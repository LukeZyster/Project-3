// ==========================================
// Merch Store — demo catalog and local cart
// ==========================================
let allItems = [];
let activeCategory = 'All';
let searchQuery = '';
const SAVED_ITEMS_KEY = 'studentMarketSavedItems';
const MERCH_IMAGE_BY_NAME = [
  { pattern: /hoodie/, path: 'assets/images/merch/varsity-hoodie.jpg' },
  { pattern: /\btee\b|t-shirt/, path: 'assets/images/merch/student-tee.jpg' },
  { pattern: /mug/, path: 'assets/images/merch/varsity-mug.jpg' },
  { pattern: /notebook|planner/, path: 'assets/images/merch/notebook.jpg' },
  { pattern: /cap/, path: 'assets/images/merch/cap.jpg' }
];
const DEMO_ITEMS = [
  { id: 9001, name: 'Campus Hoodie', description: 'Official university hoodie with an embroidered crest.', price: 499.99, category: 'Clothing', stock: 12 },
  { id: 9002, name: 'Student Tee', description: 'Soft cotton tee for everyday campus wear.', price: 199.99, category: 'Clothing', stock: 20 },
  { id: 9003, name: 'Travel Mug', description: 'Insulated mug for lectures and commutes.', price: 89.99, category: 'Drinkware', stock: 18 },
  { id: 9004, name: 'Notebook Set', description: 'A practical set of notebooks for the semester.', price: 59.99, category: 'Stationery', stock: 30 },
  { id: 9005, name: 'Campus Cap', description: 'A lightweight cap for sunny days on campus.', price: 149.99, category: 'Clothing', stock: 14 },
  { id: 9006, name: 'Laptop Sleeve', description: 'A padded sleeve to protect your laptop.', price: 329.99, category: 'Accessories', stock: 8 },
  { id: 9007, name: 'Water Bottle', description: 'Reusable bottle for long days between classes.', price: 119.99, category: 'Drinkware', stock: 16 },
  { id: 9008, name: 'Study Planner', description: 'Plan assignments, exams, and study sessions.', price: 79.99, category: 'Stationery', stock: 22 },
  { id: 9009, name: 'Campus Socks', description: 'Comfortable everyday socks in campus colors.', price: 69.99, category: 'Clothing', stock: 25 },
  { id: 9010, name: 'Exam Highlighter Pack', description: 'Bright colors for notes and revision.', price: 39.99, category: 'Stationery', stock: 35 }
];

function readStoreJson(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value == null ? fallback : value; }
  catch (error) { return fallback; }
}
function getCart() { const cart = readStoreJson('cart', []); return Array.isArray(cart) ? cart : []; }
function saveCart(cart) { localStorage.setItem('cart', JSON.stringify(cart)); updateCartBadge(); }
function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(x => String(x.id) === String(item.id));
  if (existing) existing.quantity += 1;
  else cart.push({ ...item, quantity: 1 });
  saveCart(cart);
}
function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const count = getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  badge.textContent = count;
  badge.style.display = count ? 'flex' : 'none';
}
function getSavedStoreItems() { const items = readStoreJson(SAVED_ITEMS_KEY, []); return Array.isArray(items) ? items : []; }
function toggleStoreSave(item) {
  const saved = getSavedStoreItems();
  const id = String(item.id);
  const index = saved.findIndex(savedItem => String(savedItem.id) === id);
  if (index >= 0) saved.splice(index, 1);
  else saved.push({ ...item, id, category: 'Merch', condition: 'New', seller: 'StudentMarket' });
  localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(saved));
  applyFilters();
}
function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));
}

function getMerchImage(item) {
  if (typeof item.imageUrl === 'string' && item.imageUrl.trim()) return item.imageUrl.trim();
  const name = String(item.name || '').toLowerCase();
  return MERCH_IMAGE_BY_NAME.find(image => image.pattern.test(name))?.path || '';
}

function addProductImageFallbacks(container) {
  container.querySelectorAll('.product-card-image img').forEach(image => {
    image.addEventListener('error', () => {
      const placeholder = document.createElement('div');
      placeholder.className = 'product-placeholder';
      placeholder.textContent = image.alt || 'Product image unavailable';
      image.replaceWith(placeholder);
    }, { once: true });
  });
}

