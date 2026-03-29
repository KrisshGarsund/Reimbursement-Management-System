import { extractReceiptData } from '../services/ocr.service.js';
import fs from 'fs';

export async function processReceipt(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const imageBuffer = fs.readFileSync(req.file.path);
    const result = await extractReceiptData(imageBuffer, req.file.mimetype);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
