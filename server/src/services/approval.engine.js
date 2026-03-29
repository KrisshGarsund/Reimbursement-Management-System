import prisma from '../config/db.js';
import { createNotification } from './notification.service.js';

export async function initiateApproval(expense) {
  const submitter = await prisma.user.findUnique({
    where: { id: expense.submittedById },
    include: { manager: true },
  });

  // Step 0: Check if employee has a manager with isManagerApprover=true
  if (submitter.manager && submitter.manager.isManagerApprover) {
    await prisma.expense.update({
      where: { id: expense.id },
      data: { status: 'IN_REVIEW', currentApproverStep: 0 },
    });

    await prisma.auditLog.create({
      data: {
        expenseId: expense.id,
        actorId: expense.submittedById,
        actorRole: submitter.role,
        action: 'STEP_ASSIGNED',
        comment: `Assigned to manager ${submitter.manager.name} for initial approval`,
        metadata: JSON.stringify({ step: 0, approverId: submitter.manager.id }),
      },
    });

    await createNotification(
      submitter.manager.id,
      expense.id,
      `New expense from ${submitter.name} requires your approval: ${expense.category} — ${expense.amount} ${expense.currency}`
    );
  } else {
    // No manager approver, start from approval rules step 1
    await advanceToNextStep(expense.id, expense.companyId, 0);
  }
}

export async function processApproval(expenseId, approverId, action, comment) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { submittedBy: { select: { id: true, name: true } } },
  });

  if (!expense) throw new Error('Expense not found');
  if (expense.status === 'APPROVED' || expense.status === 'REJECTED') {
    throw new Error('Expense already finalized');
  }

  const approver = await prisma.user.findUnique({ where: { id: approverId } });

  // Write ApprovalLog
  await prisma.approvalLog.create({
    data: {
      expenseId,
      approverId,
      action,
      comment,
      stepOrder: expense.currentApproverStep,
    },
  });

  // Write AuditLog
  await prisma.auditLog.create({
    data: {
      expenseId,
      actorId: approverId,
      actorRole: approver.role,
      action: action === 'APPROVED' ? 'APPROVED' : 'REJECTED',
      comment: comment || `${action} at step ${expense.currentApproverStep}`,
      metadata: JSON.stringify({ step: expense.currentApproverStep }),
    },
  });

  if (action === 'REJECTED') {
    // Rejection at any step → final
    await prisma.expense.update({
      where: { id: expenseId },
      data: { status: 'REJECTED' },
    });

    await prisma.auditLog.create({
      data: {
        expenseId,
        actorId: approverId,
        actorRole: approver.role,
        action: 'STATUS_CHANGED',
        comment: 'Expense rejected',
        metadata: JSON.stringify({ newStatus: 'REJECTED' }),
      },
    });

    await createNotification(
      expense.submittedById,
      expenseId,
      `Your expense (${expense.category} — ${expense.amount} ${expense.currency}) was rejected by ${approver.name}. Comment: ${comment || 'N/A'}`
    );

    return { status: 'REJECTED' };
  }

  // APPROVED — check approval rules for this step
  const currentStep = expense.currentApproverStep;
  const rules = await prisma.approvalRule.findMany({
    where: {
      companyId: expense.companyId,
      stepOrder: currentStep + 1,
    },
    orderBy: { stepOrder: 'asc' },
  });

  if (rules.length > 0) {
    // Check rule type for current step rules
    const rule = rules[0];
    const shouldAdvance = await evaluateRule(rule, expenseId, currentStep + 1);

    if (shouldAdvance) {
      await advanceToNextStep(expenseId, expense.companyId, currentStep + 1);
    } else {
      // Update step
      await prisma.expense.update({
        where: { id: expenseId },
        data: { currentApproverStep: currentStep + 1, status: 'IN_REVIEW' },
      });
    }
  } else {
    // No more rules → approve
    await finalizeApproval(expenseId, approverId, approver.role, expense);
  }

  return { status: 'ADVANCED' };
}

