// Sign-in page.
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
  if (UI.user) { location.replace(UI.profile && UI.profile.role === 'admin' ? 'admin.html' : nextUrl()); return; }
  wirePasswordToggles();
  const params = new URLSearchParams(location.search);
  const why = document.getElementById('why');
  if (params.get('why')) { why.textContent = params.get('why'); why.hidden = false; }
  if (params.get('next')) document.getElementById('toRegister').href = 'register.html?next=' + encodeURIComponent(params.get('next'));
  const form = document.getElementById('loginForm');
  const msg = document.getElementById('msg');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    msg.className = 'form-msg is-error';
    if (!form.email.value.trim() || !form.email.checkValidity()) { msg.textContent = 'Enter a valid email address.'; form.email.focus(); return; }
    if (!SM.EMAIL_RE.test(form.email.value.trim())) { msg.textContent = SM.EMAIL_ERROR; form.email.focus(); return; }
    if (!form.password.value) { msg.textContent = 'Enter your password.'; form.password.focus(); return; }
    msg.textContent = '';
    const btn = form.querySelector('[type=submit]');
    UI.busy(btn, true, 'Signing in…');
    try {
      await SM.signIn({ email: form.email.value.trim(), password: form.password.value });
      msg.className = 'form-msg is-ok'; msg.textContent = 'Signed in. One sec…';
      const p = await SM.getProfile().catch(() => null);
      const hasNext = new URLSearchParams(location.search).get('next');
      location.href = (!hasNext && p && p.role === 'admin') ? 'admin.html' : nextUrl();
    } catch (err) { msg.textContent = err.message; UI.busy(btn, false); }
  });
})();
