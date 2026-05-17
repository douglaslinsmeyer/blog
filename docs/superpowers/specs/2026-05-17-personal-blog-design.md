# Personal Blog — Design Spec

**Date:** 2026-05-17
**Owner:** Douglas Linsmeyer
**Status:** Approved — ready for implementation planning

## Overview

A personal blog at `douglaslinsmeyer.com` hosting a mix of long-form technical essays and short notes. Built with Astro 6.x, deployed via GitHub Actions to GitHub Pages. Editorial-minimalist design — serif typography, generous whitespace, content-first. No analytics, no comments, no third-party tracking in the baseline.

The author is a software engineer; the site must handle code snippets beautifully.

## Goals

- A blog that loads fast, reads well, and ages gracefully.
- Excellent syntax highlighting and clean code-block presentation.
- Zero third-party runtime dependencies (no embedded scripts, fonts hosted ourselves).
- Trivial publishing workflow: write a markdown file, push to `main`, it ships.
- Clean extension points for later additions (RSS, comments, search) without rework.

## Non-goals

- Multi-author support.
- Commerce, gated content, or auth.
- Real-time features.
- A CMS or web-based editor — markdown files in git is the source of truth.

## Stack

| Layer | Choice | Why |
|------|--------|-----|
| Framework | Astro 6.x | Static-first, minimal JS shipped, MDX support, Shiki syntax highlighting built in |
| Content authoring | MDX (posts) + Markdown (notes) | MDX leaves the door open for interactive components in essays without bloating notes |
| Hosting | GitHub Pages | Free, custom-domain friendly, integrates with Actions |
| CI/CD | GitHub Actions (`withastro/action@v3` + `actions/deploy-pages@v4`) | Official supported path; modern "GitHub Actions" Pages source (not `gh-pages` branch) |
| Node | 24 LTS ("Krypton"), pinned via `.nvmrc` | Newest LTS as of May 2026 (released April 2026) |
| Language | TypeScript | Astro components and `src/content/config.ts` schema |

**Scaffold:** Start from `npm create astro@latest -- --template blog`. Strip its styling and templates; keep its content collections structure as a baseline. Rebuild layouts/components to match the editorial design.

## Hosting & Domain

- **Domain:** `douglaslinsmeyer.com`
- **Registrar / DNS:** Cloudflare
- **DNS records (Cloudflare, all proxy = "DNS only" / grey cloud):**

  | Type | Name | Target |
  |------|------|--------|
  | CNAME | `@` | `douglaslinsmeyer.github.io` |
  | CNAME | `www` | `douglaslinsmeyer.github.io` |

  Cloudflare's CNAME flattening makes the apex CNAME valid. *Both records must be DNS-only (grey cloud), at minimum until GitHub provisions the Let's Encrypt cert.*

- **Repository:** `github.com/douglaslinsmeyer/blog` (already exists, currently empty, public).
- **Pages settings (one-time, post-first-deploy):**
  - Source: **GitHub Actions**
  - Custom domain: `douglaslinsmeyer.com`
  - Enforce HTTPS: enabled once cert provisions (~10 min after DNS check passes)
- **`CNAME` file:** `public/CNAME` contains `douglaslinsmeyer.com` so the domain re-pins on every deploy.

## Repository Structure

```
blog/
├── .github/workflows/deploy.yml
├── .nvmrc                       # Node 24 LTS
├── public/
│   ├── CNAME                    # douglaslinsmeyer.com
│   ├── favicon.svg              # placeholder serif "D"
│   └── fonts/                   # self-hosted Source Serif 4, JetBrains Mono
├── src/
│   ├── content/
│   │   ├── config.ts            # Content Collections schemas
│   │   ├── posts/               # long-form *.mdx
│   │   └── notes/               # short *.md
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── PostLayout.astro
│   │   └── NoteLayout.astro
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── PostCard.astro
│   │   ├── NoteCard.astro
│   │   ├── TagPill.astro
│   │   ├── ThemeToggle.astro
│   │   └── SkipLink.astro
│   ├── pages/
│   │   ├── index.astro          # combined home feed
│   │   ├── posts/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── notes/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── tags/
│   │   │   ├── index.astro
│   │   │   └── [tag].astro
│   │   ├── og/
│   │   │   └── [slug].png.ts    # build-time OG image endpoint
│   │   ├── about.astro
│   │   └── 404.astro
│   ├── styles/
│   │   ├── global.css           # CSS variables, reset, typography
│   │   └── code.css             # Shiki theme overrides
│   └── lib/
│       └── og.ts                # satori + resvg helpers
├── astro.config.mjs
├── tsconfig.json
├── package.json
└── package-lock.json
```

