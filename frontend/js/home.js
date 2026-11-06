// Landing page: live ticker, category counts, fresh listings and stats.
(async function () {
  await UI.ready;
  const { esc, money, icon } = UI;

  document.querySelectorAll('[data-go]').forEach(el => el.addEventListener('click', () => { location.href = el.dataset.go; }));

  let listings = [];
  try { listings = await SM.listListings(); }
  catch (e) { UI.toast(e.message, 'error'); }
  const available = listings.filter(l => l.status !== 'sold');

  // ticker
  const tickerItems = (available.length ? available.slice(0, 10) : [{ title: 'Your listing could be here', price: 0, category: 'Other' }])
    .map(l => '<span class="ticker__item">' + icon(UI.catIcon(l.category)) + esc(l.title) + (l.price ? ' <b>' + money(l.price) + '</b>' : '') + '</span>').join('');
  document.getElementById('ticker').innerHTML = tickerItems + tickerItems;

  // categories
  const blurbs = { 'Books': 'Textbooks & notes', 'Electronics': 'Laptops, calculators', 'Res essentials': 'Fridges, kettles, lamps', 'Furniture': 'Desks, chairs, shelves', 'Clothing': 'Hoodies, formal wear', 'Other': 'Everything else' };
  document.getElementById('cats').innerHTML = SM.CATEGORIES.map(c => {
    const n = available.filter(l => l.category === c).length;
    return '<a class="cat reveal" href="marketplace.html?cat=' + encodeURIComponent(c) + '"><span class="cat__ic">' + icon(UI.catIcon(c)) + '</span><span><b>' + esc(c) + '</b><small>' + (n ? n + ' listed · ' : '') + (blurbs[c] || 'Browse') + '</small></span></a>';
  }).join('');
  UI.refreshIcons(); UI.reveal();

  // fresh listings
  let saved = new Set(await SM.savedIds().catch(() => []));
  const fresh = document.getElementById('fresh');
  const renderFresh = () => {
    const items = available.slice(0, 8);
    fresh.innerHTML = items.length ? items.map(l => UI.listingCard(l, { saved })).join('')
      : '<div class="empty">' + icon('sticky-note') + '<h3>The board is empty</h3><p>Be the first to pin something up.</p><a class="btn btn--primary" href="sell.html">List an item</a></div>';
    UI.refreshIcons(); UI.reveal(fresh);
  };
  renderFresh();
  fresh.addEventListener('click', async e => {
    const save = e.target.closest('[data-save]');
    if (save) {
      e.stopPropagation();
      if (!UI.user) { location.href = 'login.html?next=index.html&why=' + encodeURIComponent('Sign in to save items.'); return; }
      try { const on = await SM.toggleSaved(save.dataset.save); on ? saved.add(save.dataset.save) : saved.delete(save.dataset.save); renderFresh(); UI.toast(on ? 'Saved to your shortlist' : 'Removed from saved'); }
      catch (err) { UI.toast(err.message, 'error'); }
      return;
    }
    const card = e.target.closest('.card');
    if (card) location.href = 'marketplace.html?item=' + encodeURIComponent(card.dataset.id);
  });
  fresh.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.classList.contains('card')) e.target.click(); });

  // stats, counted up
  const sellers = new Set(available.map(l => l.seller_id)).size;
  const countUp = (id, to) => {
    const el = document.getElementById(id); const start = performance.now();
    const step = t => { const p = Math.min(1, (t - start) / 900); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    const io = new IntersectionObserver(en => { if (en[0].isIntersecting) { requestAnimationFrame(step); io.disconnect(); } });
    io.observe(el);
  };
  countUp('statListings', available.length);
  countUp('statSellers', sellers);
  countUp('statSwap', available.filter(l => l.open_to_swap).length);
  const today = listings.filter(l => Date.now() - new Date(l.created_at) < 7 * 864e5).length;
  if (today) document.getElementById('heroProof').textContent = today + (today === 1 ? ' item' : ' items') + ' pinned up this week by students like you.';
})();
