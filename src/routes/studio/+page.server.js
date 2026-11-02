import { fail, redirect } from '@sveltejs/kit';
import { normaliseHex, getPalette } from '#lib/server/color-api';
import { allowLogin, checkPassword, startSession, endSession, requireUser } from '#lib/server/auth';
import { studioComments, saveComment, validateComment, deleteComment } from '#lib/server/comments';
import { createProject } from '#lib/server/create-project';
import { validateProject } from '#lib/server/project-input';
import { findProject } from '#lib/server/projects';
import { normaliseUsername, validUsername, validPassword } from '#lib/server/passwords';

export async function load({ locals, url, cookies }) {
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
 let commentsData;
 try { commentsData = await studioComments(locals, url.searchParams.get('project')); } catch {
  commentsData = { commentProjects: [], selectedCommentProject: null, comments: [], commentLoadError: 'Comments are temporarily unavailable. Please try again shortly.' };
 }
 // Consume the deletion notice once instead of keeping it in the URL.
 const commentDeleted = cookies.get('studio_comment_deleted') === url.searchParams.get('project');
 if (cookies.get('studio_comment_deleted')) cookies.delete('studio_comment_deleted', { path: '/studio', secure: true });
 return { user, createdProject, ...commentsData, commentSaved: url.searchParams.get('commentSaved') === '1', commentDeleted };
}

export const actions = {
 generatePalette: async ({ locals, request, fetch }) => {
  // Check identity before parsing input or contacting the external service.
  requireUser(locals);
  if (Number(request.headers.get('content-length') || 0) > 1024) {
   return fail(400, { paletteMessage: 'Please enter a HEX colour such as #DEC1DA.' });
  }
  let input;
  try { input = await request.formData(); } catch {
   return fail(400, { paletteMessage: 'Please use the colour palette form.' });
  }
  const raw = input.get('hex');
  const hex = normaliseHex(raw);
  const paletteHex = typeof raw === 'string' ? raw.slice(0, 16) : '';
  if (!hex) return fail(400, { paletteHex, paletteMessage: 'Enter 3 or 6 hexadecimal digits, with or without #.' });
  try {
   return { paletteHex: `#${hex}`, palette: await getPalette(hex, fetch) };
  } catch {
   return fail(502, { paletteHex: `#${hex}`, paletteMessage: 'The colour service could not generate a palette. Please try again shortly.' });
  }
 },
 deleteComment: async ({ locals, request, cookies }) => {
  requireUser(locals);
  let input;
  try { input = await request.formData(); } catch {
   return fail(400, { deleteMessage: 'Please use the Delete comment button.' });
  }
  const id = input.get('commentId');
  const project = input.get('project');
  if (typeof id !== 'string' || !/^[1-9][0-9]{0,17}$/.test(id) || typeof project !== 'string' || !/^[a-z0-9-]{1,100}$/.test(project)) {
   return fail(400, { deleteMessage: 'Choose a valid comment and project.' });
  }
  try {
   if (!await deleteComment(locals, id, project)) return fail(404, { deleteMessage: 'That comment is no longer available for this project.' });
  } catch {
   return fail(503, { deleteMessage: 'The comment could not be deleted. Please try again shortly.' });
  }
  cookies.set('studio_comment_deleted', project, { path: '/studio', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 });
  redirect(303, `/studio?project=${encodeURIComponent(project)}#comments`);
 },
 addComment: async ({ locals, request }) => {
  requireUser(locals);
  if (Number(request.headers.get('content-length') || 0) > 32768) {
   return fail(413, { commentMessage: 'This submission is too large. Please shorten the comment.' });
  }
  let input;
  try { input = await request.formData(); } catch {
   return fail(400, { commentMessage: 'Please use the comment form.' });
  }
  const { values, errors } = validateComment(input);
  if (Object.keys(errors).length) return fail(400, { commentValues: values, commentErrors: errors, commentMessage: 'Please check the comment fields.' });
  try {
   if (!await saveComment(locals, values)) return fail(400, { commentValues: values, commentErrors: { project: 'That project is no longer available.' }, commentMessage: 'Choose an existing project.' });
  } catch {
   return fail(503, { commentValues: values, commentMessage: 'The comment could not be saved. Please try again shortly.' });
  }
  // Refreshing the confirmation reloads stored comments without posting again.
  redirect(303, `/studio?project=${encodeURIComponent(values.project)}&commentSaved=1#comments`);
 },
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
