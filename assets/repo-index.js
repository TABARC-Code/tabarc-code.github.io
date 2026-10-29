(() => {
  const owner = 'TABARC-Code';
  const repoGrid = document.querySelector('#repo-grid');
  const repoStatus = document.querySelector('#repo-status');
  const gistGrid = document.querySelector('#gist-grid');
  const gistStatus = document.querySelector('#gist-status');
  const filter = document.querySelector('#repo-filter');
  if (!repoGrid) return;

  const normalise = value => String(value || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_.]+/g, ' ');
  const hay = r => normalise(r.name);
  const categories = [
    ['WORDPRESS & PLUGINS', r => /\b(wordpress|wp|woocommerce|gutenberg|indexnow|kadence)\b/i.test(hay(r))],
    ['AI & LLM SKILLS', r => /\b(ai|skills?|claude|llm|prompts?|agents?|mcp|chatgtp|chatgpt|deepseek|hive|hydra|humanizer|n8n)\b/i.test(hay(r))],
    ['TABLETOP & RPG', r => /\b(tabletop|dnd|rpg|wargaming|boardgame|board games?|gaming|events?|tournaments?|dice|charterstone|ccg|tcg)\b/i.test(hay(r))],
    ['WINDOWS UTILITIES', r => /\b(windows|powershell|ps1|winget|wiggle|keepawake|clipboard|screen coordinates|type and click)\b/i.test(hay(r))],
    ['GAMES & MEDIA', r => /\b(games?|arcade|vectoroids|pixel|media|iptv|vlc|plex|nfo|telnet|bulletin board|bbs|jetman)\b/i.test(hay(r))],
    ['HOME & HARDWARE', r => /\b(home assistant|dose|medicat\w*|udp|hardware|weather|solarify|printventor\w*|libre\w*)\b/i.test(hay(r))],
    ['WRITING & DOCUMENTATION', r => /\b(writing|writers?|documentation|docs?|lexicon|editorial|style|indexer|blog|otds)\b/i.test(hay(r))],
    ['TOOLS & EXPERIMENTS', () => true]
  ];

  let repos = [];
  let loaded = false;
  if (filter) filter.disabled = true;

  function esc(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function classify(r) {
    // A specific name wins over generic words in the supporting text.
    const sources = [r.name, Array.isArray(r.topics) ? r.topics.join(' ') : '', r.description];
    for (const source of sources) {
      for (const [name, test] of categories.slice(0, -1)) {
        if (test({name: source})) return name;
      }
    }
    return 'TOOLS & EXPERIMENTS';
  }
  function card(r) {
    const lang = r.language ? `<span>${esc(r.language)}</span>` : '';
    const stars = Number.isSafeInteger(r.stargazers_count) && r.stargazers_count > 0 ? `<span>★ ${r.stargazers_count}</span>` : '';
    const topics = (Array.isArray(r.topics) ? r.topics : []).slice(0,3).map(t => `<i>${esc(t)}</i>`).join('');
    return `<article class="repo-card" data-category="${esc(classify(r))}">
      <div class="repo-top"><label>// ${esc(classify(r))}</label><span class="repo-visibility">${r.archived ? 'ARCHIVED / ' : ''}${r.fork ? 'PUBLIC FORK' : 'PUBLIC'}</span></div>
      <h3>${esc(r.name)}</h3>
      <p>${esc(r.description || 'TABARC::CODE repository — inspect the source, read the documentation, build from it.')}</p>
      <div class="repo-meta">${lang}${stars}<span>↗ ${esc(new Date(r.updated_at).toLocaleDateString('en-GB'))}</span></div>
      <div class="repo-tags">${topics}</div>
      <a class="btn small" href="https://github.com/${owner}/${encodeURIComponent(r.name)}" target="_blank" rel="noopener">&gt; OPEN REPOSITORY →</a>
    </article>`;
  }
  function render() {
    if (!loaded) return;
    const wanted = filter?.value || 'ALL';
    const shown = repos.filter(r => wanted === 'ALL' || classify(r) === wanted);
    repoGrid.innerHTML = shown.map(card).join('') || '<div class="empty-state">NO MATCHES IN INDEX.</div>';
    if (repoStatus) repoStatus.textContent = `${shown.length} REPOSITORIES INDEXED / ${wanted}`;
  }

  const setStatus = (element, message) => { if (element) element.textContent = message; };

  async function fetchPages(kind) {
    const all = new Map();
    for (let page = 1; ; page++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const query = kind === 'repos' ? '&sort=full_name&direction=asc' : '';
        const response = await fetch(`https://api.github.com/users/${owner}/${kind}?per_page=100&page=${page}${query}`, {
          headers: {Accept: 'application/vnd.github+json'},
          credentials: 'omit',
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`GitHub API ${response.status}`);
        const batch = await response.json();
        if (!Array.isArray(batch) || batch.some(item => !item || typeof item !== 'object' || item.id == null)) {
          throw new Error('Invalid index response');
        }
        const previousSize = all.size;
        batch.forEach(item => all.set(String(item.id), item));
        if (batch.length < 100) return [...all.values()];
        if (all.size === previousSize) throw new Error('Pagination did not advance');
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  async function loadRepos() {
    try {
      setStatus(repoStatus, 'CONNECTING TO GITHUB API...');
      const all = await fetchPages('repos');
      repos = all.filter(r => r.private === false &&
        typeof r.name === 'string' && /^[a-z0-9_.-]+$/i.test(r.name) &&
        typeof r.owner?.login === 'string' && r.owner.login.toLowerCase() === owner.toLowerCase());
      loaded = true;
      render();
      if (filter) filter.disabled = false;
    } catch {
      loaded = false;
      if (filter) filter.disabled = true;
      setStatus(repoStatus, 'LIVE INDEX UNAVAILABLE / OPEN GITHUB DIRECTLY');
      repoGrid.innerHTML = `<div class="empty-state"><p>GitHub could not be queried from this browser session.</p><a class="btn small" href="https://github.com/${owner}?tab=repositories" target="_blank" rel="noopener">&gt; VIEW ALL REPOSITORIES</a></div>`;
    }
  }

  if (filter) filter.addEventListener('change', render);
  loadRepos();

  if (gistGrid) {
    fetchPages('gists')
      .then(items => {
        const gists = items.filter(g => g.public === true && /^[a-f0-9]+$/i.test(String(g.id)));
        setStatus(gistStatus, `${gists.length} PUBLIC GISTS INDEXED`);
        gistGrid.innerHTML = gists.map(g => {
          const fileNames = Object.keys(g.files || {});
          const title = esc(g.description || fileNames[0] || 'Untitled Gist');
          return `<article class="gist-card"><label>// GIST</label><h3>${title}</h3><p>${fileNames.map(esc).join(' · ')}</p><div class="repo-meta"><span>${new Date(g.updated_at).toLocaleDateString('en-GB')}</span><span>${g.public ? 'PUBLIC' : 'SECRET'}</span></div><a class="btn small" href="https://gist.github.com/${owner}/${encodeURIComponent(g.id)}" target="_blank" rel="noopener">&gt; OPEN GIST →</a></article>`;
        }).join('') || '<div class="empty-state">NO GISTS INDEXED.</div>';
      })
      .catch(() => {
        setStatus(gistStatus, 'GIST INDEX UNAVAILABLE');
        gistGrid.innerHTML = `<div class="empty-state"><a class="btn small" href="https://gist.github.com/${owner}" target="_blank" rel="noopener">&gt; VIEW GISTS →</a></div>`;
      });
  }
})();
