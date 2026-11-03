import { generateSummary } from './openrouter.js';

// Drafting has no database writes; only the separate Save project action publishes it.
export async function generateProjectSummary(project, { locals, ...options }) {
 if (!locals?.user) throw new Error('Authentication required');
 return generateSummary(project, options);
}
