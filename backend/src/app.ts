import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { testDbConnection } from './config/db';
import { migrate } from './migrate';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test DB Connection
testDbConnection();

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes /api/v1
app.use('/api/v1', apiRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    await migrate();
    console.log(`🚀 Backend REST API running on http://localhost:${PORT}`);
    console.log(`📍 API Base URL: http://localhost:${PORT}/api/v1`);
  });
}

export default app;
