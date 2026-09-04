import 'dotenv/config';

const required = [
  'PORT',
  'NODE_ENV',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const port = Number(process.env.PORT);
const dbPort = Number(process.env.DB_PORT);

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error('PORT must be a valid port number');
}

if (!Number.isInteger(dbPort) || dbPort <= 0 || dbPort > 65535) {
  throw new Error('DB_PORT must be a valid port number');
}

const allowedEnvironments = ['development', 'test', 'production'];

if (!allowedEnvironments.includes(process.env.NODE_ENV)) {
  throw new Error(`NODE_ENV must be one of: ${allowedEnvironments.join(', ')}`);
}

export const config = {
  port,
  env: process.env.NODE_ENV,
  database: {
    host: process.env.DB_HOST,
    port: dbPort,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
};
