import { requireUser } from '#lib/server/auth';

export function load({ locals }) {
 // No draft in a URL or database: data arrives only from the authenticated parent tab.
 return { user: requireUser(locals) };
}
