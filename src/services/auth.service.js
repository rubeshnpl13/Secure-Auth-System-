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

export async function refreshUserSession(rawRefreshToken) {
  const tokenHash = hashRefreshToken(rawRefreshToken);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const tokenResult = await client.query(
      `
        SELECT id, user_id, family_id, expires_at, revoked_at
        FROM refresh_tokens
        WHERE token_hash = $1
        FOR UPDATE
      `,
      [tokenHash],
    );

    const existingToken = tokenResult.rows[0];

    if (!existingToken) {
      await client.query('ROLLBACK');
      return { refreshed: false };
    }

    if (existingToken.revoked_at) {
      await client.query(
        `
          UPDATE refresh_tokens
          SET revoked_at = NOW()
          WHERE family_id = $1
            AND revoked_at IS NULL
        `,
        [existingToken.family_id],
      );

      await client.query('COMMIT');

      return {
        refreshed: false,
        reuseDetected: true,
      };
    }

    if (new Date(existingToken.expires_at) <= new Date()) {
      await client.query(
        `
          UPDATE refresh_tokens
          SET revoked_at = NOW()
          WHERE id = $1
            AND revoked_at IS NULL
        `,
        [existingToken.id],
      );

      await client.query('COMMIT');

      return { refreshed: false };
    }

    const newRefreshToken = generateRefreshToken();
    const newTokenHash = hashRefreshToken(newRefreshToken);
    const newExpiresAt = refreshTokenExpiresAt();

    const replacementResult = await client.query(
      `
        INSERT INTO refresh_tokens (
          user_id,
          token_hash,
          family_id,
          expires_at
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      [
        existingToken.user_id,
        newTokenHash,
        existingToken.family_id,
        newExpiresAt,
      ],
    );

    const replacementTokenId = replacementResult.rows[0].id;

    await client.query(
      `
        UPDATE refresh_tokens
        SET revoked_at = NOW(),
            replaced_by_token_id = $1
        WHERE id = $2
          AND revoked_at IS NULL
      `,
      [replacementTokenId, existingToken.id],
    );

    await client.query('COMMIT');

    return {
      refreshed: true,
      accessToken: createAccessToken(existingToken.user_id),
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function logoutUser(rawRefreshToken) {
  const tokenHash = hashRefreshToken(rawRefreshToken);

  const result = await pool.query(
    `
      UPDATE refresh_tokens
      SET revoked_at = NOW()
      WHERE token_hash = $1
        AND revoked_at IS NULL
      RETURNING family_id
    `,
    [tokenHash],
  );

  if (result.rowCount === 0) {
    return;
  }

  const familyId = result.rows[0].family_id;

  await pool.query(
    `
      UPDATE refresh_tokens
      SET revoked_at = NOW()
      WHERE family_id = $1
        AND revoked_at IS NULL
    `,
    [familyId],
  );
}
