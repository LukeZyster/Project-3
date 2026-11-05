const LISTINGS_KEY = 'studentMarketListings';
const SAVED_KEY = 'studentMarketSavedItems';
const MARKET_CATEGORIES = ['Textbooks', 'Appliances', 'Furniture', 'Tech', 'Other', 'Merch'];
const STARTER_LISTINGS = [
  { id: 'demo-economics-book', name: 'Intro to Economics', category: 'Textbooks', price: 180, condition: 'Good', description: 'Second-hand course textbook with light highlighting.', campus: 'CPUT District Six', seller: 'Mila', createdAt: '2026-10-28T10:00:00.000Z' },
  { id: 'demo-mini-fridge', name: 'Mini Fridge', category: 'Appliances', price: 1200, condition: 'Good', description: 'Compact fridge, clean and working well. Ideal for residence.', campus: 'CPUT District Six', seller: 'Jayden', createdAt: '2026-10-27T10:00:00.000Z' },
  { id: 'demo-study-desk', name: 'Study Desk', category: 'Furniture', price: 750, condition: 'Used', description: 'Sturdy compact desk with a few signs of use.', campus: 'Bellville Campus', seller: 'Anele', createdAt: '2026-10-26T10:00:00.000Z' },
  { id: 'demo-wireless-mouse', name: 'Wireless Mouse', category: 'Tech', price: 220, condition: 'Like new', description: 'Wireless mouse with USB receiver included.', campus: 'CPUT District Six', seller: 'Rene', createdAt: '2026-10-25T10:00:00.000Z' },
  { id: 'demo-physics-notes', name: 'Physics Notes Bundle', category: 'Textbooks', price: 100, condition: 'Good', description: 'Printed revision notes for first-year physics.', campus: 'Bellville Campus', seller: 'Thando', createdAt: '2026-10-24T10:00:00.000Z' },
  { id: 'demo-kettle', name: 'Hot Water Kettle', category: 'Appliances', price: 260, condition: 'Good', description: 'Small, clean kettle. Great for a residence room.', campus: 'CPUT District Six', seller: 'Liam', createdAt: '2026-10-23T10:00:00.000Z' }
];
let selectedCategory = 'All';

function safeRead(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return Array.isArray(value) ? value : fallback;
  } catch (error) {
    return fallback;
  }
}

function getMarketplaceListings() {
  let listings = safeRead(LISTINGS_KEY, null);
  if (!listings) {
    listings = STARTER_LISTINGS;
    localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
  }
  return listings;
}

function getSavedMarketplaceItems() { return safeRead(SAVED_KEY, []); }

function escapeMarketplaceText(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function toggleSavedMarketplaceItem(listing) {
  const saved = getSavedMarketplaceItems();
  const id = String(listing.id);
  const existingIndex = saved.findIndex(item => String(item.id) === id);
  if (existingIndex >= 0) saved.splice(existingIndex, 1);
  else saved.push({ ...listing, id });
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  renderMarketplaceListings();
}

function renderMarketplaceListings() {
  const grid = document.getElementById('marketListingGrid');
  if (!grid) return;
  const query = (document.getElementById('marketSearch')?.value || '').trim().toLowerCase();
  const savedIds = new Set(getSavedMarketplaceItems().map(item => String(item.id)));
  const listings = getMarketplaceListings().filter(item => {
    const categoryMatches = selectedCategory === 'All' || item.category === selectedCategory;
    const text = [item.name, item.description, item.category, item.condition, item.campus, item.seller].join(' ').toLowerCase();
    return categoryMatches && (!query || text.includes(query));
  }).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

  grid.innerHTML = listings.map(item => {
    const saved = savedIds.has(String(item.id));
    const price = Number(item.price).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const image = item.imageUrl
      ? `<img class="listing-card__photo" src="${escapeMarketplaceText(item.imageUrl)}" alt="${escapeMarketplaceText(item.name)}">`
      : `<div class="listing-card__image ${escapeMarketplaceText(String(item.category || 'Other').toLowerCase())}-image" aria-hidden="true">${escapeMarketplaceText(item.category || 'Student item')}</div>`;
    return `<article class="listing-card"><div class="market-image-wrap">${image}<button class="save-item-button ${saved ? 'is-saved' : ''}" type="button" data-save-id="${escapeMarketplaceText(item.id)}" aria-label="${saved ? 'Remove from saved items' : 'Save item'}" aria-pressed="${saved}">${saved ? '♥' : '♡'}</button></div><div class="listing-card__body"><p class="listing-category">${escapeMarketplaceText(item.category)} · ${escapeMarketplaceText(item.condition)}</p><h3>${escapeMarketplaceText(item.name)}</h3><p class="listing-price">R${price}</p><p>${escapeMarketplaceText(item.description)}</p><p class="listing-meta">${escapeMarketplaceText(item.campus)} · Listed by ${escapeMarketplaceText(item.seller)}</p><a class="text-link" href="chat.html">Contact seller →</a></div></article>`;
  }).join('');
  document.getElementById('listingCount').textContent = `${listings.length} ${listings.length === 1 ? 'listing' : 'listings'}`;
  document.getElementById('marketEmptyState').hidden = listings.length !== 0;
  grid.querySelectorAll('[data-save-id]').forEach(button => {
    button.addEventListener('click', () => {
      const listing = getMarketplaceListings().find(item => String(item.id) === button.dataset.saveId);
      if (listing) toggleSavedMarketplaceItem(listing);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.market-pill').forEach(button => button.addEventListener('click', () => {
    selectedCategory = button.dataset.category;
    document.querySelectorAll('.market-pill').forEach(pill => pill.classList.toggle('active', pill === button));
    renderMarketplaceListings();
  }));
  document.getElementById('marketSearch')?.addEventListener('input', renderMarketplaceListings);
  window.addEventListener('storage', event => {
    if (event.key === LISTINGS_KEY || event.key === SAVED_KEY) renderMarketplaceListings();
  });
  renderMarketplaceListings();
});
