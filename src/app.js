import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { pool } from './db/pool.js';
import { requireAuth } from './middleware/require-auth.js';
import { globalApiLimiter } from './middleware/rate-limiters.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === config.frontendOrigin) {
        return callback(null, true);
      }

      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

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

app.use('/api', globalApiLimiter);
app.use('/api/auth', authRoutes);

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
    return next(error);
  }
});

app.use((req, res) => {
  return res.status(404).json({
    message: 'Route not found',
  });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      message: 'Invalid JSON request body',
    });
  }

  if (err.message === 'Origin not allowed by CORS') {
    return res.status(403).json({
      message: 'Origin not allowed',
    });
  }

  console.error(err);

  return res.status(500).json({
    message: 'Internal server error',
  });
});

export default app;
