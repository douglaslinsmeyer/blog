import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://douglaslinsmeyer.com',
  integrations: [mdx(), sitemap()],
  markdown: {
    // Shiki dual-theme — light/dark themes emit CSS variables so they
    // swap with the rest of the site's theme. We bind these to our
    // color tokens in src/styles/code.css (Task 13).
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
      defaultColor: false,
      wrap: false,
    },
  },
});
