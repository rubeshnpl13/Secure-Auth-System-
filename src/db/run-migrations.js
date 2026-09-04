import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const migrationPath = path.join(
    __dirname,
    'migrations',
    '001_initial_schema.sql',
  );

  const sql = await fs.readFile(migrationPath, 'utf8');

  try {
    await pool.query(sql);
    console.log('Migration completed successfully.');
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error('Migration failed.');
  console.error(error);
  process.exitCode = 1;
});
