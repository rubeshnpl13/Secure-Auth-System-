const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignupInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      valid: false,
      error: 'Invalid request body',
    };
  }

  const { email, password } = input;

  if (typeof email !== 'string' || typeof password !== 'string') {
    return {
      valid: false,
      error: 'Email and password must be strings',
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (
    normalizedEmail.length === 0 ||
    normalizedEmail.length > MAX_EMAIL_LENGTH ||
    !EMAIL_PATTERN.test(normalizedEmail)
  ) {
    return {
      valid: false,
      error: 'Enter a valid email address',
    };
  }

  if (
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    return {
      valid: false,
      error: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`,
    };
  }

  return {
    valid: true,
    value: {
      email: normalizedEmail,
      password,
    },
  };
}
