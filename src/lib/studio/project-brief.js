import { projectCategories } from '../project-form.js';

export function readProjectBrief(input) {
 const title = input.get('title');
 const description = input.get('description');
 // Repeated checkbox values preserve every chosen category in the AI brief.
 const category = [...new Set(input.getAll('category'))];
 if (typeof title !== 'string' || !title.trim() || title.length > 160
  || typeof description !== 'string' || !description.trim() || description.length > 5000
  || !category.length || category.some(value => !projectCategories.includes(value))) {
  throw new Error('Add a project name, choose at least one category, and tell me about the project.');
 }
 return { title: title.trim(), category, description: description.trim() };
}
