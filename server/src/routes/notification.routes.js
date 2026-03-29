import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as notificationController from '../controllers/notification.controller.js';

const router = Router();

router.use(authenticate);
router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markAsRead);

export default router;
