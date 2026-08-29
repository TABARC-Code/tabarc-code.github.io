(() => {
  const owner = 'TABARC-Code';
  const repoGrid = document.querySelector('#repo-grid');
  const repoStatus = document.querySelector('#repo-status');
  const gistGrid = document.querySelector('#gist-grid');
  const gistStatus = document.querySelector('#gist-status');
  const filter = document.querySelector('#repo-filter');
  if (!repoGrid) return;

  const categories = [
    ['AI & LLM SKILLS', r => /skill|claude|ai|llm|prompt|agent/i.test(`${r.name} ${r.description || ''} ${(r.topics || []).join(' ')}`)],
    ['WORDPRESS & PLUGINS', r => /wordpress|wp-|plugin|woocommerce|gutenberg/i.test(`${r.name} ${r.description || ''} ${(r.topics || []).join(' ')}`)],
    ['TABLETOP & RPG', r => /tabletop|dnd|rpg|gaming|tournament|events|dice/i.test(`${r.name} ${r.description || ''} ${(r.topics || []).join(' ')}`)],
    ['WRITING & DOCUMENTATION', r => /writing|writer|documentation|otds|language|editorial|style/i.test(`${r.name} ${r.description || ''} ${(r.topics || []).join(' ')}`)],
    ['TOOLS & EXPERIMENTS', () => true]
  ];

  let repos = [];

  function esc(s='') { return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function classify(r) {
    for (const [name, test] of categories) if (test(r)) return name;
    return 'TOOLS & EXPERIMENTS';
  }
  function card(r) {
    const lang = r.language ? `<span>${esc(r.language)}</span>` : '';
    const stars = r.stargazers_count ? `<span>★ ${r.stargazers_count}</span>` : '';
    const topics = (r.topics || []).slice(0,3).map(t => `<i>${esc(t)}</i>`).join('');
    return `<article class="repo-card" data-category="${esc(classify(r))}">
      <div class="repo-top"><label>// ${esc(classify(r))}</label><span class="repo-visibility">${r.archived ? 'ARCHIVED' : 'PUBLIC'}</span></div>
      <h3>${esc(r.name)}</h3>
      <p>${esc(r.description || 'TABARC::CODE repository — inspect the source, read the documentation, build from it.')}</p>
      <div class="repo-meta">${lang}${stars}<span>↗ ${esc(new Date(r.updated_at).toLocaleDateString('en-GB'))}</span></div>
      <div class="repo-tags">${topics}</div>
      <a class="btn small" href="${r.html_url}" target="_blank" rel="noopener">&gt; OPEN REPOSITORY →</a>
    </article>`;
  }
  function render() {
    const wanted = filter?.value || 'ALL';
    const shown = repos.filter(r => wanted === 'ALL' || classify(r) === wanted);
    repoGrid.innerHTML = shown.map(card).join('') || '<div class="empty-state">NO MATCHES IN INDEX.</div>';
    if (repoStatus) repoStatus.textContent = `${shown.length} REPOSITORIES INDEXED / ${wanted}`;
  }

  async function loadRepos() {
    try {
      repoStatus.textContent = 'CONNECTING TO GITHUB API...';
      let page = 1, all = [];
      while (page <= 3) {
        const res = await fetch(`https://api.github.com/users/${owner}/repos?per_page=100&page=${page}&sort=updated`, {headers:{Accept:'application/vnd.github+json'}});
        if (!res.ok) throw new Error(`GitHub API ${res.status}`);
        const batch = await res.json();
        all.push(...batch);
        if (batch.length < 100) break;
        page++;
      }
      repos = all.filter(r => !r.fork && !r.private);
      render();
    } catch (e) {
      repoStatus.textContent = 'LIVE INDEX UNAVAILABLE — OPEN GITHUB DIRECTLY';
      repoGrid.innerHTML = `<div class="empty-state"><p>GitHub could not be queried from this browser session.</p><a class="btn small" href="https://github.com/${owner}?tab=repositories" target="_blank" rel="noopener">&gt; VIEW ALL REPOSITORIES →</a></div>`;
    }
  }

  if (filter) filter.addEventListener('change', render);
  loadRepos();

  if (gistGrid) {
    fetch(`https://api.github.com/users/${owner}/gists?per_page=100`, {headers:{Accept:'application/vnd.github+json'}})
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(gists => {
        gistStatus.textContent = `${gists.length} GISTS INDEXED`;
        gistGrid.innerHTML = gists.map(g => {
          const fileNames = Object.keys(g.files || {});
          const title = esc(g.description || fileNames[0] || 'Untitled Gist');
          return `<article class="gist-card"><label>// GIST</label><h3>${title}</h3><p>${fileNames.map(esc).join(' · ')}</p><div class="repo-meta"><span>${new Date(g.updated_at).toLocaleDateString('en-GB')}</span><span>${g.public ? 'PUBLIC' : 'SECRET'}</span></div><a class="btn small" href="${g.html_url}" target="_blank" rel="noopener">&gt; OPEN GIST →</a></article>`;
        }).join('') || '<div class="empty-state">NO GISTS INDEXED.</div>';
      })
      .catch(() => {
        gistStatus.textContent = 'GIST INDEX UNAVAILABLE';
        gistGrid.innerHTML = `<div class="empty-state"><a class="btn small" href="https://gist.github.com/${owner}" target="_blank" rel="noopener">&gt; VIEW GISTS →</a></div>`;
      });
  }
})();
