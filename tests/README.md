# Repository index checks

Run the dependency-free regression suite from the repository root:

```sh
node --test tests/repo-index.test.cjs
```

For the Chromium checks, install Playwright in your development environment and its browser:

```sh
npm install --no-save playwright
npx playwright install chromium
node tests/browser.cjs
```

The browser script starts and closes its own local server. It checks all category filters, desktop and narrow viewports, featured links, navigation and a failed API response. Public API responses are intercepted with fixtures so rate limits do not make the checks unreliable.

Set `LIVE_REPOS_PATH` to a downloaded JSON array from the public repository API to exercise real names, descriptions and topics instead of the small built-in fixture. This still uses intercepted responses; it does not prove that a particular visitor can reach the live API.

The index uses unauthenticated public endpoints, excludes private repositories and secret gists, and includes labelled public forks. Classification checks names, then topics, then descriptions. It remains heuristic; vague names and competing keywords can need editorial correction.
