import { processApproval, overrideApproval } from '../services/approval.engine.js';

export async function approveExpense(req, res, next) {
  try {
    const { comment } = req.body;
    const result = await processApproval(req.params.id, req.user.id, 'APPROVED', comment);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function rejectExpense(req, res, next) {
  try {
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
