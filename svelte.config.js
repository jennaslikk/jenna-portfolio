import adapter from '@sveltejs/adapter-auto';
export default { kit: { alias: { '#lib': './src/lib' }, adapter: adapter() } };
