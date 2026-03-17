/* ══════════════════════════════════════════════════════════════
   OSISS™ SHOPIFY THEME — main.js
   Shopify Ajax Cart API + UI Interactions
══════════════════════════════════════════════════════════════ */
'use strict';

/* ── CONSTANTS ─────────────────────────────────────────────── */
const FREE_SHIP = 2000;
const STD_SHIP  = 250;
const WA_NUM    = '923021345111';

/* ── TOAST NOTIFICATION ────────────────────────────────────── */
function showToast(msg, duration = 2800) {
  let t = document.getElementById('osiss-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'osiss-toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

/* ══ SHOPIFY AJAX CART API ══════════════════════════════════ */
async function fetchCart() {
  const r = await fetch('/cart.js', { headers: { 'Content-Type': 'application/json' } });
  return r.json();
}

async function addItemToCart(variantId, quantity = 1, properties = {}) {
  const r = await fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ id: variantId, quantity, properties }] })
  });
  if (!r.ok) throw new Error('Could not add item');
  return r.json();
}

async function updateCartItem(key, quantity) {
  const r = await fetch('/cart/change.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: key, quantity })
  });
  return r.json();
}

async function removeCartItem(key) {
  return updateCartItem(key, 0);
}

/* ── MONEY FORMAT ──────────────────────────────────────────── */
function formatMoney(cents) {
  return 'PKR ' + (cents / 100).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/* ══ CART DRAWER ═════════════════════════════════════════════ */
let cartData = null;

async function openCart() {
  cartData = await fetchCart();
  renderCartDrawer(cartData);
  document.getElementById('cartOv').classList.add('open');
  document.getElementById('cartDrawer').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartOv')?.classList.remove('open');
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.body.style.overflow = '';
}

function renderCartDrawer(cart) {
  const body  = document.getElementById('cartBody');
  const badge = document.getElementById('cartBadge');
  const count = cart.item_count;

  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('show', count > 0);
  }

  if (!body) return;

  if (count === 0) {
    body.innerHTML = `<div class="cart-empty">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:#ddd">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      <p>YOUR CART IS EMPTY</p>
    </div>`;
    renderCartFooter(cart);
    return;
  }

  body.innerHTML = cart.items.map(item => `
    <div class="cart-item" data-key="${item.key}">
      <div class="cart-thumb">
        <img src="${item.image || ''}" alt="${item.product_title}" loading="lazy" width="54" height="68">
      </div>
      <div class="cart-info">
        <p class="ci-name">${item.product_title}</p>
        <p class="ci-sub">${item.variant_title !== 'Default Title' ? item.variant_title : ''}</p>
        <p class="ci-price">${formatMoney(item.final_line_price)}</p>
        <div class="qty-ctrl">
          <button class="qbtn" onclick="changeQty('${item.key}', ${item.quantity - 1})">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <span class="qnum">${item.quantity}</span>
          <button class="qbtn" onclick="changeQty('${item.key}', ${item.quantity + 1})">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      </div>
      <button class="cart-rm" onclick="removeItem('${item.key}')" aria-label="Remove">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>`).join('');

  renderCartFooter(cart);
}

