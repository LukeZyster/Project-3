const api = (() => {
	const baseUrl = (window.API_BASE_URL || 'http://localhost:8080/api').replace(/\/$/, '');

	async function request(path, options = {}) {
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
