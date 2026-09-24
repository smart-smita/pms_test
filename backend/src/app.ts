import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import { testDbConnection } from './config/db';
import { migrate } from './migrate';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// CORS — allow configured origin(s) in production
const allowedOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS policy: Origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// DB connection + auto-migration
testDbConnection();

// Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: env.NODE_ENV });
});

// API Routes
app.use('/api/v1', apiRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    await migrate();
    console.log(`🚀 Backend running in ${env.NODE_ENV} mode on port ${PORT}`);
    console.log(`📍 API: /api/v1  |  Health: /health`);
  });
}

export default app;
