# TABARC::CODE

Cyberpunk, terminal-flavoured GitHub Pages site for `tabarc-code.github.io`. Plain HTML, CSS and a bit of JavaScript. No build step, no packages, nothing to `npm install` and then regret.

## Structure

- `/` is the landing page. The repository and gist lists are built in the browser from the GitHub API (`assets/repo-index.js`).
- `/globified/` is the Globified app, kept as one self-contained page so the site shell can't break it.
- `/projects/` and `/docs/` are older-style pages with provisional content. They use `assets/css/` and `assets/js/`, not the landing page's `assets/style.css` and `assets/site.js`. Two sets of styles for one site is untidy and I know it.
- `/assets/` has the styles, scripts, fonts and hero artwork (`tabarc-hero.webp` is what the page loads; the PNG is the original).
- `site.webmanifest`, `robots.txt`, `sitemap.xml`, `404.html` and the icons do what they say.

## Things worth knowing

- The live repo index calls GitHub's API without a token, which allows 60 requests an hour per IP. The page caches the answer for 30 minutes in the browser so a few reloads don't use it all up. If the limit is hit anyway, it says so and links to GitHub.
- "Latest push" on the landing page is the most recently pushed repository, forks included, taken from that same API response. It used to be a hard-coded line that always said "2h ago", which was charming and untrue.
- The repo index hides forks on purpose. If you want them shown, it's one filter in `assets/repo-index.js`.
- Respects `prefers-reduced-motion`: the matrix rain paints a still backdrop instead of animating.
- Fonts are self-hosted in `assets/fonts/` (IBM Plex Mono, Orbitron, Space Grotesk, Atkinson Hyperlegible), downloaded from Google Fonts. All are SIL OFL 1.1; the licence texts and copyright lines are in `assets/fonts/LICENCES.md`. The pages' only third-party request left is the GitHub API for the repo index.

## Deploy

Put the files in the `tabarc-code.github.io` repository under the `tabarc-code` account and set **Settings > Pages** to publish from the branch or from GitHub Actions, whichever you prefer. There's no workflow file in the repository at the moment, so if Pages is set to "GitHub Actions" nothing will publish until one is added. Check the setting. The site appears at `https://tabarc-code.github.io/`.

## Checks

None automated yet. I ran the page in headless Chromium with the GitHub API stubbed: no horizontal scroll at 320, 390 and 1280px, no script errors, the repo categories land where they should, and a reload makes no extra API calls. That isn't a test suite, it's me being nosy.

Author: TABARC-Code
