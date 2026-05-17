# Personal Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a personal blog at `douglaslinsmeyer.com` using Astro 6.x on GitHub Pages, matching the editorial-minimalist design in the approved spec.

**Architecture:** Astro static site, scaffolded from the official `blog` template and customized. Content Collections (Content Layer API) for posts and notes with Zod-validated schemas. GitHub Actions builds and deploys to GitHub Pages with the modern "GitHub Actions" Pages source. Custom domain via DNS at Cloudflare (already configured).

**Tech Stack:** Astro 6.x, MDX, TypeScript, Shiki (built-in syntax highlighting), `satori` + `@resvg/resvg-js` for OG image generation, GitHub Actions (`withastro/action@v3` + `actions/deploy-pages@v4`), Node 24 LTS.

**Spec reference:** `docs/superpowers/specs/2026-05-17-personal-blog-design.md`

**Notes on testing:** Static blogs don't justify Playwright/unit suites (per spec). The "test surface" is:
- `astro check` — TypeScript + Content Collections schema validation
- `astro build` — fails on broken internal links, missing required frontmatter
- Visual verification via `astro dev` and `astro preview`
- Lighthouse run at the end to verify acceptance criteria

Each task ends with build verification and a commit.

**Note on spec divergence:** The spec lists `src/content/config.ts` (Astro 4 location). Astro 5+/6 recommended location is `src/content.config.ts`. The plan uses the modern location.

---

## File Structure

Files created across all tasks (referenced by task number in parentheses):

```
blog/
├── .nvmrc                                          (T1)
├── astro.config.mjs                                (T1, T13)
├── package.json                                    (T1)
├── tsconfig.json                                   (T1, kept from template)
├── public/
│   ├── CNAME                                       (T16)
│   ├── favicon.svg                                 (T15)
│   ├── og-default.png                              (T14)
│   └── fonts/                                      (T4)
│       ├── source-serif-4-variable.woff2
│       ├── jetbrains-mono-variable.woff2
│       └── inter-variable.woff2
├── src/
│   ├── content.config.ts                           (T2)
│   ├── content/
│   │   ├── posts/
│   │   │   └── 2026-05-17-welcome.mdx             (T3)
│   │   └── notes/
│   │       └── 2026-05-17-hello.md                (T3)
│   ├── styles/
│   │   ├── global.css                              (T4)
│   │   └── code.css                                (T13)
│   ├── layouts/
│   │   ├── BaseLayout.astro                        (T5)
│   │   ├── PostLayout.astro                        (T9)
│   │   └── NoteLayout.astro                        (T10)
│   ├── components/
│   │   ├── Header.astro                            (T5)
│   │   ├── Footer.astro                            (T5)
│   │   ├── SkipLink.astro                          (T5)
│   │   ├── ThemeToggle.astro                       (T6)
│   │   ├── PostCard.astro                          (T7)
│   │   ├── NoteCard.astro                          (T7)
│   │   └── TagPill.astro                           (T7)
│   ├── lib/
│   │   ├── feed.ts                                 (T8)
│   │   └── og.ts                                   (T14)
│   └── pages/
│       ├── index.astro                             (T8)
│       ├── posts/
│       │   ├── index.astro                         (T9)
│       │   └── [slug].astro                        (T9)
│       ├── notes/
│       │   ├── index.astro                         (T10)
│       │   └── [slug].astro                        (T10)
│       ├── tags/
│       │   ├── index.astro                         (T11)
│       │   └── [tag].astro                         (T11)
│       ├── og/
│       │   └── [slug].png.ts                       (T14)
│       ├── about.astro                             (T12)
│       └── 404.astro                               (T12)
└── .github/
    └── workflows/
        └── deploy.yml                              (T16)
```

---

## Task 1: Bootstrap Astro project

