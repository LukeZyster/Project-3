let sharedReviews = [];

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
		list.append(entry);
	});
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

function getReviewerName() {
	const user = window.getCurrentUser ? window.getCurrentUser() : null;
	let profile = {};
	try {
		profile = JSON.parse(localStorage.getItem('studentMarketProfile') || '{}') || {};
	} catch (error) {
		profile = {};
	}
	return profile.name || (user && user.name) || 'Student';
}

document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('reviewForm');
	const message = document.getElementById('reviewMessage');
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
			comment: String(formData.get('comment')).trim(),
			reviewer: getReviewerName()
		};

		if (!review.item || !review.seller || !review.comment || review.itemRating < 1 || review.itemRating > 5 || review.serviceRating < 1 || review.serviceRating > 5) {
			message.textContent = 'Complete both ratings and all review details before posting.';
			message.classList.add('is-error');
			return;
		}

		try {
			const user = window.getCurrentUser ? window.getCurrentUser() : null;
			const response = await fetch(`${NOTIFICATION_API_BASE}/api/reviews`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-User-Id': String(user && user.id ? user.id : 1)
				},
				body: JSON.stringify(review)
			});
			if (!response.ok) {
				const result = await response.json().catch(() => ({}));
				throw new Error(result.error || 'Your review could not be posted.');
			}
			sharedReviews.unshift(await response.json());
			form.reset();
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
