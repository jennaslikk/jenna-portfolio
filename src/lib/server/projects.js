import { error } from '@sveltejs/kit';
import { database } from '#lib/server/db';

function projectFromRow(row) {
 const { studio, ...publicContent } = row.content;
 // Preserve the field names that the existing portfolio templates already use.
 return { ...publicContent, slug: row.slug, title: row.title, description: row.description,
  format: row.type, year: row.year, client: row.client, category: row.category,
  context: row.context, roles: row.roles, tools: row.tools, body: row.body,
  summary: row.summary, displayOrder: row.display_order };
}

export async function listProjects() {
 try {
  const sql = database();
  const rows = await sql`SELECT slug, title, description, type, year, client, category,
   context, roles, tools, body, summary, display_order, content FROM projects
   WHERE COALESCE(content->>'publicationStatus','published') = 'published' ORDER BY display_order, id`;
  return rows.map(projectFromRow);
 } catch {
  // Never expose connection URLs or database diagnostics on a public page.
  error(503, 'Projects are temporarily unavailable. Please try again shortly.');
 }
}

export async function findProject(slug) {
 let rows;
 try {
  const sql = database();
  rows = await sql`SELECT slug, title, description, type, year, client, category,
   context, roles, tools, body, summary, display_order, content FROM projects WHERE slug = ${slug}
   AND COALESCE(content->>'publicationStatus','published') = 'published'`;
 } catch {
  error(503, 'Projects are temporarily unavailable. Please try again shortly.');
 }
 if (!rows.length) error(404, 'Project not found');
 return projectFromRow(rows[0]);
}
