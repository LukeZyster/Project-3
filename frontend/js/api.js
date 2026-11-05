const api = (() => {
	const host = window.location.hostname || 'localhost';
	const baseUrl = (window.API_BASE_URL || `${window.location.protocol}//${host}:8080/api`).replace(/\/$/, '');

	async function request(path, options = {}) {
		const headers = { ...(options.headers || {}) };
		if (options.body) headers['Content-Type'] = 'application/json';
		const response = await fetch(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`, {
			headers,
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
