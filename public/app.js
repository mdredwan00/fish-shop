// Simple frontend: fetch fish, add to cart, place order
let fishList = [];
let cart = []; // {id, name, price, qty}

const fishListDiv = document.getElementById('fish-list');
const cartListDiv = document.getElementById('cart-list');
const cartTotalDiv = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkoutBtn');
const customerNameInput = document.getElementById('customerName');
const messageDiv = document.getElementById('message');

async function loadFish() {
  const res = await fetch('/api/fish');
  fishList = await res.json();
  renderFish();
}

function renderFish() {
  fishListDiv.innerHTML = '';
  fishList.forEach(f => {
    const div = document.createElement('div');
    div.className = 'fish';
    div.innerHTML = `
      <div>
        <div class="fish-name">${f.name}</div>
        <div class="fish-meta">${f.desc || ''} Price: $${f.price.toFixed(2)} | Available: ${f.qty}</div>
      </div>
      <div>
        <input type="number" min="1" max="${f.qty}" value="1" id="qty-${f.id}" style="width:60px;" />
        <button ${f.qty === 0 ? 'disabled' : ''} onclick="addToCart(${f.id})">Add</button>
      </div>
    `;
    fishListDiv.appendChild(div);
  });
  renderCart();
}

function addToCart(id) {
  const input = document.getElementById(`qty-${id}`);
  const qty = Number(input.value) || 1;
  const fish = fishList.find(f => f.id === id);
  if (!fish || qty <= 0) return;
  // if adding more than available, limit it
  const inCart = cart.find(c => c.id === id);
  const already = inCart ? inCart.qty : 0;
  if (already + qty > fish.qty) {
    alert('Not enough stock available.');
    return;
  }
  if (inCart) {
    inCart.qty += qty;
  } else {
    cart.push({ id: fish.id, name: fish.name, price: fish.price, qty });
  }
  renderCart();
}

function renderCart() {
  cartListDiv.innerHTML = '';
  if (cart.length === 0) {
    cartListDiv.textContent = 'Cart is empty';
    cartTotalDiv.textContent = '';
    return;
  }
  let total = 0;
  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `<div>${item.name} x ${item.qty}</div>
                     <div>$${(item.price * item.qty).toFixed(2)} <button onclick="removeFromCart(${item.id})">Remove</button></div>`;
    cartListDiv.appendChild(row);
    total += item.price * item.qty;
  });
  cartTotalDiv.textContent = 'Total: $' + total.toFixed(2);
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  renderCart();
}

checkoutBtn.addEventListener('click', async () => {
  messageDiv.textContent = '';
  const customerName = customerNameInput.value.trim();
  if (!customerName) {
    messageDiv.textContent = 'Enter your name before checkout';
    return;
  }
  if (cart.length === 0) {
    messageDiv.textContent = 'Cart is empty';
    return;
  }
  const items = cart.map(c => ({ id: c.id, qty: c.qty }));
  const res = await fetch('/api/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerName, items })
  });
  const data = await res.json();
  if (!res.ok) {
    messageDiv.textContent = data.error || 'Failed to place order';
    return;
  }
  messageDiv.textContent = 'Order placed! Order ID: ' + data.order.id;
  cart = [];
  await loadFish(); // refresh stock numbers
});
 
// start
loadFish();