**Files:**
- Create: `astro.config.mjs`, `package.json`, `tsconfig.json`, `.nvmrc`, `src/env.d.ts` (and many template files we'll prune)

The existing repo has only `docs/`, `.gitignore`, and `.git/`. `npm create astro` may refuse to scaffold into a non-empty directory. We'll bootstrap in a temp directory and copy the files over.

- [ ] **Step 1: Verify Node 24 is available**

```bash
node --version
```
Expected: `v24.x.x` (any v24 release; latest LTS is v24.15.0 "Krypton"). If not, install via `nvm install 24 && nvm use 24` or `brew install node@24`. Astro 6 requires Node ≥22.12.0, so any active LTS works, but the project pins to 24.

- [ ] **Step 2: Bootstrap Astro blog template in a temp directory**

```bash
cd /tmp
rm -rf astro-blog-bootstrap
npm create astro@latest astro-blog-bootstrap -- \
  --template blog \
  --typescript strict \
  --no-install \
  --no-git \
  --yes
```
Expected: a new `/tmp/astro-blog-bootstrap/` directory with the Astro blog starter files.

- [ ] **Step 3: Copy bootstrap files into the repo**

```bash
cd /Users/douglasl/Projects/blog
# Copy everything except .git/.gitignore from the bootstrap
rsync -av \
  --exclude='.git' \
  --exclude='.gitignore' \
  /tmp/astro-blog-bootstrap/ \
  ./
```
Expected: `astro.config.mjs`, `package.json`, `tsconfig.json`, `src/`, `public/`, `astro.config.mjs` now exist in the repo root.

- [ ] **Step 4: Merge template `.gitignore` entries into our existing `.gitignore`**

Verify our existing `.gitignore` already covers `node_modules/`, `dist/`, `.astro/`. If the template added new patterns (`.vercel/`, `.netlify/`, etc.), we don't need them — leave the existing `.gitignore` as-is.

```bash
cat .gitignore
```
Expected: file contains `.superpowers/`, `node_modules/`, `dist/`, `.astro/`, etc.

- [ ] **Step 5: Create `.nvmrc` pinning Node 24**

```bash
echo "24" > .nvmrc
```

- [ ] **Step 6: Install dependencies**

```bash
npm install
```
Expected: `node_modules/` populated, `package-lock.json` created. No errors.

- [ ] **Step 7: Add the `check` script to package.json**

Open `package.json`. Update the `scripts` block to:

```json
"scripts": {
  "dev": "astro dev",
  "start": "astro dev",
  "build": "astro check && astro build",
  "preview": "astro preview",
  "check": "astro check",
  "astro": "astro"
}
```

Note: `build` runs `astro check` first so schema/TS errors fail the build.

- [ ] **Step 8: Configure `astro.config.mjs`**

Replace the contents of `astro.config.mjs` with:

```js
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
```

- [ ] **Step 9: Prune template's example content and pages**

The blog template ships with example content we'll replace. Delete:

```bash
rm -rf src/content/blog
rm -f src/content.config.ts        # we'll write our own in Task 2
rm -rf src/pages/blog
rm -f src/pages/index.astro        # we'll write our own in Task 8
rm -f src/pages/about.astro        # we'll write our own in Task 12
rm -f src/pages/rss.xml.js         # RSS is out of scope per spec
rm -rf src/components              # we'll write our own
rm -rf src/layouts                 # we'll write our own
rm -f src/consts.ts                # template-specific
rm -f src/styles/global.css        # we'll write our own in Task 4
rm -f public/blog-placeholder-*.jpg
rm -f public/favicon.svg           # we'll add our own in Task 15
```

- [ ] **Step 10: Verify the empty project still configures**

Note: with `src/content.config.ts` and `src/pages/` empty, `astro check` may complain about missing pages. That's fine for this verification — we just need `astro` to launch.

```bash
npx astro info
```
Expected: prints Astro version (6.x) and config info without errors.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "Bootstrap Astro 6 project from blog template

- Scaffold from npm create astro@latest --template blog
- Pin Node 24 LTS via .nvmrc
- Configure astro.config.mjs with site URL, MDX, sitemap, dual Shiki themes
- Add 'check' script and gate build on astro check
- Prune template's example content/pages (we replace these in later tasks)"
```

---

## Task 2: Define Content Collections schema

**Files:**
- Create: `src/content.config.ts`

- [ ] **Step 1: Create the content config**

Create `src/content.config.ts`:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    tags: z.array(z.string()),
    draft: z.boolean().optional().default(false),
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    date: z.coerce.date(),
    title: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { posts, notes };
```

Why `z.coerce.date()`: YAML frontmatter dates parse as strings or Date objects depending on quoting. Coercion handles both.

Note on imports: Astro 6 deprecates `z` re-exported from `astro:content`. Import `z` from `astro/zod` directly, per the v6 upgrade guide.

- [ ] **Step 2: Create the directories so the glob loader has somewhere to look**

```bash
mkdir -p src/content/posts src/content/notes
```

- [ ] **Step 3: Run schema sync**

```bash
npx astro sync
```
Expected: generates `.astro/` types for the collections without error. Collections may report 0 entries; that's fine — seed content lands in Task 3.

- [ ] **Step 4: Commit**

```bash
git add src/content.config.ts src/content/
git commit -m "Define posts and notes Content Collections

Astro 6 Content Layer API with glob loader.
- posts: title, date, summary, tags (required), draft
- notes: date, optional title, optional tags, draft

z.coerce.date() handles both string and Date YAML frontmatter."
```

---

## Task 3: Seed content (welcome post + welcome note)

**Files:**
- Create: `src/content/posts/2026-05-17-welcome.mdx`
- Create: `src/content/notes/2026-05-17-hello.md`

- [ ] **Step 1: Create the welcome post**

Create `src/content/posts/2026-05-17-welcome.mdx`:

```mdx
---
title: "Welcome"
date: 2026-05-17
summary: "A first post — what this blog is for and what to expect."
tags: ["meta"]
---

This is the first post on the new site. It's running on [Astro](https://astro.build),
hosted at GitHub Pages, with no analytics, no comments, and no third-party scripts.

A quick taste of what's possible here — a code block:

```ts
function greet(name: string): string {
  return `hello, ${name}`;
}

console.log(greet("world"));
```

More to come.
```

- [ ] **Step 2: Create the welcome note**

Create `src/content/notes/2026-05-17-hello.md`:

```md
---
date: 2026-05-17
tags: ["meta"]
---

First note. Notes are shorter than posts — small thoughts, links worth keeping, things
I learned today. They share the home feed with longer essays but render with a
different rhythm.
```

- [ ] **Step 3: Verify the schema accepts both files**

```bash
npx astro check
```
Expected: 0 errors, 0 warnings. (Astro reports the collection entry counts during type generation.)

- [ ] **Step 4: Commit**

```bash
git add src/content/posts/ src/content/notes/
git commit -m "Add welcome post and welcome note seed content"
```

---

## Task 4: Typography foundation (fonts + global styles)

**Files:**
- Create: `public/fonts/source-serif-4-variable.woff2`
- Create: `public/fonts/jetbrains-mono-variable.woff2`
- Create: `public/fonts/inter-variable.woff2`
- Create: `src/styles/global.css`

We self-host font files (per spec — no Google Fonts, no third-party requests).

- [ ] **Step 1: Download the variable font files**

```bash
mkdir -p public/fonts

# Source Serif 4 (variable, by Adobe — OFL licensed)
curl -L -o public/fonts/source-serif-4-variable.woff2 \
  "https://github.com/adobe-fonts/source-serif/raw/release/WOFF2/VAR/SourceSerif4-VariableFont_opsz,wght.ttf.woff2"

# JetBrains Mono (variable, OFL licensed)
curl -L -o public/fonts/jetbrains-mono-variable.woff2 \
  "https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/variable/JetBrainsMono[wght].woff2"

# Inter (variable, OFL licensed)
curl -L -o public/fonts/inter-variable.woff2 \
  "https://github.com/rsms/inter/raw/master/docs/font-files/InterVariable.woff2"
```

Expected: three files in `public/fonts/`. If any URL has rotted, the implementer should pull from the official source (Adobe Fonts → Source Serif 4, JetBrains → JetBrains Mono, rsms/inter).

```bash
ls -la public/fonts/
```
Expected: three `.woff2` files, each between 50 KB and 400 KB.

- [ ] **Step 2: Create `src/styles/global.css`**

```css
/* ============================================================
   Font faces — variable fonts, self-hosted in /public/fonts
   ============================================================ */

@font-face {
  font-family: 'Source Serif 4';
  src: url('/fonts/source-serif-4-variable.woff2') format('woff2-variations'),
       url('/fonts/source-serif-4-variable.woff2') format('woff2');
  font-weight: 200 900;
  font-display: swap;
  font-style: normal;
}

@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/jetbrains-mono-variable.woff2') format('woff2-variations'),
       url('/fonts/jetbrains-mono-variable.woff2') format('woff2');
  font-weight: 100 800;
  font-display: swap;
  font-style: normal;
}

@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-variable.woff2') format('woff2-variations'),
       url('/fonts/inter-variable.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
  font-style: normal;
}

/* ============================================================
   Color tokens
   ============================================================ */

:root[data-theme='light'] {
  --bg: #fafaf7;
  --text: #1a1a1a;
  --muted: #666666;
  --rule: #dddddd;
  --accent: #8b2c2c;
  --tint: rgba(0, 0, 0, 0.04);
}

:root[data-theme='dark'] {
  --bg: #15151a;
  --text: #e8e6df;
  --muted: #8a8a8a;
  --rule: #3a3a40;     /* ~2.5:1 against --bg, visible on OLED */
  --accent: #c97a6f;
  --tint: rgba(255, 255, 255, 0.05);
}

/* ============================================================
   Reset & base typography
   ============================================================ */

*, *::before, *::after { box-sizing: border-box; }

html {
  font-family: 'Source Serif 4', Georgia, 'Times New Roman', serif;
  font-size: 18px;
  line-height: 1.65;
  color: var(--text);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
  max-width: 680px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  line-height: 1.25;
  margin: 2rem 0 0.75rem;
}

h1 { font-size: 1.85rem; }
h2 { font-size: 1.5rem; }
h3 { font-size: 1.2rem; }

p { margin: 1rem 0; }

a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
}
a:hover { text-decoration-thickness: 2px; }

hr {
  border: none;
  border-top: 1px solid var(--rule);
  margin: 2.5rem 0;
}

ul, ol { padding-left: 1.4rem; }
li { margin: 0.4rem 0; }

blockquote {
  border-left: 3px solid var(--rule);
  margin: 1.5rem 0;
  padding-left: 1.25rem;
  color: var(--muted);
  font-style: italic;
}

img { max-width: 100%; height: auto; }

code {
  font-family: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.9em;
  background: var(--tint);
  padding: 0.1em 0.3em;
  border-radius: 3px;
}

/* Code block container styles (Shiki specifics live in code.css, Task 13). */
pre {
  font-family: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  padding: 1rem 1.1rem;
  border-top: 1px solid var(--rule);
  border-radius: 0;
  overflow-x: auto;
  font-size: 0.85rem;
  line-height: 1.55;
  margin: 1.5rem 0;
}

pre > code {
  background: transparent;
  padding: 0;
  border-radius: 0;
}

/* ============================================================
   Utility classes
   ============================================================ */

.small-caps {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 500;
}

.muted { color: var(--muted); }

/* ============================================================
   Focus ring (accessibility)
   ============================================================ */

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 2px;
}

/* ============================================================
   Skip-to-content link
   ============================================================ */

.skip-link {
  position: absolute;
  left: -9999px;
  top: 0.5rem;
  background: var(--bg);
  color: var(--accent);
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--accent);
  z-index: 100;
}
.skip-link:focus { left: 0.5rem; }
```

- [ ] **Step 3: Verify CSS parses (no broken syntax)**

```bash
npx astro check
```
Expected: 0 errors, 0 warnings.

- [ ] **Step 4: Commit**

```bash
git add public/fonts/ src/styles/global.css
git commit -m "Add self-hosted fonts and global stylesheet

- Source Serif 4 (variable, body + headings)
- JetBrains Mono (variable, code)
- Inter (variable, small-caps UI accents)
- All variable fonts, font-display: swap
- Color tokens for light/dark themes via data-theme attribute
- Typography reset, focus ring, skip-link styles"
```

---

## Task 5: BaseLayout, Header, Footer, SkipLink

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`
- Create: `src/components/SkipLink.astro`

`BaseLayout` is the page shell every other layout/page extends. It includes head metadata, font preloads, the inline anti-FOUC script, and the global stylesheet. Theme toggle lives in `Header`; we wire its behavior in Task 6.

- [ ] **Step 1: Create `src/components/SkipLink.astro`**

```astro
---
// Accessible skip-to-content link, first focusable element on every page.
---
<a class="skip-link" href="#main">Skip to content</a>
```

- [ ] **Step 2: Create `src/components/Header.astro`**

```astro
---
import ThemeToggle from './ThemeToggle.astro';
---
<header class="site-header">
  <div class="site-header__inner">
    <a class="site-header__brand" href="/">Douglas Linsmeyer</a>
    <nav class="site-header__nav" aria-label="Main">
      <a href="/posts/">Posts</a>
      <a href="/notes/">Notes</a>
      <a href="/about/">About</a>
      <ThemeToggle />
    </nav>
  </div>
</header>

<style>
  .site-header {
    border-bottom: 1px solid var(--rule);
  }
  .site-header__inner {
    max-width: 680px;
    margin: 0 auto;
    padding: 1.25rem 1.25rem;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
  }
  .site-header__brand {
    font-weight: 600;
    font-size: 1.05rem;
    color: var(--text);
    text-decoration: none;
  }
  .site-header__brand:is(:hover, :focus-visible) { text-decoration: underline; text-underline-offset: 4px; }
  .site-header__nav {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 0.85rem;
  }
  .site-header__nav a {
    color: var(--muted);
    text-decoration: none;
  }
  .site-header__nav a:is(:hover, :focus-visible) {
    color: var(--text);
    text-decoration: underline;
    text-underline-offset: 4px;
  }
</style>
```

- [ ] **Step 3: Create `src/components/Footer.astro`**

```astro
---
const year = new Date().getFullYear();
---
<footer class="site-footer">
  <div class="site-footer__inner">
    <span class="small-caps">© {year} Douglas Linsmeyer</span>
    <span class="site-footer__links">
      <a href="https://github.com/douglaslinsmeyer">GitHub</a>
      <a href="mailto:douglinsmeyer@gmail.com">Email</a>
    </span>
  </div>
</footer>

<style>
  .site-footer {
    border-top: 1px solid var(--rule);
    margin-top: 4rem;
  }
  .site-footer__inner {
    max-width: 680px;
    margin: 0 auto;
    padding: 1.25rem 1.25rem;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .site-footer__links {
    display: flex;
    gap: 1rem;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 0.85rem;
  }
  .site-footer__links a {
    color: var(--muted);
    text-decoration: none;
  }
  .site-footer__links a:is(:hover, :focus-visible) {
    color: var(--text);
    text-decoration: underline;
    text-underline-offset: 4px;
  }
</style>
```

- [ ] **Step 4: Create `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import SkipLink from '../components/SkipLink.astro';

export interface Props {
  title: string;
  description?: string;
  ogImage?: string;          // absolute or root-relative path
  canonical?: string;
}

const {
  title,
  description = 'Personal blog by Douglas Linsmeyer — software, writing, notes.',
  ogImage = '/og-default.png',
  canonical,
} = Astro.props;

const siteUrl = Astro.site?.toString().replace(/\/$/, '') ?? '';
const fullTitle = title === 'Douglas Linsmeyer' ? title : `${title} · Douglas Linsmeyer`;
const canonicalUrl = canonical ?? new URL(Astro.url.pathname, Astro.site).toString();
const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;
---
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalUrl} />

    <!-- Font preloads (the three variable woff2 files) -->
    <link rel="preload" href="/fonts/source-serif-4-variable.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/jetbrains-mono-variable.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/inter-variable.woff2" as="font" type="font/woff2" crossorigin />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:image" content={ogImageUrl} />

    <!-- Twitter card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={fullTitle} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={ogImageUrl} />

    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="sitemap" href="/sitemap-index.xml" />

    <!-- Anti-FOUC: set data-theme BEFORE paint based on localStorage or system preference -->
    <script is:inline>
      (function () {
        try {
          var stored = localStorage.getItem('theme');
          var system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          var theme = stored === 'light' || stored === 'dark' ? stored : system;
          document.documentElement.setAttribute('data-theme', theme);
        } catch (e) {
          document.documentElement.setAttribute('data-theme', 'light');
        }
      })();
    </script>
  </head>
  <body>
    <SkipLink />
    <Header />
    <main id="main" tabindex="-1">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 5: Create a placeholder ThemeToggle so the Header import resolves**

Create `src/components/ThemeToggle.astro` with a minimal stub. Task 6 makes it functional.

```astro
---
// Placeholder — full behavior added in Task 6.
---
<button type="button" class="theme-toggle" aria-label="Toggle theme">◐</button>

<style>
  .theme-toggle {
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    font-size: 1rem;
    padding: 0;
  }
  .theme-toggle:hover { color: var(--text); }
</style>
```

- [ ] **Step 6: Add a temporary index page to make the build runnable**

Create `src/pages/index.astro` as a temporary stub (replaced in Task 8):

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Douglas Linsmeyer">
  <h1>Hello, world</h1>
  <p>If you can read this, the BaseLayout works.</p>
</BaseLayout>
```

- [ ] **Step 7: Verify the build**

```bash
npm run build
```
Expected: build succeeds, `dist/index.html` exists with the header, footer, and stub content.

- [ ] **Step 8: Spot-check in the dev server**

```bash
npm run dev
```
Open `http://localhost:4321` in a browser. Verify:
- Header shows "Douglas Linsmeyer" + nav (Posts / Notes / About / theme button)
- Footer shows copyright + GitHub + Email links
- Body uses the serif font
- No console errors
- Light and dark themes both load without flash on reload (toggle in OS settings, reload to test)

Kill the dev server (Ctrl+C).

- [ ] **Step 9: Commit**

```bash
git add src/layouts/BaseLayout.astro src/components/Header.astro \
        src/components/Footer.astro src/components/SkipLink.astro \
        src/components/ThemeToggle.astro src/pages/index.astro
git commit -m "Add BaseLayout, Header, Footer, SkipLink

- BaseLayout: head metadata, OG/Twitter cards, font preloads, anti-FOUC script
- Header: brand, nav links, theme toggle slot
- Footer: copyright + GitHub + Email
- SkipLink: a11y skip-to-content
- Stub index page and ThemeToggle placeholder (functional in later tasks)"
```

---

## Task 6: Functional dark mode toggle

**Files:**
- Modify: `src/components/ThemeToggle.astro`

- [ ] **Step 1: Replace `src/components/ThemeToggle.astro` with the functional version**

```astro
---
// Theme toggle button — flips data-theme on <html> and persists to localStorage.
// The initial theme is set by the inline anti-FOUC script in BaseLayout (no flash).
---
<button
  type="button"
  class="theme-toggle"
  aria-label="Toggle color theme"
  aria-pressed="false"
  data-theme-toggle
>
  <span class="theme-toggle__icon" aria-hidden="true">◐</span>
</button>

<script>
  const btn = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (btn) {
    const root = document.documentElement;
    const sync = () => {
      const current = root.getAttribute('data-theme') ?? 'light';
      btn.setAttribute('aria-pressed', current === 'dark' ? 'true' : 'false');
    };
    sync();
    btn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme') ?? 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (_) { /* ignore */ }
      sync();
    });
  }
</script>

<style>
  .theme-toggle {
    background: none;
    border: 1px solid var(--rule);
    color: var(--muted);
    cursor: pointer;
    font-size: 0.9rem;
    padding: 0.2rem 0.5rem;
    border-radius: 3px;
    line-height: 1;
    font-family: 'Inter', system-ui, sans-serif;
  }
  .theme-toggle:hover {
    color: var(--text);
    border-color: var(--text);
  }
</style>
```

- [ ] **Step 2: Verify in the dev server**

```bash
npm run dev
```
Open `http://localhost:4321`. Verify:
- Clicking the toggle swaps light ↔ dark immediately.
- Reload — chosen theme persists.
- Open DevTools → Application → Local Storage. There's a `theme` key set to `light` or `dark`.
- Clear local storage, reload, and the OS preference is used (test by toggling OS appearance).
- No FOUC: reload several times with dark theme stored; the page never flashes light first.

Kill the dev server.

- [ ] **Step 3: Verify the build still passes**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/ThemeToggle.astro
git commit -m "Make ThemeToggle functional with localStorage persistence

- aria-pressed reflects current state
- Clicking swaps data-theme on <html> and persists choice
- Initial state still set by BaseLayout's anti-FOUC script (no flash)"
```

---

## Task 7: Card components (PostCard, NoteCard, TagPill)

**Files:**
- Create: `src/components/PostCard.astro`
- Create: `src/components/NoteCard.astro`
- Create: `src/components/TagPill.astro`

- [ ] **Step 1: Create `src/components/TagPill.astro`**

```astro
---
export interface Props {
  tag: string;
  active?: boolean;
}
const { tag, active = false } = Astro.props;
---
<a class:list={['tag-pill', { 'tag-pill--active': active }]} href={`/tags/${tag}/`}>
  {tag}
</a>

<style>
  .tag-pill {
    display: inline-block;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.2rem 0.55rem;
    border: 1px solid var(--rule);
    border-radius: 999px;
    color: var(--muted);
    text-decoration: none;
    margin-right: 0.35rem;
  }
  .tag-pill:hover {
    color: var(--text);
    border-color: var(--text);
  }
  .tag-pill--active {
    color: var(--accent);
    border-color: var(--accent);
  }
</style>
```

- [ ] **Step 2: Create `src/components/PostCard.astro`**

```astro
---
import TagPill from './TagPill.astro';
export interface Props {
  slug: string;
  title: string;
  date: Date;
  summary: string;
  tags: string[];
}
const { slug, title, date, summary, tags } = Astro.props;
const dateLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const dateIso = date.toISOString();
---
<article class="post-card">
  <time class="small-caps post-card__date" datetime={dateIso}>{dateLabel}</time>
  <h2 class="post-card__title">
    <a href={`/posts/${slug}/`}>{title}</a>
  </h2>
  <p class="post-card__summary">{summary}</p>
  {tags.length > 0 && (
    <div class="post-card__tags">
      {tags.map((t) => <TagPill tag={t} />)}
    </div>
  )}
</article>

<style>
  .post-card {
    padding: 1.5rem 0;
    border-bottom: 1px solid var(--rule);
  }
  .post-card__date { display: block; margin-bottom: 0.4rem; }
  .post-card__title {
    font-size: 1.35rem;
    margin: 0 0 0.5rem;
    line-height: 1.3;
  }
  .post-card__title a {
    color: var(--text);
    text-decoration: none;
  }
  .post-card__title a:hover {
    text-decoration: underline;
    text-underline-offset: 4px;
    text-decoration-color: var(--accent);
  }
  .post-card__summary {
    margin: 0.25rem 0 0.75rem;
    color: var(--text);
  }
  .post-card__tags { margin-top: 0.5rem; }
</style>
```

- [ ] **Step 3: Create `src/components/NoteCard.astro`**

```astro
---
import TagPill from './TagPill.astro';
export interface Props {
  slug: string;
  date: Date;
  title?: string;
  body: string;       // rendered HTML preview (first paragraph or full body)
  tags: string[];
}
const { slug, date, title, body, tags } = Astro.props;
const dateLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const dateIso = date.toISOString();
---
<article class="note-card">
  <header class="note-card__header">
    <a href={`/notes/${slug}/`} class="note-card__permalink small-caps" aria-label={`Note from ${dateLabel}`}>
      <time datetime={dateIso}>{dateLabel}</time> · Note
    </a>
  </header>
  {title && <h3 class="note-card__title"><a href={`/notes/${slug}/`}>{title}</a></h3>}
  <div class="note-card__body" set:html={body} />
  {tags.length > 0 && (
    <div class="note-card__tags">
      {tags.map((t) => <TagPill tag={t} />)}
    </div>
  )}
</article>

<style>
  .note-card {
    padding: 1.2rem 0 1.2rem 1.2rem;
    border-left: 3px solid var(--rule);
    margin: 1.5rem 0;
    border-bottom: 1px solid var(--rule);
  }
  .note-card__header { margin-bottom: 0.35rem; }
  .note-card__permalink {
    color: var(--muted);
    text-decoration: none;
  }
  .note-card__permalink:hover {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .note-card__title {
    font-size: 1.05rem;
    margin: 0.2rem 0 0.4rem;
  }
  .note-card__title a {
    color: var(--text);
    text-decoration: none;
  }
  .note-card__body :global(p) { margin: 0.5rem 0; }
  .note-card__tags { margin-top: 0.5rem; }
</style>
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```
Expected: build succeeds. (The components aren't used by any page yet, but they must compile.)

- [ ] **Step 5: Commit**

```bash
git add src/components/PostCard.astro src/components/NoteCard.astro src/components/TagPill.astro
git commit -m "Add PostCard, NoteCard, TagPill components

- PostCard: date + title link + summary + tag pills, bottom rule
- NoteCard: indented left rule, date+\"Note\" small-caps, optional title, body preview
- TagPill: small uppercase rounded pill, active variant"
```

---

## Task 8: Home page (combined feed)

**Files:**
- Create: `src/lib/feed.ts`
- Replace: `src/pages/index.astro`

A small helper to merge posts and notes into a single chronologically-sorted feed, filtering drafts in production.

- [ ] **Step 1: Create `src/lib/feed.ts`**

```ts
import { getCollection, type CollectionEntry } from 'astro:content';

export type FeedItem =
  | { kind: 'post'; entry: CollectionEntry<'posts'> }
  | { kind: 'note'; entry: CollectionEntry<'notes'> };

function notDraft(entry: { data: { draft?: boolean } }): boolean {
  return entry.data.draft !== true || !import.meta.env.PROD;
}

export async function getAllPosts(): Promise<CollectionEntry<'posts'>[]> {
  const all = await getCollection('posts', notDraft);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getAllNotes(): Promise<CollectionEntry<'notes'>[]> {
  const all = await getCollection('notes', notDraft);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getCombinedFeed(): Promise<FeedItem[]> {
  const [posts, notes] = await Promise.all([getAllPosts(), getAllNotes()]);
  const items: FeedItem[] = [
    ...posts.map((entry) => ({ kind: 'post' as const, entry })),
    ...notes.map((entry) => ({ kind: 'note' as const, entry })),
  ];
  return items.sort((a, b) => b.entry.data.date.valueOf() - a.entry.data.date.valueOf());
}

export async function getAllTags(): Promise<Map<string, number>> {
  const [posts, notes] = await Promise.all([getAllPosts(), getAllNotes()]);
  const counts = new Map<string, number>();
  for (const p of posts) for (const t of p.data.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  for (const n of notes) for (const t of (n.data.tags ?? [])) counts.set(t, (counts.get(t) ?? 0) + 1);
  return counts;
}
```

- [ ] **Step 2: Update NoteCard to accept a `CollectionEntry` and render its body via `<Content />`**

The version of NoteCard from Task 7 took a string `body` prop and rendered with `set:html`. That won't render markdown — Astro doesn't expose pre-rendered HTML on the entry; you have to `render()` it and use the returned `<Content />` component. We update NoteCard now so the home, notes-index, and tag-detail pages can all pass the entry directly.

Open `src/components/NoteCard.astro` and replace its contents with:

```astro
---
import type { CollectionEntry } from 'astro:content';
import { render } from 'astro:content';
import TagPill from './TagPill.astro';

export interface Props {
  entry: CollectionEntry<'notes'>;
}
const { entry } = Astro.props;
const { Content } = await render(entry);
const date = entry.data.date;
const title = entry.data.title;
const tags = entry.data.tags ?? [];
const slug = entry.id;
const dateLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const dateIso = date.toISOString();
---
<article class="note-card">
  <header class="note-card__header">
    <a href={`/notes/${slug}/`} class="note-card__permalink small-caps" aria-label={`Note from ${dateLabel}`}>
      <time datetime={dateIso}>{dateLabel}</time> · Note
    </a>
  </header>
  {title && <h3 class="note-card__title"><a href={`/notes/${slug}/`}>{title}</a></h3>}
  <div class="note-card__body">
    <Content />
  </div>
  {tags.length > 0 && (
    <div class="note-card__tags">
      {tags.map((t) => <TagPill tag={t} />)}
    </div>
  )}
</article>

<style>
  .note-card {
    padding: 1.2rem 0 1.2rem 1.2rem;
    border-left: 3px solid var(--rule);
    margin: 1.5rem 0;
    border-bottom: 1px solid var(--rule);
  }
  .note-card__header { margin-bottom: 0.35rem; }
  .note-card__permalink {
    color: var(--muted);
    text-decoration: none;
  }
  .note-card__permalink:hover {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .note-card__title {
    font-size: 1.05rem;
    margin: 0.2rem 0 0.4rem;
  }
  .note-card__title a {
    color: var(--text);
    text-decoration: none;
  }
  .note-card__body :global(p) { margin: 0.5rem 0; }
  .note-card__tags { margin-top: 0.5rem; }
</style>
```

- [ ] **Step 3: Replace `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PostCard from '../components/PostCard.astro';
import NoteCard from '../components/NoteCard.astro';
import { getCombinedFeed } from '../lib/feed';

const feed = await getCombinedFeed();
const homeItems = feed.slice(0, 20);
---
<BaseLayout title="Douglas Linsmeyer" description="Posts and notes by Douglas Linsmeyer.">
  {homeItems.length === 0 && <p>Nothing here yet.</p>}

  {homeItems.map((item) => (
    item.kind === 'post' ? (
      <PostCard
        slug={item.entry.id}
        title={item.entry.data.title}
        date={item.entry.data.date}
        summary={item.entry.data.summary}
        tags={item.entry.data.tags}
      />
    ) : (
      <NoteCard entry={item.entry} />
    )
  ))}

  {feed.length > 20 && (
    <p style="margin-top: 2rem;">
      <a href="/posts/">All posts →</a>
    </p>
  )}
</BaseLayout>
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```
Expected: build succeeds. `dist/index.html` shows the welcome post (with summary) and the welcome note (with rendered markdown body).

- [ ] **Step 5: Spot-check in dev**

```bash
npm run dev
```
Open `http://localhost:4321`. Verify:
- Welcome post appears with its title, date, summary, and `meta` tag pill.
- Welcome note appears below (or above, depending on dates — both are 2026-05-17, sort is stable but order between them is by insertion).
- Note has the indented left rule treatment, distinct from the post.

Kill dev.

- [ ] **Step 6: Commit**

```bash
git add src/lib/feed.ts src/pages/index.astro src/components/NoteCard.astro
git commit -m "Add home page with combined post + note feed

- src/lib/feed.ts: getAllPosts/Notes, getCombinedFeed, getAllTags
  Drafts filtered out in production via import.meta.env.PROD
- index.astro: top 20 items chronologically, link to /posts/ if more
- NoteCard now takes a CollectionEntry and renders body via <Content />"
```

---

## Task 9: Posts index and post permalink

**Files:**
- Create: `src/layouts/PostLayout.astro`
- Create: `src/pages/posts/index.astro`
- Create: `src/pages/posts/[slug].astro`

- [ ] **Step 1: Create `src/layouts/PostLayout.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
import BaseLayout from './BaseLayout.astro';
import TagPill from '../components/TagPill.astro';

export interface Props {
  entry: CollectionEntry<'posts'>;
}
const { entry } = Astro.props;
const { title, date, summary, tags } = entry.data;
const dateLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const dateIso = date.toISOString();
const ogImage = `/og/${entry.id}.png`;
---
<BaseLayout title={title} description={summary} ogImage={ogImage}>
  <article class="post">
    <header class="post__header">
      <time class="small-caps" datetime={dateIso}>{dateLabel}</time>
      <h1 class="post__title">{title}</h1>
      {summary && <p class="post__summary muted">{summary}</p>}
      {tags.length > 0 && (
        <div class="post__tags">
          {tags.map((t) => <TagPill tag={t} />)}
        </div>
      )}
    </header>

    <div class="post__body">
      <slot />
    </div>

    <footer class="post__footer">
      <p class="small-caps"><a href="/posts/">← All posts</a></p>
    </footer>
  </article>

  <style>
    .post__header { margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--rule); }
    .post__title { margin: 0.5rem 0 0.75rem; font-size: 2rem; line-height: 1.2; }
    .post__summary { font-size: 1.05rem; margin: 0 0 1rem; }
    .post__tags { margin-top: 0.5rem; }
    .post__footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--rule); }
  </style>
</BaseLayout>
```

- [ ] **Step 2: Create `src/pages/posts/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import PostCard from '../../components/PostCard.astro';
import { getAllPosts } from '../../lib/feed';

const posts = await getAllPosts();
---
<BaseLayout title="Posts" description="All long-form posts.">
  <header class="page-header">
    <h1>Posts</h1>
    <p class="muted">{posts.length} post{posts.length === 1 ? '' : 's'}</p>
  </header>

  {posts.length === 0 && <p>Nothing here yet.</p>}

  {posts.map((entry) => (
    <PostCard
      slug={entry.id}
      title={entry.data.title}
      date={entry.data.date}
      summary={entry.data.summary}
      tags={entry.data.tags}
    />
  ))}

  <style>
    .page-header { margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.75rem; margin: 0 0 0.25rem; }
  </style>
</BaseLayout>
```

- [ ] **Step 3: Create `src/pages/posts/[slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import PostLayout from '../../layouts/PostLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('posts', ({ data }) => data.draft !== true || !import.meta.env.PROD);
  return posts.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---
<PostLayout entry={entry}>
  <Content />
</PostLayout>
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```
Expected: build succeeds. `dist/posts/index.html` and `dist/posts/2026-05-17-welcome/index.html` exist.

- [ ] **Step 5: Spot-check in dev**

```bash
npm run dev
```
- Visit `http://localhost:4321/posts/` — verify the welcome post is listed.
- Click the post link — verify it renders with title, date, summary, tags, and the post body including the code block.
- Verify the "← All posts" link at the bottom returns to `/posts/`.

Kill dev.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/PostLayout.astro src/pages/posts/
git commit -m "Add posts index and post permalink

- /posts/ lists all non-draft posts as PostCards
- /posts/[slug]/ renders the post via PostLayout
- PostLayout: header (date + title + summary + tags), MDX body, back link
- OG image url derived as /og/[slug].png (generated in Task 14)"
```

---

## Task 10: Notes index and note permalink

**Files:**
- Create: `src/layouts/NoteLayout.astro`
- Create: `src/pages/notes/index.astro`
- Create: `src/pages/notes/[slug].astro`

- [ ] **Step 1: Create `src/layouts/NoteLayout.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
import BaseLayout from './BaseLayout.astro';
import TagPill from '../components/TagPill.astro';

export interface Props {
  entry: CollectionEntry<'notes'>;
}
const { entry } = Astro.props;
const { date, title, tags } = entry.data;
const tagsArr = tags ?? [];
const dateLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const dateIso = date.toISOString();
const docTitle = title ?? `Note from ${dateLabel}`;
---
<BaseLayout title={docTitle} description={title ?? 'A short note.'}>
  <article class="note">
    <header class="note__header">
      <time class="small-caps" datetime={dateIso}>{dateLabel} · Note</time>
      {title && <h1 class="note__title">{title}</h1>}
    </header>

    <div class="note__body">
      <slot />
    </div>

    {tagsArr.length > 0 && (
      <div class="note__tags">
        {tagsArr.map((t) => <TagPill tag={t} />)}
      </div>
    )}

    <footer class="note__footer">
      <p class="small-caps"><a href="/notes/">← All notes</a></p>
    </footer>
  </article>

  <style>
    .note__header { margin-bottom: 1.5rem; }
    .note__title { margin: 0.5rem 0 0.75rem; font-size: 1.6rem; line-height: 1.25; }
    .note__tags { margin-top: 1.25rem; }
    .note__footer { margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid var(--rule); }
  </style>
</BaseLayout>
```

- [ ] **Step 2: Create `src/pages/notes/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import NoteCard from '../../components/NoteCard.astro';
import { getAllNotes } from '../../lib/feed';

const notes = await getAllNotes();
---
<BaseLayout title="Notes" description="Short notes.">
  <header class="page-header">
    <h1>Notes</h1>
    <p class="muted">{notes.length} note{notes.length === 1 ? '' : 's'}</p>
  </header>

  {notes.length === 0 && <p>Nothing here yet.</p>}

  {notes.map((entry) => <NoteCard entry={entry} />)}

  <style>
    .page-header { margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.75rem; margin: 0 0 0.25rem; }
  </style>
</BaseLayout>
```

- [ ] **Step 3: Create `src/pages/notes/[slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import NoteLayout from '../../layouts/NoteLayout.astro';

export async function getStaticPaths() {
  const notes = await getCollection('notes', ({ data }) => data.draft !== true || !import.meta.env.PROD);
  return notes.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---
<NoteLayout entry={entry}>
  <Content />
</NoteLayout>
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```
Expected: build succeeds. `dist/notes/index.html` and `dist/notes/2026-05-17-hello/index.html` exist.

- [ ] **Step 5: Spot-check in dev**

```bash
npm run dev
```
- Visit `http://localhost:4321/notes/` — verify the welcome note is listed.
- Click the note's "May 17, 2026 · Note" link — verify the permalink renders with date, body, and "← All notes" link.

Kill dev.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/NoteLayout.astro src/pages/notes/
git commit -m "Add notes index and note permalink

- /notes/ lists all non-draft notes as NoteCards
- /notes/[slug]/ renders the note via NoteLayout
- NoteLayout: small-caps date+\"Note\", optional title, body, tags, back link"
```

---

## Task 11: Tags index and tag detail pages

**Files:**
- Create: `src/pages/tags/index.astro`
- Create: `src/pages/tags/[tag].astro`

- [ ] **Step 1: Create `src/pages/tags/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getAllTags } from '../../lib/feed';

const counts = await getAllTags();
const sorted = [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
---
<BaseLayout title="Tags" description="All tags.">
  <header class="page-header">
    <h1>Tags</h1>
    <p class="muted">{sorted.length} tag{sorted.length === 1 ? '' : 's'}</p>
  </header>

  {sorted.length === 0 && <p>Nothing here yet.</p>}

  <ul class="tag-list">
    {sorted.map(([tag, count]) => (
      <li>
        <a href={`/tags/${tag}/`}>{tag}</a>
        <span class="muted small-caps">{count}</span>
      </li>
    ))}
  </ul>

  <style>
    .page-header { margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.75rem; margin: 0 0 0.25rem; }
    .tag-list {
      list-style: none;
      padding: 0;
      column-count: 2;
      column-gap: 2rem;
    }
    .tag-list li {
      margin: 0.5rem 0;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 0.5rem;
      break-inside: avoid;
    }
    .tag-list a {
      color: var(--text);
      text-decoration: none;
    }
    .tag-list a:hover {
      color: var(--accent);
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  </style>
</BaseLayout>
```

- [ ] **Step 2: Create `src/pages/tags/[tag].astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import PostCard from '../../components/PostCard.astro';
import NoteCard from '../../components/NoteCard.astro';
import TagPill from '../../components/TagPill.astro';
import { getAllPosts, getAllNotes } from '../../lib/feed';

export async function getStaticPaths() {
  const [posts, notes] = await Promise.all([getAllPosts(), getAllNotes()]);
  const tagSet = new Set<string>();
  for (const p of posts) for (const t of p.data.tags) tagSet.add(t);
  for (const n of notes) for (const t of (n.data.tags ?? [])) tagSet.add(t);
  return [...tagSet].map((tag) => ({
    params: { tag },
    props: {
      tag,
      posts: posts.filter((p) => p.data.tags.includes(tag)),
      notes: notes.filter((n) => (n.data.tags ?? []).includes(tag)),
    },
  }));
}

const { tag, posts, notes } = Astro.props;
type Item =
  | { kind: 'post'; entry: typeof posts[number] }
  | { kind: 'note'; entry: typeof notes[number] };
const items: Item[] = [
  ...posts.map((entry) => ({ kind: 'post' as const, entry })),
  ...notes.map((entry) => ({ kind: 'note' as const, entry })),
].sort((a, b) => b.entry.data.date.valueOf() - a.entry.data.date.valueOf());
---
<BaseLayout title={`Tagged: ${tag}`} description={`Posts and notes tagged ${tag}.`}>
  <header class="page-header">
    <p class="small-caps">Tag</p>
    <h1>
      <TagPill tag={tag} active />
    </h1>
    <p class="muted">{items.length} item{items.length === 1 ? '' : 's'}</p>
  </header>

  {items.length === 0 && <p>Nothing here yet.</p>}

  {items.map((item) => (
    item.kind === 'post' ? (
      <PostCard
        slug={item.entry.id}
        title={item.entry.data.title}
        date={item.entry.data.date}
        summary={item.entry.data.summary}
        tags={item.entry.data.tags}
      />
    ) : (
      <NoteCard entry={item.entry} />
    )
  ))}

  <footer style="margin-top:2rem;">
    <p class="small-caps"><a href="/tags/">← All tags</a></p>
  </footer>

  <style>
    .page-header { margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.6rem; margin: 0.2rem 0; }
  </style>
</BaseLayout>
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```
Expected: build succeeds. `dist/tags/index.html` lists `meta`. `dist/tags/meta/index.html` shows the welcome post + note.

- [ ] **Step 4: Spot-check in dev**

```bash
npm run dev
```
- Visit `/tags/` — verify the `meta` tag appears with count `2`.
- Click `meta` — verify both welcome items appear on the tag page.
- Verify the active tag pill shows in accent color.

Kill dev.

- [ ] **Step 5: Commit**

```bash
git add src/pages/tags/
git commit -m "Add tag index and tag detail pages

- /tags/ alphabetical list with counts, 2-column layout
- /tags/[tag]/ posts + notes filtered by tag, sorted by date desc
- Active tag pill in accent color on the detail page"
```

---

## Task 12: About page and 404 page

**Files:**
- Create: `src/pages/about.astro`
- Create: `src/pages/404.astro`

- [ ] **Step 1: Create `src/pages/about.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="About" description="About Douglas Linsmeyer.">
  <article class="page">
    <h1>About</h1>

    <p>
      I'm Douglas Linsmeyer. I'm a software engineer. This is where I write
      about things I'm working on, things I'm learning, and the occasional
      walk that turned into something.
    </p>

    <p>
      You can reach me by <a href="mailto:douglinsmeyer@gmail.com">email</a> or
      find me on <a href="https://github.com/douglaslinsmeyer">GitHub</a>.
    </p>

    <p class="muted">
      <em>Replace this with your real about copy.</em>
    </p>
  </article>

  <style>
    .page h1 { font-size: 1.75rem; margin: 0.5rem 0 1rem; }
  </style>
</BaseLayout>
```

- [ ] **Step 2: Create `src/pages/404.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Not found" description="That page doesn't exist.">
  <article class="page-404">
    <p class="small-caps">404 · Not found</p>
    <h1>That page isn't here.</h1>
    <p>
      The page you were looking for either moved, never existed, or was a typo.
    </p>
    <p>
      Try the <a href="/">home page</a> or browse <a href="/posts/">all posts</a>.
    </p>
  </article>

  <style>
    .page-404 { padding: 3rem 0; }
    .page-404 h1 { font-size: 1.75rem; margin: 0.5rem 0 1rem; }
  </style>
</BaseLayout>
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```
Expected: `dist/about/index.html` and `dist/404.html` both exist.

- [ ] **Step 4: Spot-check in dev**

```bash
npm run dev
```
- Visit `/about/` — placeholder about page renders.
- Visit `/not-a-real-page` — 404 page renders.

Kill dev.

- [ ] **Step 5: Commit**

```bash
git add src/pages/about.astro src/pages/404.astro
git commit -m "Add about page and 404 page (placeholder copy on About)"
```

---

## Task 13: Syntax highlighting CSS bridge

**Files:**
- Create: `src/styles/code.css`
- Modify: `src/layouts/BaseLayout.astro` (import the new stylesheet)

Shiki's dual themes (configured in Task 1's `astro.config.mjs`) emit code colored via CSS custom properties. We bind the active variant to our `data-theme`.

- [ ] **Step 1: Create `src/styles/code.css`**

```css
/* ============================================================
   Shiki dual-theme bridge
   Shiki emits inline styles using --shiki-light/--shiki-dark
   for each token; we control which variant is active via
   data-theme on <html>.
   ============================================================ */

:root[data-theme='light'] {
  --astro-code-background: #ffffff;
  --astro-code-foreground: #24292e;
}

:root[data-theme='dark'] {
  --astro-code-background: #22272e;
  --astro-code-foreground: #adbac7;
}

/* Activate the matching Shiki theme tokens */
:root[data-theme='light'] pre.astro-code,
:root[data-theme='light'] pre.astro-code span {
  color: var(--shiki-light) !important;
  background-color: var(--shiki-light-bg) !important;
  font-style: var(--shiki-light-font-style) !important;
  font-weight: var(--shiki-light-font-weight) !important;
  text-decoration: var(--shiki-light-text-decoration) !important;
}

:root[data-theme='dark'] pre.astro-code,
:root[data-theme='dark'] pre.astro-code span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
  font-style: var(--shiki-dark-font-style) !important;
  font-weight: var(--shiki-dark-font-weight) !important;
  text-decoration: var(--shiki-dark-text-decoration) !important;
}

/* Surround code blocks with our editorial rule treatment */
pre.astro-code {
  border-top: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
  padding: 1rem 1.1rem;
  margin: 1.5rem 0;
  overflow-x: auto;
  position: relative;
}

/* Language label in the corner (visible when set via meta on the code fence) */
pre.astro-code[data-language]::before {
  content: attr(data-language);
  position: absolute;
  top: 0.4rem;
  right: 0.6rem;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  pointer-events: none;
}
```

Note: `pre.astro-code[data-language]` may or may not be auto-set by Astro depending on version. If after verification the language label doesn't appear, that's cosmetic only — leave the rule in place; it activates if/when the attribute is set.

- [ ] **Step 2: Import `code.css` from `BaseLayout.astro`**

Open `src/layouts/BaseLayout.astro`. Right after the existing `import '../styles/global.css';`, add:

```ts
import '../styles/code.css';
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Spot-check in dev**

```bash
npm run dev
```
- Visit `/posts/2026-05-17-welcome/` — verify the TypeScript code block:
  - Is syntax-highlighted with token colors (`function`, `string`, etc.).
  - Has a thin top + bottom rule.
  - Swaps colors when you click the theme toggle.

Kill dev.

- [ ] **Step 5: Commit**

```bash
git add src/styles/code.css src/layouts/BaseLayout.astro
git commit -m "Wire Shiki dual themes to data-theme attribute

- code.css overrides --shiki-light/--shiki-dark token bindings
  based on data-theme on <html>
- Editorial border treatment around <pre.astro-code>
- Language label rule (activates when data-language is set)"
```

---

## Task 14: OG image generation

**Files:**
- Create: `src/lib/og.ts`
- Create: `src/pages/og/[slug].png.ts`
- Create: `public/og-default.png`
- Modify: `package.json` (new deps)

We use `satori` (JSX → SVG) and `@resvg/resvg-js` (SVG → PNG) to render OG cards at build time. Astro pre-renders any endpoint matching a `getStaticPaths` shape.

- [ ] **Step 1: Install dependencies**

```bash
npm install satori @resvg/resvg-js
```

- [ ] **Step 2: Create `src/lib/og.ts`**

```ts
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs/promises';
import path from 'node:path';

// Load Source Serif 4 once at module init (Node only — runs at build time).
const fontPath = path.resolve('./public/fonts/source-serif-4-variable.woff2');
let fontBufferPromise: Promise<Buffer> | null = null;
function loadFont(): Promise<Buffer> {
  if (!fontBufferPromise) {
    fontBufferPromise = fs.readFile(fontPath);
  }
  return fontBufferPromise;
}

export interface OgInput {
  title: string;
  dateLabel: string;
}

export async function renderOgPng({ title, dateLabel }: OgInput): Promise<Uint8Array> {
  const font = await loadFont();

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background: '#fafaf7',
          color: '#1a1a1a',
          fontFamily: 'Source Serif 4',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                fontSize: '24px',
                color: '#666666',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              },
              children: dateLabel,
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: '72px',
                fontWeight: 700,
                lineHeight: 1.15,
                maxWidth: '1040px',
              },
              children: title,
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: '24px',
                color: '#8b2c2c',
                fontWeight: 500,
              },
              children: 'douglaslinsmeyer.com',
            },
          },
        ],
      },
    } as any,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Source Serif 4',
          data: font,
          weight: 400,
          style: 'normal',
        },
      ],
    }
  );

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return new Uint8Array(png);
}
```

- [ ] **Step 3: Create `src/pages/og/[slug].png.ts`**

```ts
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { renderOgPng } from '../../lib/og';

export async function getStaticPaths() {
  const posts = await getCollection('posts', ({ data }) => data.draft !== true || !import.meta.env.PROD);
  return posts.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: Awaited<ReturnType<typeof getCollection<'posts'>>>[number] };
  const dateLabel = entry.data.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const png = await renderOgPng({ title: entry.data.title, dateLabel });
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
```

- [ ] **Step 4: Create a default OG image for non-post pages**

The default OG image is referenced by `BaseLayout` for home, notes, tags, about, and 404. Generate it once by hand:

Create `scripts/generate-default-og.mjs`:

```js
import { renderOgPng } from '../src/lib/og.ts';
import fs from 'node:fs/promises';

const png = await renderOgPng({
  title: 'Douglas Linsmeyer',
  dateLabel: 'Personal blog',
});
await fs.writeFile('./public/og-default.png', png);
console.log('Wrote public/og-default.png');
```

Run it:

```bash
npx tsx scripts/generate-default-og.mjs
```

If `tsx` isn't installed: `npm install -D tsx` then re-run.

Verify the file exists:

```bash
ls -la public/og-default.png
```
Expected: a PNG file ~50-200 KB.

- [ ] **Step 5: Verify the build generates per-post OG PNGs**

```bash
npm run build
```
Expected: build succeeds. Check `dist/og/2026-05-17-welcome.png` exists.

- [ ] **Step 6: Spot-check the image**

Open the generated PNG in an image viewer:

```bash
open dist/og/2026-05-17-welcome.png   # macOS
```
Expected: 1200×630 image showing date small-caps, post title in serif, "douglaslinsmeyer.com" in accent color.

- [ ] **Step 7: Commit**

```bash
git add src/lib/og.ts src/pages/og/ public/og-default.png \
        scripts/generate-default-og.mjs package.json package-lock.json
git commit -m "Add build-time OG image generation

- src/lib/og.ts: satori + resvg renders 1200x630 PNG
- /og/[slug].png.ts: endpoint per post, pre-rendered at build
- public/og-default.png: fallback for non-post pages
- scripts/generate-default-og.mjs: helper to regenerate default"
```

---

## Task 15: Favicon (placeholder)

**Files:**
- Create: `public/favicon.svg`

- [ ] **Step 1: Create a simple serif "D" favicon**

Create `public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#fafaf7"/>
  <text
    x="16" y="24"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="24"
    font-weight="700"
    text-anchor="middle"
    fill="#8b2c2c"
  >D</text>
</svg>
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: build succeeds; `dist/favicon.svg` copied.

- [ ] **Step 3: Spot-check in dev**

```bash
npm run dev
```
Visit any page and look at the browser tab — a small "D" in terracotta should appear.

- [ ] **Step 4: Commit**

```bash
git add public/favicon.svg
git commit -m "Add placeholder serif 'D' SVG favicon"
```

---

## Task 16: GitHub Actions deploy workflow + CNAME

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `public/CNAME`

- [ ] **Step 1: Create `public/CNAME`**

The CNAME file lives at the site root so GitHub Pages re-pins the custom domain on every deploy.

```bash
mkdir -p public
echo "douglaslinsmeyer.com" > public/CNAME
```

- [ ] **Step 2: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Build with Astro
        uses: withastro/action@v3
        with:
          node-version: 24
          # The action runs `npm ci` and `astro build` by default; our
          # build script also runs `astro check` first via npm.
          package-manager: npm@latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Verify the build locally one final time**

```bash
npm run build
```
Expected: 0 errors, build artifacts in `dist/`.

```bash
ls dist/
```
Expected: `index.html`, `posts/`, `notes/`, `tags/`, `about/`, `404.html`, `og/`, `fonts/`, `CNAME`, `favicon.svg`, `og-default.png`, `sitemap-index.xml`, `sitemap-0.xml`.

```bash
cat dist/CNAME
```
Expected: `douglaslinsmeyer.com`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml public/CNAME
git commit -m "Add GitHub Actions deploy workflow and CNAME

- .github/workflows/deploy.yml: builds via withastro/action@v3,
  deploys via actions/deploy-pages@v4 to the github-pages environment
- public/CNAME: pins douglaslinsmeyer.com on every deploy"
```

---

## Task 17: First deploy + Pages configuration + custom domain

This task is mostly external (configuring GitHub Pages via the repo Settings UI) and requires network access. Each step has a manual component.

- [ ] **Step 1: Push to GitHub**

```bash
git push -u origin main
```
Expected: push succeeds. (The repo was created in advance; we already verified it via `gh repo view` during brainstorming.)

- [ ] **Step 2: Enable Pages with GitHub Actions source**

```bash
gh api -X POST /repos/douglaslinsmeyer/blog/pages \
  -f 'build_type=workflow'
```
Expected: 201 Created, Pages now enabled with source = `workflow` (GitHub Actions).

- [ ] **Step 3: Watch the deploy run**

```bash
gh run watch
```
Expected: the workflow triggered by the push runs `build` then `deploy`, both green. If `build` fails, fix the error locally, commit, push.

- [ ] **Step 4: Verify the site is live on the github.io URL**

```bash
curl -I https://douglaslinsmeyer.github.io/blog/
```
Expected: HTTP 200 (may take 1-2 minutes after deploy completes). The CNAME file in `public/` should not yet redirect us — until the custom domain is configured, the site lives at the github.io URL.

If the build is still in progress, wait and re-check. If it fails after, debug from `gh run view --log`.

- [ ] **Step 5: Set the custom domain**

```bash
gh api -X PUT /repos/douglaslinsmeyer/blog/pages \
  -f cname=douglaslinsmeyer.com
```
Expected: 204 No Content. GitHub now does a DNS check.

- [ ] **Step 6: Verify DNS check passes**

```bash
gh api /repos/douglaslinsmeyer/blog/pages | grep -E '"status"|"https_certificate"'
```
Expected after a few minutes: `"status": "built"`. Cert provisioning may take 5-15 min. Re-run if needed.

If DNS doesn't resolve cleanly:
- Check `dig douglaslinsmeyer.com +short` returns GitHub Pages IPs (or a Cloudflare-flattened equivalent).
- Confirm Cloudflare's DNS records are set to "DNS only" (grey cloud), not proxied.

- [ ] **Step 7: Enforce HTTPS**

```bash
gh api -X PUT /repos/douglaslinsmeyer/blog/pages \
  -F https_enforced=true
```
Expected: 204 No Content.

- [ ] **Step 8: Verify the site is live on the custom domain**

```bash
curl -I https://douglaslinsmeyer.com/
curl -I https://www.douglaslinsmeyer.com/
```
Expected: both return 200 (or `www` returns a 301 to the apex — either is fine; GitHub handles `www` → apex redirect when both have CNAMEs pointing at `douglaslinsmeyer.github.io`).

Open `https://douglaslinsmeyer.com/` in a browser:
- Home page renders with the welcome post + welcome note.
- Tabs/header/footer all show correctly.
- Theme toggle works.
- No console errors.
- No mixed-content warnings.

- [ ] **Step 9: No commit needed**

This task changed remote-only state; no local changes to commit.

---

## Task 18: Acceptance criteria verification

The site is live. Now walk through the acceptance criteria from the spec.

- [ ] **Step 1: Cross off acceptance criteria 1-3**

Open `https://douglaslinsmeyer.com/`:
- ✅ Resolves and serves home over HTTPS (criterion 1).
- ✅ `www.douglaslinsmeyer.com` either serves the same site or 301-redirects to the apex (criterion 2).
- ✅ Welcome post + welcome note are visible (criterion 3).

- [ ] **Step 2: Verify tag page**

Open `https://douglaslinsmeyer.com/tags/meta/`:
- ✅ Page renders with both items tagged `meta` (criterion 4).

- [ ] **Step 3: Verify dark mode persistence**

- Click the theme toggle in the header. Confirm it swaps to dark.
- Navigate to `/posts/2026-05-17-welcome/`. Confirm dark theme persists across pages.
- Reload the page. Confirm dark theme survives reload (criterion 5).

- [ ] **Step 4: Run Lighthouse on production**

Open Chrome DevTools → Lighthouse → run mobile audit on `https://douglaslinsmeyer.com/` and on `https://douglaslinsmeyer.com/posts/2026-05-17-welcome/`.

Targets:
- ✅ Performance ≥ 98
- ✅ Accessibility = 100
- ✅ Best Practices = 100
- ✅ SEO = 100

If any score is below target, investigate via Lighthouse's recommendations and patch. Common things that may need attention:
- Image dimensions missing → add explicit `width`/`height` on `<img>` if any are added later.
- `<html>` missing `lang` → already set to `en` in BaseLayout.
- Color contrast → re-check our token values; the spec calls out AA contrast which our palette already meets.

- [ ] **Step 5: Verify no third-party scripts**

In Chrome DevTools → Network tab, hard-reload `https://douglaslinsmeyer.com/`. Filter by "JS". Confirm:
- ✅ Only requests to `douglaslinsmeyer.com` (and same-origin font requests). No Google, no third-party analytics, no embeds (criterion 7).

- [ ] **Step 6: Verify `astro build` clean**

```bash
npm run build
```
Expected: no warnings, no errors (criterion 8).

- [ ] **Step 7: Final sanity sweep**

Click through every nav link, every footer link, every tag, both a post and a note. Look for:
- Broken links (none should exist — Astro fails the build on broken internal links).
- Mis-styled elements.
- Anything that doesn't match the editorial intent.

- [ ] **Step 8: Mark done**

If all criteria are green, the blog is launched. Drop a note in the repo's `README.md` if you want to document quickstart for future content edits — otherwise the spec and this plan are the documentation.

No commit unless you wrote a README.
