import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function createAccessToken(userId) {
  return jwt.sign(
    {
      sub: userId,
      type: 'access',
    },
    config.jwt.accessSecret,
    {
      algorithm: 'HS256',
      expiresIn: config.jwt.accessTokenTtl,
      issuer: 'secure-auth-api',
      audience: 'secure-auth-client',
    },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret, {
    algorithms: ['HS256'],
    issuer: 'secure-auth-api',
    audience: 'secure-auth-client',
  });
}

export function generateRefreshToken() {
  return crypto.randomBytes(64).toString('base64url');
}

export function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createTokenFamilyId() {
  return crypto.randomUUID();
}

export function refreshTokenExpiresAt() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshTokenTtlDays);

  return expiresAt;
}
