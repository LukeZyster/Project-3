document.getElementById('loginForm')?.addEventListener('submit', event => {
	event.preventDefault();
	const email = document.getElementById('loginEmail').value.trim();
	const message = document.getElementById('loginMessage');
	const name = email ? email.split('@')[0] : 'Student';

	setCurrentUser({
		id: 1,
		name,
		email,
		role: 'USER'
	});

	message.textContent = 'Signed in. Taking you to your profile...';
	setTimeout(() => {
		window.location.href = 'profile.html';
	}, 250);
});
