// Sell: photo upload with preview, live listing card, publish to Supabase.
(async function () {
  await UI.ready;
  const user = await UI.requireUser('Sign in to list an item.');
  const form = document.getElementById('sellForm');
  const msg = document.getElementById('sellMsg');
  const drop = document.getElementById('drop');
  const photo = document.getElementById('photo');
  let file = null, previewUrl = null;

  form.category.innerHTML = '<option value="">Choose…</option>' + SM.CATEGORIES.map(c => '<option>' + UI.esc(c) + '</option>').join('');
  document.getElementById('cond').innerHTML = SM.CONDITIONS.map((c, i) => '<label><input type="radio" name="condition" value="' + UI.esc(c) + '"' + (i === 2 ? ' checked' : '') + '><span>' + UI.esc(c) + '</span></label>').join('');
  if (UI.profile && UI.profile.campus) form.campus.value = UI.profile.campus;

  function values() {
    const f = new FormData(form);
    return {
      title: String(f.get('title') || '').trim(),
      category: String(f.get('category') || ''),
      price: Number(f.get('price')),
      condition: String(f.get('condition') || 'Good'),
      description: String(f.get('description') || '').trim(),
      campus: String(f.get('campus') || '').trim(),
      pickup_spot: String(f.get('pickup_spot') || '').trim(),
      open_to_swap: !!f.get('open_to_swap')
    };
  }
  function preview() {
    const v = values();
    document.getElementById('descCount').textContent = v.description.length;
    document.getElementById('preview').innerHTML = UI.listingCard(Object.assign({}, v, {
      id: 'preview', title: v.title || 'Your item title', category: v.category || 'Other', price: v.price || 0,
      image_url: previewUrl, created_at: new Date().toISOString(), status: 'available'
    }), { noSave: true }).replace('reveal', 'is-in');
    UI.refreshIcons();
  }
  const warn = document.createElement('p');
  warn.className = 'notice notice--warn'; warn.hidden = true;
  form.insertBefore(warn, document.getElementById('sellMsg'));
  function checkRules() {
    const v = values();
    const hit = SM.findProhibited(v.title + ' ' + v.description);
    warn.hidden = !hit;
    if (hit) { warn.innerHTML = UI.icon('octagon-alert') + '<span><b>' + UI.esc(hit.reason) + ' isn\'t allowed.</b> "' + UI.esc(hit.term) + '" can\'t be sold on StudentMarket — alcohol, drugs, vapes, adult items and weapons are blocked for everyone.</span>'; UI.refreshIcons(); }
    return !hit;
  }
  form.addEventListener('input', checkRules);
  if (UI.profile && UI.profile.account_status !== 'active') {
    form.innerHTML = '<div class="empty" style="border:0">' + UI.icon('shield-alert') + '<h3>Listing is paused on your account</h3><p>' + UI.esc(UI.profile.status_reason || 'An admin has restricted your account, so you can\'t list items right now.') + '</p><a class="btn btn--ghost" href="marketplace.html">Back to the marketplace</a></div>';
    UI.refreshIcons();
    return;
  }
  form.addEventListener('input', preview);
  form.addEventListener('change', preview);

  function setFile(f) {
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) { UI.toast('Please choose a JPG, PNG or WebP image.', 'error'); return; }
    file = f;
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(f);
    drop.querySelectorAll('img, .drop__clear').forEach(n => n.remove());
    drop.insertAdjacentHTML('beforeend', '<img src="' + previewUrl + '" alt="Selected photo"><button type="button" class="btn btn--light btn--sm drop__clear">' + UI.icon('x') + 'Remove</button>');
    drop.querySelector('.drop__clear').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); file = null; previewUrl = null; photo.value = ''; drop.querySelectorAll('img, .drop__clear').forEach(n => n.remove()); preview(); });
    UI.refreshIcons(); preview();
  }
  photo.addEventListener('change', () => setFile(photo.files[0]));
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('is-over'); }));
  drop.addEventListener('drop', e => setFile(e.dataTransfer.files[0]));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    msg.className = 'form-msg is-error';
    const v = values();
    if (v.title.length < 2) { msg.textContent = 'Give your item a title.'; form.title.focus(); return; }
    if (!v.category) { msg.textContent = 'Choose a category.'; form.category.focus(); return; }
    if (!Number.isFinite(v.price) || v.price < 0) { msg.textContent = 'Enter a price (0 if you\'re giving it away).'; form.price.focus(); return; }
    if (!v.campus) { msg.textContent = 'Which campus is it on?'; form.campus.focus(); return; }
    if (!checkRules()) { msg.textContent = 'This listing includes an item that isn\'t allowed.'; return; }
    msg.textContent = '';
    const btn = form.querySelector('[type=submit]');
    UI.busy(btn, true, file ? 'Uploading photo…' : 'Publishing…');
    try {
      const image_url = file ? await SM.uploadImage(file) : null;
      const listing = await SM.createListing(Object.assign(v, { image_url }));
      if (UI.profile && !UI.profile.campus && v.campus) SM.updateProfile({ campus: v.campus }).catch(() => {});
      UI.toast('Your listing is live!');
      setTimeout(() => { location.href = 'marketplace.html?item=' + encodeURIComponent(listing.id); }, 500);
    } catch (err) {
      msg.textContent = err.message;
      UI.busy(btn, false);
    }
  });

  preview();
  void user;
})();
