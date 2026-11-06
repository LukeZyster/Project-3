// Marketplace: search, filters, sort, listing detail and "message the seller".
(async function () {
  await UI.ready;
  const { esc, money, icon, ago } = UI;
  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get('q') || '',
    cat: params.get('cat') || 'All',
    cond: 'Any',
    min: '', max: '',
    swap: params.get('swap') === '1',
    hideSold: true,
    sort: 'new'
  };
  let listings = [];
  let saved = new Set();

  const $ = id => document.getElementById(id);
  $('q').value = state.q;
  $('swapOnly').checked = state.swap;

  const chip = (group, value, label, ic) => '<button type="button" class="chip' + ((group === 'cat' ? state.cat : state.cond) === value ? ' is-active' : '') + '" data-' + group + '="' + esc(value) + '">' + (ic ? icon(ic) : '') + esc(label) + '</button>';
  function renderChips() {
    $('catChips').innerHTML = chip('cat', 'All', 'All') + SM.CATEGORIES.map(c => chip('cat', c, c, UI.catIcon(c))).join('');
    $('condChips').innerHTML = chip('cond', 'Any', 'Any') + SM.CONDITIONS.map(c => chip('cond', c, c)).join('');
    UI.refreshIcons();
  }

  function filtered() {
    const q = state.q.trim().toLowerCase();
    const min = parseFloat(state.min), max = parseFloat(state.max);
    let out = listings.filter(l =>
      (state.cat === 'All' || l.category === state.cat) &&
      (state.cond === 'Any' || l.condition === state.cond) &&
      (!state.swap || l.open_to_swap) &&
      (!state.hideSold || l.status !== 'sold') &&
      (isNaN(min) || Number(l.price) >= min) &&
      (isNaN(max) || Number(l.price) <= max) &&
      (!q || [l.title, l.description, l.category, l.campus, l.pickup_spot, l.seller && l.seller.full_name].join(' ').toLowerCase().includes(q))
    );
    if (state.sort === 'low') out.sort((a, b) => a.price - b.price);
    else if (state.sort === 'high') out.sort((a, b) => b.price - a.price);
    else out.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    return out;
  }

  function render() {
    const items = filtered();
    $('count').textContent = items.length + (items.length === 1 ? ' item' : ' items');
    $('grid').innerHTML = items.length
      ? items.map(l => UI.listingCard(l, { saved })).join('')
      : '<div class="empty">' + icon('search-x') + '<h3>Nothing matches that yet</h3><p>Try a different filter — or be the one who lists it.</p><a class="btn btn--primary" href="sell.html">List an item</a></div>';
    UI.refreshIcons(); UI.reveal($('grid'));
    const url = new URL(location.href);
    ['q', 'cat', 'swap'].forEach(k => url.searchParams.delete(k));
    if (state.q) url.searchParams.set('q', state.q);
    if (state.cat !== 'All') url.searchParams.set('cat', state.cat);
    if (state.swap) url.searchParams.set('swap', '1');
    history.replaceState(null, '', url);
  }

  async function load() {
    try {
      [listings, saved] = await Promise.all([SM.listListings(), SM.savedIds().then(ids => new Set(ids)).catch(() => new Set())]);
    } catch (e) {
      listings = [];
      $('grid').innerHTML = '<div class="empty">' + icon('wifi-off') + '<h3>Couldn\'t load listings</h3><p>' + esc(e.message) + '</p><button class="btn btn--ghost" onclick="location.reload()">Try again</button></div>';
      UI.refreshIcons(); return;
    }
    render();
  }

  async function toggleSave(id) {
    if (!UI.user) { UI.toast('Sign in to save items to your shortlist.', 'info'); setTimeout(() => location.href = 'login.html?next=' + encodeURIComponent('marketplace.html?item=' + id), 900); return; }
    try {
      const on = await SM.toggleSaved(id);
      on ? saved.add(id) : saved.delete(id);
      render();
      const btn = document.querySelector('.modal [data-save-detail]');
      if (btn) { btn.classList.toggle('is-saved', on); btn.innerHTML = icon('heart') + (on ? 'Saved' : 'Save'); UI.refreshIcons(); }
      UI.toast(on ? 'Saved to your shortlist' : 'Removed from saved');
    } catch (e) { UI.toast(e.message, 'error'); }
  }

  async function openListing(id) {
    let l = listings.find(x => x.id === id);
    if (!l) { try { l = await SM.getListing(id); } catch (e) { /* handled below */ } }
    if (!l) { UI.toast('That listing has been removed.', 'error'); return; }
    const mine = UI.user && UI.user.id === l.seller_id;
    const seller = l.seller || { full_name: 'Student' };
    const media = l.image_url ? '<img src="' + esc(l.image_url) + '" alt="' + esc(l.title) + '">' : '<div class="card__ph card__ph--' + esc(l.category.toLowerCase().replace(/\s+/g, '-')) + '">' + icon(UI.catIcon(l.category)) + '<span>' + esc(l.category) + '</span></div>';
    const statusStamp = l.status !== 'available' ? '<span class="stamp stamp--' + esc(l.status) + '">' + esc(l.status) + '</span>' : '';
    const panel = UI.openModal(
      '<div class="detail">' +
        '<div class="detail__media">' + media + statusStamp + '</div>' +
        '<div class="detail__body">' +
          '<div><p class="card__meta">' + icon(UI.catIcon(l.category)) + esc(l.category) + ' · listed ' + ago(l.created_at) + '</p><h2 style="margin-top:8px">' + esc(l.title) + '</h2></div>' +
          '<div class="detail__price">' + money(l.price) + (l.open_to_swap ? ' <span class="hand" style="font-size:24px;color:var(--ok)">or swap!</span>' : '') + '</div>' +
          (l.description ? '<p class="muted" style="white-space:pre-line">' + esc(l.description) + '</p>' : '') +
          '<div class="facts">' +
            '<div class="fact">' + icon('sparkles') + '<span><small>Condition</small>' + esc(l.condition) + '</span></div>' +
            '<div class="fact">' + icon('map-pin') + '<span><small>Campus</small>' + esc(l.campus || '—') + '</span></div>' +
            '<div class="fact" style="grid-column:1/-1">' + icon('handshake') + '<span><small>Pickup spot</small>' + esc(l.pickup_spot || 'Agree in chat') + '</span></div>' +
          '</div>' +
          '<div class="seller"><span class="seller__av">' + (seller.avatar_url ? '<img src="' + esc(seller.avatar_url) + '" alt="">' : esc(UI.initials(seller.full_name))) + '</span><div><b>' + esc(seller.full_name) + (mine ? ' (you)' : '') + '</b><p class="muted" style="font-size:13px">' + esc(seller.campus || 'Student seller') + '</p></div></div>' +
          (mine
            ? '<div class="card__actions"><button class="btn btn--ghost btn--sm" data-status="available">Available</button><button class="btn btn--ghost btn--sm" data-status="archived">Hide</button><button class="btn btn--primary btn--sm" data-status="sold">Mark sold</button><button class="btn btn--danger btn--sm" data-delete>' + icon('trash-2') + 'Delete</button></div>'
            : (l.status === 'sold'
              ? '<p class="notice notice--warn">' + icon('info') + 'This one has already found a new home.</p>'
              : '<div style="display:grid;gap:10px"><div class="quick-replies"><button type="button">Is this still available?</button><button type="button">Can we meet on campus tomorrow?</button>' + (l.open_to_swap ? '<button type="button">Would you swap for something?</button>' : '<button type="button">Would you take a bit less?</button>') + '</div>' +
                '<form class="msg-box" id="msgForm"><input class="input" name="body" maxlength="1000" required placeholder="Write to ' + esc(seller.full_name.split(' ')[0]) + '…"><button class="btn btn--primary" type="submit">' + icon('send') + '<span>Send</span></button></form></div>')) +
          '<div class="card__actions" style="margin-top:auto">' + (UI.profile && UI.profile.role === 'admin' && !mine ? '<button class="btn btn--danger btn--sm" data-admin-remove>' + icon('shield-x') + 'Remove (admin)</button>' : '') + (mine || !UI.user ? '' : '<button class="btn btn--ghost btn--sm" data-report>' + icon('flag') + 'Report</button>') + (mine ? '' : '<button class="btn btn--ghost btn--sm card__save-detail ' + (saved.has(l.id) ? 'is-saved' : '') + '" data-save-detail>' + icon('heart') + (saved.has(l.id) ? 'Saved' : 'Save') + '</button>') + '<button class="btn btn--ghost btn--sm" data-share>' + icon('link') + 'Copy link</button></div>' +
        '</div>' +
      '</div>', { wide: true });

    const url = new URL(location.href); url.searchParams.set('item', l.id); history.replaceState(null, '', url);
    UI.onModalClose = () => { const u = new URL(location.href); u.searchParams.delete('item'); history.replaceState(null, '', u); };

    panel.querySelectorAll('.quick-replies button').forEach(b => b.addEventListener('click', () => { const i = panel.querySelector('#msgForm input'); i.value = b.textContent; i.focus(); }));
    const form = panel.querySelector('#msgForm');
    if (form) form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!UI.user) { location.href = 'login.html?next=' + encodeURIComponent('marketplace.html?item=' + l.id) + '&why=' + encodeURIComponent('Sign in to message sellers.'); return; }
      const btn = form.querySelector('button'); UI.busy(btn, true, 'Sending');
      try {
        await SM.sendMessage({ to: l.seller_id, listingId: l.id, body: form.body.value.trim() });
        UI.toast('Message sent to ' + seller.full_name.split(' ')[0]);
        setTimeout(() => { location.href = 'chat.html?with=' + encodeURIComponent(l.seller_id) + '&listing=' + encodeURIComponent(l.id); }, 600);
      } catch (err) { UI.toast(err.message, 'error'); UI.busy(btn, false); }
    });
    const saveBtn = panel.querySelector('[data-save-detail]');
    if (saveBtn) saveBtn.addEventListener('click', () => toggleSave(l.id));
    panel.querySelector('[data-share]').addEventListener('click', async () => {
      const link = location.href.split('?')[0] + '?item=' + l.id;
      try { await navigator.clipboard.writeText(link); UI.toast('Link copied — send it to a friend'); } catch (e) { prompt('Copy this link', link); }
    });
    panel.querySelectorAll('[data-status]').forEach(b => b.addEventListener('click', async () => {
      try { await SM.updateListing(l.id, { status: b.dataset.status }); l.status = b.dataset.status; UI.toast(b.dataset.status === 'archived' ? 'Hidden from the marketplace' : 'Marked as ' + b.dataset.status); if (b.dataset.status === 'archived') listings = listings.filter(x => x.id !== l.id); UI.closeModal(); render(); }
      catch (e) { UI.toast(e.message, 'error'); }
    }));
    const rep = panel.querySelector('[data-report]');
    if (rep) rep.addEventListener('click', () => {
      const p2 = UI.openModal('<form class="profile-form" id="repForm" style="padding:30px"><span class="eyebrow">Report listing</span><h2 style="font-size:26px">What\'s wrong with "' + esc(l.title) + '"?</h2>' +
        '<div class="chips" style="flex-wrap:wrap">' + ['Prohibited item', 'Scam or fake', 'Offensive content', 'Wrong category', 'Already sold'].map(r => '<button type="button" class="chip" data-r="' + r + '">' + r + '</button>').join('') + '</div>' +
        '<label class="field"><span>Details</span><textarea name="reason" required minlength="3" maxlength="300" placeholder="Tell the admins what you noticed"></textarea></label><button class="btn btn--accent" type="submit">' + icon('flag') + 'Send report</button></form>');
      const f = p2.querySelector('#repForm');
      p2.querySelectorAll('[data-r]').forEach(c => c.addEventListener('click', () => { p2.querySelectorAll('[data-r]').forEach(x => x.classList.toggle('is-active', x === c)); if (!f.reason.value) f.reason.value = c.dataset.r; }));
      f.addEventListener('submit', async e => {
        e.preventDefault(); const b = f.querySelector('[type=submit]'); UI.busy(b, true, 'Sending');
        try { await SM.reportListing(l.id, f.reason.value.trim()); UI.closeModal(); UI.toast('Thanks — an admin will take a look.'); }
        catch (err) { UI.toast(err.message, 'error'); UI.busy(b, false); }
      });
    });
    const adm = panel.querySelector('[data-admin-remove]');
    if (adm) adm.addEventListener('click', async () => {
      const reason = prompt('Reason for removing "' + l.title + '" (sent to the seller):', 'Breaks the StudentMarket rules');
      if (reason === null) return;
      try { await SM.adminRemoveListing(l.id, reason); listings = listings.filter(x => x.id !== l.id); UI.toast('Listing removed'); UI.closeModal(); render(); }
      catch (e) { UI.toast(e.message, 'error'); }
    });
    const del = panel.querySelector('[data-delete]');
    if (del) del.addEventListener('click', async () => {
      if (!confirm('Delete "' + l.title + '"? This can\'t be undone.')) return;
      try { await SM.deleteListing(l.id); listings = listings.filter(x => x.id !== l.id); UI.toast('Listing deleted'); UI.closeModal(); render(); }
      catch (e) { UI.toast(e.message, 'error'); }
    });
  }

  // events
  $('filters').addEventListener('click', e => {
    const c = e.target.closest('[data-cat]'), d = e.target.closest('[data-cond]');
    if (c) state.cat = c.dataset.cat;
    if (d) state.cond = d.dataset.cond;
    if (c || d) { renderChips(); render(); }
  });
  let t;
  $('q').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value; render(); }, 150); });
  $('sort').addEventListener('change', e => { state.sort = e.target.value; render(); });
  $('minPrice').addEventListener('input', e => { state.min = e.target.value; render(); });
  $('maxPrice').addEventListener('input', e => { state.max = e.target.value; render(); });
  $('swapOnly').addEventListener('change', e => { state.swap = e.target.checked; render(); });
  $('hideSold').addEventListener('change', e => { state.hideSold = e.target.checked; render(); });
  $('resetFilters').addEventListener('click', () => {
    Object.assign(state, { q: '', cat: 'All', cond: 'Any', min: '', max: '', swap: false, hideSold: true });
    $('q').value = ''; $('minPrice').value = ''; $('maxPrice').value = ''; $('swapOnly').checked = false; $('hideSold').checked = true;
    renderChips(); render();
  });
  $('openFilters').addEventListener('click', () => $('filters').classList.add('open'));
  $('closeFilters').addEventListener('click', () => $('filters').classList.remove('open'));

  $('grid').addEventListener('click', e => {
    const s = e.target.closest('[data-save]');
    if (s) { e.stopPropagation(); toggleSave(s.dataset.save); return; }
    const card = e.target.closest('.card');
    if (card) openListing(card.dataset.id);
  });
  $('grid').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.classList.contains('card')) openListing(e.target.dataset.id); });

  renderChips();
  await load();
  if (params.get('item')) openListing(params.get('item'));
})();
