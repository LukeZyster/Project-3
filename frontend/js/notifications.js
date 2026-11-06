// Notifications: created by database triggers (messages, saves, orders).
(async function () {
  await UI.ready;
  await UI.requireUser('Sign in to see your notifications.');
  const { esc, icon, ago } = UI;
  const ICON = { message: 'message-circle', saved: 'heart', order: 'shopping-bag', info: 'bell' };
  let notes = [], filter = 'all';
  const box = document.getElementById('notes');

  function render() {
    const list = notes.filter(n => filter === 'all' || (filter === 'unread' ? !n.is_read : n.kind === filter));
    const unread = notes.filter(n => !n.is_read).length;
    document.getElementById('noteSummary').textContent = unread ? unread + ' unread · messages, saves on your listings and store orders.' : 'You\'re all caught up.';
    box.innerHTML = list.length ? list.map(n =>
      '<article class="note reveal' + (n.is_read ? '' : ' is-unread') + '" data-id="' + esc(n.id) + '">' +
        '<span class="note__ic note__ic--' + esc(n.kind) + '">' + icon(ICON[n.kind] || 'bell') + '</span>' +
        '<div class="note__body"><b>' + esc(n.title) + '</b><p>' + esc(n.body) + '</p><time>' + ago(n.created_at) + '</time>' +
          (n.link ? ' · <a class="link-arrow" style="font-size:12.5px" href="' + esc(n.link) + '" data-open>Open ' + icon('arrow-right') + '</a>' : '') + '</div>' +
        '<div class="note__acts"><button class="icon-btn" data-toggle aria-label="' + (n.is_read ? 'Mark unread' : 'Mark read') + '" title="' + (n.is_read ? 'Mark unread' : 'Mark read') + '">' + icon(n.is_read ? 'mail' : 'mail-open') + '</button><button class="icon-btn" data-del aria-label="Delete" title="Delete">' + icon('x') + '</button></div>' +
      '</article>').join('')
      : '<div class="empty">' + icon('bell-off') + '<h3>' + (notes.length ? 'Nothing in this filter' : 'No notifications yet') + '</h3><p>When someone messages you or saves your listing, it shows up here.</p></div>';
    UI.refreshIcons(); UI.reveal(box);
  }
  async function load() { notes = await SM.notifications(); render(); }

  document.getElementById('noteFilters').addEventListener('click', e => {
    const c = e.target.closest('[data-f]'); if (!c) return;
    filter = c.dataset.f;
    document.querySelectorAll('#noteFilters .chip').forEach(x => x.classList.toggle('is-active', x === c));
    render();
  });
  box.addEventListener('click', async e => {
    const card = e.target.closest('.note'); if (!card) return;
    const n = notes.find(x => x.id === card.dataset.id);
    try {
      if (e.target.closest('[data-del]')) {
        card.classList.add('is-leaving');
        await SM.deleteNotification(n.id); notes = notes.filter(x => x !== n);
        setTimeout(render, 250);
      } else if (e.target.closest('[data-toggle]')) {
        await SM.markNotification(n.id, !n.is_read); n.is_read = !n.is_read; render();
      } else if (e.target.closest('[data-open]')) {
        if (!n.is_read) { e.preventDefault(); await SM.markNotification(n.id, true); location.href = n.link; }
      }
      UI.updateBadges();
    } catch (err) { UI.toast(err.message, 'error'); }
  });
  document.getElementById('readAll').addEventListener('click', async () => {
    try { await SM.markAllNotificationsRead(); notes.forEach(n => n.is_read = true); render(); UI.updateBadges(); UI.toast('All caught up'); }
    catch (err) { UI.toast(err.message, 'error'); }
  });
  document.getElementById('clearAll').addEventListener('click', async () => {
    if (!notes.length || !confirm('Clear all notifications?')) return;
    try { await SM.clearNotifications(); notes = []; render(); UI.updateBadges(); }
    catch (err) { UI.toast(err.message, 'error'); }
  });

  try { await load(); } catch (e) { UI.toast(e.message, 'error'); box.innerHTML = ''; }
  SM.subscribe(() => load().catch(() => {}));
})();
