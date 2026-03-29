import Anthropic from '@anthropic-ai/sdk';
import prisma from '../config/db.js';
import config from '../config/env.js';
import { emitToUser } from '../config/socket.js';
import { createNotification } from './notification.service.js';

let anthropic;
try {
  if (config.anthropicApiKey && config.anthropicApiKey !== 'your-anthropic-api-key') {
    anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
  }
} catch (e) {
  console.warn('Anthropic SDK not initialized:', e.message);
}

export async function analyzeExpense(expenseId) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      submittedBy: { select: { id: true, name: true } },
      company: true,
    },
  });

  if (!expense) return;

  // Get employee's last 10 expenses
  const history = await prisma.expense.findMany({
    where: {
      submittedById: expense.submittedById,
      id: { not: expense.id },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { amount: true, currency: true, convertedAmount: true, category: true, date: true, description: true },
  });

  // Get company avg for category
  const categoryAvg = await prisma.expense.aggregate({
    where: {
      companyId: expense.companyId,
      category: expense.category,
      id: { not: expense.id },
    },
    _avg: { convertedAmount: true },
  });

  const dayOfWeek = new Date(expense.date).toLocaleDateString('en-US', { weekday: 'long' });

  if (!anthropic) {
    // Mock anomaly detection when API key not available
    const flagged = expense.convertedAmount > 500;
    await prisma.expense.update({
      where: { id: expenseId },
      data: {
        aiFlag: flagged,
        aiSeverity: flagged ? 'MEDIUM' : null,
        aiFlags: flagged ? JSON.stringify(['high_amount']) : JSON.stringify([]),
        aiReasoning: flagged ? 'Amount exceeds typical threshold for this category.' : null,
      },
    });

    if (flagged) {
      await prisma.auditLog.create({
        data: {
          expenseId,
          actorId: expense.submittedById,
          actorRole: 'EMPLOYEE',
          action: 'AI_FLAGGED',
          comment: 'AI flagged expense (mock mode)',
          metadata: JSON.stringify({ severity: 'MEDIUM', flags: ['high_amount'] }),
        },
      });
    }
    return;
  }

  try {
    const prompt = `You are a corporate expense auditor. Analyze this expense submission for anomalies.
Expense: ${JSON.stringify({ amount: expense.amount, currency: expense.currency, convertedAmount: expense.convertedAmount, category: expense.category, description: expense.description, date: expense.date })}
Employee's last 10 expenses for context: ${JSON.stringify(history)}
Company average amount for this category: ${categoryAvg._avg.convertedAmount || 'N/A'}
Day of week: ${dayOfWeek}

Check for: duplicate submission (same amount+category+date), amount significantly above employee or category average, weekend/holiday submission, unusually high amount for category, suspicious vendor patterns.

Return ONLY this JSON:
{
  "isFlagged": true/false,
  "severity": "low" | "medium" | "high",
  "flags": array of strings from ["duplicate", "above_avg", "weekend", "high_amount", "unusual_pattern"],
  "reasoning": "One concise sentence explaining the finding"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text;
    const result = JSON.parse(text);

    await prisma.expense.update({
      where: { id: expenseId },
      data: {
        aiFlag: result.isFlagged,
        aiSeverity: result.isFlagged ? result.severity.toUpperCase() : null,
        aiFlags: JSON.stringify(result.flags || []),
        aiReasoning: result.reasoning || null,
      },
    });

    if (result.isFlagged) {
      await prisma.auditLog.create({
        data: {
          expenseId,
          actorId: expense.submittedById,
          actorRole: 'EMPLOYEE',
          action: 'AI_FLAGGED',
          comment: result.reasoning,
          metadata: JSON.stringify({ severity: result.severity, flags: result.flags }),
        },
      });

      // Notify managers/admins if HIGH severity
      if (result.severity === 'high') {
        const managersAndAdmins = await prisma.user.findMany({
          where: {
            companyId: expense.companyId,
            role: { in: ['MANAGER', 'ADMIN'] },
          },
        });

        for (const user of managersAndAdmins) {
          await createNotification(
            user.id,
            expenseId,
            `⚠️ HIGH RISK: Expense by ${expense.submittedBy.name} flagged — ${result.reasoning}`
          );
        }
      }
    }
  } catch (error) {
    console.error('AI anomaly detection error:', error.message);
  }
}
