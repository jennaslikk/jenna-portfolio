import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { generateProjectSummary } from '#lib/server/project-summary';
import { generateProjectLayout, layoutFailureMessage } from '#lib/server/openrouter';
import { layoutToDraft } from '#lib/studio/layout-response';
import { readProjectBrief } from '#lib/studio/project-brief';
import { validateLayoutSave } from '#lib/studio/layout-save';
import { studioProjectList, openLayoutDraft, saveLayoutProject, DraftConflict } from '#lib/server/layout-projects';
import { publicProjectMedia } from '#lib/server/project-media';
import { getFontDetails } from '#lib/server/font-details';
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
   if (project.createdViaStudio) createdProject = { slug: project.slug, title: project.title, summary: project.summary, summaryStatus: project.summaryStatus };
  } catch { /* A stale confirmation URL must not break the studio. */ }
 }
 let commentsData;
 try { commentsData = await studioComments(locals, url.searchParams.get('project')); } catch {
  commentsData = { commentProjects: [], selectedCommentProject: null, comments: [], commentLoadError: 'Comments are temporarily unavailable. Please try again shortly.' };
 }
 // Consume the deletion notice once instead of keeping it in the URL.
 const commentDeleted = cookies.get('studio_comment_deleted') === url.searchParams.get('project');
 if (cookies.get('studio_comment_deleted')) cookies.delete('studio_comment_deleted', { path: '/studio', secure: true });
 let savedProjects = [], projectListMessage = '';
 try { savedProjects = await studioProjectList(locals); } catch { projectListMessage = 'Your projects could not be loaded. Please refresh to try again.'; }
 return { user, createdProject, savedProjects, projectListMessage, builderMedia: await publicProjectMedia(), ...commentsData, commentSaved: url.searchParams.get('commentSaved') === '1', commentDeleted };
}

export const actions = {
 saveLayout: async ({ locals, request }) => {
  requireUser(locals);
  if (Number(request.headers.get('content-length') || 0) > 1048576) return fail(413,{saveMessage:'This layout is too large. Please shorten it.'});
  let input;
  try {
   const form = await request.formData(), raw = form.get('layout');
   if (typeof raw !== 'string' || raw.length > 500000) return fail(400,{saveMessage:'Please check your project layout.'});
   input = JSON.parse(raw);
  } catch { return fail(400,{saveMessage:'The layout could not be read. Your changes remain in this tab.'}); }
  let value;
  try { value = validateLayoutSave(input, await publicProjectMedia()); }
  catch (error) { return fail(400,{saveMessage:error.message || 'Please check your project details.'}); }
  try {
   const saved = await saveLayoutProject(value,locals);
   return {saved,saveMessage:saved.status === 'published' ? 'Added to your portfolio.' : 'Draft saved. Find it under Your projects.'};
  } catch (error) {
   return fail(error instanceof DraftConflict ? 409 : 503,{saveMessage:error instanceof DraftConflict ? error.message : 'Your project could not be saved. Your changes remain in this tab; please try again.'});
  }
 },
 openDraft: async ({ locals, request }) => {
  requireUser(locals);
  let slug;
  try { slug = (await request.formData()).get('slug'); } catch { return fail(400,{saveMessage:'Choose a saved draft.'}); }
  if (typeof slug !== 'string' || !/^[a-z0-9-]{1,100}$/.test(slug)) return fail(400,{saveMessage:'Choose a saved draft.'});
  try { return {openedDraft:await openLayoutDraft(slug,locals,await publicProjectMedia())}; }
  catch { return fail(404,{saveMessage:'This draft could not be opened. Refresh Your projects and try again.'}); }
 },
 generateLayout: async ({ locals, request, fetch }) => {
  requireUser(locals);
  if (Number(request.headers.get('content-length') || 0) > 32768) return fail(413, {layoutMessage:'Please shorten your project description.'});
  let input;
  try { input=await request.formData(); } catch { return fail(400,{layoutMessage:'Please use the project description form.'}); }
  let brief;
  try { brief = readProjectBrief(input); }
  catch { return fail(400,{layoutMessage:'Add a project name, choose at least one category, and tell me about the project.'}); }
  try {
   const layout=await generateProjectLayout(brief,{apiKey:env.OPENROUTER_API_KEY,model:env.OPENROUTER_MODEL,fetcher:fetch});
   return {layoutDraft:layoutToDraft(layout,brief.title,brief.category)};
  } catch (error) {return fail(502,{layoutMessage:layoutFailureMessage(error)});}
 },
 generateSummary: async ({ locals, request, fetch }) => {
  // Authenticate before reading drafts or making a potentially paid API request.
  requireUser(locals);
  if (Number(request.headers.get('content-length') || 0) > 131072) {
   return fail(413, { summaryMessage: 'This submission is too large. Please shorten the project text.' });
  }
  let formData;
  try { formData = await request.formData(); } catch {
   return fail(400, { summaryMessage: 'Please use the Generate AI Summary button.' });
  }
  // Other project fields need not be complete to preview a summary.
  const { values, errors } = validateProject(formData);
  if (errors.description || errors.context) {
   return fail(400, { values, errors: { description: errors.description, context: errors.context },
    summaryMessage: 'Enter a description and check the context before generating a summary.' });
  }
  try {
   const summary = await generateProjectSummary(values, { locals,
    apiKey: env.OPENROUTER_API_KEY, model: env.OPENROUTER_MODEL, fetcher: fetch });
   return { values: { ...values, summary }, summaryMessage: 'Summary generated. Review or edit it before saving the project.' };
  } catch {
   // Keep the previous draft and all entered fields when the provider fails.
   return fail(502, { values, summaryMessage: 'The AI summary could not be generated. Please try again later, or check the OpenRouter model and credits. Your draft has been kept.' });
  }
 },
 fontDetails: async ({ locals, request, fetch }) => {
  requireUser(locals);
  if (Number(request.headers.get('content-length') || 0) > 1024) return fail(400, { fontDetailsMessage: 'Choose a font from the collection.' });
  let input;
  try { input = await request.formData(); } catch { return fail(400, { fontDetailsMessage: 'Please use Font details.' }); }
  const fontId = input.get('fontId');
  if (typeof fontId !== 'string' || !/^[a-z0-9-]{1,60}$/.test(fontId)) return fail(400, { fontDetailsMessage: 'Choose a font from the collection.' });
  try { return { fontDetails: await getFontDetails(fontId, fetch) }; }
  catch { return fail(502, { fontDetailsMessage: 'Live font information is temporarily unavailable. The saved font and quote remain available.' }); }
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
 createProject: async ({ locals, request, fetch }) => {
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
  // Stage A has no layout persistence: do not silently publish while dropping sections.
  const rawLayout = formData.get('builderLayout');
  if (rawLayout) {
   try {
    const layout = JSON.parse(String(rawLayout));
    if (!Array.isArray(layout.sections) || layout.sections.length) return fail(400, { values, projectMessage: 'Section layouts are preview-only in Stage A. Your project has not been published.' });
   } catch { return fail(400, { values, projectMessage: 'Please check the section layout before publishing.' }); }
  }
  let saved;
  try { saved = await createProject(project, locals); } catch {
   return fail(503, { values, projectMessage: 'The project could not be saved. Please try again shortly.' });
  }
  // Save only the reviewed text; publishing must never trigger a paid AI request.
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