## Content Model

Posts and notes are Astro Content Collections with typed schemas validated at build time.

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    summary: z.string(),            // shown on home + index + OG image
    tags: z.array(z.string()),      // required; empty array allowed
    draft: z.boolean().optional().default(false),
  }),
});

const notes = defineCollection({
  type: 'content',
  schema: z.object({
    date: z.date(),
    title: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { posts, notes };
```

**Slugs:** Filename = slug. Convention: `YYYY-MM-DD-kebab-title.mdx` for posts, `YYYY-MM-DD-short-handle.md` for notes.

**Drafts:** `draft: true` excludes from production builds. `astro dev` shows drafts so they can be previewed locally. The build filters via `astro:content`'s `getCollection` predicate, gated on `import.meta.env.PROD`.

## Routes

| Route | Page | Notes |
|-------|------|-------|
| `/` | Home | Combined chronological feed of posts + notes, newest first; ~20 items, then "Older →" |
| `/posts/` | Posts index | All non-draft posts, paginated 20/page |
| `/posts/[slug]/` | Post permalink | MDX rendered via `PostLayout` |
| `/notes/` | Notes index | All non-draft notes, paginated 30/page |
| `/notes/[slug]/` | Note permalink | Short page; useful for direct sharing |
| `/tags/` | Tag index | Alphabetical list of tags with counts |
| `/tags/[tag]/` | Tag detail | Posts + notes with that tag, newest first |
| `/about/` | About | Content authored inline in `about.astro` as MDX (no separate content collection needed for a single page) |
| `/404` | 404 | Custom not-found page |

## Visual & Typography System

**Fonts (all self-hosted in `public/fonts/` with `font-display: swap` and preload):**
- **Source Serif 4** — body, headings. Variable font.
- **JetBrains Mono** — code blocks, inline code, UI mono.
- **Inter** — small UI accents (date stamps, tag pills, post meta).

**Layout:** Single column, content max-width 680px (~65ch), centered. Generous vertical rhythm. No sidebar.

**Color tokens (CSS custom properties):**

```css
:root[data-theme='light'] {
  --bg:      #fafaf7;
  --text:    #1a1a1a;
  --muted:   #666666;
  --rule:    #dddddd;
  --accent:  #8b2c2c;  /* terracotta */
}

:root[data-theme='dark'] {
  --bg:      #15151a;
  --text:    #e8e6df;
  --muted:   #8a8a8a;
  --rule:    #2a2a2a;
  --accent:  #c97a6f;
}
```

Links use `--accent` with a 1px underline-offset rule on hover. All non-link interactive elements are neutral so the content carries the visual weight.

**Dark mode behavior:**
- Default to `prefers-color-scheme`.
- User-toggleable via `ThemeToggle` in the header; choice persisted to `localStorage` under `theme`.
- Inline `<script>` in `<head>` reads `localStorage` and sets `data-theme` on `<html>` *before* paint to prevent FOUC.

**Syntax highlighting:**
- Astro's built-in Shiki, dual themes: `github-light` + `github-dark-dimmed`.
- Custom CSS bridges Shiki's themes to our color tokens so code blocks respect the active theme without a re-paint.
- Inline code gets a subtle background tint (`--rule` at ~30% alpha).
- Code blocks get a thin top border with the language label in the top-right.

**Component conventions:**
- **PostCard:** date in muted small-caps, title 22px serif, summary 16px serif, tag pills below.
- **NoteCard:** date + body inline, smaller scale, slightly indented; no separate title block.
- **TagPill:** uppercase letter-spaced text, rounded outline, accent color when active.
- **Footer:** single thin rule, muted small-caps, three links (GitHub, Email, plus future RSS slot).

## Build & Deploy Pipeline

**`.github/workflows/deploy.yml`:**
- Triggers: `push` to `main`, `workflow_dispatch`.
- Permissions: `contents: read`, `pages: write`, `id-token: write`.
- Concurrency group `pages`, `cancel-in-progress: false`.
- `build` job: `withastro/action@v3` (handles Node setup, `npm ci`, `astro build`, artifact upload).
- `deploy` job: `actions/deploy-pages@v4`, depends on `build`, runs in the `github-pages` environment.

**Pre-deploy quality gates (run automatically in `astro build`):**
- `astro check` — TypeScript + content schema validation. Missing required frontmatter fails the build.
- Internal link validation — Astro flags broken internal links by default.
- That's the test surface. Static blog; no Playwright/unit suite.

**Local development:**
- `npm run dev` — Astro dev server on `localhost:4321`. HMR, drafts visible.
- `npm run build` — production build (identical to CI).
- `npm run preview` — serves `dist/` for last-mile verification.

## OG Image Generation

- Build-time endpoint `src/pages/og/[slug].png.ts` returns a PNG per post.
- Implemented with `satori` (JSX-to-SVG) + `@resvg/resvg-js` (SVG-to-PNG). Both pure-JS, no native deps.
- Layout: post title in Source Serif 4, date and `douglaslinsmeyer.com` footer in Inter small-caps. Matches site palette.
- Astro pre-renders these to static files at build; no runtime image generation.
- Notes use a single default OG image (no per-note generation — many notes have no title).
- `<meta property="og:image">` and Twitter card tags point at the generated PNGs.

## Error Handling

- **404 page** — matching site typography/layout, short copy, link back to home and posts index. Static, no client logic.
- **Empty states** — `/tags/`, `/notes/`, and tag detail pages render a "Nothing here yet" line on zero results; build still passes.
- **Build is the safety net.** Missing required frontmatter, malformed dates, broken internal links → `astro build` fails in CI, deploy doesn't happen. Production never sees a half-broken page.

## Accessibility

- Semantic HTML throughout: `<article>`, `<nav>`, `<main>`, `<time datetime="…">`.
- Skip-to-content link at the top of every page (`SkipLink.astro`).
- Visible focus ring on all interactive elements: 2px outline in `--accent`.
- Color contrast verified ≥ WCAG AA in both themes (light and dark) using axe DevTools or equivalent before launch.
- Required `alt` text on images via the content schema; build fails if missing.
- Dark mode toggle is a real `<button>` with `aria-label` and `aria-pressed`; keyboard-operable.

## Performance Budget

Lighthouse targets (mobile, throttled): Performance ≥ 98, Accessibility 100, Best Practices 100, SEO 100.

- Astro ships ~zero JS by default. Only the dark-mode toggle ships a small inline script (~200 bytes).
- Two self-hosted font families, preloaded, `font-display: swap`.
- Astro's built-in `<Image>` for all post images: auto AVIF/WebP, responsive `srcset`.
- Zero third-party scripts in the baseline.

## Out of Scope (Parking Lot)

Documented here because each is a likely future addition with a near-zero integration cost. The architecture leaves clean slots for them.

- **RSS feed** (`@astrojs/rss`) — ~10 lines. Footer has a reserved slot for the link.
- **Comments** (giscus → GitHub Discussions) — `PostLayout` reserves a `<section>` at the bottom that gets populated when enabled.
- **Analytics** — none today. Slot exists in `BaseLayout`'s footer-injection point if ever desired.
- **Search** (Pagefind) — appropriate around 50+ posts.
- **Newsletter** — Buttondown or similar, later.
- **Webmentions** — IndieWeb integration, later.

## Author-Provided Inputs (Placeholders Until Replaced)

- Site name (default: `Douglas Linsmeyer`).
- Tagline (default: empty).
- About page content (placeholder text until written).
- Favicon (placeholder: simple serif "D" SVG).
- Footer links: GitHub profile (`github.com/douglaslinsmeyer`), `mailto:` (default to `douglinsmeyer@gmail.com` — replace if desired).
- Seed content: one welcome post + one placeholder note so the home feed isn't empty on first deploy.

## Acceptance Criteria

The first deploy is considered complete when all of the following are true:

1. `https://douglaslinsmeyer.com` resolves and serves the home page over HTTPS.
2. `https://www.douglaslinsmeyer.com` resolves and redirects (or serves) the same site.
3. At least one post and one note are visible on the home page.
4. Tag pages render with at least one tag populated.
5. Dark mode toggle persists across navigation and survives page reload.
6. Lighthouse mobile run reports Performance ≥ 98 and Accessibility 100 on the home page and one post page.
7. View-source confirms zero third-party scripts loaded.
8. `astro build` passes locally and in CI with no warnings.

## Open Questions

None at design time. Author-provided content (site name, tagline, about copy, social links) ships with placeholders and can be edited any time post-launch.
