import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { upload } from '../middleware/upload.js';
import * as expenseController from '../controllers/expense.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', upload.single('receipt'), expenseController.createExpense);
router.get('/', expenseController.listExpenses);
router.get('/export/csv', roleGuard('ADMIN'), expenseController.exportCSV);
router.get('/convert', expenseController.convertCurrency);
router.get('/:id', expenseController.getExpense);
router.get('/:id/history', expenseController.getExpenseHistory);

export default router;
