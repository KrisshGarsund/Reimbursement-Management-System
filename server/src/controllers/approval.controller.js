import { processApproval, overrideApproval } from '../services/approval.engine.js';
import prisma from '../config/db.js';

export async function approveExpense(req, res, next) {
  try {
    const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    if (expense.submittedById === req.user.id) {
      return res.status(403).json({ success: false, message: 'You cannot approve your own expense' });
    }
    const { comment } = req.body;
    const result = await processApproval(req.params.id, req.user.id, 'APPROVED', comment);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function rejectExpense(req, res, next) {
  try {
    const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    if (expense.submittedById === req.user.id) {
      return res.status(403).json({ success: false, message: 'You cannot reject your own expense' });
    }
    const { comment } = req.body;
    if (!comment) {
      return res.status(400).json({ success: false, message: 'Comment is required for rejection' });
    }
    const result = await processApproval(req.params.id, req.user.id, 'REJECTED', comment);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function overrideExpense(req, res, next) {
  try {
    const { action, comment } = req.body;
    const result = await overrideApproval(req.params.id, req.user.id, action, comment);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
