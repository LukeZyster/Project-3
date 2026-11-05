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
	// Reuse a link already in the page instead of adding a second shortcut.
	const existingLinks = [...document.querySelectorAll('a[href="notification.html"], [data-notifications-link]')];
	let link = existingLinks.shift();
	existingLinks.forEach(duplicate => duplicate.remove());

	if (!link) {
		const siteNav = document.querySelector('.site-links');
		const appHeader = document.querySelector('.app-header');
		const parent = siteNav || appHeader;
		if (parent) {
			link = document.createElement('a');
			link.href = 'notification.html';
			if (siteNav) {
				link.textContent = 'Notifications';
			} else {
				link.className = 'icon-btn notification-link';
				link.setAttribute('aria-label', 'Notifications');
				link.textContent = '🔔';
			}
			parent.append(link);
		}
	}

	if (link) {
		link.dataset.notificationsLink = '';
		if (!link.querySelector('[data-notification-count]')) {
			const badge = document.createElement('span');
			badge.className = 'notification-count';
			badge.dataset.notificationCount = '';
			badge.hidden = true;
			link.append(badge);
		}
	}

	const user = getCurrentUser();
	document.querySelectorAll('[data-auth-link]').forEach(authLink => {
		if (user) {
			authLink.textContent = 'My account';
			authLink.href = 'profile.html';
		}
	});

	const badge = link && link.querySelector('[data-notification-count]');
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
