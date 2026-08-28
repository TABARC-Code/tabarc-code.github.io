(() => {
  const root = document.documentElement;
  document.getElementById('year').textContent = new Date().getFullYear();
  const clock = document.getElementById('clock');
  const tick = () => clock && (clock.textContent = new Date().toISOString().slice(11, 19) + ' UTC');
  tick(); setInterval(tick, 1000);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals = document.querySelectorAll('[data-reveal]');
  if (reduced || !('IntersectionObserver' in window)) reveals.forEach(el => el.classList.add('visible'));
  else {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: .12 });
    reveals.forEach(el => observer.observe(el));
  }

  const signal = document.querySelector('.signal-switch');
  signal?.addEventListener('click', () => {
    const active = signal.getAttribute('aria-pressed') === 'true';
    signal.setAttribute('aria-pressed', String(!active));
    signal.lastChild.textContent = active ? ' signal:off' : ' signal:on';
    document.body.classList.toggle('signal-off', active);
  });

  if (reduced) return;
  const canvas = document.getElementById('matrix');
  const ctx = canvas.getContext('2d');
  const glyphs = '01<>/{}[]λ∆⌁TABARC'; let cols = [], font = 14;
  const resize = () => { canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); cols = Array(Math.ceil(innerWidth/font)).fill(0).map(() => Math.random()*-80); };
  const rain = () => { ctx.fillStyle='rgba(5,8,6,.08)';ctx.fillRect(0,0,innerWidth,innerHeight);ctx.fillStyle='#71ff45';ctx.font=`${font}px monospace`;cols.forEach((y,i)=>{ctx.fillText(glyphs[Math.floor(Math.random()*glyphs.length)],i*font,y*font);if(y*font>innerHeight&&Math.random()>.985)cols[i]=0;cols[i]+=.35;});requestAnimationFrame(rain); };
  addEventListener('resize', resize, {passive:true}); resize(); rain();
})();
