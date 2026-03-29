import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

// Validate required environment variables
const requiredVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingVars = requiredVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.warn(`⚠️  Warning: Missing environment variables: ${missingVars.join(', ')}. Using defaults.`);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠️  Warning: ANTHROPIC_API_KEY not set. OCR and AI anomaly detection will use mock data.');
}

export default {
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'hackathon_secret_key_123!@#',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'hackathon_refresh_key_123!@#',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
};
