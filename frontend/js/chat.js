// Chat: threads grouped by the other student, live updates via Supabase Realtime.
(async function () {
  await UI.ready;
  const me = await UI.requireUser('Sign in to see your messages.');
  const { esc, icon, ago } = UI;
  const params = new URLSearchParams(location.search);
  let messages = [];
  let active = params.get('with');
  let activeListing = params.get('listing');
  let otherProfile = null;
  const profileCache = {};

  const otherOf = m => m.sender_id === me.id ? m.recipient : m.sender;
  const otherIdOf = m => m.sender_id === me.id ? m.recipient_id : m.sender_id;
  const avatar = p => '<span class="seller__av">' + (p && p.avatar_url ? '<img src="' + esc(p.avatar_url) + '" alt="">' : esc(UI.initials(p && p.full_name))) + '</span>';

  function threads() {
    const map = new Map();
    messages.forEach(m => {
      const id = otherIdOf(m);
      const t = map.get(id) || { id, profile: otherOf(m), last: null, unread: 0, listing: null };
      t.last = m; if (m.listing) t.listing = m.listing;
      if (m.recipient_id === me.id && !m.read_at) t.unread++;
      map.set(id, t);
    });
    return [...map.values()].sort((a, b) => String(b.last.created_at).localeCompare(String(a.last.created_at)));
  }

  function renderThreads() {
    const list = threads();
    if (active && !list.some(t => t.id === active)) list.unshift({ id: active, profile: otherProfile, last: null, unread: 0, listing: null });
    document.getElementById('threads').innerHTML = list.length ? list.map(t =>
      '<button class="thread' + (t.id === active ? ' is-active' : '') + (t.unread ? ' is-unread' : '') + '" data-thread="' + esc(t.id) + '">' + avatar(t.profile) +
        '<span class="thread__body"><span class="thread__top"><b>' + esc((t.profile && t.profile.full_name) || 'Student') + '</b><time>' + (t.last ? ago(t.last.created_at) : 'new') + '</time></span>' +
        '<span class="thread__last" style="display:block">' + (t.last ? (t.last.sender_id === me.id ? 'You: ' : '') + esc(t.last.body) : 'Say hi 👋') + '</span>' +
        (t.listing ? '<span class="thread__item">' + esc(t.listing.title) + '</span>' : '') +
      '</span>' + (t.unread ? '<span class="count-badge" style="position:static;border:0">' + t.unread + '</span>' : '') + '</button>'
    ).join('') : '<div class="convo__empty" style="padding:40px 20px">' + icon('inbox') + '<p>No conversations yet.</p></div>';
    UI.refreshIcons();
  }

  async function renderConvo(scroll) {
    const box = document.getElementById('convo');
    document.getElementById('chat').classList.toggle('has-active', !!active);
    if (!active) return;
    const msgs = messages.filter(m => otherIdOf(m) === active);
    const listing = (activeListing && (msgs.find(m => m.listing && m.listing.id === activeListing) || {}).listing) || (msgs.filter(m => m.listing).pop() || {}).listing || (activeListing ? await SM.getListing(activeListing).catch(() => null) : null);
    let lastDay = '';
    const rows = msgs.map(m => {
      const day = new Date(m.created_at).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
      const sep = day !== lastDay ? '<span class="day-sep">' + day + '</span>' : ''; lastDay = day;
      return sep + '<div class="bubble' + (m.sender_id === me.id ? ' me' : '') + '">' + esc(m.body) + '<time>' + new Date(m.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) + (m.sender_id === me.id && m.read_at ? ' · seen' : '') + '</time></div>';
    }).join('');
    const p = otherProfile || {};
    const keepDraft = box.querySelector('#composer input') ? box.querySelector('#composer input').value : '';
    box.innerHTML =
      '<div class="convo__head"><button class="icon-btn back" id="back" aria-label="Back to inbox">' + icon('arrow-left') + '</button>' + avatar(p) + '<div><b>' + esc(p.full_name || 'Student') + '</b><p class="muted" style="font-size:12.5px">' + esc(p.campus || 'Student') + '</p></div>' +
        (listing ? '<a class="convo__listing" href="marketplace.html?item=' + esc(listing.id) + '">' + (listing.image_url ? '<img src="' + esc(listing.image_url) + '" alt="">' : '<span class="mini-ph">' + icon('package') + '</span>') + '<span><b style="display:block;font-size:13px">' + esc(listing.title) + '</b>' + UI.money(listing.price) + '</span></a>' : '') +
      '</div>' +
      '<div class="convo__msgs" id="msgs">' + (rows || '<div class="convo__empty">' + icon('hand') + '<p>Start the conversation — ask if it\'s still available.</p></div>') + '</div>' +
      '<form class="composer" id="composer"><input class="input" name="body" maxlength="1000" autocomplete="off" placeholder="Type a message…" required><button class="btn btn--primary" aria-label="Send">' + icon('send') + '</button></form>';
    UI.refreshIcons();
    const input = box.querySelector('#composer input'); input.value = keepDraft;
    const list = document.getElementById('msgs');
    if (scroll !== false) list.scrollTop = list.scrollHeight;
    if (window.innerWidth > 820) input.focus();
    document.getElementById('back').onclick = () => { active = null; history.replaceState(null, '', 'chat.html'); document.getElementById('chat').classList.remove('has-active'); renderThreads(); };
    box.querySelector('#composer').addEventListener('submit', async e => {
      e.preventDefault();
      const body = input.value.trim(); if (!body) return;
      input.value = '';
      const temp = { id: 'tmp', sender_id: me.id, recipient_id: active, body, created_at: new Date().toISOString(), listing: listing, listing_id: listing && listing.id };
      messages.push(Object.assign({ sender: UI.profile, recipient: otherProfile }, temp));
      renderConvo(); renderThreads();
      try { await SM.sendMessage({ to: active, listingId: listing && listing.id, body }); await refresh(); }
      catch (err) { messages = messages.filter(m => m.id !== 'tmp'); renderConvo(); UI.toast(err.message, 'error'); input.value = body; }
    });
    if (msgs.some(m => m.recipient_id === me.id && !m.read_at)) {
      await SM.markThreadRead(active);
      msgs.forEach(m => { if (m.recipient_id === me.id) m.read_at = m.read_at || new Date().toISOString(); });
      renderThreads(); UI.updateBadges();
    }
  }

  async function select(id) {
    active = id;
    const t = threads().find(x => x.id === id);
    otherProfile = (t && t.profile) || profileCache[id] || (profileCache[id] = await SM.getProfile(id).catch(() => ({ id, full_name: 'Student' })));
    if (!t || !activeListing) activeListing = activeListing || null;
    history.replaceState(null, '', 'chat.html?with=' + encodeURIComponent(id) + (activeListing ? '&listing=' + encodeURIComponent(activeListing) : ''));
    renderThreads(); await renderConvo();
  }

  async function refresh() {
    const before = messages.length;
    messages = await SM.messages();
    renderThreads();
    if (active) await renderConvo(messages.length !== before);
  }

  document.getElementById('threads').addEventListener('click', e => {
    const b = e.target.closest('[data-thread]');
    if (b) { activeListing = null; select(b.dataset.thread); }
  });

  try { messages = await SM.messages(); } catch (e) { UI.toast(e.message, 'error'); }
  if (active && active === me.id) active = null;
  if (active) await select(active); else renderThreads();

  SM.subscribe(() => refresh().catch(() => {}));
  if (SM.mode === 'supabase') setInterval(() => { if (!document.hidden) refresh().catch(() => {}); }, 15000);
})();
