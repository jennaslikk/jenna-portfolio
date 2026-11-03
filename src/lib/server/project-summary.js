import { generateSummary, hasOpenRouterKey } from './openrouter.js';

export async function completeProjectSummary({ locals, slug, project, apiKey, model, connect, fetcher = fetch, timeoutMs = 10000 }) {
 if (!locals?.user) throw new Error('Authentication required');
 // Claim generation atomically: a project can incur at most one application API request.
 const sql = connect();
 const claimed = await sql`UPDATE projects SET content = content || '{"summaryStatus":"generating"}'::jsonb
  WHERE slug = ${slug} AND summary IS NULL AND content->>'createdViaStudio' = 'true'
  AND NOT (content ? 'summaryStatus') RETURNING id::text AS id`;
 if (!claimed.length) return 'skipped';
 const id = claimed[0].id;
 let summary = null;
 let status = 'not_configured';
 if (hasOpenRouterKey(apiKey)) {
  try {
   summary = await generateSummary(project, { apiKey, model, fetcher, timeoutMs });
   status = 'generated';
  } catch {
   status = 'failed';
  }
 }
 // Get a fresh query timeout after the external request; the original content is already saved.
 const save = connect();
 await save`UPDATE projects SET summary = ${summary},
  content = content || jsonb_build_object('summaryStatus', ${status}::text)
  WHERE id = ${id} AND summary IS NULL`;
 return status;
}