function renderCartFooter(cart) {
  const foot = document.getElementById('cartFoot');
  if (!foot) return;

  const subtotal  = cart.total_price;
  const shipping  = subtotal >= FREE_SHIP * 100 ? 0 : STD_SHIP * 100;
  const remaining = Math.max(0, FREE_SHIP * 100 - subtotal);
  const pct       = Math.min(100, (subtotal / (FREE_SHIP * 100)) * 100);
  const unlocked  = shipping === 0;

  const waMsg = encodeURIComponent(
    'Hi OSISS! I want to place an order:\n' +
    (cart.items || []).map(i => `• ${i.product_title} x${i.quantity} = ${formatMoney(i.final_line_price)}`).join('\n') +
    `\nTotal: ${formatMoney(subtotal)}\nPlease confirm my order.`
  );

  foot.innerHTML = `
    <div class="ship-prog">
      <p class="prog-msg${unlocked ? ' unlocked' : ''}">
        ${unlocked ? '🎉 FREE SHIPPING UNLOCKED!' : `Add ${formatMoney(remaining)} more for free shipping`}
      </p>
      <div class="prog-track"><div class="prog-fill${unlocked ? ' done' : ''}" style="width:${pct}%"></div></div>
    </div>
    <div class="cart-foot">
      <div class="cart-totals">
        <div class="ctr"><span class="ctr-l">Subtotal</span><span class="ctr-v">${formatMoney(subtotal)}</span></div>
        <div class="ctr"><span class="ctr-l">Shipping</span><span class="ctr-v${unlocked ? ' free' : ''}">${unlocked ? 'FREE' : formatMoney(shipping)}</span></div>
        <div class="ctr cart-grand">
          <span class="ctr-l">Total</span>
          <span class="ctr-v">${formatMoney(subtotal + shipping)}</span>
        </div>
      </div>
      <a href="/checkout" class="btn-checkout" style="display:block;text-align:center;text-decoration:none">CHECKOUT SECURELY →</a>
      <a href="https://wa.me/${WA_NUM}?text=${waMsg}" target="_blank" class="btn-wa" style="display:flex;text-decoration:none" rel="noopener">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.122 1.523 5.856L0 24l6.335-1.518A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 0 1-5.006-1.373l-.357-.213-3.764.902.955-3.668-.232-.376A9.793 9.793 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z"/></svg>
        ORDER VIA WHATSAPP
      </a>
      <button onclick="closeCart()" class="btn-continue">CONTINUE SHOPPING</button>
    </div>`;
}

async function changeQty(key, qty) {
  const cart = qty <= 0 ? await removeCartItem(key) : await updateCartItem(key, qty);
  cartData = cart;
  renderCartDrawer(cart);
  updateHeaderBadge(cart.item_count);
}

async function removeItem(key) {
  const cart = await removeCartItem(key);
  cartData = cart;
  renderCartDrawer(cart);
  updateHeaderBadge(cart.item_count);
}

function updateHeaderBadge(count) {
  const badge = document.getElementById('cartBadge');
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('show', count > 0);
  }
}

/* ══ ADD TO CART (called from product cards) ═════════════════ */
async function addToCart(variantId, btn) {
  if (!variantId) return;
  const origText = btn ? btn.textContent : '';
  if (btn) { btn.textContent = '...'; btn.disabled = true; }
  try {
    await addItemToCart(variantId);
    const cart = await fetchCart();
    updateHeaderBadge(cart.item_count);
    showToast('✓ ADDED TO CART');
    if (btn) { btn.textContent = '✓ ADDED!'; btn.style.background = '#2d6a4f'; }
    setTimeout(() => {
      if (btn) { btn.textContent = origText; btn.style.background = ''; btn.disabled = false; }
    }, 2000);
    openCart();
  } catch(e) {
    showToast('Error adding item. Please try again.');
    if (btn) { btn.textContent = origText; btn.disabled = false; }
  }
}

/* ══ DRAWER NAV ══════════════════════════════════════════════ */
function openDrawer() {
  document.getElementById('drawerOverlay')?.classList.add('open');
  document.getElementById('drawerPanel')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  document.getElementById('drawerOverlay')?.classList.remove('open');
  document.getElementById('drawerPanel')?.classList.remove('open');
  document.body.style.overflow = '';
}
function toggleDrawerCat(id) {
  const sub = document.getElementById(id);
  const btn = sub?.previousElementSibling;
  if (!sub) return;
  const isOpen = sub.classList.contains('open');
  document.querySelectorAll('.drawer-subcat').forEach(el => el.classList.remove('open'));
  document.querySelectorAll('.drawer-cat-btn').forEach(el => el.classList.remove('open'));
  if (!isOpen) {
    sub.classList.add('open');
    btn?.classList.add('open');
  }
}

/* ══ WISHLIST ════════════════════════════════════════════════ */
let wishlist = JSON.parse(localStorage.getItem('osiss_wl') || '[]');

function saveWishlist() {
  localStorage.setItem('osiss_wl', JSON.stringify(wishlist));
}

function toggleWishlist(productId, productTitle, productPrice, productImg) {
  const idx = wishlist.findIndex(i => i.id === productId);
  if (idx > -1) {
    wishlist.splice(idx, 1);
    showToast('REMOVED FROM WISHLIST');
  } else {
    wishlist.push({ id: productId, title: productTitle, price: productPrice, img: productImg });
    showToast('❤ ADDED TO WISHLIST');
  }
  saveWishlist();
  updateWishlistBtns();
  renderWishlist();
}

