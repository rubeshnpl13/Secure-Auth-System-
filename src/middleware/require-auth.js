import { verifyAccessToken } from '../utils/tokens.js';

export function requireAuth(req, res, next) {
  const authorization = req.get('authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  const token = authorization.slice('Bearer '.length).trim();

  if (!token) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.type !== 'access' || typeof payload.sub !== 'string') {
      return res.status(401).json({
        message: 'Authentication required',
      });
    }

    req.auth = {
      userId: payload.sub,
    };

    return next();
  } catch {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }
}
