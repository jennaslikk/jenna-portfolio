import './load-private-env.js';
import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL_UNPOOLED) throw new Error('Configure DATABASE_URL_UNPOOLED in your private env file.');
const sql = neon(process.env.DATABASE_URL_UNPOOLED);
const migration = await readFile(new URL('../db/migrations/002-auth.sql', import.meta.url), 'utf8');
try {
 // Only this checked-in migration is used as SQL text; no input is interpolated.
 await sql.query(migration);
 console.log('Stage 2 login throttling table is ready. Existing projects and users were not changed.');
} catch {
 console.error('Authentication setup failed. Check the private database configuration and connection.');
 process.exitCode = 1;
}
