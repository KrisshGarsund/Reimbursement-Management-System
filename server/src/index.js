import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import config from './config/env.js';
import { initSocket } from './config/socket.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import approvalRoutes from './routes/approval.routes.js';
import ruleRoutes from './routes/rule.routes.js';
import ocrRoutes from './routes/ocr.routes.js';
import notificationRoutes from './routes/notification.routes.js';

const app = express();
const httpServer = createServer(app);

initSocket(httpServer);

app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/expenses', approvalRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = config.port;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
