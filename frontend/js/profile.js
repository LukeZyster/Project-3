const PROFILE_KEY = 'studentMarketProfile';
const SAVED_KEY = 'studentMarketSavedItems';
const LISTINGS_KEY = 'studentMarketListings';

function readJsonArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value || '';
}

function renderProfileItems() {
  const saved = readJsonArray(SAVED_KEY);
  const grid = document.getElementById('savedItemsGrid');
  grid.innerHTML = saved.map(item => `<article class="listing-card"><div class="listing-card__body"><p class="listing-category">${profileEscape(item.category || 'Student item')}</p><h3>${profileEscape(item.name || 'Saved item')}</h3><p class="listing-price">R${Number(item.price || 0).toFixed(2)}</p><button type="button" class="button button-secondary" data-remove-saved="${profileEscape(item.id)}">Remove saved item</button></div></article>`).join('');
  document.getElementById('savedItemsEmpty').hidden = saved.length > 0;
  grid.querySelectorAll('[data-remove-saved]').forEach(button => button.addEventListener('click', () => {
    const next = readJsonArray(SAVED_KEY).filter(item => String(item.id) !== button.dataset.removeSaved);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    renderProfileItems();
  }));

  const user = getCurrentUser();
  const myListings = readJsonArray(LISTINGS_KEY).filter(item => String(item.sellerId || '') === String(user && (user.id || user.email) || ''));
  const myGrid = document.getElementById('myListingsGrid');
  myGrid.innerHTML = myListings.map(item => `<article class="listing-card"><div class="listing-card__body"><p class="listing-category">${profileEscape(item.category)} · ${profileEscape(item.condition)}</p><h3>${profileEscape(item.name)}</h3><p class="listing-price">R${Number(item.price).toFixed(2)}</p><p>${profileEscape(item.campus)}</p></div></article>`).join('');
  document.getElementById('myListingsEmpty').hidden = myListings.length > 0;
}

function profileEscape(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

async function refreshSignedInUser() {
  try {
    const response = await fetch(`${NOTIFICATION_API_BASE}/api/auth/me`, { credentials: 'include' });
    if (!response.ok) {
      localStorage.removeItem('studentMarketUser');
      return null;
    }
    const user = await response.json();
    setCurrentUser(user);
    return user;
  } catch (error) {
    return null;
  }
}

async function loadAdminUsers(currentUser) {
  const section = document.getElementById('adminUserManagement');
  if (currentUser.role !== 'ADMIN') {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  const list = document.getElementById('adminUsersList');
  const message = document.getElementById('adminUsersMessage');
  try {
    const response = await fetch(`${NOTIFICATION_API_BASE}/api/admin/users`, { credentials: 'include' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not load user accounts.');
    document.getElementById('adminUserCount').textContent = `${result.length} accounts`;
    list.replaceChildren();
    result.forEach(account => {
      const row = document.createElement('li');
      const detail = document.createElement('span');
      detail.textContent = `${account.name} · ${account.email} · ${account.role}`;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button button-secondary';
      button.textContent = account.role === 'ADMIN' ? 'Remove admin' : 'Make admin';
      button.addEventListener('click', () => changeUserRole(account, button));
      row.append(detail, button);
      list.append(row);
    });
    message.textContent = '';
  } catch (error) {
    message.textContent = error.message || 'Could not load user accounts.';
  }
}

async function changeUserRole(account, button) {
  const nextRole = account.role === 'ADMIN' ? 'USER' : 'ADMIN';
  const action = nextRole === 'ADMIN' ? 'Grant admin access to' : 'Remove admin access from';
  if (!window.confirm(`${action} ${account.name}?`)) return;
  button.disabled = true;
  const message = document.getElementById('adminUsersMessage');
  try {
    const response = await fetch(`${NOTIFICATION_API_BASE}/api/admin/users/${encodeURIComponent(account.id)}/role`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: nextRole })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not update user role.');
    message.textContent = `${result.name}'s role is now ${result.role}.`;
    const refreshedUser = await refreshSignedInUser();
    if (refreshedUser) await loadAdminUsers(refreshedUser);
  } catch (error) {
    button.disabled = false;
    message.textContent = error.message || 'Could not update user role.';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await refreshSignedInUser();
  const profileContent = document.getElementById('profileContent');
  if (!user) {
    setText('profileGreeting', 'You are not signed in yet.');
    setText('profileDetail', 'Sign in or create an account to manage your details, listings, and saved items.');
    profileContent.hidden = true;
    document.getElementById('signOutButton').hidden = true;
    document.getElementById('guestActions').hidden = false;
    return;
  }

  let profile = {};
  try { profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}') || {}; } catch (error) { profile = {}; }
  const name = profile.name || user.name || 'Student';
  const email = profile.email || user.email || '';
  setText('profileGreeting', `Good to see you, ${name}.`);
  setText('profileDetail', email);
  setText('profileName', name);
  setText('profileMeta', profile.campus || (user.role === 'ADMIN' ? 'Administrator' : 'Student member'));
  setText('profileAvatar', name.charAt(0).toUpperCase());

  const profileForm = document.getElementById('profileForm');
  for (const [field, value] of Object.entries({ name, email, course: profile.course, year: profile.year, studentId: profile.studentId, campus: profile.campus })) {
    if (profileForm.elements[field]) profileForm.elements[field].value = value || '';
  }
  const bankForm = document.getElementById('bankForm');
  for (const field of ['bankName', 'bankHolder', 'accountType']) {
    if (bankForm.elements[field]) bankForm.elements[field].value = profile[field] || (field === 'bankHolder' ? name : '');
  }

  profileForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!profileForm.reportValidity()) return;
    const updated = Object.fromEntries(new FormData(profileForm).entries());
    profile = { ...profile, ...updated };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    const savedUser = { ...user, name: updated.name, email: updated.email };
    localStorage.setItem('studentMarketUser', JSON.stringify(savedUser));
    setText('profileGreeting', `Good to see you, ${updated.name}.`);
    setText('profileDetail', updated.email);
    setText('profileName', updated.name);
    setText('profileMeta', updated.campus || 'Student member');
    setText('profileAvatar', updated.name.charAt(0).toUpperCase());
    setText('profileMessage', 'Profile saved on this device.');
  });

  bankForm.addEventListener('submit', event => {
    event.preventDefault();
    profile = { ...profile, ...Object.fromEntries(new FormData(bankForm).entries()) };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    setText('bankMessage', 'Bank name and account preferences saved on this device.');
  });

  document.getElementById('signOutButton').addEventListener('click', () => {
    fetch(`${NOTIFICATION_API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' })
      .finally(() => {
        localStorage.removeItem('studentMarketUser');
        window.location.href = 'index.html';
      });
  });
  renderProfileItems();
  await loadAdminUsers(user);
  window.addEventListener('storage', event => {
    if ([SAVED_KEY, LISTINGS_KEY].includes(event.key)) renderProfileItems();
  });
});
