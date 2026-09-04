import argon2 from 'argon2';
import { pool } from '../db/pool.js';

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