function updateWishlistBtns() {
  document.querySelectorAll('[data-wishlist-id]').forEach(btn => {
    const id = btn.getAttribute('data-wishlist-id');
    const active = wishlist.some(i => i.id === id);
    btn.style.color = active ? '#c8a951' : '';
  });
}

function openWishlist() {
  renderWishlist();
  document.getElementById('wlOverlay')?.classList.add('open');
  document.getElementById('wlPanel')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeWishlist() {
  document.getElementById('wlOverlay')?.classList.remove('open');
  document.getElementById('wlPanel')?.classList.remove('open');
  document.body.style.overflow = '';
}

function renderWishlist() {
  const body = document.getElementById('wlBody');
  if (!body) return;
  if (wishlist.length === 0) {
    body.innerHTML = '<p style="padding:40px 20px;text-align:center;font-size:11px;color:#bbb;font-weight:700;letter-spacing:1px;text-transform:uppercase">Your wishlist is empty</p>';
    return;
  }
  body.innerHTML = wishlist.map(item => `
    <div style="display:flex;gap:12px;padding:14px 0;border-bottom:1px solid #f0f0f0;align-items:center">
      <div style="width:54px;height:68px;background:#f5f5f5;flex-shrink:0;overflow:hidden">
        <img src="${item.img || ''}" alt="${item.title}" style="width:100%;height:100%;object-fit:contain;padding:4px" loading="lazy">
      </div>
      <div style="flex:1;min-width:0">
        <p style="font-size:9px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;margin-bottom:4px">${item.title}</p>
        <p style="font-size:11px;font-weight:700;margin-bottom:8px">${item.price}</p>
        <a href="/products/${item.id}" style="display:inline-block;font-size:8px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;background:#000;color:#fff;padding:6px 14px">VIEW →</a>
      </div>
      <button onclick="toggleWishlist('${item.id}')" style="background:none;border:none;padding:4px;color:#ccc;cursor:pointer" aria-label="Remove">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>`).join('');
}

/* ══ SALE COUNTDOWN ══════════════════════════════════════════ */
function initSaleCountdown() {
  const SALE_KEY = 'osiss_sale_end';
  let saleEnd = parseInt(sessionStorage.getItem(SALE_KEY) || '0');
  const now = Date.now();
  if (!saleEnd || saleEnd < now) {
    saleEnd = now + (47 * 3600 + 59 * 60) * 1000;
    sessionStorage.setItem(SALE_KEY, saleEnd);
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function tick() {
    const diff = Math.max(0, saleEnd - Date.now());
    const hh = Math.floor(diff / 3600000);
    const mm = Math.floor((diff % 3600000) / 60000);
    const ss = Math.floor((diff % 60000) / 1000);
    const hhEl = document.getElementById('saleHH');
    const mmEl = document.getElementById('saleMM');
    const ssEl = document.getElementById('saleSS');
    if (!hhEl) return;
    if (hhEl.textContent !== pad(hh)) { hhEl.textContent = pad(hh); hhEl.classList.add('flip'); setTimeout(() => hhEl.classList.remove('flip'), 300); }
    if (mmEl.textContent !== pad(mm)) { mmEl.textContent = pad(mm); mmEl.classList.add('flip'); setTimeout(() => mmEl.classList.remove('flip'), 300); }
    ssEl.textContent = pad(ss);
    if (diff <= 0) { saleEnd = Date.now() + (47 * 3600 + 59 * 60) * 1000; sessionStorage.setItem(SALE_KEY, saleEnd); }
  }
  tick();
  setInterval(tick, 1000);
}

/* ══ SOCIAL PROOF BADGES ═════════════════════════════════════ */
function initSocialProof() {
  // Viewers refresh every 10s
  setInterval(() => {
    document.querySelectorAll('[data-viewer-badge]').forEach(el => {
      const n = Math.floor(Math.random() * 8) + 8;
      el.textContent = n + ' viewing now';
    });
  }, 10000);
}

/* ══ PRODUCT PAGE ════════════════════════════════════════════ */
function initProductPage() {
  // Variant selection
  document.querySelectorAll('.var-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.prod-var-opts');
      group?.querySelectorAll('.var-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Thumbnail gallery
  document.querySelectorAll('.prod-thumb').forEach((thumb, i) => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.prod-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      const mainImg = document.querySelector('.prod-main-img img');
      if (mainImg) mainImg.src = thumb.querySelector('img')?.src || '';
    });
  });

  // ATC button
  const atcBtn = document.getElementById('prodAtcBtn');
  if (atcBtn) {
    atcBtn.addEventListener('click', async () => {
      const variantId = atcBtn.getAttribute('data-variant-id');
      const qtyEl = document.getElementById('prodQty');
      const qty = qtyEl ? parseInt(qtyEl.textContent) || 1 : 1;
      if (!variantId) return;
      atcBtn.textContent = '...';
      atcBtn.disabled = true;
      try {
        await addItemToCart(parseInt(variantId), qty);
        const cart = await fetchCart();
        updateHeaderBadge(cart.item_count);
        showToast('✓ ADDED TO CART');
        atcBtn.textContent = '✓ ADDED TO CART!';
        atcBtn.style.background = '#2d6a4f';
        setTimeout(() => {
          atcBtn.textContent = 'ADD TO CART';
          atcBtn.style.background = '';
          atcBtn.disabled = false;
        }, 2200);
        openCart();
      } catch(e) {
        atcBtn.textContent = 'ADD TO CART';
        atcBtn.disabled = false;
        showToast('Out of stock or unavailable.');
      }
    });
  }

  // Qty controls
  const qtyEl = document.getElementById('prodQty');
  document.getElementById('prodQtyMinus')?.addEventListener('click', () => {
    if (qtyEl) qtyEl.textContent = Math.max(1, parseInt(qtyEl.textContent) - 1);
  });
  document.getElementById('prodQtyPlus')?.addEventListener('click', () => {
    if (qtyEl) qtyEl.textContent = Math.min(10, parseInt(qtyEl.textContent) + 1);
  });
}

