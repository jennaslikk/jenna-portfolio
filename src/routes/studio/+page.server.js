import { fail, redirect } from '@sveltejs/kit';
import { allowLogin, checkPassword, startSession, endSession, requireUser } from '#lib/server/auth';
import { normaliseUsername, validUsername, validPassword } from '#lib/server/passwords';

export function load({ locals }) {
 // Logged-out responses contain no private project data or course tools.
 return { user: locals.user ? requireUser(locals) : null };
}

export const actions = {
 login: async ({ request, cookies, locals, getClientAddress }) => {
  if (locals.user) redirect(303, '/studio');
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 4096) return fail(400, { message: 'Please enter a valid username and password.' });
  let data;
  try { data = await request.formData(); } catch {
   return fail(400, { message: 'Please use the sign-in form.' });
  }
  const username = normaliseUsername(data.get('username'));
  const password = data.get('password');
  if (!validUsername(username) || !validPassword(password)) {
   return fail(400, { message: 'The username or password is incorrect.' });
  }
  try {
   if (!await allowLogin(getClientAddress(), username)) {
    return fail(429, { message: 'Too many sign-in attempts. Please wait 15 minutes and try again.' });
   }
   const user = await checkPassword(username, password);
   if (!user) return fail(400, { message: 'The username or password is incorrect.' });
   await startSession(user.id, cookies);
  } catch {
   return fail(503, { message: 'Sign-in is temporarily unavailable. Please try again shortly.' });
  }
  redirect(303, '/studio');
 },
 logout: async ({ locals, cookies }) => {
  requireUser(locals);
  try { await endSession(cookies); } catch {
   return fail(503, { message: 'Sign-out could not be completed. Please try again.' });
  }
  redirect(303, '/studio');
 }
};
