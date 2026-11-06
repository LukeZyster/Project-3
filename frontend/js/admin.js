// Admin control room: reports, listings, users (roles, restrict, ban) and blocked words.
(async function () {
  await UI.ready;
  const meProfile = await UI.requireAdmin();
  const { esc, money, icon, ago } = UI;
  const $ = id => document.getElementById(id);
  let users = [], listings = [], reports = [], terms = [];
  let repFilter = 'open';

  const TITLES = { overview: ['Overview', 'Control room'], reports: ['Reports', 'What students flagged'], listings: ['Listings', 'Everything on the board'], users: ['Users', 'People & permissions'], rules: ['Blocked items', 'What can\'t be sold'] };
  function show(view) {
    document.querySelectorAll('#adminNav [data-view]').forEach(b => b.classList.toggle('is-active', b.dataset.view === view));
    document.querySelectorAll('[data-v]').forEach(p => { p.hidden = p.dataset.v !== view; if (!p.hidden) p.classList.add('tab-panel'); });
    $('viewEyebrow').textContent = TITLES[view][0]; $('viewTitle').textContent = TITLES[view][1];
    history.replaceState(null, '', '#' + view);
  }
  document.getElementById('adminNav').addEventListener('click', e => { const b = e.target.closest('[data-view]'); if (b) show(b.dataset.view); });
  document.addEventListener('click', e => { const j = e.target.closest('[data-jump]'); if (j) show(j.dataset.jump); });

  const flagged = l => SM.findProhibited(l.title + ' ' + (l.description || ''));
  const av = p => '<span class="seller__av" style="width:34px;height:34px;font-size:12px">' + (p && p.avatar_url ? '<img src="' + esc(p.avatar_url) + '" alt="">' : esc(UI.initials(p && p.full_name))) + '</span>';
  const pill = (txt, kind) => '<span class="pill pill--' + kind + '">' + esc(txt) + '</span>';
  const statusPill = s => s === 'banned' ? pill('banned', 'bad') : s === 'restricted' ? pill('restricted', 'warn') : pill('active', 'ok');

  async function load() {
    const [u, l, r, t] = await Promise.all([
      SM.adminUsers().catch(e => { UI.toast(e.message, 'error'); return []; }),
      SM.adminListings().catch(e => { UI.toast(e.message, 'error'); return []; }),
      SM.adminReports().catch(e => { console.warn(e.message); return []; }),
      SM.prohibitedTerms().catch(() => [])
    ]);
    users = u; listings = l; reports = r; terms = t;
    renderAll();
  }

  function renderAll() { renderOverview(); renderReports(); renderListings(); renderUsers(); renderTerms(); UI.refreshIcons(); }

  function renderOverview() {
    const open = reports.filter(r => r.status === 'open');
    const flaggedListings = listings.filter(l => l.status !== 'archived' && flagged(l));
    document.querySelectorAll('[data-open-reports]').forEach(b => { b.textContent = open.length; b.hidden = !open.length; });
    const k = [
      ['users-round', users.length, 'members', 'blue'],
      ['store', listings.filter(l => l.status === 'available').length, 'live listings', 'green'],
      ['flag', open.length, 'open reports', 'pink'],
      ['triangle-alert', flaggedListings.length, 'auto-flagged', 'sun'],
      ['shield-ban', users.filter(x => x.account_status !== 'active').length, 'restricted / banned', 'ink']
    ];
    $('kpis').innerHTML = k.map(x => '<div class="panel admin-kpi admin-kpi--' + x[3] + '"><span>' + icon(x[0]) + '</span><b>' + x[1] + '</b><small>' + x[2] + '</small></div>').join('');
    $('ovReports').innerHTML = open.slice(0, 5).map(r => '<div class="mini-row">' + icon('flag') + '<div><b>' + esc(r.listing ? r.listing.title : 'Removed listing') + '</b><small>' + esc(r.reason) + ' · ' + ago(r.created_at) + '</small></div></div>').join('') || '<p class="muted mini-empty">No open reports. Quiet day.</p>';
    $('ovFlagged').innerHTML = flaggedListings.slice(0, 5).map(l => '<div class="mini-row">' + icon('triangle-alert') + '<div><b>' + esc(l.title) + '</b><small>matches "' + esc(flagged(l).term) + '" · ' + esc(l.seller.full_name) + '</small></div><button class="btn btn--danger btn--sm" data-remove="' + esc(l.id) + '">Remove</button></div>').join('') || '<p class="muted mini-empty">Nothing on the board breaks the rules.</p>';
    $('ovUsers').innerHTML = users.slice(0, 5).map(u => '<div class="mini-row">' + av(u) + '<div><b>' + esc(u.full_name) + (u.role === 'admin' ? ' ' + pill('admin', 'admin') : '') + '</b><small>' + esc(u.email || '@' + (u.username || '')) + '</small></div>' + statusPill(u.account_status) + '</div>').join('') || '<p class="muted mini-empty">No users yet.</p>';
  }

  function renderReports() {
    const list = reports.filter(r => repFilter === 'all' || r.status === repFilter);
    $('reportsList').innerHTML = list.map(r => {
      const l = r.listing;
      return '<article class="panel report">' +
        '<div class="report__thumb">' + (l && l.image_url ? '<img src="' + esc(l.image_url) + '" alt="">' : icon('package')) + '</div>' +
        '<div class="report__body"><div class="report__top"><b>' + esc(l ? l.title : 'Listing already removed') + '</b>' + (l ? '<span class="muted">' + money(l.price) + '</span>' : '') + pill(r.status, r.status === 'open' ? 'warn' : 'muted') + '</div>' +
          '<p>"' + esc(r.reason) + '"</p><small class="muted">Reported by ' + esc(r.reporter ? r.reporter.full_name : 'a student') + ' · ' + ago(r.created_at) + '</small></div>' +
        '<div class="report__acts">' + (l ? '<a class="btn btn--ghost btn--sm" href="marketplace.html?item=' + esc(l.id) + '" target="_blank">' + icon('eye') + 'View</a>' : '') +
          (r.status === 'open' ? (l ? '<button class="btn btn--danger btn--sm" data-remove="' + esc(l.id) + '">' + icon('trash-2') + 'Remove listing</button>' : '') + (l ? '<button class="btn btn--ghost btn--sm" data-user-act="restricted" data-user="' + esc(l.seller_id) + '">' + icon('shield-alert') + 'Restrict seller</button>' : '') + '<button class="btn btn--ghost btn--sm" data-dismiss="' + esc(r.id) + '">Dismiss</button>' : '') +
        '</div></article>';
    }).join('') || '<div class="empty">' + icon('flag') + '<h3>No reports here</h3><p>When students report a listing it lands in this queue.</p></div>';
  }

  function renderListings() {
    const q = ($('lq').value || '').toLowerCase(), f = $('lf').value;
    const list = listings.filter(l => (f === 'all' || (f === 'flagged' ? !!flagged(l) : l.status === f)) && (!q || [l.title, l.category, l.seller.full_name].join(' ').toLowerCase().includes(q)));
    $('listingsTable').innerHTML = '<thead><tr><th>Listing</th><th>Seller</th><th>Price</th><th>Status</th><th>Listed</th><th></th></tr></thead><tbody>' + (list.map(l => {
      const hit = flagged(l);
      return '<tr' + (hit ? ' class="is-flagged"' : '') + '><td><div class="cell-item">' + (l.image_url ? '<img src="' + esc(l.image_url) + '" alt="">' : '<span class="cell-ph">' + icon(UI.catIcon(l.category)) + '</span>') + '<div><b>' + esc(l.title) + '</b><small>' + esc(l.category) + (hit ? ' · ' + '<span style="color:var(--accent-2);font-weight:700">matches "' + esc(hit.term) + '"</span>' : '') + '</small></div></div></td>' +
        '<td>' + esc(l.seller.full_name) + '</td><td>' + money(l.price) + '</td><td>' + (l.status === 'available' ? pill('live', 'ok') : l.status === 'sold' ? pill('sold', 'muted') : pill('hidden', 'warn')) + '</td><td class="muted">' + ago(l.created_at) + '</td>' +
        '<td class="cell-acts"><a class="icon-btn" title="View" href="marketplace.html?item=' + esc(l.id) + '" target="_blank">' + icon('eye') + '</a>' + (l.status !== 'archived' ? '<button class="icon-btn" title="Hide from marketplace" data-hide="' + esc(l.id) + '">' + icon('eye-off') + '</button>' : '<button class="icon-btn" title="Put back on the marketplace" data-unhide="' + esc(l.id) + '">' + icon('undo-2') + '</button>') + '<button class="icon-btn icon-btn--bad" title="Remove listing" data-remove="' + esc(l.id) + '">' + icon('trash-2') + '</button></td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted" style="text-align:center;padding:30px">No listings match.</td></tr>') + '</tbody>';
    UI.refreshIcons();
  }

  function renderUsers() {
    const q = ($('uq').value || '').toLowerCase(), f = $('uf').value;
    const list = users.filter(u => (f === 'all' || u.role === f || u.account_status === f) && (!q || [u.full_name, u.email, u.username].join(' ').toLowerCase().includes(q)));
    $('usersTable').innerHTML = '<thead><tr><th>Member</th><th>Role</th><th>Status</th><th>Listings</th><th>Joined</th><th>Actions</th></tr></thead><tbody>' + (list.map(u => {
      const self = u.id === meProfile.id;
      return '<tr><td><div class="cell-item">' + av(u) + '<div><b>' + esc(u.full_name) + (self ? ' (you)' : '') + '</b><small>' + esc(u.email || '@' + (u.username || 'no-email')) + '</small></div></div></td>' +
        '<td>' + (u.role === 'admin' ? pill('admin', 'admin') : pill('student', 'muted')) + '</td><td>' + statusPill(u.account_status) + (u.status_reason ? '<small class="muted" style="display:block;max-width:180px">' + esc(u.status_reason) + '</small>' : '') + '</td><td>' + (u.listings || 0) + '</td><td class="muted">' + (u.created_at ? ago(u.created_at) : '—') + '</td>' +
        '<td class="cell-acts">' + (self ? '<span class="muted" style="font-size:12px">—</span>' :
          (u.role === 'admin' ? '<button class="btn btn--ghost btn--sm" data-role="student" data-user="' + esc(u.id) + '">Remove admin</button>' : '<button class="btn btn--ghost btn--sm" data-role="admin" data-user="' + esc(u.id) + '">' + icon('shield-plus') + 'Make admin</button>') +
          (u.account_status !== 'active' ? '<button class="btn btn--ghost btn--sm" data-user-act="active" data-user="' + esc(u.id) + '">' + icon('rotate-ccw') + 'Reinstate</button>' : '') +
          (u.account_status !== 'restricted' ? '<button class="btn btn--ghost btn--sm" data-user-act="restricted" data-user="' + esc(u.id) + '">' + icon('shield-alert') + 'Restrict</button>' : '') +
          (u.account_status !== 'banned' ? '<button class="btn btn--danger btn--sm" data-user-act="banned" data-user="' + esc(u.id) + '">' + icon('ban') + 'Ban</button>' : '')) + '</td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted" style="text-align:center;padding:30px">No users match.</td></tr>') + '</tbody>';
    UI.refreshIcons();
  }

  function renderTerms() {
    const groups = {};
    terms.forEach(t => { (groups[t.reason] = groups[t.reason] || []).push(t.term); });
    $('terms').innerHTML = Object.keys(groups).sort().map(g => '<div class="term-group"><h4>' + esc(g) + '</h4><div class="chips" style="flex-wrap:wrap">' + groups[g].sort().map(t => '<span class="chip term">' + esc(t) + '<button data-term="' + esc(t) + '" aria-label="Unblock ' + esc(t) + '">' + icon('x') + '</button></span>').join('') + '</div></div>').join('') || '<p class="muted">No blocked words.</p>';
    UI.refreshIcons();
  }

  // confirm dialog with a reason box
  function askReason(title, text, cta, danger, defaultReason) {
    return new Promise(resolve => {
      const p = UI.openModal('<form class="profile-form" style="padding:30px" id="askForm"><span class="eyebrow">Admin action</span><h2 style="font-size:26px">' + esc(title) + '</h2><p class="muted">' + esc(text) + '</p><label class="field"><span>Reason (the user will see this)</span><textarea name="reason" maxlength="300">' + esc(defaultReason || '') + '</textarea></label><div style="display:flex;gap:8px"><button class="btn ' + (danger ? 'btn--accent' : 'btn--primary') + '" type="submit">' + esc(cta) + '</button><button class="btn btn--ghost" type="button" data-close>Cancel</button></div></form>');
      let done = false;
      UI.onModalClose = () => { if (!done) resolve(null); };
      p.querySelector('#askForm').addEventListener('submit', e => { e.preventDefault(); done = true; const v = e.target.reason.value.trim(); UI.closeModal(); resolve(v); });
    });
  }

  document.querySelector('.admin__main').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t) return;
    try {
      if (t.dataset.remove) {
        const l = listings.find(x => x.id === t.dataset.remove);
        const hit = l && flagged(l);
        const reason = await askReason('Remove "' + (l ? l.title : 'listing') + '"?', 'It will be deleted for everyone and any open reports on it are closed.', 'Remove listing', true, hit ? hit.reason + ' isn\'t allowed on StudentMarket.' : 'Breaks the StudentMarket community rules.');
        if (reason === null) return;
        await SM.adminRemoveListing(t.dataset.remove, reason);
        listings = listings.filter(x => x.id !== t.dataset.remove);
        reports.forEach(r => { if (r.listing && r.listing.id === t.dataset.remove) { r.status = 'resolved'; r.listing = null; } });
        UI.toast('Listing removed');
      } else if (t.dataset.hide || t.dataset.unhide) {
        const id = t.dataset.hide || t.dataset.unhide;
        await SM.updateListing(id, { status: t.dataset.hide ? 'archived' : 'available' });
        listings.find(x => x.id === id).status = t.dataset.hide ? 'archived' : 'available';
        UI.toast(t.dataset.hide ? 'Hidden from the marketplace' : 'Back on the marketplace');
      } else if (t.dataset.role) {
        const u = users.find(x => x.id === t.dataset.user);
        if (!confirm(t.dataset.role === 'admin' ? 'Give ' + u.full_name + ' admin access? They\'ll be able to ban users and add other admins.' : 'Remove admin access from ' + u.full_name + '?')) return;
        await SM.adminSetRole(u.id, t.dataset.role); u.role = t.dataset.role;
        UI.toast(t.dataset.role === 'admin' ? u.full_name + ' is now an admin' : u.full_name + ' is now a student account');
      } else if (t.dataset.userAct) {
        const u = users.find(x => x.id === t.dataset.user) || { id: t.dataset.user, full_name: 'this seller' };
        const s = t.dataset.userAct;
        const copy = {
          active: ['Reinstate ' + u.full_name + '?', 'They can list, message and shop again.', 'Reinstate', false, ''],
          restricted: ['Restrict ' + u.full_name + '?', 'They can still browse, chat and shop, but can\'t list items.', 'Restrict account', false, 'Listing items that break the StudentMarket rules.'],
          banned: ['Ban ' + u.full_name + '?', 'They lose access to StudentMarket and all their live listings are hidden.', 'Ban user', true, 'Serious or repeated breaking of the StudentMarket rules.']
        }[s];
        const reason = await askReason.apply(null, copy);
        if (reason === null) return;
        await SM.adminSetStatus(u.id, s, reason);
        if (u.account_status !== undefined) { u.account_status = s; u.status_reason = reason; }
        if (s === 'banned') listings.forEach(l => { if (l.seller_id === u.id && l.status === 'available') l.status = 'archived'; });
        UI.toast(s === 'active' ? 'Account reinstated' : s === 'restricted' ? 'Account restricted' : 'User banned');
      } else if (t.dataset.dismiss) {
        await SM.adminResolveReport(t.dataset.dismiss, 'dismissed');
        reports.find(r => r.id === t.dataset.dismiss).status = 'dismissed';
        UI.toast('Report dismissed');
      } else if (t.dataset.term) {
        await SM.removeProhibitedTerm(t.dataset.term); terms = terms.filter(x => x.term !== t.dataset.term); UI.toast('"' + t.dataset.term + '" unblocked');
      } else if (t.dataset.f) {
        repFilter = t.dataset.f; document.querySelectorAll('#repFilter .chip').forEach(c => c.classList.toggle('is-active', c === t));
      } else return;
      renderAll();
    } catch (err) { UI.toast(err.message, 'error'); }
  });

  $('lq').addEventListener('input', renderListings); $('lf').addEventListener('change', renderListings);
  $('uq').addEventListener('input', renderUsers); $('uf').addEventListener('change', renderUsers);
  $('termForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, term = f.term.value.trim().toLowerCase(), reason = f.reason.value.trim() || 'Not allowed on StudentMarket';
    if (term.length < 2) return;
    try { await SM.addProhibitedTerm(term, reason); terms = terms.filter(x => x.term !== term).concat([{ term, reason }]); f.reset(); renderAll(); UI.toast('"' + term + '" is now blocked'); }
    catch (err) { UI.toast(err.message, 'error'); }
  });

  const initial = location.hash.slice(1);
  show(TITLES[initial] ? initial : 'overview');
  $('viewTitle').textContent = initial && TITLES[initial] ? TITLES[initial][1] : 'Hi ' + (meProfile.full_name || 'admin').split(' ')[0] + '.';
  await load();
})();
