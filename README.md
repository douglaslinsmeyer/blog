# Personal blog

Source for [douglaslinsmeyer.com](https://douglaslinsmeyer.com). Built with Astro 6, hosted on GitHub Pages.

## Develop

```bash
nvm use            # Node 24 (per .nvmrc)
npm install
npm run dev        # localhost:4321, drafts visible
npm run build      # astro check + astro build (CI runs this)
npm run preview    # serve the production build locally
```

## Publish

Posts live in `src/content/posts/*.mdx`. Notes live in `src/content/notes/*.md`. Push to `main`; the GitHub Actions workflow builds and deploys to GitHub Pages.

A post with `draft: true` in its frontmatter is excluded from production builds but visible in `npm run dev`.

## Reference

- Design spec: [`docs/superpowers/specs/2026-05-17-personal-blog-design.md`](docs/superpowers/specs/2026-05-17-personal-blog-design.md)
- Implementation plan: [`docs/superpowers/plans/2026-05-17-personal-blog.md`](docs/superpowers/plans/2026-05-17-personal-blog.md)
