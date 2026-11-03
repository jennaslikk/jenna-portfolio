import { error } from '@sveltejs/kit';
import { SESSION_COOKIE, sessionUser, clearSessionCookie } from '#lib/server/auth';

export async function handle({ event, resolve }) {
 event.locals.user = null;
 const studio = event.url.pathname === '/studio' || event.url.pathname.startsWith('/studio/');
 // The public portfolio does not acquire an extra auth/database dependency.
 if (!studio) return resolve(event);
 event.setHeaders({
  'cache-control': 'private, no-store',
  'x-robots-tag': 'noindex, nofollow',
  // no-referrer can turn a normal form's Origin into null and break CSRF checks.
  // Keep same-origin form headers without leaking studio URLs to other sites.
  'referrer-policy': 'same-origin',
  // Only the authenticated preview may be framed, and only by this same website.
  'x-frame-options': event.url.pathname === '/studio/preview' ? 'SAMEORIGIN' : 'DENY'
 });
 if (event.request.method !== 'GET' && event.request.method !== 'HEAD') {
  // Explicit origin checking covers every studio POST, not just visible HTML forms.
  if (event.request.headers.get('origin') !== event.url.origin) error(403, 'This request must come from the studio.');
 }
 const token = event.cookies.get(SESSION_COOKIE);
 if (token) {
  try {
   event.locals.user = await sessionUser(token);
  } catch {
   // Database errors must never turn into authenticated access or reveal credentials.
   error(503, 'Sign-in is temporarily unavailable. Please try again shortly.');
  }
  if (!event.locals.user) clearSessionCookie(event.cookies);
 }
 return resolve(event);
}
