import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validateLoginInput,
  validateSignupInput,
} from '../src/validators/auth.validator.js';

test('signup accepts and normalizes valid input', () => {
  const result = validateSignupInput({
    email: '  User@Example.COM  ',
    password: 'this-is-a-long-unique-password',
  });

  assert.equal(result.valid, true);
  assert.equal(result.value.email, 'user@example.com');
  assert.equal(result.value.password, 'this-is-a-long-unique-password');
});

test('signup rejects malformed email addresses', () => {
  const result = validateSignupInput({
    email: 'not-an-email',
    password: 'this-is-a-long-unique-password',
  });

  assert.equal(result.valid, false);
  assert.equal(result.error, 'Enter a valid email address');
});

test('signup rejects passwords shorter than 12 characters', () => {
  const result = validateSignupInput({
    email: 'user@example.com',
    password: 'too-short',
  });

  assert.equal(result.valid, false);
  assert.match(result.error, /between 12 and 128 characters/);
});

test('signup does not silently trim passwords', () => {
  const password = '  this-is-a-long-unique-password  ';

  const result = validateSignupInput({
    email: 'user@example.com',
    password,
  });

  assert.equal(result.valid, true);
  assert.equal(result.value.password, password);
});

test('login normalizes valid email input', () => {
  const result = validateLoginInput({
    email: '  User@Example.COM ',
    password: 'password-is-not-trimmed',
  });

  assert.equal(result.valid, true);
  assert.equal(result.value.email, 'user@example.com');
  assert.equal(result.value.password, 'password-is-not-trimmed');
});

test('login gives a generic error for unknown or invalid data', () => {
  const malformedEmail = validateLoginInput({
    email: 'not-an-email',
    password: 'some-password',
  });

  const missingPassword = validateLoginInput({
    email: 'user@example.com',
    password: '',
  });

  assert.equal(malformedEmail.valid, false);
  assert.equal(malformedEmail.error, 'Invalid email or password');
  assert.equal(missingPassword.valid, false);
  assert.equal(missingPassword.error, 'Invalid email or password');
});
