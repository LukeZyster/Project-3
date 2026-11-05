function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
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

function renderCart() {
    const cart = getCart();
    const container = document.getElementById('cartItems');
    const summary = document.getElementById('cartSummary');

    if (cart.length === 0) {
        container.innerHTML = `<div class="empty-state">Your cart is empty.</div>`;
        summary.style.display = 'none';
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
}

async function completePurchase() {
    const cart = getCart();
    const checkoutButton = document.getElementById('checkoutBtn');
    if (!cart.length) return;

    checkoutButton.disabled = true;
    checkoutButton.textContent = 'Processing…';
    try {
        for (const item of cart) {
            if (!Number.isInteger(Number(item.id))) {
                throw new Error('This item is not connected to the live inventory. Remove it and add it again from the store.');
            }
            await api.post(`/merch/${Number(item.id)}/purchase?quantity=${Number(item.quantity)}`, {});
        }
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
