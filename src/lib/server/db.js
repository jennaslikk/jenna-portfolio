import { neon } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';

// Private environment access keeps database credentials out of browser bundles.
export function database() {
 if (!env.DATABASE_URL) throw new Error('Database connection is not configured');
 // A suspended or unavailable database should not leave a page waiting forever.
 return neon(env.DATABASE_URL, { fetchOptions: { signal: AbortSignal.timeout(15000) } });
}
