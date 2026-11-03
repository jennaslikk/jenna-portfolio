import { projectCategories, projectTypes, projectFields } from '../project-form.js';

export function validateProject(formData) {
 const values = {};
 const errors = {};
 for (const field of projectFields) {
  const raw = formData.get(field.name);
  values[field.name] = typeof raw === 'string' ? raw.trim() : '';
  if (raw !== null && typeof raw !== 'string') errors[field.name] = 'Please enter text for this field.';
  else if (field.required && !values[field.name]) errors[field.name] = `${field.label} is required.`;
  else if (values[field.name].length > field.max) errors[field.name] = `Use no more than ${field.max} characters.`;
 }
 // Preserve the reviewed draft on validation errors and store it as plain text.
 const summary = formData.get('summary');
 values.summary = typeof summary === 'string' ? summary.trim() : '';
 if (summary !== null && typeof summary !== 'string') errors.summary = 'Please enter plain text for the summary.';
 else if (values.summary.length > 2000) errors.summary = 'Use no more than 2000 characters for the summary.';
 // Repeated checkbox fields become one validated, deduplicated category list.
 values.category = [...new Set(formData.getAll('category'))];
 if (!values.category.length || values.category.some(value => !projectCategories.includes(value))) {
  errors.category = 'Choose at least one valid category.';
 }
 for (const [name, options] of [['type', projectTypes]]) {
  const raw = formData.get(name);
  values[name] = typeof raw === 'string' ? raw : '';
  if (!options.includes(values[name])) errors[name] = `Choose a valid ${name}.`;
 }
 if (values.year && !/^[1-9][0-9]{3}$/.test(values.year)) errors.year = 'Enter a four-digit year, or leave it empty.';
 if (/berry[\s_-]*lovely|usa[\s_-]*valentines/i.test(values.title)) {
  errors.title = 'This unreleased project is not available for publishing yet.';
 }
 const lists = {};
 for (const name of ['roles', 'tools']) {
  lists[name] = values[name].split(/\r?\n/).map(value => value.trim()).filter(Boolean);
  if (lists[name].length > 20 || lists[name].some(value => value.length > 100)) {
   errors[name] = 'Use up to 20 lines, with no more than 100 characters per line.';
  }
 }
 return { values, errors, project: { ...values, roles: lists.roles, tools: lists.tools } };
}

export function projectSlug(title) {
 // Keep URLs readable; the database, not the browser, checks uniqueness.
 return title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80).replace(/-$/g, '') || 'project';
}
