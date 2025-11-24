import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-vercel';

const config = {
	kit: { adapter: adapter() },
	preprocess: [mdsvex()],
	extensions: ['.svelte', '.svx']
};

export default config;
