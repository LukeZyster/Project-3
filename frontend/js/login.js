document.getElementById('loginForm')?.addEventListener('submit', event => {
	event.preventDefault();
	const email = document.getElementById('loginEmail').value.trim();
	const message = document.getElementById('loginMessage');
	setCurrentUser({ name: email.split('@')[0], email });
	message.textContent = 'Signed in. Taking you to the store...';
	redirectAfterAuth();
});
