import { listProjects } from '#lib/server/projects';
export async function load() {
 const projects = await listProjects();
 return { selectedProjects: projects.filter(project => project.home).sort((a, b) => a.home.order - b.home.order) };
}
