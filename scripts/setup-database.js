import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
import { projects } from '../src/lib/projects.js';
import { fruityMedia } from '../src/lib/media.js';

// This file is an initial snapshot, not a live content source for the website.
const categories = {
 'project-01': [],
 'fruity-pigs': ['AI Creative', 'Motion Graphics', 'Illustration'],
 'project-03': ['Branding'],
 'daybreak-distillery': ['Motion Graphics'],
 'project-05': ['AI Creative']
};
const connection = process.env.DATABASE_URL_UNPOOLED;
if (!connection) throw new Error('Set DATABASE_URL_UNPOOLED in your private environment file.');
const sql = neon(connection);
const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
// Only checked-in SQL is executed as schema text; all project values are parameters.
const statements = schema.split(';').map(statement => statement.trim()).filter(Boolean);
const queries = statements.map(statement => sql.query(statement));
for (const [index, project] of projects.entries()) {
 const content = { ...project };
 let context = null;
 let roles = [];
 let tools = [];
 if (project.slug === 'fruity-pigs') {
  content.media = fruityMedia;
  content.home = { order: 1, cover: '/projects/fruity-pigs/home-selected-work.png', hoverVideo: '/projects/fruity-pigs/home-selected-work-hover.mp4' };
  context = 'An illustrated, animated social media video created for Funday Sweets’ launch of Fruity Pigs. The video follows a pig through a playful story, bringing the new candy to life through character and movement.';
  roles = ['Creative Direction', 'Illustration', 'Motion Graphics', 'AI-Assisted Animation'];
  tools = ['Procreate', 'After Effects', 'Magnific · Wan 3.0', 'ElevenLabs'];
 }
 if (project.slug === 'project-03') {
  content.home = { order: 2, cover: '/projects/imperfect/home-selected-work.png', hoverCover: '/projects/imperfect/home-selected-work.gif' };
 }
 // Existing records are never overwritten when this setup script is run again.
 queries.push(sql`INSERT INTO projects (slug, title, description, type, year, client, category,
  context, roles, tools, display_order, content)
  VALUES (${project.slug}, ${project.title}, ${project.description}, ${project.format},
   ${project.year || null}, ${project.client || null}, ${categories[project.slug] || []},
   ${context}, ${roles}, ${tools}, ${index + 1}, ${JSON.stringify(content)}::jsonb)
  ON CONFLICT (slug) DO NOTHING`);
}
try {
 await sql.transaction(queries);
 const rows = await sql`SELECT slug FROM projects ORDER BY display_order, id`;
 console.log('Database setup complete: projects, users, sessions, comments.');
 console.log(`Projects (${rows.length}): ${rows.map(row => row.slug).join(', ')}`);
} catch (error) {
 console.error('Database setup failed:', error.code || error.name);
 process.exitCode = 1;
}
