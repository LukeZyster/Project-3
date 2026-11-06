// Campus store: products from Supabase (merch_items) with a local fallback.
(async function () {
  await UI.ready;
  const { esc, money, icon } = UI;
  let items = [], cat = 'All';
  const grid = document.getElementById('merchGrid');

  function render() {
    const list = items.filter(i => cat === 'All' || i.category === cat);
    grid.innerHTML = list.map(i =>
      '<article class="product reveal">' +
        '<div class="product__media"><img src="' + esc(i.image_url) + '" alt="' + esc(i.name) + '" loading="lazy"><span class="product__cat">' + esc(i.category) + '</span></div>' +
        '<div class="product__body"><h3>' + esc(i.name) + '</h3><p>' + esc(i.description) + '</p>' +
          (i.sizes && i.sizes.length > 1 ? '<label class="field" style="margin-top:6px"><span class="sr-only">Size</span><select class="input" data-size="' + esc(i.id) + '" style="padding:8px 12px;font-size:13px">' + i.sizes.map(s => '<option>' + esc(s) + '</option>').join('') + '</select></label>' : '') +
          '<div class="product__row"><span class="product__price">' + money(i.price) + '</span><button class="btn btn--primary btn--sm add-btn" data-add="' + esc(i.id) + '">' + icon('plus') + 'Add</button></div>' +
        '</div></article>').join('');
    UI.refreshIcons(); UI.reveal(grid);
  }

  try { items = await SM.merch(); } catch (e) { UI.toast(e.message, 'error'); }
  const cats = ['All'].concat([...new Set(items.map(i => i.category))]);
  const chips = document.getElementById('merchCats');
  chips.innerHTML = cats.map(c => '<button class="chip' + (c === cat ? ' is-active' : '') + '" data-c="' + esc(c) + '">' + esc(c) + '</button>').join('');
  chips.addEventListener('click', e => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    cat = b.dataset.c; chips.querySelectorAll('.chip').forEach(x => x.classList.toggle('is-active', x === b)); render();
  });
  render();

  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    const item = items.find(i => String(i.id) === b.dataset.add);
    const sel = grid.querySelector('[data-size="' + b.dataset.add + '"]');
    const size = sel ? sel.value : '';
    UI.cart.add(Object.assign({}, item, size ? { id: item.id + '-' + size, name: item.name + ' (' + size + ')' } : {}));
    b.classList.add('is-added'); b.innerHTML = icon('check') + 'Added'; UI.refreshIcons();
    UI.toast(item.name + ' added to your cart');
    setTimeout(() => { b.classList.remove('is-added'); b.innerHTML = icon('plus') + 'Add'; UI.refreshIcons(); }, 1400);
  });
})();
