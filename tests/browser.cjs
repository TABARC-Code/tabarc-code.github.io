const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const repo = (name, extra = {}) => ({id: name, name, private: false, owner: {login: 'TABARC-Code'},
  topics: [], updated_at: '2026-10-29', ...extra});

(async () => {
  const rows = process.env.LIVE_REPOS_PATH ? JSON.parse(await fs.readFile(process.env.LIVE_REPOS_PATH, 'utf8')) : [
    repo('home-assistant', {description: 'Agent prompts'}), repo('ai-tools'), repo('wp-tools'),
    repo('globified', {fork: true}), repo('private-tool', {private: true})];
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = path.resolve('.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
      if (!file.startsWith(process.cwd() + path.sep)) throw new Error('Invalid path');
      const content = await fs.readFile(file);
      res.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.png') ? 'image/png' : file.endsWith('.svg') ? 'image/svg+xml' : 'text/html');
      res.end(content);
    } catch {res.writeHead(404).end();}
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({headless: true});
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({body: ''}));
    await page.route('https://fonts.gstatic.com/**', route => route.abort());
    await page.route('https://api.github.com/**', route => {
      const url = new URL(route.request().url());
      const n = Number(url.searchParams.get('page'));
      return route.fulfill({json: url.pathname.endsWith('/repos') ? rows.slice((n - 1) * 100, n * 100) : []});
    });
    const origin = `http://127.0.0.1:${server.address().port}`;
    await page.goto(origin, {waitUntil: 'domcontentloaded'});
    await page.waitForFunction(() => !document.querySelector('#repo-filter').disabled);
    assert.equal(await page.locator('.repo-card').count(), rows.filter(r => r.private === false).length);
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({width, height: 900});
      await page.locator('#repo-filter').scrollIntoViewIfNeeded();
      const bounds = await page.locator('#repo-filter').boundingBox();
      assert(bounds.x >= 0 && bounds.x + bounds.width <= width, `filter clipped at ${width}px`);
      const clipped = await page.locator('.repo-card').evaluateAll(cards => cards.filter(card =>
        [...card.querySelectorAll('h3, p, .repo-tags i, .btn')].some(el => el.scrollWidth > el.clientWidth + 2)).length);
      assert.equal(clipped, 0, `card content clipped at ${width}px`);
    }
    const options = await page.locator('#repo-filter option').allTextContents();
    for (const option of options) {
      await page.selectOption('#repo-filter', {label: option});
      const groups = await page.locator('.repo-card').evaluateAll(cards => cards.map(c => c.dataset.category));
      assert(groups.every(group => option === 'ALL' || group === option));
    }
    await page.setViewportSize({width: 1440, height: 900});
    await page.goto(origin + '/projects/', {waitUntil: 'domcontentloaded'});
    assert.equal(await page.locator('.project-card').count(), 3);
    for (const href of await page.locator('.project-card').evaluateAll(cards => cards.map(c => c.href))) {
      assert.match(href, /^https:\/\/github.com\/TABARC-Code\/.+/);
    }
    await page.locator('nav a').first().click();
    assert.equal(new URL(page.url()).hash, '#projects');
    await page.unroute('https://api.github.com/**');
    await page.route('https://api.github.com/**', route => route.fulfill({status: 403, json: {message: 'Rate limit'}}));
    await page.goto(origin, {waitUntil: 'domcontentloaded'});
    await page.waitForFunction(() => document.querySelector('#repo-status').textContent.includes('UNAVAILABLE'));
    assert.equal(await page.locator('#repo-filter').isDisabled(), true);
    await page.locator('#repo-filter').dispatchEvent('change');
    assert.match(await page.locator('#repo-grid').textContent(), /could not be queried/);
    assert.deepEqual(errors, []);
    console.log(`Browser checks passed: ${rows.length} records, all filters, four viewport widths, project navigation and API failure.`);
  } finally {
    if (browser) await browser.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
