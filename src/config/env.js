import 'dotenv/config';

const requiredBase = [
  'PORT',
  'NODE_ENV',
  'JWT_ACCESS_SECRET',
  'FRONTEND_ORIGIN',
];

for (const key of requiredBase) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const port = Number(process.env.PORT);

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error('PORT must be a valid port number');
}

const allowedEnvironments = ['development', 'test', 'production'];

if (!allowedEnvironments.includes(process.env.NODE_ENV)) {
  throw new Error(`NODE_ENV must be one of: ${allowedEnvironments.join(', ')}`);
}

if (process.env.JWT_ACCESS_SECRET.length < 64) {
  throw new Error('JWT_ACCESS_SECRET must be at least 64 characters long');
}

let frontendOrigin;

try {
  frontendOrigin = new URL(process.env.FRONTEND_ORIGIN).origin;
} catch {
  throw new Error('FRONTEND_ORIGIN must be a valid URL');
}

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

const database = hasDatabaseUrl
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: true }
          : false,
    }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

if (!hasDatabaseUrl) {
  const requiredDatabaseFields = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
  ];

  for (const key of requiredDatabaseFields) {
    if (!process.env[key]) {
      throw new Error(`Missing required database environment variable: ${key}`);
    }
  }

  if (
    !Number.isInteger(database.port) ||
    database.port <= 0 ||
    database.port > 65535
  ) {
    throw new Error('DB_PORT must be a valid port number');
  }
}

export const config = {
  port,
  env: process.env.NODE_ENV,
  frontendOrigin,
  database,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessTokenTtl: '15m',
    refreshTokenTtlDays: 7,
  },
};
