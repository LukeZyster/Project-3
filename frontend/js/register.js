// Registration page.
function wirePasswordToggles() {
  document.querySelectorAll('[data-pw]').forEach(btn => btn.addEventListener('click', () => {
    const input = btn.previousElementSibling;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.innerHTML = UI.icon(show ? 'eye-off' : 'eye');
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    UI.refreshIcons();
  }));
}
function nextUrl() {
  const n = new URLSearchParams(location.search).get('next');
  return n && /^[a-z-]+\.html/.test(n) ? n : 'profile.html';
}

(async function () {
  await UI.ready;
  if (UI.user) { location.replace(nextUrl()); return; }
  wirePasswordToggles();
  const next = new URLSearchParams(location.search).get('next');
  if (next) document.getElementById('toLogin').href = 'login.html?next=' + encodeURIComponent(next);
  const form = document.getElementById('registerForm');
  const msg = document.getElementById('msg');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    msg.className = 'form-msg is-error';
    const name = form.name.value.trim(), email = form.email.value.trim(), password = form.password.value;
    if (name.length < 2) { msg.textContent = 'Tell us your name.'; form.name.focus(); return; }
    if (!email || !form.email.checkValidity()) { msg.textContent = 'Enter a valid email address.'; form.email.focus(); return; }
    if (!SM.EMAIL_RE.test(email)) { msg.textContent = SM.EMAIL_ERROR; form.email.focus(); return; }
    if (password.length < 6) { msg.textContent = 'Use at least 6 characters for your password.'; form.password.focus(); return; }
    msg.textContent = '';
    const btn = form.querySelector('[type=submit]');
    UI.busy(btn, true, 'Creating account…');
    try {
      const res = await SM.signUp({ name, email, password, campus: form.campus.value.trim() });
      if (res.needsConfirmation) {
        try { await SM.signIn({ email, password }); }
        catch (e) { UI.toast('Account created. Please sign in.'); setTimeout(() => { location.href = 'login.html'; }, 800); return; }
      }
      UI.toast('Welcome to StudentMarket, ' + name.split(' ')[0] + '!');
      location.href = SM.isStaffEmail(email) ? 'admin.html' : nextUrl();
    } catch (err) { msg.textContent = err.message; UI.busy(btn, false); }
  });
})();
