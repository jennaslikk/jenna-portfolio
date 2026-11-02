import { findProject } from '#lib/server/projects';
export async function load({ params }) {
 return { project: await findProject(params.slug) };
}
