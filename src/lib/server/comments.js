import { database } from '#lib/server/db';
import { requireUser } from '#lib/server/auth';

export function validateComment(formData) {
 const values = {};
 const errors = {};
 for (const [name, max] of [['project', 100], ['name', 80], ['message', 2000]]) {
  const value = formData.get(name);
  values[name] = typeof value === 'string' ? value.trim() : '';
  if (!values[name] || values[name].length > max || (value !== null && typeof value !== 'string')) {
   errors[name] = name === 'project' ? 'Choose an existing project.' : `Enter ${name === 'name' ? 'a name' : 'a comment'} of 1–${max} characters.`;
  }
 }
 if (!/^[a-z0-9-]+$/.test(values.project)) errors.project = 'Choose an existing project.';
 return { values, errors };
}

export async function studioComments(locals, slug) {
 requireUser(locals);
 const sql = database();
 const projects = await sql`SELECT slug, title FROM projects ORDER BY display_order, id`;
 const selected = slug ? projects.find(project => project.slug === slug) : projects[0];
 if (!selected) return { commentProjects: projects, selectedCommentProject: null, comments: [], commentLoadError: slug ? 'Choose an existing project to see its comments.' : '' };
 const comments = await sql`SELECT comments.id::text AS id, comments.display_name AS name,
  comments.message, comments.created_at AS created
  FROM comments JOIN projects ON projects.id = comments.project_id
  WHERE projects.slug = ${selected.slug} ORDER BY comments.created_at DESC, comments.id DESC`;
 return {
  commentProjects: projects, selectedCommentProject: selected,
  comments: comments.map(comment => ({ ...comment, created: new Date(comment.created).toISOString() })),
  commentLoadError: ''
 };
}

export async function saveComment(locals, values) {
 requireUser(locals);
 const sql = database();
 // Selecting the project in the insert also prevents orphan comments if a project disappears.
 const saved = await sql`INSERT INTO comments (project_id, display_name, message)
  SELECT id, ${values.name}, ${values.message} FROM projects WHERE slug = ${values.project}
  RETURNING id`;
 return saved.length === 1;
}

export async function deleteComment(locals, id, project) {
 requireUser(locals);
 const sql = database();
 // Match both id and project: a modified form cannot delete a different project's comment.
 const deleted = await sql`DELETE FROM comments USING projects
  WHERE comments.project_id = projects.id AND projects.slug = ${project}
  AND comments.id = ${id} RETURNING comments.id`;
 return deleted.length === 1;
}
