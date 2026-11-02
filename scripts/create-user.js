import './load-private-env.js';
import { createInterface } from 'node:readline/promises';
import { emitKeypressEvents } from 'node:readline';
import { neon } from '@neondatabase/serverless';
import { normaliseUsername, validUsername, validPassword, hashPassword } from '../src/lib/server/passwords.js';

function hiddenPassword(prompt) {
 if (!process.stdin.isTTY) throw new Error('Use an interactive terminal for the hidden password prompt.');
 emitKeypressEvents(process.stdin);
 // Disable terminal echo before displaying the prompt, avoiding an input race.
 process.stdin.setRawMode(true);
 process.stdin.resume();
 process.stdout.write(prompt);
 return new Promise((resolve, reject) => {
  let value = '';
  function finish() {
   process.stdin.removeListener('keypress', onKey);
   process.stdin.setRawMode(false);
   process.stdin.pause();
   process.stdout.write('\n');
  }
  function onKey(text, key) {
   if (key?.ctrl && key.name === 'c') { finish(); reject(new Error('Cancelled.')); }
   else if (key?.name === 'return' || key?.name === 'enter') { finish(); resolve(value); }
   else if (key?.name === 'backspace') value = Array.from(value).slice(0, -1).join('');
   else if (!key?.ctrl && !key?.meta && text && !/[\x00-\x1f\x7f]/.test(text)) value += text;
  }
  process.stdin.on('keypress', onKey);
 });
}

try {
 let username = process.argv[2];
 let password = process.argv[3];
 if (!username) {
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  username = await prompt.question('Administrator username: ');
  prompt.close();
 }
 username = normaliseUsername(username);
 if (!validUsername(username)) throw new Error('Use 3–40 letters, digits, underscores or hyphens for the username.');
 if (!password) {
  password = await hiddenPassword('Password (hidden): ');
  const confirmation = await hiddenPassword('Repeat password (hidden): ');
  if (password !== confirmation) throw new Error('Passwords did not match.');
 }
 if (!validPassword(password)) throw new Error('Use at least 12 characters and no more than 72 UTF-8 bytes for the password.');
 if (!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL in your private env file.');
 const sql = neon(process.env.DATABASE_URL);
 const passwordHash = await hashPassword(password);
 const created = await sql`INSERT INTO users (username, password_hash) VALUES (${username}, ${passwordHash})
  ON CONFLICT (username) DO NOTHING RETURNING id`;
 if (!created.length) throw new Error('That username already exists. No account was changed.');
 console.log('Administrator account created. No password was printed or written to a file.');
} catch (error) {
 // Database diagnostics can contain connection details, so only show our own validation messages.
 const safe = ['Use ', 'Passwords did not match.', 'Configure ', 'That username already exists.', 'Cancelled.', 'Use an interactive'];
 console.error(safe.some(prefix => error.message?.startsWith(prefix)) ? error.message : 'Account creation failed. Check the database connection and try again.');
 process.exitCode = 1;
}
