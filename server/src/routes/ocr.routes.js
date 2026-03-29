import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import * as ocrController from '../controllers/ocr.controller.js';

const router = Router();

router.use(authenticate);
router.post('/', upload.single('receipt'), ocrController.processReceipt);

export default router;
