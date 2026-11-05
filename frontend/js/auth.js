// Auth and browser-local demo persistence helpers.
const AUTH_KEY = 'studentMarketUser';
const STORAGE_KEYS = {
  profile: 'studentMarketProfile',
  listings: 'studentMarketListings',
  saved: 'studentMarketSavedItems'
};

const NOTIFICATION_API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://localhost:8080'
  : 'https://project-3-iykb.onrender.com';

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  } catch (error) {
    return null;
  }
}

function getStoredProfile() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.profile) || '{}');
  } catch (error) {
    return {};
  }
}

function setStoredProfile(profile) {
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
}

function setCurrentUser(user) {
  const safeUser = {
    id: user && user.id ? user.id : Date.now(),
    name: user && user.name ? user.name : (user && user.email ? user.email.split('@')[0] : 'Student'),
    email: user && user.email ? user.email : '',
    role: user && user.role ? user.role : 'USER',
    ...user
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(safeUser));
  const profile = getStoredProfile();
  setStoredProfile({
    ...profile,
    name: safeUser.name,
    email: safeUser.email,
    accountType: safeUser.role === 'ADMIN' ? 'Administrator' : 'Student account',
    bankHolder: profile.bankHolder || safeUser.name
  });
}

function isLoggedIn() {
  return !!getCurrentUser();
}

function redirectAfterAuth() {
  window.location.href = 'profile.html';
}

function hideSignedOutAuthLinks() {
  const user = getCurrentUser();
  if (!user) return;
  document.querySelectorAll('a[href="login.html"], a[href="register.html"]').forEach(link => {
    link.style.display = 'none';
  });
  document.querySelectorAll('[data-auth-link]').forEach(authLink => {
    authLink.textContent = 'My account';
    authLink.href = 'profile.html';
    authLink.setAttribute('aria-label', 'My account');
  });
}

function redirectAuthenticatedUsersAwayFromAuthPages() {
  if (!getCurrentUser()) return;
  const path = window.location.pathname.split('/').pop() || '';
  if (path === 'login.html' || path === 'register.html') window.location.replace('profile.html');
}

function addNotificationsLink() {
  const existingLinks = [...document.querySelectorAll('a[href="notification.html"], a[data-notifications-link]')];
  const siteNav = document.querySelector('.site-links');
  const appHeader = document.querySelector('.app-header');
  let link = existingLinks.find(item => siteNav && siteNav.contains(item)) || existingLinks[0];
  existingLinks.forEach(item => { if (item !== link) item.remove(); });

  if (!link) {
    const parent = siteNav || appHeader;
    if (parent) {
      link = document.createElement('a');
      link.href = 'notification.html';
      link.dataset.notificationsLink = '';
      if (siteNav) link.textContent = 'Notifications';
      else {
        link.className = 'icon-btn notification-link';
        link.setAttribute('aria-label', 'Notifications');
        link.textContent = '🔔';
      }
      parent.append(link);
    }
  }

  if (link && !link.querySelector('[data-notification-count]')) {
    const badge = document.createElement('span');
    badge.className = 'notification-count';
    badge.dataset.notificationCount = '';
    badge.hidden = true;
    link.append(badge);
  }

  const user = getCurrentUser();
  document.querySelectorAll('[data-auth-link]').forEach(authLink => {
    authLink.textContent = user ? 'My account' : 'Sign in';
    authLink.href = user ? 'profile.html' : 'login.html';
  });

  const badge = link && link.querySelector('[data-notification-count]');
  if (!badge) return;
  fetch(`${NOTIFICATION_API_BASE}/api/notifications/unread-count`, {
    headers: { 'X-User-Id': String(user && user.id ? user.id : 1) }
  })
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(result => {
      if (result.unread > 0) {
        badge.textContent = result.unread > 99 ? '99+' : result.unread;
        badge.hidden = false;
      }
    })
    .catch(error => console.warn('Could not load notification count', error));
}

document.addEventListener('DOMContentLoaded', () => {
  hideSignedOutAuthLinks();
  redirectAuthenticatedUsersAwayFromAuthPages();
  addNotificationsLink();
});
