import { listProjects } from '#lib/server/projects';
export async function load() {
 return { projects: await listProjects() };
}
