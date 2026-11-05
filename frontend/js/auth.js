const AUTH_KEY = 'studentMarketUser';

function getCurrentUser() {
	return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
}

function setCurrentUser(user) {
	localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function redirectAfterAuth() {
	window.location.href = 'merch.html';
}

document.addEventListener('DOMContentLoaded', () => {
	const user = getCurrentUser();
	document.querySelectorAll('[data-auth-link]').forEach(link => {
		if (user) {
			link.textContent = 'My account';
			link.href = 'profile.html';
		}
	});
});
