import { publicProjectMedia } from '#lib/server/project-media';
import { requireUser } from '#lib/server/auth';

export async function load({ locals }) {
 // No draft in a URL or database: data arrives only from the authenticated parent tab.
 const user = requireUser(locals);
 return { user, builderMedia: await publicProjectMedia() };
}
