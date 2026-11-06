// Shared UI: navigation, footer, toasts, icons, scroll reveals, cart and small helpers.
(function () {
  const page = (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';

  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => 'R' + Number(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const ago = iso => {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    if (s < 604800) return Math.floor(s / 86400) + 'd ago';
    return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  };
  const initials = name => String(name || 'S').trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  const CAT_ICON = { 'Books': 'book-open', 'Textbooks': 'book-open', 'Electronics': 'laptop', 'Tech': 'laptop', 'Res essentials': 'lamp-desk', 'Furniture': 'armchair', 'Clothing': 'shirt', 'Other': 'package' };
  const catIcon = c => CAT_ICON[c] || 'package';
  const icon = (name, cls) => '<i data-lucide="' + name + '"' + (cls ? ' class="' + cls + '"' : '') + '></i>';
  const refreshIcons = () => { if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.8 } }); };

  // ---------- cart (kept on this device) ----------
  const CART_KEY = 'sm_cart';
  const cart = {
    get() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; } },
    set(items) { localStorage.setItem(CART_KEY, JSON.stringify(items)); updateBadges(); },
    add(item) { const c = cart.get(); const e = c.find(x => x.id === item.id); if (e) e.quantity += 1; else c.push({ id: item.id, name: item.name, price: Number(item.price), image_url: item.image_url, quantity: 1 }); cart.set(c); },
    count() { return cart.get().reduce((s, x) => s + x.quantity, 0); }
  };

  // ---------- toast ----------
  function toast(message, type) {
    let wrap = document.getElementById('toasts');
    if (!wrap) { wrap = document.createElement('div'); wrap.id = 'toasts'; wrap.setAttribute('aria-live', 'polite'); document.body.appendChild(wrap); }
    const t = document.createElement('div');
    t.className = 'toast toast--' + (type || 'ok');
    t.innerHTML = icon(type === 'error' ? 'circle-alert' : type === 'info' ? 'info' : 'circle-check') + '<span>' + esc(message) + '</span>';
    wrap.appendChild(t); refreshIcons();
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 400); }, type === 'error' ? 5200 : 3200);
  }

  function busy(btn, on, label) {
    if (!btn) return;
    if (on) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.classList.add('is-busy'); btn.innerHTML = '<span class="spinner"></span>' + esc(label || 'Working…'); }
    else { btn.disabled = false; btn.classList.remove('is-busy'); if (btn.dataset.label) btn.innerHTML = btn.dataset.label; refreshIcons(); }
  }

  // ---------- modal ----------
  function openModal(html, opts) {
    closeModal();
    const m = document.createElement('div');
    m.className = 'modal'; m.id = 'modal';
    m.innerHTML = '<div class="modal__backdrop" data-close></div><div class="modal__panel ' + ((opts && opts.wide) ? 'modal__panel--wide' : '') + '" role="dialog" aria-modal="true"><button class="modal__x" data-close aria-label="Close">' + icon('x') + '</button>' + html + '</div>';
    document.body.appendChild(m); document.body.classList.add('no-scroll');
    m.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModal(); });
    refreshIcons();
    requestAnimationFrame(() => m.classList.add('open'));
    return m.querySelector('.modal__panel');
  }
  function closeModal() {
    const m = document.getElementById('modal'); if (!m) return;
    m.classList.remove('open'); document.body.classList.remove('no-scroll');
    setTimeout(() => m.remove(), 250);
    if (UI.onModalClose) { const f = UI.onModalClose; UI.onModalClose = null; f(); }
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // ---------- listing card (shared by marketplace, home and profile) ----------
  function listingCard(l, opts) {
    opts = opts || {};
    const saved = opts.saved && opts.saved.has(l.id);
    const status = l.status && l.status !== 'available' ? '<span class="stamp stamp--' + esc(l.status) + '">' + (l.status === 'archived' ? 'hidden' : esc(l.status)) + '</span>' : '';
    const media = l.image_url
      ? '<img src="' + esc(l.image_url) + '" alt="' + esc(l.title) + '" loading="lazy">'
      : '<div class="card__ph card__ph--' + esc(String(l.category).toLowerCase().replace(/\s+/g, '-')) + '">' + icon(catIcon(l.category)) + '<span>' + esc(l.category) + '</span></div>';
    return '<article class="card reveal" data-id="' + esc(l.id) + '" tabindex="0">' +
      '<div class="card__media">' + media + status +
        (opts.noSave ? '' : '<button class="card__save ' + (saved ? 'is-saved' : '') + '" data-save="' + esc(l.id) + '" aria-label="' + (saved ? 'Remove from saved' : 'Save') + '" aria-pressed="' + !!saved + '">' + icon('heart') + '</button>') +
        '<span class="tag-price">' + money(l.price) + '</span>' +
      '</div>' +
      '<div class="card__body">' +
        '<p class="card__meta">' + icon(catIcon(l.category)) + esc(l.category) + ' · ' + esc(l.condition) + (l.open_to_swap ? ' · <b class="swap">swap ok</b>' : '') + '</p>' +
        '<h3 class="card__title">' + esc(l.title) + '</h3>' +
        '<p class="card__foot"><span>' + icon('map-pin') + esc(l.campus || 'Campus') + '</span><span>' + ago(l.created_at) + '</span></p>' +
        (opts.actions || '') +
      '</div></article>';
  }

  // ---------- scroll reveals ----------
  let io;
  function reveal(root) {
    const els = (root || document).querySelectorAll('.reveal:not(.is-in)');
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach(e => e.classList.add('is-in')); return; }
    io = io || new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach((e, i) => { e.style.setProperty('--d', (i % 8) * 55 + 'ms'); io.observe(e); });
  }

  // ---------- nav ----------
  const NAV = [
    { href: 'marketplace.html', key: 'marketplace', label: 'Marketplace', ic: 'store' },
    { href: 'merch.html', key: 'merch', label: 'Campus store', ic: 'shirt' },
    { href: 'chat.html', key: 'chat', label: 'Messages', ic: 'message-circle', badge: 'msg' }
  ];
  function renderNav(user, profile) {
    const isAdmin = !!(profile && profile.role === 'admin');
    const header = document.getElementById('siteNav');
    if (header) {
      header.className = 'nav';
      header.innerHTML =
        '<div class="nav__inner">' +
          '<a class="logo" href="index.html" aria-label="StudentMarket home"><span class="logo__mark">S<i></i></span><span class="logo__word">Student<b>Market</b></span></a>' +
          '<nav class="nav__links" aria-label="Primary">' + NAV.map(n => '<a href="' + n.href + '" class="' + (page === n.key ? 'is-active' : '') + '">' + esc(n.label) + (n.badge ? '<span class="dot-badge" data-badge="' + n.badge + '" hidden></span>' : '') + '</a>').join('') + (isAdmin ? '<a href="admin.html" class="nav__admin' + (page === 'admin' ? ' is-active' : '') + '">' + icon('shield-check') + 'Admin</a>' : '') + '</nav>' +
          '<div class="nav__actions">' +
            '<a class="icon-btn" href="notification.html" aria-label="Notifications">' + icon('bell') + '<span class="count-badge" data-badge="notes" hidden></span></a>' +
            '<a class="icon-btn" href="cart.html" aria-label="Cart">' + icon('shopping-bag') + '<span class="count-badge" data-badge="cart" hidden></span></a>' +
            (user
              ? '<a class="avatar-btn" href="profile.html" aria-label="Your account" title="' + esc(profile && profile.full_name) + '">' + (profile && profile.avatar_url ? '<img src="' + esc(profile.avatar_url) + '" alt="">' : esc(initials(profile && profile.full_name))) + '</a>'
              : '<a class="btn btn--ghost btn--sm nav__signin" href="login.html">Sign in</a>') +
            '<a class="btn btn--accent btn--sm nav__sell" href="sell.html">' + icon('plus') + '<span>Sell</span></a>' +
          '</div>' +
        '</div>';
      const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
      onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    }

    if (!document.querySelector('.tabbar') && !document.body.hasAttribute('data-no-tabbar')) {
      const tb = document.createElement('nav');
      tb.className = 'tabbar'; tb.setAttribute('aria-label', 'Mobile');
      const T = [isAdmin ? ['admin.html', 'admin', 'shield-check', 'Admin'] : ['index.html', 'index', 'house', 'Home'], ['marketplace.html', 'marketplace', 'store', 'Browse'], ['sell.html', 'sell', 'plus', 'Sell'], ['chat.html', 'chat', 'message-circle', 'Chats'], [user ? 'profile.html' : 'login.html', user ? 'profile' : 'login', 'user-round', user ? 'Me' : 'Sign in']];
      tb.innerHTML = T.map(t => '<a href="' + t[0] + '" class="' + (page === t[1] ? 'is-active ' : '') + (t[1] === 'sell' ? 'tabbar__sell' : '') + '">' + icon(t[2]) + '<span>' + t[3] + '</span>' + (t[1] === 'chat' ? '<span class="dot-badge" data-badge="msg" hidden></span>' : '') + '</a>').join('');
      document.body.appendChild(tb);
    }

    const footer = document.getElementById('siteFooter');
    if (footer) {
      footer.className = 'footer';
      footer.innerHTML =
        '<div class="footer__inner">' +
          '<div class="footer__brand"><a class="logo" href="index.html"><span class="logo__mark">S<i></i></span><span class="logo__word">Student<b>Market</b></span></a><p>Made on campus, for campus. Buy it from someone in your lecture, sell it to someone in your res.</p></div>' +
          '<div><h4>Shop</h4><a href="marketplace.html">Marketplace</a><a href="merch.html">Campus store</a><a href="sell.html">Sell an item</a></div>' +
          '<div><h4>You</h4><a href="profile.html">Account</a><a href="chat.html">Messages</a><a href="notification.html">Notifications</a></div>' +
          '<div><h4>Meet safely</h4><p class="footer__tip">' + icon('shield-check') + 'Meet in busy spots like the library entrance or student centre, and check the item before you pay.</p></div>' +
        '</div>' +
        '<div class="footer__base"><span>© ' + new Date().getFullYear() + ' StudentMarket</span><span>' + (SM.mode === 'demo' ? 'Demo mode · data stays in this browser' : 'Live · powered by Supabase') + '</span></div>';
    }
    refreshIcons();
  }

  async function updateBadges() {
    const c = cart.count();
    document.querySelectorAll('[data-badge="cart"]').forEach(b => { b.textContent = c; b.hidden = !c; });
    try {
      const user = await SM.currentUser();
      if (!user) { document.querySelectorAll('[data-badge="notes"],[data-badge="msg"]').forEach(b => b.hidden = true); return; }
      const [notes, msgs] = await Promise.all([SM.notifications(), SM.messages()]);
      const unreadNotes = notes.filter(n => !n.is_read).length;
      const unreadMsgs = msgs.filter(m => m.recipient_id === user.id && !m.read_at).length;
      document.querySelectorAll('[data-badge="notes"]').forEach(b => { b.textContent = unreadNotes > 9 ? '9+' : unreadNotes; b.hidden = !unreadNotes; });
      document.querySelectorAll('[data-badge="msg"]').forEach(b => { b.hidden = !unreadMsgs; });
    } catch (e) { console.warn('Badges unavailable:', e.message); }
  }

  function demoBanner() {
    if (SM.mode !== 'demo' || sessionStorage.getItem('sm_demo_dismissed')) return;
    const b = document.createElement('div');
    b.className = 'demo-bar';
    b.innerHTML = icon('flask-conical') + '<span><b>Demo mode.</b> Everything works, but data is saved in this browser only. Add your Supabase keys in <code>js/config.js</code> to go live.</span><button aria-label="Dismiss">' + icon('x') + '</button>';
    b.querySelector('button').onclick = () => { sessionStorage.setItem('sm_demo_dismissed', '1'); b.remove(); };
    document.body.prepend(b);
  }

  function accountGate(profile) {
    if (!profile) return;
    if (profile.account_status === 'banned' && !['index', 'login', 'register'].includes(page)) {
      const o = document.createElement('div');
      o.className = 'gate';
      o.innerHTML = '<div class="gate__card"><span class="gate__ic">' + icon('ban') + '</span><h2>This account has been banned.</h2><p>' + esc(profile.status_reason || 'A StudentMarket admin has banned this account for breaking the community rules.') + '</p><p class="muted" style="font-size:13px">If you think this is a mistake, speak to the campus Student Affairs office.</p><button class="btn btn--primary" id="gateOut">' + icon('log-out') + 'Sign out</button></div>';
      document.body.appendChild(o); document.body.classList.add('no-scroll');
      o.querySelector('#gateOut').onclick = async () => { await SM.signOut(); location.href = 'index.html'; };
    } else if (profile.account_status === 'restricted') {
      const b = document.createElement('div');
      b.className = 'demo-bar demo-bar--warn';
      b.innerHTML = icon('shield-alert') + '<span><b>Your account is restricted.</b> You can browse, chat and shop, but you can\'t list items right now.' + (profile.status_reason ? ' Reason: ' + esc(profile.status_reason) : '') + '</span>';
      document.body.prepend(b);
    }
  }

  async function requireAdmin() {
    await requireUser('Admins only — please sign in.');
    if (!UI.profile || UI.profile.role !== 'admin' || UI.profile.account_status !== 'active') { location.replace('index.html'); return new Promise(() => {}); }
    return UI.profile;
  }

  async function requireUser(message) {
    const u = await SM.currentUser();
    if (!u) {
      location.href = 'login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search) + (message ? '&why=' + encodeURIComponent(message) : '');
      return new Promise(() => {});
    }
    return u;
  }

  const UI = { page, esc, money, ago, initials, icon, catIcon, refreshIcons, toast, busy, openModal, closeModal, listingCard, reveal, cart, updateBadges, requireUser, requireAdmin, ready: null };

  UI.ready = (async () => {
    let user = null, profile = null;
    await SM.ready;
    try { user = await SM.currentUser(); if (user) profile = await SM.getProfile(); }
    catch (e) { console.warn(e); }
    UI.user = user; UI.profile = profile;
    if (document.readyState === 'loading') await new Promise(r => document.addEventListener('DOMContentLoaded', r));
    demoBanner();
    renderNav(user, profile);
    accountGate(profile);
    reveal();
    updateBadges();
    SM.subscribe(() => updateBadges());
    document.body.classList.add('is-ready');
    return { user, profile };
  })();

  window.UI = UI;
})();
