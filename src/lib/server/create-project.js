import { database } from '#lib/server/db';
import { requireUser } from '#lib/server/auth';
import { projectSlug } from '#lib/server/project-input';

export async function createProject(project, locals) {
 requireUser(locals);
 const sql = database();
 const base = projectSlug(project.title);
 for (let attempt = 0; attempt < 50; attempt += 1) {
  const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
  // ON CONFLICT also handles two requests choosing the same slug at once.
  const rows = await sql`INSERT INTO projects (slug, title, category, type, year, client,
   description, context, roles, tools, body, summary, display_order, content)
   SELECT ${slug}, ${project.title}, ${project.category}, ${project.type},
    ${project.year || null}, ${project.client || null}, ${project.description},
    ${project.context || null}, ${project.roles}, ${project.tools}, ${project.body}, ${project.summary || null},
    COALESCE(MAX(display_order), 0) + 1, ${JSON.stringify({ cover: '', createdViaStudio: true, summaryStatus: project.summary ? 'reviewed' : 'not_requested' })}::jsonb
   FROM projects ON CONFLICT (slug) DO NOTHING RETURNING slug, title`;
  if (rows.length) return rows[0];
 }
 throw new Error('Could not allocate a unique project URL.');
}
