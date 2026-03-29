import { extractReceiptData } from '../services/ocr.service.js';
import fs from 'fs';
import path from 'path';

export async function processReceipt(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const filePath = req.file.path;
    try {
      const imageBuffer = fs.readFileSync(filePath);
      const result = await extractReceiptData(imageBuffer, req.file.mimetype);

      res.json({ success: true, data: result });
    } finally {
      // Clean up temp file after processing
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Failed to delete temp OCR file:', err);
        });
      }
    }
  } catch (error) {
    next(error);
  }
}
