document.getElementById('loginForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const message = document.getElementById('loginMessage');
  message.textContent = '';
  try {
    const response = await fetch(`${NOTIFICATION_API_BASE}/api/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Sign in failed.');
    setCurrentUser(result);
    message.textContent = 'Signed in. Taking you to your profile...';
    window.location.href = 'profile.html';
  } catch (error) {
    message.textContent = error.message || 'Could not connect to StudentMarket. Try again.';
  }
});
