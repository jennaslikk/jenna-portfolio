import { listProjects } from './projects.js';

import { isPublicMediaPath } from '../studio/media-paths.js';

// Read only paths already used by public projects. Nothing private is scanned or uploaded.
export async function publicProjectMedia() {
 const catalogue = new Map();
 let projects;
 // An unavailable library must not prevent signing out or using the other Studio tools.
 try { projects = await listProjects(); } catch { return []; }
 for (const project of projects) {
  const visit = value => {
   if (isPublicMediaPath(value)) {
    const kind = /\.(mp4|webm)$/i.test(value) ? 'video' : 'image';
    catalogue.set(value, { src: value, kind, label: `${project.title} — ${value.split('/').pop().replace(/[-_]/g, ' ')}` });
   } else if (Array.isArray(value)) value.forEach(visit);
   else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  };
  visit(project);
 }
 return [...catalogue.values()];
}
