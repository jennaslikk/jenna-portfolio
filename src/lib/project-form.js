// Shared options keep the studio aligned with the portfolio's existing filters.
export const projectCategories = ['AI Creative', 'Motion Graphics', 'Branding', 'Illustration'];
export const projectTypes = ['landscape', 'portrait'];
export const projectFields = [
 { name: 'title', label: 'Project title', max: 160, required: true },
 { name: 'year', label: 'Year', max: 4 },
 { name: 'client', label: 'Client', max: 160 },
 { name: 'description', label: 'Description', max: 500, required: true, multiline: true },
 { name: 'context', label: 'Context', max: 5000, multiline: true },
 { name: 'roles', label: 'Roles', max: 2000, multiline: true, hint: 'Enter one role per line.' },
 { name: 'tools', label: 'Tools', max: 2000, multiline: true, hint: 'Enter one tool per line.' },
 { name: 'body', label: 'Body content', max: 20000, multiline: true, hint: 'Plain text; line breaks are preserved.' }
];
