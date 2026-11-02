import assert from 'node:assert/strict';

// Credential-free checks: no users, sessions or private test passwords are created.
const origin = process.env.AUTH_TEST_ORIGIN || 'http://127.0.0.1:4174';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Use a local test server.');
const page = await fetch(origin + '/studio');
assert.equal(page.status, 200);
assert.equal(page.headers.get('referrer-policy'), 'same-origin');
assert.match(page.headers.get('cache-control'), /no-store/);
const html = await page.text();
assert(html.includes('action="?/login"'));
assert(!html.includes('Signed in as'));
console.log('PASS studio policy preserves same-origin form headers; login action stays relative');

async function submit(action, headers) {
 return fetch(origin + '/studio?/' + action, {
  method: 'POST', headers: { accept: 'text/html', ...headers },
  body: new URLSearchParams(), redirect: 'manual'
 });
}
const invalid = await submit('login', { origin });
assert.equal(invalid.status, 400);
assert((await invalid.text()).includes('The username or password is incorrect.'));
console.log('PASS same-origin form reaches normal validation rather than the 403 guard');
assert.equal((await submit('logout', { origin })).status, 401);
console.log('PASS unauthenticated protected action still denied');
for (const headers of [
 { origin: 'null' },
 {},
 { referer: origin + '/studio' },
 { origin: 'https://untrusted.invalid', referer: origin + '/studio' }
]) {
 assert.equal((await submit('login', headers)).status, 403);
}
console.log('PASS null, missing and foreign Origins denied; Referer cannot bypass the check');
assert.equal((await fetch(origin + '/studio', { headers: { cookie: 'studio_session=invalid' } })).status, 200);
const forged = await fetch(origin + '/studio', { headers: { cookie: 'studio_session=invalid' } });
assert(!(await forged.text()).includes('Signed in as'));
console.log('PASS forged session cannot unlock studio');
