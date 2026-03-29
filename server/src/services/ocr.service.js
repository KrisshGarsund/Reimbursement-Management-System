import Anthropic from '@anthropic-ai/sdk';
import config from '../config/env.js';

let anthropic;
try {
  if (config.anthropicApiKey && config.anthropicApiKey !== 'your-anthropic-api-key') {
    anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
  }
} catch (e) {
  console.warn('Anthropic SDK not initialized for OCR:', e.message);
}

export async function extractReceiptData(imageBuffer, mimeType) {
  if (!anthropic) {
    // Return mock data when API key not available
    return {
      amount: null,
      currency: null,
      date: null,
      vendor: null,
      description: null,
      category: 'OTHER',
      error: 'OCR not available — Anthropic API key not configured',
    };
  }

  try {
    const base64Image = imageBuffer.toString('base64');
    const mediaType = mimeType || 'image/jpeg';

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: 'You are an OCR expense extractor. Extract from this receipt image: amount (number only), currency (ISO code), date (YYYY-MM-DD), vendor name, description, and expense category (one of: TRAVEL, MEALS, ACCOMMODATION, OFFICE, ENTERTAINMENT, OTHER). Return ONLY a JSON object with keys: amount, currency, date, vendor, description, category. No explanation.',
            },
          ],
        },
      ],
    });

    const text = response.content[0].text;
    return JSON.parse(text);
  } catch (error) {
    console.error('OCR error:', error.message);
    return {
      amount: null,
      currency: null,
      date: null,
      vendor: null,
      description: null,
      category: 'OTHER',
      error: error.message,
    };
  }
}
