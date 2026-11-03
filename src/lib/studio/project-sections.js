// Approved editorial sections share a small set of portfolio layout patterns.
export const sectionTypes = [
 ['introduction', 'Introduction', 'text'],
 ['context', 'Context', 'text'],
 ['concept-development', 'Concept development', 'text-image'],
 ['research-moodboard', 'Research / moodboard', 'gallery'],
 ['creative-process', 'Creative process', 'text-image'],
 ['illustration', 'Illustration', 'gallery'],
 ['storyboard', 'Storyboard', 'storyboard'],
 ['ai-assisted-workflow', 'AI-assisted workflow', 'two-videos'],
 ['animation-highlights', 'Animation highlights', 'vertical-video'],
 ['image-gallery', 'Image gallery', 'gallery'],
 ['video-showcase', 'Video showcase', 'video'],
 ['final-outcome', 'Final outcome', 'image']
].map(([type, label, layout]) => ({ type, label, layout }));

export const sectionLayouts = [
 ['text', 'Text only'], ['text-image', 'Text with image'], ['image', 'Full-width image'],
 ['two-images', 'Two-column images'], ['gallery', 'Image gallery'], ['video', 'Single video'],
 ['two-videos', 'Side-by-side videos'], ['storyboard', 'Square storyboard'], ['vertical-video', 'Vertical video']
].map(([value, label]) => ({ value, label }));

export function makeSection(type, id) {
 const definition = sectionTypes.find(item => item.type === type);
 if (!definition) throw new Error('Choose an available section type.');
 return { id, type, heading: definition.label, description: '', text: '', layout: definition.layout, media: [] };
}

export function validateSectionLayout(value) {
 if (!value || value.version !== 1 || !Array.isArray(value.sections) || value.sections.length > 24) {
  throw new Error('Use up to 24 project sections.');
 }
 const ids = new Set();
 return { version: 1, sections: value.sections.map(section => {
  if (!section || !/^section-[a-z0-9-]{1,60}$/.test(section.id) || ids.has(section.id)) throw new Error('Invalid section identifier.');
  ids.add(section.id);
  if (!sectionTypes.some(item => item.type === section.type) || !sectionLayouts.some(item => item.value === section.layout)) throw new Error('Choose an available section and media layout.');
  for (const [name, max] of [['heading', 160], ['description', 2000], ['text', 5000]]) {
   if (typeof section[name] !== 'string' || section[name].length > max) throw new Error('Please shorten the section text.');
  }
  // Stage A intentionally accepts no media paths. Stage C will add an approved catalogue.
  if (!Array.isArray(section.media) || section.media.length) throw new Error('Media selection will be available in Stage C.');
  return { id: section.id, type: section.type, layout: section.layout, heading: section.heading, description: section.description, text: section.text, media: [] };
 }) };
}

export function moveSection(sections, index, direction) {
 const target = index + direction;
 if (target < 0 || target >= sections.length) return sections;
 const reordered = [...sections];
 [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
 return reordered;
}

export function validatePreviewProject(value) {
 if (!value || typeof value !== 'object') throw new Error('Invalid project preview.');
 const project = {};
 for (const [name, max] of [['title', 160], ['description', 500], ['year', 4], ['client', 160], ['context', 5000], ['summary', 2000], ['body', 20000]]) {
  if (typeof value[name] !== 'string' || value[name].length > max) throw new Error('Please check the project details before previewing.');
  project[name] = value[name];
 }
 for (const name of ['roles', 'tools']) {
  if (!Array.isArray(value[name]) || value[name].length > 20 || value[name].some(item => typeof item !== 'string' || item.length > 100)) throw new Error('Use up to 20 short lines for roles and tools.');
  project[name] = [...value[name]];
 }
 if (!['landscape', 'portrait'].includes(value.format)) throw new Error('Choose a valid project format.');
 return { ...project, format: value.format, slug: 'studio-preview', createdViaStudio: true, layout: validateSectionLayout(value.layout), cover: '' };
}

export function projectFromForm(formData, sections) {
 const text = name => String(formData.get(name) || '').trim();
 const lines = name => text(name).split(/\r?\n/).map(line => line.trim()).filter(Boolean);
 return validatePreviewProject({
  title: text('title') || 'Project title', description: text('description') || 'Project description',
  client: text('client'), year: text('year'), context: text('context'), summary: text('summary'), body: text('body'),
  roles: lines('roles'), tools: lines('tools'), format: text('type') || 'landscape',
  layout: { version: 1, sections }
 });
}
