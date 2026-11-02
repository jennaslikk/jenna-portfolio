import './load-private-env.js';
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const origin = process.env.PALETTE_TEST_ORIGIN || 'http://127.0.0.1:4178';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Use a local preview.');
const sql = neon(process.env.DATABASE_URL);
const token = randomBytes(32).toString('base64url');
const id = createHash('sha256').update(token).digest('hex');
const cookie = `studio_session=${token}`;
let phase = 'authentication';
async function submit(hex, authenticated = true, requestOrigin = origin) {
 return fetch(origin + '/studio?/generatePalette', {
  method: 'POST', redirect: 'manual', body: new URLSearchParams({ hex }),
  headers: { accept: 'text/html', origin: requestOrigin, cookie: authenticated ? cookie : '' }
 });
}
try {
 const users = await sql`SELECT id::text AS id FROM users ORDER BY id LIMIT 1`;
 assert(users.length);
 await sql`INSERT INTO sessions (id, user_id, expires_at) VALUES (${id}, ${users[0].id}, now() + interval '5 minutes')`;
 const anonymous = await fetch(origin + '/studio');
 assert(!(await anonymous.text()).includes('id="palette-title"'));
 assert.equal((await submit('#0047AB', false)).status, 401);
 assert.equal((await submit('#0047AB', true, 'https://untrusted.invalid')).status, 403);
 console.log('PASS palette hidden from guests; unauthenticated and cross-origin actions denied');
 phase = 'validation';
 const invalid = await submit('not-a-hex');
 assert.equal(invalid.status, 400);
 assert((await invalid.text()).includes('Enter 3 or 6 hexadecimal digits'));
 console.log('PASS invalid HEX returns a friendly validation message');
 phase = 'live Color API';
 const response = await submit('#0047AB');
 const html = await response.text();
 assert.equal(response.status, 200);
 assert(html.includes('Analogous palette'));
 assert(html.includes('#0047AB'));
 assert.equal((html.match(/role="img"/g) || []).length, 6);
 assert.equal((html.match(/>Copy HEX<\/button>/g) || []).length, 6);
 for (const secret of [process.env.DATABASE_URL, process.env.DATABASE_URL_UNPOOLED]) assert(!html.includes(secret));
 console.log('PASS live server-side /id and /scheme requests render seed + five named swatches, HEX values and copy controls');
 phase = 'public portfolio';
 for (const path of ['/', '/work', '/work/fruity-pigs']) {
  const result = await fetch(origin + path);
  assert.equal(result.status, 200);
  assert(!(await result.text()).includes('id="palette-title"'));
 }
 console.log('PASS palette remains private; public portfolio pages still load');
} catch (error) {
 console.error(`FAIL palette verification (${phase}):`, error.code || error.name);
 process.exitCode = 1;
} finally {
 await sql`DELETE FROM sessions WHERE id = ${id}`;
 console.log('Temporary verification session removed; account and portfolio content unchanged.');
}
