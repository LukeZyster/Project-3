function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}

const TRANSACTIONS_KEY = 'studentMarketTransactions';
const DEMO_TRANSACTIONS = [
    { id: 'demo-1', items: [{ name: 'Campus Hoodie', quantity: 1, price: 499.99 }], total: 499.99, status: 'Completed', completedAt: '2026-10-28T10:30:00' },
    { id: 'demo-2', items: [{ name: 'Travel Mug', quantity: 1, price: 89.99 }, { name: 'Notebook Set', quantity: 2, price: 59.99 }], total: 209.97, status: 'Completed', completedAt: '2026-11-01T14:15:00' },
    { id: 'demo-3', items: [{ name: 'Student Tee', quantity: 1, price: 199.99 }], total: 199.99, status: 'Completed', completedAt: '2026-11-03T09:00:00' }
];

function getTransactions() {
    const stored = localStorage.getItem(TRANSACTIONS_KEY);
    if (stored === null) {
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(DEMO_TRANSACTIONS));
        return DEMO_TRANSACTIONS;
    }
    try {
        return JSON.parse(stored) || [];
    } catch (error) {
        console.warn('Could not read transaction history:', error);
        return DEMO_TRANSACTIONS;
    }
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function escapeCartHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderTransactionHistory() {
    const history = document.getElementById('transactionHistory');
    if (!history) return;

    const transactions = getTransactions();
    if (transactions.length === 0) {
        history.innerHTML = '<p class="empty-state">Completed purchases will appear here.</p>';
        return;
    }

    history.innerHTML = transactions.map(transaction => {
        const items = (transaction.items || []).map(item =>
            `${escapeCartHtml(item.quantity)} × ${escapeCartHtml(item.name)}`
        ).join(', ');
        const date = transaction.completedAt
            ? new Date(transaction.completedAt).toLocaleDateString()
            : '';
        return `
          <article class="product-card" style="margin-bottom:12px;padding:16px;">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
              <div>
                <strong>${escapeCartHtml(transaction.status || 'Completed')}</strong>
                <div style="margin-top:6px;">${items}</div>
                <small>${escapeCartHtml(date)}</small>
              </div>
              <strong>R${Number(transaction.total || 0).toFixed(2)}</strong>
            </div>
          </article>`;
    }).join('');
}

function recordCompletedPurchase(cart) {
    const transactions = getTransactions();
    const items = cart.map(item => ({
        name: String(item.name),
        quantity: Number(item.quantity),
        price: Number(item.price)
    }));
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    transactions.unshift({
        id: `purchase-${Date.now()}`,
        items,
        total,
        status: 'Completed',
        completedAt: new Date().toISOString()
    });
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
}

function renderCart() {
    const cart = getCart();
    const container = document.getElementById('cartItems');
    const summary = document.getElementById('cartSummary');

    if (cart.length === 0) {
        container.innerHTML = `<div class="empty-state">Your cart is empty.</div>`;
        summary.style.display = 'none';
        renderTransactionHistory();
        return;
    }

    let total = 0;
    container.innerHTML = cart.map(item => {
        const lineTotal = Number(item.price) * item.quantity;
        total += lineTotal;
        return `
      <div class="product-card" style="margin-bottom:12px; flex-direction:row; padding:12px;">
        <div class="product-card-image" style="width:80px; height:80px; flex-shrink:0;">
          ${item.imageUrl ? `<img src="${escapeCartHtml(item.imageUrl)}" alt="">` : ''}
        </div>
        <div style="flex:1; padding-left:12px;">
          <div class="product-name">${escapeCartHtml(item.name)}</div>
          <div class="product-price">R${Number(item.price).toFixed(2)}</div>
          <div style="display:flex; gap:8px; align-items:center;">
            <button class="pill" onclick="changeQty(${Number(item.id)}, -1)">−</button>
            <span>${item.quantity}</span>
            <button class="pill" onclick="changeQty(${Number(item.id)}, 1)">+</button>
            <button class="pill" onclick="removeItem(${Number(item.id)})" style="margin-left:auto;">Remove</button>
          </div>
        </div>
      </div>
    `;
    }).join('');

    document.getElementById('cartTotal').textContent = `R${total.toFixed(2)}`;
    summary.style.display = 'block';

    document.getElementById('clearCartBtn').onclick = () => {
        if (confirm('Clear your cart?')) {
            saveCart([]);
            renderCart();
        }
    };

    const checkoutButton = document.getElementById('checkoutBtn');
    checkoutButton.disabled = false;
    checkoutButton.textContent = 'Complete demo purchase';
    checkoutButton.onclick = completePurchase;
    renderTransactionHistory();
}

async function completePurchase() {
    const cart = getCart();
    const checkoutButton = document.getElementById('checkoutBtn');
    if (!cart.length) return;

    checkoutButton.disabled = true;
    checkoutButton.textContent = 'Processing…';
    try {
        for (const item of cart) {
            if (!Number.isInteger(Number(item.id)) || Number(item.id) >= 9000) {
                throw new Error('This demo item is not connected to the live inventory. Your cart has been kept.');
            }
            await api.post(`/merch/${Number(item.id)}/purchase?quantity=${Number(item.quantity)}`, {});
        }
        recordCompletedPurchase(cart);
        saveCart([]);
        alert('Demo purchase completed. The sale notification has been posted.');
        renderCart();
    } catch (error) {
        console.error('Purchase failed:', error);
        alert(error.message || 'Could not complete the demo purchase. Please try again.');
        checkoutButton.disabled = false;
        checkoutButton.textContent = 'Complete demo purchase';
    }
}

function changeQty(id, delta) {
    const cart = getCart();
    const item = cart.find(x => Number(x.id) === Number(id));
    if (!item) return;
    item.quantity = Math.max(1, item.quantity + delta);
    saveCart(cart);
    renderCart();
}

function removeItem(id) {
    const cart = getCart().filter(x => Number(x.id) !== Number(id));
    saveCart(cart);
    renderCart();
}

document.addEventListener('DOMContentLoaded', renderCart);
