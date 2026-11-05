// ==========================================
// Merch Store — Isaac
// ==========================================

let allItems = [];
let activeCategory = 'All';
let searchQuery = '';

const fallbackItems = [
    { id: 1, name: 'Campus Hoodie', price: 499.99, category: 'Clothing', imageUrl: 'assets/images/merch/varsity-hoodie.jpg', description: 'A warm campus essential.' },
    { id: 2, name: 'Student Tee', price: 199.99, category: 'Clothing', imageUrl: 'assets/images/merch/student-tee.jpg', description: 'Everyday student style.' },
    { id: 3, name: 'Coffee Mug', price: 89.99, category: 'Drinkware', imageUrl: 'assets/images/merch/varsity-mug.jpg', description: 'For early lectures and late study sessions.' },
    { id: 4, name: 'Notebook', price: 59.99, category: 'Stationery', imageUrl: 'assets/images/merch/notebook.jpg', description: 'Keep your semester organised.' },
    { id: 5, name: 'Snapback Cap', price: 149.99, category: 'Clothing', imageUrl: 'assets/images/merch/cap.jpg', description: 'A classic campus finish.' }
];

// ---------- Cart helpers ----------
function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(item) {
    const cart = getCart();
    const existing = cart.find(x => x.id === item.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    saveCart(cart);
}

function updateCartBadge() {
    const count = getCart().reduce((sum, x) => sum + x.quantity, 0);
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// ---------- Rendering ----------
function productCard(item) {
    const price = `R${Number(item.price).toFixed(2)}`;
    const imageContent = item.imageUrl
        ? `<img src="${item.imageUrl}" alt="${escapeHtml(item.name)}" onerror="this.parentNode.innerHTML='<div class=&quot;product-placeholder&quot;>${escapeHtml(item.name)}</div>'">`
        : `<div class="product-placeholder">${escapeHtml(item.name)}</div>`;

    return `
    <article class="product-card" data-id="${item.id}">
      <div class="product-card-image">${imageContent}</div>
      <div class="product-card-body">
        <div class="product-name">${escapeHtml(item.name)}</div>
        <div class="product-price">${price}</div>
        <button class="add-to-cart" data-id="${item.id}">
          <span>Add to Cart</span>
          <span class="heart">♡</span>
        </button>
      </div>
    </article>
  `;
}

function listingCard(item) {
    const price = `R${Number(item.price).toFixed(2)}`;
    const bg = item.imageUrl ? `style="background-image:url('${item.imageUrl}')"` : '';
    return `
    <article class="listing-card" data-id="${item.id}">
      <div class="listing-card-image" ${bg}></div>
      <div class="listing-card-body">
        <div class="listing-card-name">${escapeHtml(item.name)}</div>
        <div class="listing-card-price">${price}</div>
      </div>
    </article>
  `;
}

function render(items) {
    const popularGrid = document.getElementById('popularGrid');
    const secondGrid = document.getElementById('secondGrid');
    const newListings = document.getElementById('newListings');

    if (items.length === 0) {
        popularGrid.innerHTML = `<div class="empty-state">No products found.</div>`;
        secondGrid.innerHTML = '';
        newListings.innerHTML = '';
        return;
    }

    popularGrid.innerHTML = items.slice(0, 4).map(productCard).join('');
    secondGrid.innerHTML = items.slice(4, 8).map(productCard).join('');
    newListings.innerHTML = items.map(listingCard).join('');

    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = Number(btn.dataset.id);
            const item = allItems.find(x => x.id === id);
            if (item) {
                addToCart(item);
                btn.classList.add('added');
                btn.querySelector('span:first-child').textContent = 'Added ✓';
                setTimeout(() => {
                    btn.classList.remove('added');
                    btn.querySelector('span:first-child').textContent = 'Add to Cart';
                }, 1200);
            }
        });
    });
}

// ---------- Filtering ----------
function applyFilters() {
    let filtered = allItems;

    if (activeCategory !== 'All') {
        filtered = filtered.filter(i => i.category === activeCategory);
    }

    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(i =>
            i.name.toLowerCase().includes(q) ||
            (i.description || '').toLowerCase().includes(q)
        );
    }

    render(filtered);
}

// ---------- Data loading ----------
async function loadMerch() {
    try {
        const remoteItems = await api.get('/merch');
        allItems = remoteItems.length ? remoteItems : fallbackItems;
        applyFilters();
    } catch (err) {
        console.error('Failed to load merch:', err);
        allItems = fallbackItems;
        applyFilters();
    }
}

// ---------- Utilities ----------
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        applyFilters();
    });

    document.querySelectorAll('.pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeCategory = pill.dataset.category;
            applyFilters();
        });
    });

    const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    if (user && user.role === 'ADMIN') {
        const fab = document.getElementById('fabAdd');
        if (fab) {
            fab.style.display = 'block';
            fab.addEventListener('click', () => { window.location.href = 'marketplace.html'; });
        }
    }

    document.querySelector('.shop-now-btn')?.addEventListener('click', () => {
        document.getElementById('popularGrid')?.scrollIntoView({ behavior: 'smooth' });
    });

    updateCartBadge();
    loadMerch();
});