async function evaluateRule(rule, expenseId, stepOrder) {
  switch (rule.ruleType) {
    case 'SEQUENTIAL':
      return false; // must wait for this approver

    case 'PERCENTAGE': {
      const totalApprovers = await prisma.approvalRule.count({
        where: { companyId: rule.companyId, stepOrder },
      });
      const approvedCount = await prisma.approvalLog.count({
        where: { expenseId, stepOrder, action: 'APPROVED' },
      });
      const percentage = ((approvedCount + 1) / totalApprovers) * 100;
      return percentage >= (rule.percentageThreshold || 100);
    }

    case 'SPECIFIC_APPROVER':
      return false; // handled by checking approver identity

    case 'HYBRID': {
      // Check percentage OR specific approver
      const totalHybrid = await prisma.approvalRule.count({
        where: { companyId: rule.companyId, stepOrder },
      });
      const approvedHybrid = await prisma.approvalLog.count({
        where: { expenseId, stepOrder, action: 'APPROVED' },
      });
      const pct = ((approvedHybrid + 1) / totalHybrid) * 100;
      return pct >= (rule.percentageThreshold || 100);
    }

    default:
      return false;
  }
}

async function advanceToNextStep(expenseId, companyId, nextStep) {
  const nextRules = await prisma.approvalRule.findMany({
    where: { companyId, stepOrder: nextStep },
    include: { approver: true },
  });

  if (nextRules.length === 0) {
    // No more steps → auto-approve
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { submittedBy: true },
    });
    // Use system-level approval
    await prisma.expense.update({
      where: { id: expenseId },
      data: { status: 'APPROVED', currentApproverStep: nextStep },
    });

    if (expense) {
      await prisma.auditLog.create({
        data: {
          expenseId,
          actorId: expense.submittedById,
          actorRole: expense.submittedBy.role,
          action: 'STATUS_CHANGED',
          comment: 'Expense auto-approved (no approval rules configured)',
          metadata: JSON.stringify({ newStatus: 'APPROVED' }),
        },
      });

      await createNotification(
        expense.submittedById,
        expenseId,
        `Your expense (${expense.category} — ${expense.amount} ${expense.currency}) has been approved! 🎉`
      );
    }
    return;
  }

  await prisma.expense.update({
    where: { id: expenseId },
    data: { currentApproverStep: nextStep, status: 'IN_REVIEW' },
  });

  // Notify all approvers at this step
  for (const rule of nextRules) {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { submittedBy: { select: { name: true } } },
    });

    await prisma.auditLog.create({
      data: {
        expenseId,
        actorId: rule.approverId,
        actorRole: rule.approver.role,
        action: 'STEP_ASSIGNED',
        comment: `Step ${nextStep}: Assigned to ${rule.approver.name}`,
        metadata: JSON.stringify({ step: nextStep }),
      },
    });

    await createNotification(
      rule.approverId,
      expenseId,
      `Expense from ${expense?.submittedBy?.name || 'Employee'} requires your approval (Step ${nextStep})`
    );
  }
}

async function finalizeApproval(expenseId, approverId, approverRole, expense) {
  await prisma.expense.update({
    where: { id: expenseId },
    data: { status: 'APPROVED' },
  });

  await prisma.auditLog.create({
    data: {
      expenseId,
      actorId: approverId,
      actorRole: approverRole,
      action: 'STATUS_CHANGED',
      comment: 'Expense approved (final)',
      metadata: JSON.stringify({ newStatus: 'APPROVED' }),
    },
  });

  await createNotification(
    expense.submittedById,
    expenseId,
    `Your expense (${expense.category} — ${expense.amount} ${expense.currency}) has been approved! 🎉`
  );
}

export async function overrideApproval(expenseId, adminId, action, comment) {
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!expense) throw new Error('Expense not found');

  const admin = await prisma.user.findUnique({ where: { id: adminId } });

  const newStatus = action === 'APPROVED' ? 'APPROVED' : 'REJECTED';

  await prisma.expense.update({
    where: { id: expenseId },
    data: { status: newStatus },
  });

  await prisma.auditLog.create({
    data: {
      expenseId,
      actorId: adminId,
      actorRole: 'ADMIN',
      action: 'OVERRIDDEN',
      comment: comment || `Admin override: ${newStatus}`,
      metadata: JSON.stringify({ newStatus, overriddenBy: admin.name }),
    },
  });

  await prisma.auditLog.create({
    data: {
      expenseId,
      actorId: adminId,
      actorRole: 'ADMIN',
      action: 'STATUS_CHANGED',
      comment: `Status changed to ${newStatus} via admin override`,
      metadata: JSON.stringify({ newStatus }),
    },
  });

  await createNotification(
    expense.submittedById,
    expenseId,
    `Your expense was ${newStatus.toLowerCase()} by admin (override).`
  );

  return { status: newStatus };
}
