import 'dotenv/config';

const required = ['PORT', 'NODE_ENV'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}

export const config = {
  port: Number(process.env.PORT),
  env: process.env.NODE_ENV,
};
