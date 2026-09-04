import express from 'express';
import { pool } from './db/pool.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

app.use(express.json({ limit: '10kb' }));

app.get('/', (req, res) => {
  res.json({
    name: 'Secure Auth System API',
    status: 'running',
    health: '/health',
  });
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');

    return res.status(200).json({
      status: 'ok',
      database: 'connected',
      uptime: process.uptime(),
    });
  } catch {
    return res.status(503).json({
      status: 'unavailable',
      database: 'disconnected',
    });
  }
});

app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    message: 'Internal server error',
  });
});

export default app;
