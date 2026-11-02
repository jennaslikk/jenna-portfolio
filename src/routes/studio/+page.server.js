import { fail, redirect } from '@sveltejs/kit';
import { allowLogin, checkPassword, startSession, endSession, requireUser } from '#lib/server/auth';
import { createProject } from '#lib/server/create-project';
import { validateProject } from '#lib/server/project-input';
import { findProject } from '#lib/server/projects';
import { normaliseUsername, validUsername, validPassword } from '#lib/server/passwords';

export async function load({ locals, url }) {
 // No project data or course tools are queried for logged-out visitors.
 if (!locals.user) return { user: null, createdProject: null };
 const user = requireUser(locals);
 let createdProject = null;
 const slug = url.searchParams.get('created');
 if (slug && /^[a-z0-9-]{1,100}$/.test(slug)) {
  try {
   const project = await findProject(slug);
   if (project.createdViaStudio) createdProject = { slug: project.slug, title: project.title };
  } catch { /* A stale confirmation URL must not break the studio. */ }
 }
 return { user, createdProject };
}

export const actions = {
 createProject: async ({ locals, request }) => {
  // Authorisation runs before reading the submitted content or writing anything.
  requireUser(locals);
  if (Number(request.headers.get('content-length') || 0) > 131072) {
   return fail(413, { projectMessage: 'This submission is too large. Please shorten the project text.' });
  }
  let formData;
  try { formData = await request.formData(); } catch {
   return fail(400, { projectMessage: 'Please use the Add a project form.' });
  }
  const { values, errors, project } = validateProject(formData);
  if (Object.keys(errors).length) {
   return fail(400, { values, errors, projectMessage: 'Please check the highlighted fields.' });
  }
  let saved;
  try { saved = await createProject(project, locals); } catch {
   return fail(503, { values, projectMessage: 'The project could not be saved. Please try again shortly.' });
  }
  // A GET after saving prevents refresh from submitting the project a second time.
  redirect(303, `/studio?created=${saved.slug}`);
 },
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
