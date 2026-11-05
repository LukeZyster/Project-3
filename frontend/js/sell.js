const LISTINGS_KEY = 'studentMarketListings';

function readListings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LISTINGS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('sellForm');
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const notice = document.getElementById('sellAuthNotice');
  const message = document.getElementById('sellMessage');
  if (!user) {
    form.hidden = true;
    notice.hidden = false;
    notice.innerHTML = 'Please <a href="login.html">sign in</a> or <a href="register.html">create an account</a> to publish a listing.';
    return;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const price = Number(values.get('price'));
    if (!Number.isFinite(price) || price <= 0) {
      message.textContent = 'Enter a valid price greater than zero.';
      return;
    }
    const listing = {
      id: `listing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: String(values.get('name')).trim(),
      category: String(values.get('category')),
      price,
      condition: String(values.get('condition')),
      campus: String(values.get('campus')).trim(),
      description: String(values.get('description')).trim(),
      imageUrl: String(values.get('imageUrl') || '').trim(),
      seller: user.name || user.email || 'Student',
      sellerId: String(user.id || user.email || ''),
      createdAt: new Date().toISOString()
    };
    const listings = readListings();
    listings.push(listing);
    localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
    message.textContent = 'Your listing is live. Opening the marketplace...';
    form.reset();
    setTimeout(() => { window.location.href = 'marketplace.html'; }, 350);
  });
});
