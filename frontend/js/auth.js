const AUTH_KEY = 'studentMarketUser';
const NOTIFICATION_API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
	? 'http://localhost:8080'
	: 'https://project-3-iykb.onrender.com';

function getCurrentUser() {
	return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
}

function setCurrentUser(user) {
	localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function redirectAfterAuth() {
	window.location.href = 'merch.html';
}

function addNotificationsLink() {
	const siteNav = document.querySelector('.site-links');
	if (siteNav && !siteNav.querySelector('[data-notifications-link]')) {
		const link = document.createElement('a');
		link.href = 'notification.html';
		link.dataset.notificationsLink = '';
		link.textContent = 'Notifications';
		siteNav.append(link);
	}

	const appHeader = document.querySelector('.app-header');
	if (appHeader && !appHeader.querySelector('[data-notifications-link]')) {
		const link = document.createElement('a');
		link.href = 'notification.html';
		link.className = 'icon-btn notification-link';
		link.dataset.notificationsLink = '';
		link.setAttribute('aria-label', 'Notifications');
		link.innerHTML = '🔔<span class="notification-count" data-notification-count hidden></span>';
		appHeader.append(link);
	}

	const user = getCurrentUser();
	document.querySelectorAll('[data-auth-link]').forEach(link => {
		if (user) {
			link.textContent = 'My account';
			link.href = 'profile.html';
		}
	});

	const badge = document.querySelector('[data-notification-count]');
	if (badge) {
		const userId = user && user.id ? user.id : 1;
		fetch(`${NOTIFICATION_API_BASE}/api/notifications/unread-count`, {
			headers: { 'X-User-Id': String(userId) }
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
}

document.addEventListener('DOMContentLoaded', addNotificationsLink);
