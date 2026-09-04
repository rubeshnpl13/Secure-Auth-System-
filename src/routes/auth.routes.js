import { Router } from 'express';
import { loginUser, registerUser } from '../services/auth.service.js';
import {
  validateLoginInput,
  validateSignupInput,
} from '../validators/auth.validator.js';
import { config } from '../config/env.js';

const router = Router();

router.post('/signup', async (req, res, next) => {
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

router.post('/login', async (req, res, next) => {
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

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: config.jwt.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      accessToken: result.accessToken,
      tokenType: 'Bearer',
      expiresIn: config.jwt.accessTokenTtl,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
