import prisma from '../config/db.js';
import { ApiError } from '../utils/apiError.js';
import * as currencyService from './currency.service.js';
import { analyzeExpense } from './anomaly.service.js';
import { initiateApproval } from './approval.engine.js';

export async function createExpense({ companyId, submittedById, amount, currency, category, description, date, receiptUrl }) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw ApiError.notFound('Company not found');

  const convertedAmount = await currencyService.convert(amount, currency, company.currency);

  const expense = await prisma.expense.create({
    data: {
      companyId,
      submittedById,
      amount,
      currency,
      convertedAmount,
      companyCurrency: company.currency,
      category,
      description,
      date: new Date(date),
      receiptUrl,
      status: 'PENDING',
    },
    include: {
      submittedBy: { select: { id: true, name: true, email: true, managerId: true, manager: { select: { id: true, name: true, isManagerApprover: true } } } },
    },
  });

  // Write SUBMITTED to AuditLog
  const user = await prisma.user.findUnique({ where: { id: submittedById } });
  await prisma.auditLog.create({
    data: {
      expenseId: expense.id,
      actorId: submittedById,
      actorRole: user.role,
      action: 'SUBMITTED',
      comment: `Expense submitted: ${category} - ${amount} ${currency}`,
    },
  });

  // Fire-and-forget anomaly detection
  analyzeExpense(expense.id).catch(err => console.error('Anomaly detection error:', err));

  // Initiate approval workflow
  initiateApproval(expense).catch(err => console.error('Approval init error:', err));

  return expense;
}

export async function listExpenses({ companyId, userId, role, status, category, startDate, endDate, employeeId, page = 1, limit = 20 }) {
  const where = { companyId };

  if (role === 'EMPLOYEE') {
    where.submittedById = userId;
  } else if (role === 'MANAGER') {
    // Manager sees team expenses + their own + expenses assigned to them via rules
    const team = await prisma.user.findMany({
      where: { managerId: userId },
      select: { id: true },
    });
    const teamIds = team.map(u => u.id);
    teamIds.push(userId);

    const activeRules = await prisma.approvalRule.findMany({
      where: { companyId, OR: [{ approverId: userId }, { specificApproverId: userId }] }
    });
    
    const ruleConditions = activeRules.map(r => ({
      status: 'IN_REVIEW',
      currentApproverStep: r.stepOrder
    }));

    where.OR = [
      { submittedById: { in: teamIds } },
      ...(ruleConditions.length > 0 ? ruleConditions : [])
    ];
  }
  // ADMIN sees all company expenses

  if (status) where.status = status;
  if (category) where.category = category;
  if (employeeId) where.submittedById = employeeId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        submittedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ]);

  return { expenses, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getExpense(expenseId, companyId) {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, companyId },
    include: {
      submittedBy: { select: { id: true, name: true, email: true, role: true } },
      approvalLogs: {
        include: { approver: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!expense) throw ApiError.notFound('Expense not found');

  if (expense.aiFlags && typeof expense.aiFlags === 'string') {
    try { expense.aiFlags = JSON.parse(expense.aiFlags); } catch (e) {}
  }

  return expense;
}

export async function getExpenseHistory(expenseId, companyId) {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, companyId },
  });
  if (!expense) throw ApiError.notFound('Expense not found');

  const history = await prisma.auditLog.findMany({
    where: { expenseId },
    include: {
      actor: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return history.map(log => {
    if (log.metadata && typeof log.metadata === 'string') {
      try { log.metadata = JSON.parse(log.metadata); } catch (e) {}
    }
    return log;
  });
}

export async function exportExpensesCSV(companyId) {
  return prisma.expense.findMany({
    where: { companyId },
    include: {
      submittedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
