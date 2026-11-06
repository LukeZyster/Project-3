document.getElementById('registerForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const message = document.getElementById('registerMessage');
  message.textContent = '';
  try {
    const response = await fetch(`${NOTIFICATION_API_BASE}/api/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Account creation failed.');
    setCurrentUser(result);
    message.textContent = 'Account created. Taking you to your profile...';
    window.location.href = 'profile.html';
  } catch (error) {
    message.textContent = error.message || 'Could not connect to StudentMarket. Try again.';
  }
});
