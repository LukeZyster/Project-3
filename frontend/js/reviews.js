let sharedReviews = [];

function updateRatingDisplay(group) {
	const selected = Number(group.querySelector('input:checked')?.value || 0);
	group.dataset.selected = String(selected);
	group.querySelectorAll('.rating-option').forEach(option => {
		option.dataset.filled = String(Number(option.dataset.rating) <= selected);
	});
}

function currentUserIsAdmin() {
	const user = window.getCurrentUser?.();
	return String(user?.role || '').toUpperCase() === 'ADMIN';
}

function addRatingRow(container, label, rating) {
	const row = document.createElement('span');
	row.className = 'review-entry-rating';
	row.append(`${label} `);

	const stars = document.createElement('span');
	stars.setAttribute('aria-label', `${rating} out of 5 stars`);
	stars.textContent = `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`;
	row.append(stars);
	container.append(row);
}

function renderReviews() {
	const reviews = sharedReviews.slice().sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));
	const list = document.getElementById('reviewList');
	const emptyState = document.getElementById('reviewEmptyState');
	document.getElementById('reviewCount').textContent = String(reviews.length);
	emptyState.hidden = reviews.length > 0;
	emptyState.textContent = 'No reviews yet. Yours can be the first.';
	list.replaceChildren();

	reviews.forEach(review => {
		const entry = document.createElement('article');
		entry.className = 'review-entry';

		const header = document.createElement('div');
		header.className = 'review-entry-header';
		const titleBlock = document.createElement('div');
		const title = document.createElement('h3');
		title.textContent = review.item;
		const meta = document.createElement('p');
		meta.className = 'review-entry-meta';
		meta.textContent = `Seller: ${review.seller} · Reviewed by ${review.reviewer}`;
		titleBlock.append(title, meta);
		const date = document.createElement('time');
		date.className = 'review-entry-date';
		date.dateTime = new Date(review.createdAt).toISOString();
		date.textContent = new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
		header.append(titleBlock, date);

		const ratings = document.createElement('div');
		ratings.className = 'review-entry-ratings';
		addRatingRow(ratings, 'Item', review.itemRating);
		addRatingRow(ratings, 'Service', review.serviceRating);

		const comment = document.createElement('p');
		comment.className = 'review-entry-comment';
		comment.textContent = review.comment;
		entry.append(header, ratings, comment);

		if (currentUserIsAdmin()) {
			const actions = document.createElement('div');
			actions.className = 'review-entry-actions';
			const deleteButton = document.createElement('button');
			deleteButton.className = 'button button-secondary review-delete-button';
			deleteButton.type = 'button';
			deleteButton.textContent = 'Delete review';
			deleteButton.addEventListener('click', () => deleteReview(review.id, deleteButton));
			actions.append(deleteButton);
			entry.append(actions);
		}
		list.append(entry);
	});
}

async function deleteReview(reviewId, button) {
	if (!window.confirm('Delete this review? This cannot be undone.')) return;
	button.disabled = true;
	try {
		const response = await fetch(`${NOTIFICATION_API_BASE}/api/reviews/${encodeURIComponent(reviewId)}`, {
			method: 'DELETE',
			credentials: 'include'
		});
		if (!response.ok) {
			const result = await response.json().catch(() => ({}));
			throw new Error(result.error || 'The review could not be deleted.');
		}
		sharedReviews = sharedReviews.filter(review => String(review.id) !== String(reviewId));
		renderReviews();
	} catch (error) {
		button.disabled = false;
		const message = document.getElementById('reviewMessage');
		message.textContent = error.message || 'The review could not be deleted.';
		message.classList.add('is-error');
	}
}

async function loadReviews() {
	try {
		const response = await fetch(`${NOTIFICATION_API_BASE}/api/reviews`);
		if (!response.ok) throw new Error('Review request failed');
		const reviews = await response.json();
		if (!Array.isArray(reviews)) throw new Error('Review response was invalid');
		sharedReviews = reviews;
		renderReviews();
	} catch (error) {
		sharedReviews = [];
		renderReviews();
		const emptyState = document.getElementById('reviewEmptyState');
		emptyState.hidden = false;
		emptyState.textContent = 'Reviews could not be loaded. Please try again.';
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('reviewForm');
	const message = document.getElementById('reviewMessage');
	document.querySelectorAll('.rating-options').forEach(group => {
		group.addEventListener('change', () => updateRatingDisplay(group));
		updateRatingDisplay(group);
	});
	const query = new URLSearchParams(window.location.search);
	document.getElementById('reviewItem').value = query.get('item') || '';
	document.getElementById('reviewSeller').value = query.get('seller') || '';

	form.addEventListener('submit', async event => {
		event.preventDefault();
		message.textContent = '';
		message.classList.remove('is-error');

		const formData = new FormData(form);
		const review = {
			item: String(formData.get('item')).trim(),
			seller: String(formData.get('seller')).trim(),
			itemRating: Number(formData.get('itemRating')),
			serviceRating: Number(formData.get('serviceRating')),
			comment: String(formData.get('comment')).trim()
		};

		if (!review.item || !review.seller || !review.comment || review.itemRating < 1 || review.itemRating > 5 || review.serviceRating < 1 || review.serviceRating > 5) {
			message.textContent = 'Complete both ratings and all review details before posting.';
			message.classList.add('is-error');
			return;
		}

		try {
			const response = await fetch(`${NOTIFICATION_API_BASE}/api/reviews`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(review)
			});
			if (!response.ok) {
				const result = await response.json().catch(() => ({}));
				throw new Error(result.error || 'Your review could not be posted.');
			}
			sharedReviews.unshift(await response.json());
			form.reset();
			document.querySelectorAll('.rating-options').forEach(updateRatingDisplay);
			message.textContent = 'Your review has been posted.';
			renderReviews();
		} catch (error) {
			message.textContent = error.message || 'Your review could not be posted.';
			message.classList.add('is-error');
		}
	});

	window.addEventListener('focus', loadReviews);
	window.setInterval(loadReviews, 30000);
	loadReviews();
});
