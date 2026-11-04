import { validatePreviewProject } from './project-sections.js';
import { readProjectBrief } from './project-brief.js';

export function validateLayoutSave(input, catalogue) {
 const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
 if (!input || !uuid.test(input.key) || !['draft','publish'].includes(input.intent)) throw new Error('Please use Save Draft or Add to Portfolio.');
 if (input.slug && !/^[a-z0-9-]{1,100}$/.test(input.slug)) throw new Error('Invalid draft.');
 if (input.revision && !uuid.test(input.revision)) throw new Error('Invalid draft version.');
 const form = new FormData();
 form.set('title', input.brief?.title || '');form.set('description', input.brief?.description || '');
 if (!Array.isArray(input.brief?.category)) throw new Error('Choose project categories.');
 for (const category of input.brief.category) form.append('category', category);
 const brief = readProjectBrief(form);
 if (input.project?.cover && !catalogue.some(item => item.src === input.project.cover && item.kind === 'image')) throw new Error('Your cover is unavailable in the media library. Try loading the library again.');
 const project = validatePreviewProject(input.project, catalogue);
 if (!project.title.trim()) throw new Error('Give your project a name before saving.');
 if (/berry[\s_-]*lovely|usa[\s_-]*valentines/i.test(project.title + ' ' + brief.title)) throw new Error('This unreleased project is not available in the builder.');
 if (!project.category.length) throw new Error('Choose at least one project category.');
 if (input.intent === 'publish') {
  if (input.confirmed !== true) throw new Error('Confirm Add to Portfolio before publishing.');
  if (!project.description.trim() || !project.cover || !project.layout.sections.length) throw new Error('Add an introduction, cover image and at least one section before publishing.');
  if (project.year && !/^[1-9][0-9]{3}$/.test(project.year)) throw new Error('Use a four-digit year or leave it empty.');
  for (const section of project.layout.sections) {
   const count = section.layout === 'gallery' ? 3 : ['two-images','two-videos'].includes(section.layout) ? 2 : section.layout === 'text' ? 0 : 1;
   if (section.media.length < count) throw new Error('Fill the media placeholders or remove unfinished sections before publishing.');
  }
 }
 return {project,brief,key:input.key,slug:input.slug || '',revision:input.revision || '',status:input.intent === 'publish' ? 'published' : 'draft'};
}
