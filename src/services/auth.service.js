import argon2 from 'argon2';
import { pool } from '../db/pool.js';

import {
  createAccessToken,
  createTokenFamilyId,
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiresAt,
} from '../utils/tokens.js';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19 * 1024,
  timeCost: 2,
  parallelism: 1,
};

export async function registerUser({ email, password }) {
  const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);

  try {
    await pool.query(
      `
        INSERT INTO users (email, password_hash)
        VALUES ($1, $2)
      `,
      [email, passwordHash],
    );

    return { created: true };
  } catch (error) {
    if (error.code === '23505') {
      return { created: false, reason: 'duplicate_email' };
    }

    throw error;
  }
}

export async function loginUser({ email, password }) {
  const result = await pool.query(
    `
      SELECT id, password_hash
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  const user = result.rows[0];

  if (!user) {
    return { authenticated: false };
  }

  const passwordMatches = await argon2.verify(user.password_hash, password);

  if (!passwordMatches) {
    return { authenticated: false };
  }

  const accessToken = createAccessToken(user.id);
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  const familyId = createTokenFamilyId();
  const expiresAt = refreshTokenExpiresAt();

  await pool.query(
    `
      INSERT INTO refresh_tokens (
        user_id,
        token_hash,
        family_id,
        expires_at
      )
      VALUES ($1, $2, $3, $4)
    `,
    [user.id, tokenHash, familyId, expiresAt],
  );

  return {
    authenticated: true,
    accessToken,
    refreshToken,
  };
}
