import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import * as userController from '../controllers/user.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', roleGuard('ADMIN'), userController.listUsers);
router.post('/', roleGuard('ADMIN'), userController.createUser);
router.patch('/:id', roleGuard('ADMIN'), userController.updateUser);
router.delete('/:id', roleGuard('ADMIN'), userController.deleteUser);

export default router;
