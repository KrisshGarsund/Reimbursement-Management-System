import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import * as ruleController from '../controllers/rule.controller.js';

const router = Router();

router.use(authenticate);
router.use(roleGuard('ADMIN'));

router.get('/', ruleController.listRules);
router.post('/', ruleController.createRule);
router.patch('/:id', ruleController.updateRule);
router.delete('/:id', ruleController.deleteRule);

export default router;
