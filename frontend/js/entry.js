document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch(`${NOTIFICATION_API_BASE}/api/auth/me`, { credentials: 'include' });
    if (response.ok) {
      setCurrentUser(await response.json());
      window.location.replace('marketplace.html');
      return;
    }
  } catch (error) {
    // Continue to sign-in when the backend cannot verify an active session.
  }

  localStorage.removeItem('studentMarketUser');
  window.location.replace('login.html');
});