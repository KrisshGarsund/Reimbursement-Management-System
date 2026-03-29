import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import * as approvalController from '../controllers/approval.controller.js';

const router = Router();

router.use(authenticate);

router.post('/:id/approve', roleGuard('MANAGER', 'ADMIN'), approvalController.approveExpense);
router.post('/:id/reject', roleGuard('MANAGER', 'ADMIN'), approvalController.rejectExpense);
router.post('/:id/override', roleGuard('ADMIN'), approvalController.overrideExpense);

export default router;
