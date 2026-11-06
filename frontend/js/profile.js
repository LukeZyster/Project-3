// Profile: listings management, saved items, orders and editable details.
(async function () {
  await UI.ready;
  const user = await UI.requireUser('Sign in to see your account.');
  const { esc, money, icon } = UI;
  const $ = id => document.getElementById(id);
  let profile = UI.profile || await SM.getProfile();
  let listings = [], saved = new Set(), orders = [];

  function header() {
    $('pName').textContent = profile.full_name || 'Student';
    const bits = [];
    if (profile.campus) bits.push('<span>' + icon('map-pin') + esc(profile.campus) + '</span>');
    if (profile.course) bits.push('<span>' + icon('graduation-cap') + esc(profile.course) + (profile.year_of_study ? ', ' + esc(profile.year_of_study) : '') + '</span>');
    bits.push('<span>' + icon('mail') + esc(user.email || '') + '</span>');
    $('pMeta').innerHTML = bits.join('');
    $('avatarInner').innerHTML = profile.avatar_url ? '<img src="' + esc(profile.avatar_url) + '" alt="">' : esc(UI.initials(profile.full_name));
    UI.refreshIcons();
  }

  async function load() {
    const [all, mineAll, ids, ords] = await Promise.all([SM.listListings(), SM.myListings(), SM.savedIds(), SM.orders()]);
    const byId = new Map(all.map(l => [l.id, l])); mineAll.forEach(l => byId.set(l.id, l));
    listings = [...byId.values()]; saved = new Set(ids); orders = ords;
    render();
  }

  function render() {
    const mine = listings.filter(l => l.seller_id === user.id);
    const savedItems = listings.filter(l => saved.has(l.id));
    $('kActive').textContent = mine.filter(l => l.status === 'available').length;
    $('kSold').textContent = mine.filter(l => l.status === 'sold').length;
    $('kSaved').textContent = savedItems.length;
    $('kOrders').textContent = orders.length;

    const actions = l => '<div class="card__actions">' +
      (l.status === 'available' ? '<button class="btn btn--primary btn--sm" data-act="sold" data-id="' + esc(l.id) + '">' + icon('check') + 'Sold</button>' : '<button class="btn btn--ghost btn--sm" data-act="available" data-id="' + esc(l.id) + '">Relist</button>') +
      (l.status === 'available' ? '<button class="btn btn--ghost btn--sm" data-act="archived" data-id="' + esc(l.id) + '">Hide</button>' : '') +
      '<button class="btn btn--danger btn--sm" data-act="delete" data-id="' + esc(l.id) + '" aria-label="Delete">' + icon('trash-2') + '</button></div>';

    $('myListings').innerHTML = mine.length ? mine.map(l => UI.listingCard(l, { noSave: true, actions: actions(l) })).join('')
      : '<div class="empty">' + icon('sticky-note') + '<h3>Nothing pinned yet</h3><p>Got a textbook or a kettle you don\'t need? List it in a minute.</p><a class="btn btn--accent" href="sell.html">List your first item</a></div>';
    $('savedGrid').innerHTML = savedItems.length ? savedItems.map(l => UI.listingCard(l, { saved })).join('')
      : '<div class="empty">' + icon('heart') + '<h3>No saved items</h3><p>Tap the heart on any listing to keep it here.</p><a class="btn btn--primary" href="marketplace.html">Browse the marketplace</a></div>';
    $('ordersList').innerHTML = orders.length ? orders.map(o => {
      const items = Array.isArray(o.items) ? o.items : [];
      return '<div class="order panel"><div><b>Order #' + esc(String(o.id).slice(0, 8).toUpperCase()) + '</b><p class="muted" style="font-size:13px">' + new Date(o.created_at).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }) + ' · ' + items.reduce((s, i) => s + i.quantity, 0) + ' items · collect at the campus store</p></div>' +
        '<div class="order__thumbs">' + items.slice(0, 4).map(i => '<img src="' + esc(i.image_url) + '" alt="' + esc(i.name) + '" title="' + esc(i.name) + ' × ' + i.quantity + '">').join('') + '</div><b style="font:700 18px Space Grotesk">' + money(o.total) + '</b></div>';
    }).join('') : '<div class="empty">' + icon('receipt') + '<h3>No orders yet</h3><p>Orders from the campus store will show up here.</p><a class="btn btn--primary" href="merch.html">Visit the store</a></div>';
    UI.refreshIcons(); UI.reveal();
  }

  // tabs
  const tabs = document.querySelectorAll('[data-tab]');
  function show(name) {
    tabs.forEach(t => t.classList.toggle('is-active', t.dataset.tab === name));
    document.querySelectorAll('[data-panel]').forEach(p => p.hidden = p.dataset.panel !== name);
  }
  tabs.forEach(t => t.addEventListener('click', () => { show(t.dataset.tab); history.replaceState(null, '', '#' + t.dataset.tab); }));
  const initial = location.hash.slice(1);
  if (['listings', 'saved', 'orders', 'details'].includes(initial)) show(initial);

  // listing actions
  $('myListings').addEventListener('click', async e => {
    const b = e.target.closest('[data-act]');
    if (b) {
      e.stopPropagation();
      const l = listings.find(x => x.id === b.dataset.id);
      try {
        if (b.dataset.act === 'delete') {
          if (!confirm('Delete "' + l.title + '"?')) return;
          await SM.deleteListing(l.id); listings = listings.filter(x => x.id !== l.id); UI.toast('Listing deleted');
        } else {
          await SM.updateListing(l.id, { status: b.dataset.act }); l.status = b.dataset.act;
          UI.toast(b.dataset.act === 'sold' ? 'Nice one — marked as sold' : b.dataset.act === 'archived' ? 'Hidden from the marketplace' : 'Back on the board');
        }
        render();
      } catch (err) { UI.toast(err.message, 'error'); }
      return;
    }
    const card = e.target.closest('.card');
    if (card) location.href = 'marketplace.html?item=' + encodeURIComponent(card.dataset.id);
  });
  $('savedGrid').addEventListener('click', async e => {
    const s = e.target.closest('[data-save]');
    if (s) { e.stopPropagation(); try { await SM.toggleSaved(s.dataset.save); saved.delete(s.dataset.save); render(); UI.toast('Removed from saved'); } catch (err) { UI.toast(err.message, 'error'); } return; }
    const card = e.target.closest('.card');
    if (card) location.href = 'marketplace.html?item=' + encodeURIComponent(card.dataset.id);
  });

  // details form
  const form = $('profileForm');
  ['full_name', 'campus', 'course', 'year_of_study', 'bio'].forEach(k => { if (form[k]) form[k].value = profile[k] || ''; });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('profileMsg');
    const patch = Object.fromEntries(new FormData(form).entries());
    patch.full_name = String(patch.full_name || '').trim();
    if (patch.full_name.length < 2) { msg.className = 'form-msg is-error'; msg.textContent = 'Your name needs at least 2 characters.'; return; }
    const btn = form.querySelector('[type=submit]'); UI.busy(btn, true, 'Saving…');
    try { profile = Object.assign(profile, await SM.updateProfile(patch)); header(); msg.className = 'form-msg is-ok'; msg.textContent = 'Saved.'; UI.toast('Profile updated'); }
    catch (err) { msg.className = 'form-msg is-error'; msg.textContent = err.message; }
    UI.busy(btn, false);
  });

  // avatar
  $('avatarFile').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    UI.toast('Uploading photo…', 'info');
    try { const url = await SM.uploadImage(f); profile = Object.assign(profile, await SM.updateProfile({ avatar_url: url })); header(); UI.toast('Looking good!'); }
    catch (err) { UI.toast(err.message, 'error'); }
  });

  $('signOut').addEventListener('click', async () => { await SM.signOut(); location.href = 'index.html'; });

  header();
  try { await load(); } catch (e) { UI.toast(e.message, 'error'); }
})();