/* ══ COLLECTION FILTER / SORT ════════════════════════════════ */
function initCollection() {
  const sortEl = document.getElementById('collectionSort');
  if (sortEl) {
    sortEl.addEventListener('change', () => {
      const url = new URL(window.location);
      url.searchParams.set('sort_by', sortEl.value);
      window.location = url;
    });
  }
}

/* ══ FAQ ACCORDION ═══════════════════════════════════════════ */
function initFaq() {
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const a = q.nextElementSibling;
      const isOpen = q.classList.contains('open');
      document.querySelectorAll('.faq-q').forEach(el => { el.classList.remove('open'); el.nextElementSibling?.classList.remove('open'); });
      if (!isOpen) { q.classList.add('open'); a?.classList.add('open'); }
    });
  });
}

/* ══ NEWSLETTER FORM ═════════════════════════════════════════ */
function initNewsletter() {
  const forms = document.querySelectorAll('.foot-nl-form');
  forms.forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const inp = form.querySelector('.foot-nl-input');
      if (inp && inp.value.includes('@')) {
        showToast('✓ SUBSCRIBED! Thank you.');
        inp.value = '';
      }
    });
  });
}

/* ══ CONTACT FORM ════════════════════════════════════════════ */
function initContactForm() {
  const form = document.getElementById('contactForm');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    showToast('✓ MESSAGE SENT! We\'ll reply within 24 hours.');
    form.reset();
  });
}

/* ══ STICKY HEADER SCROLL ════════════════════════════════════ */
function initHeaderScroll() {
  // Already sticky via CSS
}

/* ══ INIT ════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Cart
  const cartOpenBtn = document.getElementById('cartOpenBtn');
  const cartOv      = document.getElementById('cartOv');
  cartOpenBtn?.addEventListener('click', openCart);
  cartOv?.addEventListener('click', closeCart);

  // Drawer
  document.getElementById('burgerBtn')?.addEventListener('click', openDrawer);
  document.getElementById('drawerOverlay')?.addEventListener('click', closeDrawer);
  document.getElementById('drawerCloseBtn')?.addEventListener('click', closeDrawer);

  // Wishlist
  document.getElementById('wishlistBtn')?.addEventListener('click', openWishlist);
  document.getElementById('wlOverlay')?.addEventListener('click', closeWishlist);
  document.getElementById('wlClose')?.addEventListener('click', closeWishlist);

  // ESC key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeCart(); closeDrawer(); closeWishlist(); }
  });

  // Init modules
  initSaleCountdown();
  initSocialProof();
  initProductPage();
  initCollection();
  initFaq();
  initNewsletter();
  initContactForm();
  updateWishlistBtns();

  // Fetch initial cart count
  fetchCart().then(cart => updateHeaderBadge(cart.item_count)).catch(() => {});
});