function productCard(item) {
  const saved = getSavedStoreItems().some(savedItem => String(savedItem.id) === String(item.id));
  const imageUrl = getMerchImage(item);
  const image = imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.name)}">` : `<div class="product-placeholder">${escapeHtml(item.name)}</div>`;
  return `<article class="product-card" data-id="${escapeHtml(item.id)}"><div class="product-card-image">${image}<button class="store-save-button ${saved ? 'is-saved' : ''}" type="button" data-save-id="${escapeHtml(item.id)}" aria-label="${saved ? 'Remove saved item' : 'Save item'}" aria-pressed="${saved}">${saved ? '♥' : '♡'}</button></div><div class="product-card-body"><div class="product-name">${escapeHtml(item.name)}</div><div class="product-price">R${Number(item.price).toFixed(2)}</div><button class="add-to-cart" data-id="${escapeHtml(item.id)}"><span>Add to Cart</span><span class="heart">＋</span></button></div></article>`;
}
function listingCard(item) {
  const imageUrl = getMerchImage(item);
  const bg = imageUrl ? `style="background-image:url('${escapeHtml(imageUrl)}')"` : '';
  return `<article class="listing-card" data-id="${escapeHtml(item.id)}"><div class="listing-card-image" ${bg}></div><div class="listing-card-body"><div class="listing-card-name">${escapeHtml(item.name)}</div><div class="listing-card-price">R${Number(item.price).toFixed(2)}</div></div></article>`;
}
function renderStore(items) {
  const popular = document.getElementById('popularGrid');
  const second = document.getElementById('secondGrid');
  const listings = document.getElementById('newListings');
  if (!popular || !second || !listings) return;
  popular.innerHTML = items.slice(0, 4).map(productCard).join('') || '<div class="empty-state">No products found.</div>';
  second.innerHTML = items.slice(4, 8).map(productCard).join('');
  listings.innerHTML = items.map(listingCard).join('');
  addProductImageFallbacks(popular);
  addProductImageFallbacks(second);
  document.querySelectorAll('.add-to-cart').forEach(button => button.addEventListener('click', event => {
    event.stopPropagation();
    const item = allItems.find(product => String(product.id) === button.dataset.id);
    if (!item) return;
    addToCart(item);
    const label = button.querySelector('span:first-child');
    label.textContent = 'Added ✓';
    setTimeout(() => { if (label.isConnected) label.textContent = 'Add to Cart'; }, 1200);
  }));
  document.querySelectorAll('[data-save-id]').forEach(button => button.addEventListener('click', () => {
    const item = allItems.find(product => String(product.id) === button.dataset.saveId);
    if (item) toggleStoreSave(item);
  }));
}
function applyFilters() {
  const filtered = allItems.filter(item => {
    const categoryMatches = activeCategory === 'All' || item.category === activeCategory;
    const query = searchQuery.trim().toLowerCase();
    return categoryMatches && (!query || `${item.name} ${item.description || ''}`.toLowerCase().includes(query));
  });
  renderStore(filtered);
}
async function loadMerch() {
  try {
    const response = await api.get('/merch');
    const products = Array.isArray(response) && response.length ? response : DEMO_ITEMS;
    allItems = products.map(item => ({ ...item, imageUrl: getMerchImage(item) }));
  } catch (error) {
    console.info('Using the demo merch catalog while the store API is unavailable.');
    allItems = DEMO_ITEMS.map(item => ({ ...item, imageUrl: getMerchImage(item) }));
  }
  applyFilters();
}
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('searchInput')?.addEventListener('input', event => { searchQuery = event.target.value; applyFilters(); });
  document.querySelectorAll('.pill').forEach(pill => pill.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(item => item.classList.remove('active'));
    pill.classList.add('active');
    activeCategory = pill.dataset.category;
    applyFilters();
  }));
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const fab = document.getElementById('fabAdd');
  if (user && user.role === 'ADMIN' && fab) {
    fab.style.display = 'block';
    fab.addEventListener('click', () => alert('Use the listing form to add marketplace items.'));
  }
  updateCartBadge();
  loadMerch();
});
