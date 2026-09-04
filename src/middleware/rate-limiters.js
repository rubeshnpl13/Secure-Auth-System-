import { rateLimit } from 'express-rate-limit';

function rateLimitMessage(message) {
  return {
    message,
  };
}

export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitMessage('Too many requests. Please try again later.'),
});

export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitMessage(
    'Too many signup attempts. Please try again later.',
  ),
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitMessage('Too many login attempts. Please try again later.'),
});
