document.getElementById('registerForm')?.addEventListener('submit', event => {
	event.preventDefault();
	const name = document.getElementById('registerName').value.trim();
	const email = document.getElementById('registerEmail').value.trim();
	const message = document.getElementById('registerMessage');
	setCurrentUser({ name, email });
	message.textContent = 'Account created. Taking you to the store...';
	redirectAfterAuth();
});
