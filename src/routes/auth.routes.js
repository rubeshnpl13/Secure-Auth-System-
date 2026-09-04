import { Router } from 'express';
import {
  loginUser,
  logoutUser,
  refreshUserSession,
  registerUser,
} from '../services/auth.service.js';
import {
  validateLoginInput,
  validateSignupInput,
} from '../validators/auth.validator.js';
import { config } from '../config/env.js';
import { loginLimiter, signupLimiter } from '../middleware/rate-limiters.js';

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: config.jwt.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  };
}

function clearRefreshCookie(res) {
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict',
    path: '/api/auth',
  });
}

const router = Router();

router.post('/signup', signupLimiter, async (req, res, next) => {
  try {
    const validation = validateSignupInput(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        message: validation.error,
      });
    }

    await registerUser(validation.value);

    return res.status(201).json({
      message: 'If the email is eligible, an account has been created.',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const validation = validateLoginInput(req.body);

    if (!validation.valid) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    const result = await loginUser(validation.value);

    if (!result.authenticated) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    res.cookie('refresh_token', result.refreshToken, refreshCookieOptions());

    return res.status(200).json({
      accessToken: result.accessToken,
      tokenType: 'Bearer',
      expiresIn: config.jwt.accessTokenTtl,
    });
  } catch (error) {
    next(error);
  }
});
router.post('/refresh', async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies.refresh_token;

    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      clearRefreshCookie(res);

      return res.status(401).json({
        message: 'Session expired. Please sign in again.',
      });
    }

    const result = await refreshUserSession(rawRefreshToken);

    if (!result.refreshed) {
      clearRefreshCookie(res);

      return res.status(401).json({
        message: 'Session expired. Please sign in again.',
      });
    }

    res.cookie('refresh_token', result.refreshToken, refreshCookieOptions());

    return res.status(200).json({
      accessToken: result.accessToken,
      tokenType: 'Bearer',
      expiresIn: config.jwt.accessTokenTtl,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies.refresh_token;

    if (typeof rawRefreshToken === 'string') {
      await logoutUser(rawRefreshToken);
    }

    clearRefreshCookie(res);

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
