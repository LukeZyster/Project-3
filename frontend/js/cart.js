function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
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
          ${item.imageUrl ? `<img src="${item.imageUrl}" alt="">` : ''}
        </div>
        <div style="flex:1; padding-left:12px;">
          <div class="product-name">${item.name}</div>
          <div class="product-price">R${Number(item.price).toFixed(2)}</div>
          <div style="display:flex; gap:8px; align-items:center;">
            <button class="pill" onclick="changeQty(${item.id}, -1)">−</button>
            <span>${item.quantity}</span>
            <button class="pill" onclick="changeQty(${item.id}, 1)">+</button>
            <button class="pill" onclick="removeItem(${item.id})" style="margin-left:auto;">Remove</button>
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

    document.getElementById('checkoutBtn').onclick = () => {
      const order = {
        id: `SM-${Date.now().toString().slice(-6)}`,
        items: cart,
        total,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('lastOrder', JSON.stringify(order));
      saveCart([]);
      container.innerHTML = `<div class="empty-state"><strong>Order ${order.id} placed.</strong><br>Your campus essentials are on their way.</div>`;
      summary.style.display = 'none';
    };
}

function changeQty(id, delta) {
    const cart = getCart();
    const item = cart.find(x => x.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity < 1) item.quantity = 1;
    saveCart(cart);
    renderCart();
}

function removeItem(id) {
    const cart = getCart().filter(x => x.id !== id);
    saveCart(cart);
    renderCart();
}

document.addEventListener('DOMContentLoaded', renderCart);