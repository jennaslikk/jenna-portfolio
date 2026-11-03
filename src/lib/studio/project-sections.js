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
 ['text', 'Text only'], ['text-image', 'Text above image'], ['image', 'Full-width image'],
 ['two-images', 'Two-column images'], ['gallery', 'Image gallery'], ['video', 'Single video'],
 ['two-videos', 'Side-by-side videos'], ['storyboard', 'Square storyboard'], ['vertical-video', 'Vertical video']
].map(([value, label]) => ({ value, label }));

export function makeSection(type, id) {
 const definition = sectionTypes.find(item => item.type === type);
 if (!definition) throw new Error('Choose an available section type.');
 return { id, type, heading: definition.label, description: '', text: '', layout: definition.layout, media: [] };
}

export function validateMedia(value, catalogue) {
 if (!value || typeof value !== 'object' || !catalogue.some(item => item.src === value.src && item.kind === value.kind)) throw new Error('Choose media already available in the project library.');
 if (!Number.isFinite(value.ratio) || value.ratio < 0.05 || value.ratio > 20) throw new Error('The media proportions could not be read.');
 for (const key of ['alt', 'caption']) if (typeof value[key] !== 'string' || value[key].length > 500) throw new Error('Please shorten the media caption or description.');
 return {src:value.src,kind:value.kind,ratio:value.ratio,alt:value.alt,caption:value.caption};
}

export function validateSectionLayout(value, catalogue = []) {
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
  if (!Array.isArray(section.media) || section.media.length > 12) throw new Error('Use up to twelve media items per section.');
  return { id: section.id, type: section.type, layout: section.layout, heading: section.heading, description: section.description, text: section.text, media: section.media.map(item => validateMedia(item, catalogue)) };
 }) };
}

export function moveSection(sections, index, direction) {
 const target = index + direction;
 if (target < 0 || target >= sections.length) return sections;
 const reordered = [...sections];
 [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
 return reordered;
}

// Accept only known text fields; inline editing cannot change URLs or layout data.
export function updatePreviewText(project, action, catalogue = []) {
 if (typeof action.value !== 'string') throw new Error('Please enter plain text.');
 const next = structuredClone(project);
 if (action.target === 'project' && ['title','description','year','client','context','summary','body','roles','tools'].includes(action.field)) {
  // Keep a new empty line while typing, so Enter can start the next role/tool.
  next[action.field] = ['roles','tools'].includes(action.field) ? (action.value ? action.value.split('\n') : []) : action.value;
 } else if (action.target === 'section' && ['heading','description','text'].includes(action.field)) {
  const section = next.layout.sections.find(section => section.id === action.id);
  if (!section) throw new Error('This section is no longer available.');
  section[action.field] = action.value;
 } else if (action.target === 'caption' && Number.isInteger(action.index)) {
  const item = next.layout.sections.find(section => section.id === action.id)?.media[action.index];
  if (!item) throw new Error('This media is no longer available.');
  item.caption = action.value;
 } else throw new Error('This field cannot be edited.');
 return validatePreviewProject(next, catalogue);
}

export function validatePreviewProject(value, catalogue = []) {
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
 const cover = catalogue.some(item => item.src === value.cover && item.kind === 'image') ? value.cover : '';
 const coverRatio = Number.isFinite(value.coverRatio) && value.coverRatio > 0.05 && value.coverRatio < 20 ? value.coverRatio : 16 / 9;
 return { ...project, format: value.format, slug: 'studio-preview', createdViaStudio: true, layout: validateSectionLayout(value.layout, catalogue), cover, coverRatio };
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
