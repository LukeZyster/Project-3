// Cart + checkout. The cart lives on this device; placing an order saves it to Supabase.
(async function () {
  await UI.ready;
  const { esc, money, icon } = UI;
  const root = document.getElementById('cartRoot');

  function render() {
    const items = UI.cart.get();
    if (!items.length) {
      root.innerHTML = '<div class="empty">' + icon('shopping-bag') + '<h3>Your cart is empty</h3><p>Hoodies, mugs and notebooks are waiting in the campus store.</p><a class="btn btn--primary" href="merch.html">Visit the store</a></div>';
      UI.refreshIcons(); return;
    }
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const count = items.reduce((s, i) => s + i.quantity, 0);
    root.innerHTML = '<div class="cart"><div class="panel">' + items.map(i =>
      '<div class="cart-line"><img src="' + esc(i.image_url) + '" alt=""><div class="cart-line__info"><b>' + esc(i.name) + '</b><span class="muted" style="font-size:13px">' + money(i.price) + ' each</span></div>' +
      '<div class="qty"><button data-q="-1" data-id="' + esc(i.id) + '" aria-label="Fewer">' + icon('minus') + '</button><span>' + i.quantity + '</span><button data-q="1" data-id="' + esc(i.id) + '" aria-label="More">' + icon('plus') + '</button></div>' +
      '<b style="min-width:84px;text-align:right">' + money(i.price * i.quantity) + '</b><button class="icon-btn" data-rm="' + esc(i.id) + '" aria-label="Remove">' + icon('trash-2') + '</button></div>').join('') + '</div>' +
      '<aside class="summary panel"><h3 style="font-size:20px">Order summary</h3><div class="summary__row"><span>Items (' + count + ')</span><span>' + money(total) + '</span></div><div class="summary__row"><span>Collection</span><span style="color:var(--ok);font-weight:700">Free</span></div><div class="summary__total"><span>Total</span><span>' + money(total) + '</span></div>' +
      '<button class="btn btn--accent btn--block" id="checkout">' + icon('check') + 'Place order</button><p class="muted" style="font-size:12.5px;text-align:center">Pay by card or cash when you collect.</p></aside></div>';
    UI.refreshIcons();
  }

  root.addEventListener('click', async e => {
    const q = e.target.closest('[data-q]'), rm = e.target.closest('[data-rm]');
    if (q || rm) {
      let items = UI.cart.get();
      const id = (q || rm).dataset.id;
      const it = items.find(i => String(i.id) === id);
      if (rm || (it.quantity + Number(q.dataset.q) < 1)) items = items.filter(i => String(i.id) !== id);
      else it.quantity = Math.min(20, it.quantity + Number(q.dataset.q));
      UI.cart.set(items); render(); return;
    }
    if (e.target.closest('#checkout')) {
      if (!UI.user) { location.href = 'login.html?next=cart.html&why=' + encodeURIComponent('Sign in to place your order.'); return; }
      const btn = e.target.closest('#checkout'); UI.busy(btn, true, 'Placing order…');
      const items = UI.cart.get();
      const total = Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
      try {
        const order = await SM.placeOrder(items, total);
        UI.cart.set([]);
        root.innerHTML = '<div class="panel receipt"><span class="receipt__ic">' + icon('check') + '</span><h2>Order placed!</h2><p class="muted">Order <b>#' + esc(String(order.id).slice(0, 8).toUpperCase()) + '</b> · ' + money(total) + '. Show this number at the campus store counter.</p><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:8px"><a class="btn btn--primary" href="profile.html#orders">View my orders</a><a class="btn btn--ghost" href="marketplace.html">Browse the marketplace</a></div></div>';
        UI.refreshIcons(); UI.updateBadges();
      } catch (err) { UI.toast(err.message, 'error'); UI.busy(btn, false); }
    }
  });
  render();
})();
