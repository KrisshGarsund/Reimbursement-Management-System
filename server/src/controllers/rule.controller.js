import prisma from '../config/db.js';
import { ApiError } from '../utils/apiError.js';

export async function listRules(req, res, next) {
  try {
    const rules = await prisma.approvalRule.findMany({
      where: { companyId: req.user.companyId },
      include: {
        approver: { select: { id: true, name: true, role: true } },
        specificApprover: { select: { id: true, name: true, role: true } },
      },
      orderBy: { stepOrder: 'asc' },
    });
    res.json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
}

export async function createRule(req, res, next) {
  try {
    const { stepOrder, approverId, ruleType, percentageThreshold, specificApproverId } = req.body;
    const rule = await prisma.approvalRule.create({
      data: {
        companyId: req.user.companyId,
        stepOrder,
        approverId,
        ruleType: ruleType || 'SEQUENTIAL',
        percentageThreshold,
        specificApproverId,
      },
      include: {
        approver: { select: { id: true, name: true, role: true } },
      },
    });
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
}

export async function updateRule(req, res, next) {
  try {
    const rule = await prisma.approvalRule.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!rule) throw ApiError.notFound('Rule not found');

    const updated = await prisma.approvalRule.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        approver: { select: { id: true, name: true, role: true } },
      },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteRule(req, res, next) {
  try {
    const rule = await prisma.approvalRule.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!rule) throw ApiError.notFound('Rule not found');

    await prisma.approvalRule.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    next(error);
  }
}
