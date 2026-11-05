const api = (() => {
	const isLocalDevelopment = ['localhost', '127.0.0.1'].includes(window.location.hostname);
	const configuredBaseUrl = window.API_BASE_URL || (isLocalDevelopment ? 'http://localhost:8080/api' : '');
	const baseUrl = configuredBaseUrl.replace(/\/$/, '');

	async function request(path, options = {}) {
		if (!baseUrl) {
			throw new Error('API is not configured. Set window.API_BASE_URL to your deployed backend URL (for example, https://your-service.onrender.com/api).');
		}

		const response = await fetch(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`, {
			headers: {
				'Content-Type': 'application/json',
				...(options.headers || {})
			},
			...options
		});

		if (!response.ok) {
			const message = await response.text();
			throw new Error(message || `Request failed with status ${response.status}`);
		}

		if (response.status === 204) return null;
		return response.json();
	}

	return {
		get: path => request(path),
		post: (path, body) => request(path, {
			method: 'POST',
			body: JSON.stringify(body)
		}),
		put: (path, body) => request(path, {
			method: 'PUT',
			body: JSON.stringify(body)
		}),
		delete: path => request(path, { method: 'DELETE' })
	};
})();
