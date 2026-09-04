import express from 'express';
import { pool } from './db/pool.js';
import authRoutes from './routes/auth.routes.js';
import cookieParser from 'cookie-parser';
import { requireAuth } from './middleware/require-auth.js';

const app = express();

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

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
app.get('/api/me', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `
        SELECT id, email, created_at
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [req.auth.userId],
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        message: 'Authentication required',
      });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default app;
