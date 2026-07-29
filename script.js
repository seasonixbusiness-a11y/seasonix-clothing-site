// ============================================================
// SEASONIX CLOTHING — SITE LOGIC
// Cart persists in localStorage. Checkout builds a message and
// opens Instagram DM with the order copied to clipboard.
// ============================================================

// Your Instagram handle — order summary gets copied to clipboard,
// then your Instagram DMs open so the customer can paste it in.
const INSTAGRAM_USERNAME = "seasonix.clothing";

const DELIVERY_FLAT = 80; // ৳ flat delivery fee — adjust as needed, or set to 0

// ---------- State ----------
let cart = JSON.parse(localStorage.getItem("seasonix_cart") || "[]");
const selectedSizes = {}; // productId -> size currently chosen on the card

function saveCart(){
  localStorage.setItem("seasonix_cart", JSON.stringify(cart));
  renderCartCount();
  renderReceipt();
}

// ---------- Product Grid ----------
function renderGrid(filter = "all"){
  const grid = document.getElementById("productGrid");
  grid.innerHTML = "";
  const items = filter === "all" ? PRODUCTS : PRODUCTS.filter(p => p.category === filter);

  items.forEach(p => {
    if(!selectedSizes[p.id]) selectedSizes[p.id] = p.sizes[0];

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-string"></div>
      <div class="card-tag">
        <div class="card-hole"></div>
        <div class="card-media">
          ${p.img
            ? `<img src="${p.img}" alt="${p.name}">`
            : `<span class="card-placeholder">Photo coming soon<br>${p.name}</span>`
          }
          ${p.tag ? `<span class="card-badge">${p.tag}</span>` : ""}
        </div>
        <div class="card-body">
          <p class="card-name">${p.name}</p>
          <div class="card-row">
            <span class="card-price">৳${p.price}</span>
            <div class="card-sizes" data-id="${p.id}">
              ${p.sizes.map(s => `<button class="size-chip ${s === selectedSizes[p.id] ? "selected" : ""}" data-size="${s}">${s}</button>`).join("")}
            </div>
          </div>
          <button class="card-add" data-id="${p.id}">Add to Cart</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll(".card-sizes").forEach(row => {
    row.addEventListener("click", e => {
      const btn = e.target.closest(".size-chip");
      if(!btn) return;
      const id = row.dataset.id;
      selectedSizes[id] = btn.dataset.size;
      row.querySelectorAll(".size-chip").forEach(c => c.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });

  grid.querySelectorAll(".card-add").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const product = PRODUCTS.find(p => p.id === id);
      const size = selectedSizes[id];
      const existing = cart.find(c => c.id === id && c.size === size);
      if(existing){
        existing.qty += 1;
      } else {
        cart.push({ id, name: product.name, price: product.price, size, qty: 1 });
      }
      saveCart();
      openCart();
      btn.textContent = "Added ✓";
      setTimeout(() => { btn.textContent = "Add to Cart"; }, 900);
    });
  });
}

// ---------- Filters ----------
document.getElementById("filters").addEventListener("click", e => {
  const chip = e.target.closest(".filter-chip");
  if(!chip) return;
  document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
  chip.classList.add("active");
  renderGrid(chip.dataset.filter);
});

// ---------- Cart Drawer ----------
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");

function openCart(){
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("open");
}
function closeCart(){
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("open");
}
document.getElementById("cartToggle").addEventListener("click", openCart);
document.getElementById("cartClose").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

function renderCartCount(){
  const count = cart.reduce((sum, c) => sum + c.qty, 0);
  document.getElementById("cartCount").textContent = count;
}

function renderReceipt(){
  const wrap = document.getElementById("receiptItems");
  if(cart.length === 0){
    wrap.innerHTML = `<p class="empty-cart">Your basket's empty. Go grab something off the rack.</p>`;
    document.getElementById("receiptSubtotal").textContent = "৳0";
    document.getElementById("receiptDelivery").textContent = "—";
    document.getElementById("receiptTotal").textContent = "৳0";
    return;
  }

  wrap.innerHTML = cart.map((c, i) => `
    <div class="receipt-item">
      <span class="receipt-item-name">${c.name}</span>
      <span class="receipt-item-price">৳${c.price * c.qty}</span>
      <span class="receipt-item-meta">SIZE ${c.size}</span>
      <span></span>
      <div class="receipt-item-qty">
        <button data-i="${i}" data-op="dec">−</button>
        <span>${c.qty}</span>
        <button data-i="${i}" data-op="inc">+</button>
      </div>
      <button class="receipt-item-remove" data-i="${i}" data-op="remove">remove</button>
    </div>
  `).join("");

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const delivery = DELIVERY_FLAT;
  document.getElementById("receiptSubtotal").textContent = `৳${subtotal}`;
  document.getElementById("receiptDelivery").textContent = `৳${delivery}`;
  document.getElementById("receiptTotal").textContent = `৳${subtotal + delivery}`;

  wrap.querySelectorAll("button[data-op]").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.i);
      const op = btn.dataset.op;
      if(op === "inc") cart[i].qty += 1;
      if(op === "dec") cart[i].qty = Math.max(1, cart[i].qty - 1);
      if(op === "remove") cart.splice(i, 1);
      saveCart();
    });
  });
}

// ---------- Checkout -> Instagram DM ----------
document.getElementById("checkoutForm").addEventListener("submit", async e => {
  e.preventDefault();
  if(cart.length === 0){
    alert("Your basket is empty — add something from the rack first.");
    return;
  }

  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const address = document.getElementById("custAddress").value.trim();

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const total = subtotal + DELIVERY_FLAT;

  const lines = cart.map(c => `• ${c.name} (Size ${c.size}) x${c.qty} — ৳${c.price * c.qty}`).join("\n");

  const message =
`New order from the Seasonix website 🛍️

${lines}

Subtotal: ৳${subtotal}
Delivery: ৳${DELIVERY_FLAT}
Total: ৳${total}

Name: ${name}
Phone: ${phone}
Address: ${address}`;

  try{
    await navigator.clipboard.writeText(message);
    alert("Your order's copied! Instagram DMs will open next — just paste (long-press → Paste) and hit send.");
  } catch(err){
    alert("Couldn't auto-copy — here's your order, screenshot or copy it manually:\n\n" + message);
  }

  window.open(`https://ig.me/m/${INSTAGRAM_USERNAME}`, "_blank");

  cart = [];
  saveCart();
  e.target.reset();
});

// ---------- Init ----------
renderGrid();
renderCartCount();
renderReceipt();
