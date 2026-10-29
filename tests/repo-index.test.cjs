const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync('assets/repo-index.js', 'utf8');
const repo = (name, extra = {}) => ({id: name, name, private: false, fork: false,
  owner: {login: 'TABARC-Code'}, topics: [], updated_at: '2026-10-29', ...extra});
const response = data => ({ok: true, json: async () => data});

async function run(fetch, {status = true, gists = true} = {}) {
  const elements = {};
  for (const id of ['repo-grid', 'repo-filter', ...(status ? ['repo-status'] : []), ...(gists ? ['gist-grid', 'gist-status'] : [])]) {
    elements[id] = {innerHTML: '', textContent: '', value: 'ALL', addEventListener(event, fn) {this[event] = fn;}};
  }
  vm.runInNewContext(code, {document: {querySelector: q => elements[q.slice(1)]},
    fetch, AbortController, setTimeout, clearTimeout});
  for (let i = 0; i < 20; i++) await new Promise(resolve => setImmediate(resolve));
  return elements;
}
const reposOnly = data => url => Promise.resolve(response(url.includes('/gists?') ? [] : data));

test('classifies specific names before supporting text, and recognises separated terms', async () => {
  const rows = [repo('mail-maintenance'), repo('home-assistant', {description: 'Agent skills for local hardware'}),
    repo('wp-tools'), repo('ai-utils'), repo('board_games'), repo('Unknown', {topics: ['powershell']}),
    repo('Other', {description: 'A writing tool'}), repo('Printventoriuos')];
  const el = await run(reposOnly(rows));
  const html = el['repo-grid'].innerHTML;
  const groups = [...html.matchAll(/data-category="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(groups, ['TOOLS &amp; EXPERIMENTS', 'HOME &amp; HARDWARE', 'WORDPRESS &amp; PLUGINS',
    'AI &amp; LLM SKILLS', 'TABLETOP &amp; RPG', 'WINDOWS UTILITIES', 'WRITING &amp; DOCUMENTATION', 'HOME &amp; HARDWARE']);
  el['repo-filter'].value = 'HOME & HARDWARE';
  el['repo-filter'].change();
  assert.equal((el['repo-grid'].innerHTML.match(/class="repo-card"/g) || []).length, 2);
});

test('loads beyond 300, uses stable ordering and deduplicates IDs', async () => {
  const calls = [];
  const el = await run(async url => {
    if (url.includes('/gists?')) return response([]);
    calls.push(url);
    const page = Number(new URL(url).searchParams.get('page'));
    return response(page < 4 ? Array.from({length: 100}, (_, i) => repo(`repo-${(page - 1) * 100 + i}`)) : [repo('last'), repo('repo-0')]);
  });
  assert.equal(calls.length, 4);
  assert(calls.every(url => url.includes('sort=full_name&direction=asc')));
  assert.match(el['repo-status'].textContent, /^301 REPOSITORIES/);
});

test('includes labelled forks and excludes private and foreign repositories', async () => {
  const el = await run(reposOnly([repo('globified', {fork: true}), repo('hidden', {private: true}),
    repo('foreign', {owner: {login: 'elsewhere'}})]));
  assert.match(el['repo-grid'].innerHTML, /PUBLIC FORK/);
  assert.match(el['repo-status'].textContent, /^1 REPOSITORIES/);
  assert.doesNotMatch(el['repo-grid'].innerHTML, /hidden|foreign/);
});

test('escapes metadata and constructs links without trusting remote URLs', async () => {
  const el = await run(reposOnly([repo('safe-name', {html_url: 'javascript:alert(1)',
    description: '<img src=x onerror=alert(1)>', language: '<script>', topics: ['<svg onload=x>'],
    stargazers_count: '\"><img src=x>'})]));
  const html = el['repo-grid'].innerHTML;
  assert.doesNotMatch(html, /javascript:|<img|<script>|<svg/);
  assert.match(html, /href="https:\/\/github.com\/TABARC-Code\/safe-name"/);
});

test('error survives a filter event after a rate limit', async () => {
  const el = await run(async () => ({ok: false, status: 403}));
  const before = el['repo-grid'].innerHTML;
  el['repo-filter'].change();
  assert.equal(el['repo-grid'].innerHTML, before);
  assert.equal(el['repo-filter'].disabled, true);
  assert.match(el['repo-status'].textContent, /UNAVAILABLE/);
});

test('later page failure does not advertise an incomplete index', async () => {
  let n = 0;
  const el = await run(async url => {
    if (url.includes('/gists?')) return response([]);
    if (++n > 1) throw new Error('offline');
    return response(Array.from({length: 100}, (_, i) => repo(`repo-${i}`)));
  });
  assert.match(el['repo-status'].textContent, /UNAVAILABLE/);
  assert.doesNotMatch(el['repo-grid'].innerHTML, /class="repo-card"/);
});

test('invalid JSON shape and non-advancing pages fail cleanly', async () => {
  for (const data of [{message: 'broken'}, [null], Array.from({length: 100}, () => repo('same'))]) {
    const el = await run(reposOnly(data));
    assert.match(el['repo-status'].textContent, /UNAVAILABLE/);
  }
});

test('optional status elements and missing topic arrays do not break loading', async () => {
  const el = await run(reposOnly([repo('working', {topics: {bad: true}})]), {status: false, gists: false});
  assert.match(el['repo-grid'].innerHTML, /working/);
  assert.equal(el['repo-filter'].disabled, false);
});

test('gists paginate, exclude secret entries and escape titles and filenames', async () => {
  const el = await run(async url => {
    if (!url.includes('/gists?')) return response([]);
    const page = Number(new URL(url).searchParams.get('page'));
    return response(page === 1 ? Array.from({length: 100}, (_, i) => ({id: i.toString(16), public: true, files: {}})) : [
      {id: 'abcdef', public: true, description: '<svg onload=x>', files: {'<img>.md': {}}, html_url: 'javascript:x'},
      {id: 'ffff', public: false, files: {}}]);
  });
  assert.match(el['gist-status'].textContent, /^101 PUBLIC GISTS/);
  assert.doesNotMatch(el['gist-grid'].innerHTML, /javascript:|<svg|<img|SECRET/);
  assert.match(el['gist-grid'].innerHTML, /https:\/\/gist.github.com\/TABARC-Code\/abcdef/);
});

test('a stalled response times out and leaves a usable archive link', async () => {
  const elements = Object.fromEntries(['repo-grid', 'repo-status', 'repo-filter'].map(id => [id,
    {value: 'ALL', innerHTML: '', textContent: '', addEventListener() {}}]));
  vm.runInNewContext(code, {
    document: {querySelector: q => elements[q.slice(1)]}, AbortController,
    setTimeout: fn => setTimeout(fn, 1), clearTimeout,
    fetch: (url, {signal}) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('timeout'))))
  });
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.match(elements['repo-status'].textContent, /UNAVAILABLE/);
  assert.match(elements['repo-grid'].innerHTML, /https:\/\/github.com\/TABARC-Code\?tab=repositories/);
  assert.equal(elements['repo-filter'].disabled, true);
});
