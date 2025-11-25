import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-node';

const config = {
	kit: { 
		adapter: adapter({
			out: 'build',
			precompress: false
		})
	},
	preprocess: [mdsvex()],
	extensions: ['.svelte', '.svx']
};

export default config;
