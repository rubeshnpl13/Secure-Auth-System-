import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAccessToken,
  createTokenFamilyId,
  generateRefreshToken,
  hashRefreshToken,
  verifyAccessToken,
} from '../src/utils/tokens.js';

test('refresh tokens are unique and URL-safe', () => {
  const first = generateRefreshToken();
  const second = generateRefreshToken();

  assert.notEqual(first, second);
  assert.match(first, /^[A-Za-z0-9_-]+$/);
  assert.match(second, /^[A-Za-z0-9_-]+$/);
});

test('refresh token hashing is deterministic and one-way formatted', () => {
  const token = 'example-refresh-token';
  const hash = hashRefreshToken(token);

  assert.equal(hash, hashRefreshToken(token));
  assert.equal(hash.length, 64);
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.notEqual(hash, token);
});

test('token-family IDs are unique UUIDs', () => {
  const first = createTokenFamilyId();
  const second = createTokenFamilyId();

  assert.notEqual(first, second);
  assert.match(
    first,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
});

test('access tokens verify with expected claims', () => {
  const userId = '3cb437de-838b-4838-8a3f-7ed5021a15f1';

  const token = createAccessToken(userId);
  const payload = verifyAccessToken(token);

  assert.equal(payload.sub, userId);
  assert.equal(payload.type, 'access');
  assert.equal(payload.iss, 'secure-auth-api');
  assert.equal(payload.aud, 'secure-auth-client');
});

test('access token verification rejects a modified token', () => {
  const token = createAccessToken('3cb437de-838b-4838-8a3f-7ed5021a15f1');

  const modifiedToken = `${token.slice(0, -1)}x`;

  assert.throws(() => verifyAccessToken(modifiedToken));
});
