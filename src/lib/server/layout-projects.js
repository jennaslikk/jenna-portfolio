import { randomUUID } from 'node:crypto';
import { database } from '#lib/server/db';
import { requireUser } from '#lib/server/auth';
import { projectSlug } from '#lib/server/project-input';
import { validatePreviewProject } from '#lib/studio/project-sections';

export class DraftConflict extends Error {}

export async function studioProjectList(locals) {
 const user = requireUser(locals);
 const sql = database();
 return await sql`SELECT slug,title,COALESCE(content->>'publicationStatus','published') AS status
  FROM projects WHERE COALESCE(content->>'publicationStatus','published') = 'published'
  OR (content->>'publicationStatus' = 'draft' AND content#>>'{studio,ownerId}' = ${String(user.id)})
  ORDER BY created_at DESC,id DESC`;
}

export async function openLayoutDraft(slug, locals, catalogue) {
 const user = requireUser(locals);
 const sql = database();
 const rows = await sql`SELECT slug,title,description,type,year,client,category,context,roles,tools,body,summary,content
  FROM projects WHERE slug = ${slug} AND content->>'publicationStatus' = 'draft'
  AND content#>>'{studio,ownerId}' = ${String(user.id)}`;
 if (!rows.length) throw new DraftConflict('This draft is unavailable. Refresh Your projects.');
 const row = rows[0], stored = row.content;
 return {slug:row.slug,key:stored.studio.key,revision:stored.studio.revision,brief:stored.studio.brief,
  project:validatePreviewProject({...stored,...row,format:row.type,year:row.year || '',client:row.client || '',context:row.context || '',summary:row.summary || ''},catalogue)};
}

export async function saveLayoutProject(value, locals) {
 const user = requireUser(locals);
 const sql = database(), p = value.project;
 const revision = randomUUID();
 const content = JSON.stringify({createdViaStudio:true,cover:p.cover,coverRatio:p.coverRatio,layout:p.layout,
  publicationStatus:value.status,summaryStatus:p.summary ? 'reviewed' : 'not_requested',
  studio:{ownerId:String(user.id),key:value.key,revision,brief:value.brief}});
 let rows;
 if (value.slug) {
  // Only the owner's current private draft can change. Published projects never match.
  rows = await sql`UPDATE projects SET title=${p.title},description=${p.description},category=${p.category},
   type=${p.format},year=${p.year || null},client=${p.client || null},context=${p.context || null},roles=${p.roles},
   tools=${p.tools},body=${p.body},summary=${p.summary || null},content=${content}::jsonb
   WHERE slug=${value.slug} AND content->>'publicationStatus'='draft'
   AND content#>>'{studio,ownerId}'=${String(user.id)} AND content#>>'{studio,key}'=${value.key}
   AND content#>>'{studio,revision}'=${value.revision} RETURNING slug,title`;
 } else {
  // A stable key prevents a repeated save from inserting the same draft twice.
  const slug = `${projectSlug(value.brief.title).slice(0,60)}-${value.key.replaceAll('-','')}`;
  rows = await sql`INSERT INTO projects (slug,title,category,type,year,client,description,context,roles,tools,body,summary,display_order,content)
   SELECT ${slug},${p.title},${p.category},${p.format},${p.year || null},${p.client || null},${p.description},${p.context || null},
   ${p.roles},${p.tools},${p.body},${p.summary || null},COALESCE(MAX(display_order),0)+1,${content}::jsonb
   FROM projects ON CONFLICT (slug) DO NOTHING RETURNING slug,title`;
 }
 if (!rows.length) throw new DraftConflict('This draft was already saved or changed in another tab. Reopen it from Your projects before saving again.');
 return {...rows[0],revision,status:value.status};
}
