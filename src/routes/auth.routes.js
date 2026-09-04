import { Router } from 'express';
import { registerUser } from '../services/auth.service.js';
import { validateSignupInput } from '../validators/auth.validator.js';

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

export default router;
