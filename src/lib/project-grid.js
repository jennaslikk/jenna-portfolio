// Repeat the original five-card composition rather than auto-placing new cards.
const pattern = [
 { format: 'landscape', row: 0, column: 1 },
 { format: 'portrait', row: 0, column: 3 },
 { format: 'landscape', row: 1, column: 2 },
 { format: 'landscape', row: 2, column: 1 },
 { format: 'portrait', row: 2, column: 3, staggered: true }
];

export function projectGrid(projects) {
 let slot = 0;
 const placements = projects.map(project => {
  const format = project.format === 'portrait' ? 'portrait' : 'landscape';
  while (pattern[slot % pattern.length].format !== format) slot += 1;
  const position = pattern[slot % pattern.length];
  const row = Math.floor(slot / pattern.length) * 3 + position.row;
  slot += 1;
  return { slug: project.slug, row, column: position.column, staggered: !!position.staggered };
 });
 // Missing formats must not create empty rows with extra vertical gaps.
 const rows = [...new Set(placements.map(position => position.row))].sort((a, b) => a - b);
 return Object.fromEntries(placements.map(position => [position.slug, { ...position, row: rows.indexOf(position.row) + 1 }]));
}
