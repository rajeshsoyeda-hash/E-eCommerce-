let currentUser=null,currentPage='home',selCat='All',selProduct=null,detailQty=1,adminTab='orders',editProdId=null,maxPrice=200000,sortBy='featured';

// AUTH
function switchAuthTab(tab){
  document.querySelectorAll('.auth-tab').forEach((t,i)=>t.classList.toggle('active',(i===0)===(tab==='login')));
  document.getElementById('loginForm').style.display=tab==='login'?'block':'none';
  document.getElementById('registerForm').style.display=tab==='register'?'block':'none';
  document.getElementById('authError').style.display='none';
}
function fillDemo(e,p){document.getElementById('loginEmail').value=e;document.getElementById('loginPass').value=p;switchAuthTab('login');}
function showAuthError(m){const el=document.getElementById('authError');el.textContent=m;el.style.display='block';}
function handleLogin(){
  const e=document.getElementById('loginEmail').value.trim(),p=document.getElementById('loginPass').value;
  if(!e||!p){showAuthError('Fill all fields.');return;}
  const user=DB.users().find(u=>u.email===e&&u.password===p);
  if(!user){showAuthError('Invalid email or password.');return;}
  DB.save('session',user);startApp(user);
}
function handleRegister(){
  const n=document.getElementById('regName').value.trim(),e=document.getElementById('regEmail').value.trim(),p=document.getElementById('regPass').value;
  if(!n||!e||!p){showAuthError('Fill all fields.');return;}
  if(p.length<6){showAuthError('Password min 6 chars.');return;}
  const users=DB.users();
  if(users.find(u=>u.email===e)){showAuthError('Email exists.');return;}
  const nu={id:Date.now(),name:n,email:e,password:p,role:'user'};
  users.push(nu);DB.save('users',users);DB.save('session',nu);startApp(nu);
}
function handleLogout(){DB.save('session',null);DB.save('cart',[]);currentUser=null;document.getElementById('authScreen').style.display='flex';document.getElementById('appScreen').style.display='none';showToast('Signed out.','info');}
function startApp(user){
  currentUser=user;
  document.getElementById('authScreen').style.display='none';
  document.getElementById('appScreen').style.display='block';
  document.getElementById('headerName').textContent=user.name.split(' ')[0];
  document.getElementById('headerAvatar').textContent=user.name.charAt(0).toUpperCase();
  const roleTag=document.getElementById('headerRole'),adminLink=document.getElementById('adminNavLink');
  if(user.role==='admin'){
    roleTag.style.display='inline';
    adminLink.style.display='inline';
    const pendingReqs = DB.orders().filter(o => (o.status==='Pending' || o.orderStatus==='Pending')).length;
    if (pendingReqs > 0) {
      setTimeout(() => {
        showToast(`🔔 Admin Alert: ${pendingReqs} new order request(s) waiting for your confirmation!`, 'info');
      }, 800);
    }
  }
  else{roleTag.style.display='none';adminLink.style.display='none';}
  showPage('home');updateCartBadge();
  showToast('Welcome, '+user.name.split(' ')[0]+'! 🛍️','success');
}

// ROUTING
function showPage(page){
  if((page==='checkout'||page==='orders') && !currentUser){
    showToast('Please sign in to continue 🔒','info');
    document.getElementById('authScreen').style.display='flex';
    document.getElementById('appScreen').style.display='none';
    return;
  }
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(n=>n.classList.remove('active'));
  currentPage=page;
  document.getElementById('page-'+page)?.classList.add('active');
  const nm={home:0,products:1,orders:2,admin:4};
  const nl=document.querySelectorAll('.nav-link');
  if(nm[page]!==undefined)nl[nm[page]]?.classList.add('active');
  if(page==='home')renderFeatured();
  if(page==='products'){selCat='All';renderCategories();renderAllProducts();}
  if(page==='orders')renderOrders();
  if(page==='admin'){
    if(currentUser?.role!=='admin'){
      showToast('Admin access required!','error');
      showPage('home');
      return;
    }
    adminOrderFilter = 'All';
    adminOrderSearch = '';
    renderAdmin();
  }
  if(page==='checkout')renderCheckout();
  window.scrollTo(0,0);closeCart();
}

// SKELETON LOADERS
function renderSkeletons(containerId, count=8){
  const el=document.getElementById(containerId);if(!el)return;
  const skeletonHtml=`<div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-body"><div class="skeleton-line short"></div><div class="skeleton-line title"></div><div class="skeleton-line medium"></div><div class="skeleton-line full" style="height:32px;margin-top:6px;border-radius:8px"></div></div></div>`;
  el.innerHTML=Array(count).fill(skeletonHtml).join('');
}

let selectedColor='Midnight Slate',selectedSize='Standard',currentQvQty=1;

// PRODUCTS
function productCard(p){
  const cat=CAT_COLORS[p.category]||{bg:'#f3f4f6',color:'#555'};
  const isWish=DB.wishlist().includes(p.id);
  const isOut=p.stock===0;
  return`<div class="product-card" onclick="openQuickView(${p.id})">
    <div class="product-img" style="background:${cat.bg}">
      ${isOut?`<div class="product-badge badge-red">OUT OF STOCK</div>`:(p.badge?`<div class="product-badge" style="${BADGE_STYLES[p.badge]||''}">${p.badge}</div>`:'')}
      <div class="product-wishlist ${isWish?'active':''}" onclick="event.stopPropagation();toggleWishlist(${p.id})">${isWish?'💖':'❤️'}</div>
      <span>${p.emoji||'📦'}</span>
    </div>
    <div class="product-body">
      <div class="product-cat">${p.category}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-rating"><span class="stars">${'★'.repeat(Math.floor(p.rating||4))}${'☆'.repeat(5-Math.floor(p.rating||4))}</span><span class="rating-count">(${(p.reviews||0).toLocaleString()})</span></div>
      <div class="product-footer">
        <div class="product-price">₹${p.price.toLocaleString()}${p.original?`<span class="original">₹${p.original.toLocaleString()}</span>`:''}</div>
        <button class="add-cart-btn ${isOut?'btn-disabled':''}" ${isOut?'disabled':''} onclick="event.stopPropagation();addToCart(${p.id})">+</button>
      </div>
    </div>
  </div>`;
}
function renderFeatured(){
  renderSkeletons('featuredGrid', 4);
  setTimeout(()=>{ document.getElementById('featuredGrid').innerHTML=DB.products().slice(0,8).map(productCard).join(''); }, 200);
}
function renderCategories(){
  const cats=['All',...new Set(DB.products().map(p=>p.category))];
  document.getElementById('categoriesRow').innerHTML=cats.map(c=>`<div class="cat-pill ${c===selCat?'active':''}" onclick="filterByCategory('${c}')">${CAT_EMOJI[c]||''} ${c}</div>`).join('');
}
function handlePriceSlider(val){
  maxPrice=parseFloat(val)||200000;
  const el=document.getElementById('priceValue');
  if(el) el.textContent='₹'+maxPrice.toLocaleString('en-IN');
  renderAllProducts();
}
function handleSortChange(val){
  sortBy=val;
  renderAllProducts();
}
function renderAllProducts(){
  renderSkeletons('allProductsGrid', 8);
  setTimeout(()=>{
    let prods=DB.products();
    if(selCat!=='All') prods=prods.filter(p=>p.category===selCat);
    
    // Price Range Filter
    prods=prods.filter(p=>p.price <= maxPrice);

    // Full-Text Search (Name, Category, Description, Badge)
    const q=document.getElementById('searchInput').value.toLowerCase().trim();
    if(q){
      prods=prods.filter(p=>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.desc && p.desc.toLowerCase().includes(q)) ||
        (p.badge && p.badge.toLowerCase().includes(q))
      );
    }

    // Sorting Pipeline
    if(sortBy === 'price-low') prods.sort((a,b) => a.price - b.price);
    else if(sortBy === 'price-high') prods.sort((a,b) => b.price - a.price);
    else if(sortBy === 'rating') prods.sort((a,b) => (b.rating||0) - (a.rating||0));

    const totalCount=DB.products().length;
    document.getElementById('productCount').textContent=`Showing ${prods.length} of ${totalCount} products`;
    document.getElementById('allProductsGrid').innerHTML=prods.length ? prods.map(productCard).join('') : `<div style="grid-column:1/-1;text-align:center;padding:3.5rem;color:var(--text-muted)"><div style="font-size:3.5rem;margin-bottom:1rem">🔍</div><div style="font-size:1.1rem;font-weight:700;color:var(--text)">No matching products found</div><div style="font-size:0.85rem;margin-top:4px;color:var(--text-dim)">Try adjusting your price slider or search keywords.</div></div>`;
  }, 120);
}
function handleSearch(){if(currentPage==='products')renderAllProducts();else showPage('products');}

// WISHLIST PERSISTENCE
function toggleWishlist(id){
  let list=DB.wishlist();
  const idx=list.indexOf(id);
  let added=false;
  if(idx>=0){ list.splice(idx,1); }
  else{ list.push(id); added=true; }
  DB.save('wishlist',list);
  if(currentPage==='products') renderAllProducts();
  if(currentPage==='home') renderFeatured();
  showToast(added?'Added to wishlist ❤️':'Removed from wishlist','info');
}

// PROMO CODES SYSTEM
const PROMO_CODES={
  SAVE10:{code:'SAVE10',percent:10},
  PROMO20:{code:'PROMO20',percent:20},
  WELCOME50:{code:'WELCOME50',percent:50}
};

function applyPromoCode(){
  const input=document.getElementById('promoInput');
  if(!input)return;
  const val=input.value.trim().toUpperCase();
  if(!val){ showToast('Enter a promo code!','error'); return; }
  if(PROMO_CODES[val]){
    DB.save('promo',PROMO_CODES[val]);
    showToast(`Promo code ${val} applied! 🎉`,'success');
    renderCartSidebar();
    if(currentPage==='checkout') renderCheckout();
  }else{
    showToast('Invalid promo code! Try SAVE10 or PROMO20','error');
  }
}

function removePromoCode(){
  DB.save('promo',null);
  showToast('Promo code removed','info');
  renderCartSidebar();
  if(currentPage==='checkout') renderCheckout();
}

// QUICK VIEW MODAL
function openQuickView(id){
  const p=DB.products().find(p=>p.id===id);
  if(!p)return;
  selProduct=p;
  currentQvQty=1;
  selectedColor=p.category==='Fashion'?'Midnight Black':'Midnight Slate';
  selectedSize=p.category==='Electronics'?'256GB':(p.category==='Fashion'?'M':'Standard');

  const cat=CAT_COLORS[p.category]||{bg:'#f3f4f6',color:'#555'};
  const disc=p.original?Math.round((1-p.price/p.original)*100):0;
  
  const colors=p.category==='Fashion'?['Midnight Black','Classic Blue','Crimson Red']:['Midnight Slate','Titanium Silver','Deep Indigo'];
  const sizes=p.category==='Electronics'?['128GB','256GB','512GB']:(p.category==='Fashion'?['S','M','L','XL']:['Standard','Pro Max']);

  document.getElementById('quickViewContent').innerHTML=`
    <div class="qv-grid">
      <div>
        <div class="qv-preview-box" id="qvPreview" style="background:${cat.bg}">
          <span>${p.emoji||'📦'}</span>
        </div>
        <div class="qv-thumbnails">
          <div class="qv-thumb-pill active" onclick="switchQvThumb(this, '${p.emoji||'📦'}')">📐 Front</div>
          <div class="qv-thumb-pill" onclick="switchQvThumb(this, '🔄')">🔄 Angle</div>
          <div class="qv-thumb-pill" onclick="switchQvThumb(this, '🔍')">🔍 Detail</div>
        </div>
      </div>
      <div>
        <div style="font-size:.75rem;font-weight:700;color:var(--accent);letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px">${p.category}</div>
        <h2 style="font-size:1.4rem;font-weight:900;margin-bottom:6px">${p.name}</h2>
        <div class="product-rating" style="margin-bottom:10px"><span class="stars">${'★'.repeat(Math.floor(p.rating||4))}${'☆'.repeat(5-Math.floor(p.rating||4))}</span><span class="rating-count">${p.rating} (${(p.reviews||0).toLocaleString()})</span></div>
        <div class="detail-price-row" style="margin:.75rem 0">
          <div class="detail-price">₹${p.price.toLocaleString()}</div>
          ${p.original?`<div class="detail-original">₹${p.original.toLocaleString()}</div><div class="detail-discount">${disc}% OFF</div>`:''}
        </div>
        
        <div class="stock-indicator ${p.stock===0?'out-stock':(p.stock<15?'low-stock':'in-stock')}">
          ${p.stock===0?'❌ Out of Stock — 0 available':(p.stock<15?'⚠️ Low Stock — '+p.stock+' units left':'✓ In Stock — '+p.stock+' available')}
        </div>

        <div class="variant-group">
          <div class="variant-label">Select Color: <span id="selectedColorLabel" style="color:var(--text);font-weight:800">${selectedColor}</span></div>
          <div class="variant-pills">
            ${colors.map(c=>`<div class="variant-pill ${c===selectedColor?'active':''}" onclick="selectQvColor(this, '${c}')">${c}</div>`).join('')}
          </div>
        </div>

        <div class="variant-group">
          <div class="variant-label">Select Option: <span id="selectedSizeLabel" style="color:var(--text);font-weight:800">${selectedSize}</span></div>
          <div class="variant-pills">
            ${sizes.map(s=>`<div class="variant-pill ${s===selectedSize?'active':''}" onclick="selectQvSize(this, '${s}')">${s}</div>`).join('')}
          </div>
        </div>

        <div class="qty-row" style="margin-bottom:1.25rem">
          <span class="qty-label">Quantity:</span>
          <div style="display:flex;align-items:center;gap:8px">
            <button class="qty-btn" onclick="changeQvQty(-1)">−</button>
            <span class="qty-num" id="qvQtyNum">1</span>
            <button class="qty-btn" onclick="changeQvQty(1)">+</button>
          </div>
        </div>

        <div class="detail-btns">
          <button class="btn-primary ${p.stock===0?'btn-disabled':''}" ${p.stock===0?'disabled':''} onclick="addQvToCart()">🛒 Add to Cart</button>
          <button class="btn-outline ${p.stock===0?'btn-disabled':''}" ${p.stock===0?'disabled':''} onclick="addQvToCart();closeModal('quickViewModal');showPage('checkout')">⚡ Buy Now</button>
        </div>
      </div>
    </div>`;

  openModal('quickViewModal');
}

function switchQvThumb(el, icon){
  document.querySelectorAll('.qv-thumb-pill').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  const box=document.getElementById('qvPreview');
  if(box) box.innerHTML=`<span>${icon}</span>`;
}

function selectQvColor(el, color){
  selectedColor=color;
  el.parentElement.querySelectorAll('.variant-pill').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('selectedColorLabel').textContent=color;
}

function selectQvSize(el, size){
  selectedSize=size;
  el.parentElement.querySelectorAll('.variant-pill').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('selectedSizeLabel').textContent=size;
}

function changeQvQty(d){
  currentQvQty=Math.max(1,Math.min(selProduct?.stock||10,currentQvQty+d));
  const el=document.getElementById('qvQtyNum');
  if(el) el.textContent=currentQvQty;
}

function addQvToCart(){
  if(!selProduct)return;
  addToCart(selProduct.id, currentQvQty);
  closeModal('quickViewModal');
  showToast(`${selProduct.name} (${selectedColor}, ${selectedSize}) added to cart! 🛒`,'success');
}

function openDetail(id){
  const p=DB.products().find(p=>p.id===id);if(!p)return;
  selProduct=p;detailQty=1;
  const cat=CAT_COLORS[p.category]||{bg:'#f3f4f6',color:'#555'};
  const disc=p.original?Math.round((1-p.price/p.original)*100):0;
  document.getElementById('productDetailContent').innerHTML=`
    <div><div class="product-detail-img" style="background:${cat.bg}"><span style="font-size:7rem">${p.emoji||'📦'}</span></div></div>
    <div>
      <div style="font-size:.75rem;font-weight:700;color:var(--accent);letter-spacing:.08em;text-transform:uppercase;margin-bottom:.5rem">${p.category}</div>
      <h1 style="font-size:1.75rem;font-weight:900;letter-spacing:-.03em;margin-bottom:.5rem">${p.name}</h1>
      <div class="product-rating"><span class="stars" style="font-size:1rem">${'★'.repeat(Math.floor(p.rating||4))}${'☆'.repeat(5-Math.floor(p.rating||4))}</span><span class="rating-count">${p.rating} (${(p.reviews||0).toLocaleString()} reviews)</span></div>
      <div class="detail-price-row">
        <div class="detail-price">₹${p.price.toLocaleString()}</div>
        ${p.original?`<div class="detail-original">₹${p.original.toLocaleString()}</div><div class="detail-discount">${disc}% OFF</div>`:''}
      </div>
      <p class="detail-desc">${p.desc||'High quality product.'}</p>
      <div class="qty-row">
        <span class="qty-label">Quantity:</span>
        <div style="display:flex;align-items:center;gap:8px">
          <button class="qty-btn" onclick="changeDetailQty(-1)">−</button>
          <span class="qty-num" id="detailQtyNum">1</span>
          <button class="qty-btn" onclick="changeDetailQty(1)">+</button>
        </div>
        <span style="font-size:.8rem;color:${p.stock<10?'var(--rose)':'var(--emerald)'}">
          ${p.stock<10?'⚠ Only '+p.stock+' left':'✓ In Stock ('+p.stock+')'}
        </span>
      </div>
      <div class="detail-btns">
        <button class="btn-primary" onclick="addToCart(${p.id},detailQty);toggleCart()">🛒 Add to Cart</button>
        <button class="btn-outline" onclick="addToCart(${p.id},detailQty);showPage('checkout')">⚡ Buy Now</button>
      </div>
      <div class="spec-grid">
        <div class="spec-item"><div class="spec-label">Category</div><div class="spec-value">${p.category}</div></div>
        <div class="spec-item"><div class="spec-label">Stock</div><div class="spec-value">${p.stock} units</div></div>
        <div class="spec-item"><div class="spec-label">Rating</div><div class="spec-value">${p.rating} / 5.0 ★</div></div>
        <div class="spec-item"><div class="spec-label">Delivery</div><div class="spec-value">${p.price>=499?'Free':'₹40'}</div></div>
      </div>
    </div>`;
  showPage('detail');
}
function changeDetailQty(d){detailQty=Math.max(1,Math.min(selProduct?.stock||10,detailQty+d));document.getElementById('detailQtyNum').textContent=detailQty;}

// CART
function addToCart(id,qty=1){
  const p=DB.products().find(p=>p.id===id);if(!p)return;
  const cart=DB.cart(),ex=cart.find(c=>c.productId===id);
  if(ex)ex.qty=Math.min(ex.qty+qty,p.stock);
  else cart.push({productId:id,name:p.name,price:p.price,emoji:p.emoji,qty});
  DB.save('cart',cart);updateCartBadge();renderCartSidebar();
  showToast(p.name+' added to cart! 🛒','success');
}
function removeFromCart(id){DB.save('cart',DB.cart().filter(c=>c.productId!==id));updateCartBadge();renderCartSidebar();}
function changeCartQty(id,d){
  const cart=DB.cart(),item=cart.find(c=>c.productId===id);if(!item)return;
  item.qty=Math.max(1,item.qty+d);DB.save('cart',cart);updateCartBadge();renderCartSidebar();
}
function updateCartBadge(){
  const t=DB.cart().reduce((s,c)=>s+c.qty,0);
  const el=document.getElementById('cartCount');
  if(el){
    el.textContent=t;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }
  const elItem=document.getElementById('cartItemCount');
  if(elItem) elItem.textContent=t;
}
function toggleCart(){const c=document.getElementById('cartSidebar'),o=document.getElementById('cartOverlay');const op=c.classList.toggle('open');o.classList.toggle('show',op);if(op)renderCartSidebar();}
function closeCart(){document.getElementById('cartSidebar').classList.remove('open');document.getElementById('cartOverlay').classList.remove('show');}
function renderCartSidebar(){
  const cart=DB.cart(),body=document.getElementById('cartBody'),footer=document.getElementById('cartFooter');
  if(!cart.length){
    body.innerHTML=`<div class="cart-empty"><div class="cart-empty-icon">🛒</div><div style="font-weight:700;margin-bottom:.5rem">Your cart is empty</div><div style="font-size:.85rem">Add products to get started!</div></div>`;
    footer.innerHTML='';
    return;
  }
  body.innerHTML=cart.map(item=>`
    <div class="cart-item">
      <div class="cart-item-img">${item.emoji||'📦'}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${(item.price*item.qty).toLocaleString()}</div>
        <div class="qty-control">
          <button class="qty-btn" onclick="changeCartQty(${item.productId},-1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeCartQty(${item.productId},1)">+</button>
        </div>
      </div>
      <div class="remove-btn" onclick="removeFromCart(${item.productId})">✕</div>
    </div>`).join('');

  const sub=cart.reduce((s,c)=>s+c.price*c.qty,0);
  const activePromo=DB.promo();
  const disc=activePromo ? Math.round(sub*(activePromo.percent/100)) : 0;
  const del=sub>0 && (sub-disc)<499 ? 40 : 0;
  const total=Math.max(0, sub - disc + del);

  const promoHtml=activePromo?`
    <div class="promo-active-tag">
      <span>🎟 ${activePromo.code} (${activePromo.percent}% OFF)</span>
      <button class="promo-remove-btn" onclick="removePromoCode()">✕</button>
    </div>`:
    `<div class="promo-input-group">
      <input type="text" id="promoInput" class="promo-input" placeholder="PROMO CODE (e.g. SAVE10)">
      <button class="promo-apply-btn" onclick="applyPromoCode()">Apply</button>
    </div>`;

  footer.innerHTML=`
  <div class="promo-box">${promoHtml}</div>
  <div class="cart-summary">
    <div class="cart-row"><span>Subtotal</span><span>₹${sub.toLocaleString()}</span></div>
    ${disc>0?`<div class="cart-row discount-row"><span>Discount (${activePromo.code})</span><span>−₹${disc.toLocaleString()}</span></div>`:''}
    <div class="cart-row"><span>Delivery</span><span>${del===0?'<span style="color:var(--emerald)">FREE</span>':'₹'+del}</span></div>
    <div class="cart-row total"><span>Total</span><span>₹${total.toLocaleString()}</span></div>
  </div>
  <button class="checkout-btn" onclick="closeCart();showPage('checkout')">Proceed to Checkout →</button>`;
}

// CHECKOUT
function renderCheckout(){
  const cart=DB.cart();
  if(!cart.length){showPage('home');showToast('Cart is empty!','error');return;}
  const sub=cart.reduce((s,c)=>s+c.price*c.qty,0);
  const activePromo=DB.promo();
  const disc=activePromo ? Math.round(sub*(activePromo.percent/100)) : 0;
  const del=sub>0 && (sub-disc)<499 ? 40 : 0;
  const total=Math.max(0, sub - disc + del);

  document.getElementById('checkoutItems').innerHTML=cart.map(i=>`<div class="order-item-row"><div class="order-item-img">${i.emoji||'📦'}</div><div class="order-item-name">${i.name} ×${i.qty}</div><div class="order-item-price">₹${(i.price*i.qty).toLocaleString()}</div></div>`).join('');
  document.getElementById('checkoutSummary').innerHTML=`
    <div class="summary-row"><span>Subtotal</span><span>₹${sub.toLocaleString()}</span></div>
    ${disc>0?`<div class="summary-row discount-row" style="color:var(--emerald)"><span>Discount (${activePromo.code})</span><span>−₹${disc.toLocaleString()}</span></div>`:''}
    <div class="summary-row total"><span>Total</span><span>₹${total.toLocaleString()}</span></div>`;
  document.getElementById('ckName').value=currentUser?.name||'';
}

let adminOrderFilter = 'All', adminOrderSearch = '';

function getTimelineProgress(status) {
  switch (status) {
    case 'Pending':
      return { step: 1, percent: '0%', text: 'Order Placed & Pending Confirmation' };
    case 'Confirmed':
      return { step: 2, percent: '33%', text: 'Order Confirmed by Store' };
    case 'Shipped':
    case 'Out for Delivery':
      return { step: 3, percent: '66%', text: 'Order Out for Delivery 🚚' };
    case 'Delivered':
      return { step: 4, percent: '100%', text: 'Order Delivered Successfully 🎉' };
    case 'Cancelled':
      return { step: 0, percent: '0%', text: 'Order Cancelled ❌' };
    default:
      return { step: 1, percent: '0%', text: 'Processing Order' };
  }
}

function renderTimelineHTML(status) {
  const info = getTimelineProgress(status);
  if (status === 'Cancelled') {
    return `<div style="padding:1rem;background:var(--rose-light);border:1px solid rgba(244,63,94,0.3);border-radius:var(--r-sm);color:var(--rose);font-weight:700;text-align:center">
      ❌ Order Status: Cancelled
    </div>`;
  }
  return `
    <div class="order-tracker-card">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:0.78rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em">Real-Time Delivery Tracker</span>
        <span style="font-size:0.85rem;font-weight:800;color:var(--accent)">${info.text}</span>
      </div>
      <div class="timeline-tracker">
        <div class="timeline-progress" style="width: ${info.percent}"></div>
        
        <div class="timeline-step ${info.step >= 1 ? (info.step === 1 ? 'active' : 'completed') : ''}">
          <div class="step-node">${info.step > 1 ? '✓' : '📝'}</div>
          <div class="step-label">Order Placed</div>
        </div>

        <div class="timeline-step ${info.step >= 2 ? (info.step === 2 ? 'active' : 'completed') : ''}">
          <div class="step-node">${info.step > 2 ? '✓' : '⚙️'}</div>
          <div class="step-label">Confirmed</div>
        </div>

        <div class="timeline-step ${info.step >= 3 ? (info.step === 3 ? 'active' : 'completed') : ''}">
          <div class="step-node">${info.step > 3 ? '✓' : '🚚'}</div>
          <div class="step-label">Out for Delivery</div>
        </div>

        <div class="timeline-step ${info.step >= 4 ? 'completed active' : ''}">
          <div class="step-node">${info.step === 4 ? '🎉' : '🎁'}</div>
          <div class="step-label">Delivered</div>
        </div>
      </div>
    </div>
  `;
}

async function placeOrder(){
  if(!currentUser){
    showToast('Please sign in to place order 🔒','error');
    showPage('home');
    return;
  }
  const name=document.getElementById('ckName').value.trim();
  const phone=document.getElementById('ckPhone').value.trim();
  const pin=document.getElementById('ckPin').value.trim();
  const addr=document.getElementById('ckAddr').value.trim();

  if(!name||!phone||!addr||!pin){
    showToast('Fill all delivery details!','error');
    return;
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if(cleanPhone.length < 10){
    showToast('Enter a valid 10-digit phone number!','error');
    return;
  }

  if(!/^\d{6}$/.test(pin)){
    showToast('Enter a valid 6-digit PIN Code!','error');
    return;
  }

  const cart=DB.cart();
  if(!cart.length){
    showToast('Your cart is empty!','error');
    return;
  }

  // Deduct inventory in DB.products()
  const products = DB.products();
  for(const item of cart){
    const prod = products.find(p => p.id === item.productId);
    if(prod){
      prod.stock = Math.max(0, prod.stock - item.qty);
    }
  }
  DB.save('products', products);

  const sub=cart.reduce((s,c)=>s+c.price*c.qty,0);
  const activePromo=DB.promo();
  const disc=activePromo ? Math.round(sub*(activePromo.percent/100)) : 0;
  const del=sub>0 && (sub-disc)<499 ? 40 : 0;
  const total=Math.max(0, sub - disc + del);
  const pay=document.querySelector('input[name="payment"]:checked')?.value||'UPI';

  const btn = document.getElementById('placeOrderBtn');
  const originalText = btn ? btn.innerHTML : 'Place Order →';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⌛ Processing Order...';
  }

  const oid='ORD-'+new Date().getFullYear()+'-'+Math.floor(10000000+Math.random()*90000000);
  const orderPayload={
    id:oid,
    orderId:oid,
    userId:currentUser.id,
    customerName:name,
    items:cart.map(c=>({productId:c.productId,name:c.name,qty:c.qty,price:c.price,emoji:c.emoji})),
    cart:cart.map(c=>({productId:c.productId,name:c.name,qty:c.qty,price:c.price,emoji:c.emoji})),
    subtotal:sub,
    discount:disc,
    delivery:del,
    total,
    status:'Pending',
    orderStatus:'Pending',
    address:`${addr}, ${document.getElementById('ckCity').value}, ${document.getElementById('ckState').value} - ${pin}`,
    phone:phone,
    payment:pay,
    paymentMethod:pay,
    date:new Date().toISOString()
  };

  // Try POST to /api/orders (Express server API)
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json();
      console.log('Order created on backend:', data);
    }
  } catch (err) {
    console.warn('Server offline, saving locally in DB.orders()');
  }

  // Always save locally in DB.orders() for standalone fallback
  const orders=DB.orders();
  orders.unshift(orderPayload);
  DB.save('orders',orders);
  DB.save('cart',[]);
  DB.save('promo',null);
  updateCartBadge();

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }

  document.getElementById('successOrderId').textContent='Order #'+oid;
  showPage('success');
  showToast('Order placed successfully! 📦','success');
}

function renderOrders(){
  const orders=DB.orders().filter(o=>o.userId===currentUser?.id);
  const el=document.getElementById('ordersContent');
  if(!orders.length){
    el.innerHTML=`<div style="text-align:center;padding:3rem;color:var(--text-muted)"><div style="font-size:3rem;margin-bottom:1rem">📦</div><div style="font-weight:700;margin-bottom:.5rem">No orders placed yet</div><button class="btn-primary" style="max-width:200px;margin:1rem auto 0;display:flex" onclick="showPage('products')">Shop Now →</button></div>`;
    return;
  }
  el.innerHTML=`<table class="orders-table">
    <thead>
      <tr>
        <th>Order ID</th>
        <th>Items</th>
        <th>Total</th>
        <th>Payment</th>
        <th>Status</th>
        <th>Date</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      ${orders.map(o=>`<tr>
        <td><span style="font-family:var(--font-mono);font-weight:700;color:var(--accent)">${o.id || o.orderId}</span></td>
        <td>${(o.items || o.orderItems || []).map(i=>`${i.emoji||'📦'} ${i.name} (x${i.qty||i.quantity||1})`).join(', ')}</td>
        <td style="font-weight:700">₹${(o.total || o.totalAmount || 0).toLocaleString()}</td>
        <td>${(o.payment || o.paymentMethod || 'UPI').toUpperCase()}</td>
        <td><span class="badge ${STATUS_BADGE[o.status || o.orderStatus]||'badge-blue'}">${o.status || o.orderStatus}</span></td>
        <td style="color:var(--text-muted);font-size:.8rem">${new Date(o.date || o.createdAt || Date.now()).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
        <td><button class="action-btn" style="background:var(--accent-light);color:var(--accent)" onclick="viewOrderDetails('${o.id || o.orderId}')">👁 Details</button></td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

function viewOrderDetails(id){
  const o = DB.orders().find(o => (o.id === id || o.orderId === id));
  if(!o) return;
  const user = DB.users().find(u => u.id === o.userId);
  const STATUS = ['Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
  const isAdmin = currentUser?.role === 'admin';
  const currentStatus = o.status || o.orderStatus || 'Pending';

  document.getElementById('orderDetailsContent').innerHTML = `
    <div style="margin-bottom:1.25rem">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:1rem;flex-wrap:wrap">
        <div>
          <div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em">Order Number</div>
          <div style="font-family:var(--font-mono);font-size:1.3rem;font-weight:900;color:var(--accent)">${o.id || o.orderId}</div>
        </div>
        <div>
          <span class="badge ${STATUS_BADGE[currentStatus]||'badge-blue'}" style="font-size:0.9rem;padding:6px 14px">${currentStatus}</span>
        </div>
      </div>

      ${renderTimelineHTML(currentStatus)}
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem">
        <div style="background:var(--bg-secondary);padding:1rem;border-radius:var(--r-sm);border:1px solid var(--border)">
          <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">Customer Info</div>
          <div style="font-weight:800;color:var(--text)">👤 ${o.customerName || user?.name || 'Customer'}</div>
          <div style="font-size:0.85rem;color:var(--text-muted);margin-top:2px">📞 ${o.phone || 'N/A'}</div>
          <div style="font-size:0.85rem;color:var(--text-muted);margin-top:2px">✉️ ${user?.email || 'N/A'}</div>
        </div>
        <div style="background:var(--bg-secondary);padding:1rem;border-radius:var(--r-sm);border:1px solid var(--border)">
          <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">Shipping & Payment</div>
          <div style="font-size:0.85rem;color:var(--text);font-weight:600">📍 ${o.address || o.shippingAddress?.fullAddress || ''}</div>
          <div style="font-size:0.85rem;color:var(--text-muted);margin-top:4px">💳 Payment: <strong style="color:var(--text)">${(o.payment || o.paymentMethod || 'UPI').toUpperCase()}</strong></div>
          <div style="font-size:0.8rem;color:var(--text-dim);margin-top:2px">📅 ${new Date(o.date || o.createdAt || Date.now()).toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div style="font-size:0.85rem;font-weight:800;color:var(--text);margin-bottom:0.6rem">Ordered Items (${(o.items || o.orderItems || []).reduce((s,i)=>s+(i.qty||i.quantity||1),0)})</div>
      <div class="table-wrap" style="margin-bottom:1.25rem">
        <table class="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${(o.items || o.orderItems || []).map(i=>`<tr>
              <td><span style="font-size:1.1rem">${i.emoji||'📦'}</span> <strong>${i.name}</strong></td>
              <td>x${i.qty||i.quantity||1}</td>
              <td>₹${i.price.toLocaleString()}</td>
              <td style="font-weight:700">₹${(i.price * (i.qty||i.quantity||1)).toLocaleString()}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <div style="background:var(--bg-secondary);padding:1rem;border-radius:var(--r-sm);border:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;font-size:0.88rem;color:var(--text-muted);padding:3px 0"><span>Subtotal</span><span>₹${(o.subtotal||o.total||o.totalAmount).toLocaleString()}</span></div>
        ${o.discount ? `<div style="display:flex;justify-content:space-between;font-size:0.88rem;color:var(--emerald);font-weight:700;padding:3px 0"><span>Promo Discount</span><span>−₹${o.discount.toLocaleString()}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;font-size:0.88rem;color:var(--text-muted);padding:3px 0"><span>Delivery Charge</span><span>${o.delivery===0?'<strong style="color:var(--emerald)">FREE</strong>':'₹'+(o.delivery||0)}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:1.1rem;font-weight:900;color:var(--text);border-top:1px solid var(--border);padding-top:8px;margin-top:4px"><span>Order Total</span><span>₹${(o.total || o.totalAmount || 0).toLocaleString()}</span></div>
      </div>

      ${isAdmin ? `
      <div style="margin-top:1.25rem;padding-top:1rem;border-top:1px dashed var(--border);display:flex;flex-direction:column;gap:10px">
        <div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);text-transform:uppercase">Quick Admin Actions:</div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <button class="action-btn" style="background:var(--accent-light);color:var(--accent);padding:6px 12px;font-weight:700" onclick="updateOrderStatus('${o.id || o.orderId}','Confirmed');viewOrderDetails('${o.id || o.orderId}')">✓ Confirm</button>
          <button class="action-btn" style="background:var(--amber-light);color:var(--amber);padding:6px 12px;font-weight:700" onclick="updateOrderStatus('${o.id || o.orderId}','Out for Delivery');viewOrderDetails('${o.id || o.orderId}')">🚚 Out for Delivery</button>
          <button class="action-btn" style="background:var(--emerald-light);color:var(--emerald);padding:6px 12px;font-weight:700" onclick="updateOrderStatus('${o.id || o.orderId}','Delivered');viewOrderDetails('${o.id || o.orderId}')">✅ Delivered</button>
          <button class="action-btn" style="background:var(--rose-light);color:var(--rose);padding:6px 12px;margin-left:auto" onclick="deleteOrder('${o.id || o.orderId}');closeModal('orderDetailsModal')">🗑 Delete Order</button>
        </div>
      </div>` : ''}
    </div>
  `;
  openModal('orderDetailsModal');
}

// ADMIN
function renderAdmin(){
  const prods=DB.products(),orders=DB.orders(),users=DB.users();
  document.getElementById('adminProducts').textContent=prods.length;
  document.getElementById('adminOrders').textContent=orders.length;
  document.getElementById('adminUsers').textContent=users.length;
  document.getElementById('adminRevenue').textContent='₹'+orders.reduce((s,o)=>s+o.total,0).toLocaleString();
  renderAdminTab(adminTab);
}

function switchAdminTab(tab,el){
  adminTab=tab;
  document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('active'));
  if(el) el.classList.add('active');
  renderAdminTab(tab);
}

function handleAdminOrderFilter(val){
  adminOrderFilter=val;
  renderAdminTab('orders');
}

function handleAdminOrderSearch(val){
  adminOrderSearch=val.toLowerCase().trim();
  renderAdminTab('orders');
}

function quickRestockProduct(id, amount=10){
  const prods = DB.products();
  const p = prods.find(p => p.id === id);
  if(!p) return;
  p.stock += amount;
  DB.save('products', prods);
  renderAdmin();
  showToast(`Restocked ${p.name} (+${amount} units) 📦`, 'success');
}

function openAdminOrderModal(){
  const users = DB.users();
  const products = DB.products();
  
  if(!products.length){
    showToast('No products available to order!','error');
    return;
  }

  const uSelect = document.getElementById('aoUser');
  uSelect.innerHTML = users.map(u => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('');

  const pSelect = document.getElementById('aoProduct');
  pSelect.innerHTML = products.map(p => `<option value="${p.id}">${p.emoji||'📦'} ${p.name} — ₹${p.price.toLocaleString()} (${p.stock} in stock)</option>`).join('');

  document.getElementById('aoQty').value = 1;
  document.getElementById('aoPhone').value = currentUser?.phone || '9876543210';
  document.getElementById('aoAddress').value = 'Bhopal, Madhya Pradesh - 462001';
  openModal('adminOrderModal');
}

function saveAdminOrder(){
  const userId = parseInt(document.getElementById('aoUser').value);
  const prodId = parseInt(document.getElementById('aoProduct').value);
  const qty = parseInt(document.getElementById('aoQty').value) || 1;
  const pay = document.getElementById('aoPayment').value;
  const phone = document.getElementById('aoPhone').value.trim();
  const addr = document.getElementById('aoAddress').value.trim();

  if(!userId || !prodId || !phone || !addr){
    showToast('Fill all order details!','error');
    return;
  }

  const user = DB.users().find(u => u.id === userId);
  const products = DB.products();
  const prod = products.find(p => p.id === prodId);

  if(!prod || prod.stock < qty){
    showToast(`Insufficient stock! Only ${prod?.stock||0} available.`, 'error');
    return;
  }

  prod.stock -= qty;
  DB.save('products', products);

  const sub = prod.price * qty;
  const del = sub < 499 ? 40 : 0;
  const total = sub + del;
  const oid = 'ORD-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);

  const order = {
    id: oid,
    userId: user.id,
    customerName: user.name,
    items: [{ productId: prod.id, name: prod.name, qty: qty, price: prod.price, emoji: prod.emoji }],
    subtotal: sub,
    discount: 0,
    delivery: del,
    total: total,
    status: 'Confirmed',
    address: addr,
    phone: phone,
    payment: pay,
    date: new Date().toISOString()
  };

  const orders = DB.orders();
  orders.unshift(order);
  DB.save('orders', orders);

  closeModal('adminOrderModal');
  renderAdmin();
  showToast(`Order #${oid} created & placed for ${user.name}! 📦`, 'success');
}

function openUserModal(){
  document.getElementById('uName').value='';
  document.getElementById('uEmail').value='';
  document.getElementById('uPass').value='';
  document.getElementById('uRole').value='user';
  openModal('userModal');
}

function saveUser(){
  const name=document.getElementById('uName').value.trim();
  const email=document.getElementById('uEmail').value.trim();
  const pass=document.getElementById('uPass').value.trim();
  const role=document.getElementById('uRole').value;
  if(!name||!email||!pass){
    showToast('Name, Email and Password required!','error');
    return;
  }
  const users=DB.users();
  if(users.find(u=>u.email===email)){
    showToast('User email already exists!','error');
    return;
  }
  users.push({id:Date.now(),name,email,password:pass,role});
  DB.save('users',users);
  closeModal('userModal');
  renderAdmin();
  showToast(`User ${name} created successfully!`, 'success');
}

function deleteUser(id){
  if(id === currentUser.id){
    showToast('Cannot delete yourself!','error');
    return;
  }
  const users = DB.users().filter(u => u.id !== id);
  DB.save('users', users);
  renderAdmin();
  showToast('User account deleted.', 'error');
}

function renderAdminTab(tab){
  const el=document.getElementById('adminContent');
  if(tab==='products'){
    el.innerHTML=`<div class="table-wrap">
      <div class="table-head">
        <div class="table-head-title">Products Inventory (${DB.products().length})</div>
        <button class="action-btn" style="background:var(--accent);color:#fff;padding:8px 16px;font-weight:700" onclick="openProductModal()">+ Add Product</button>
      </div>
      <table class="data-table">
        <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock Level</th><th>Actions</th></tr></thead>
        <tbody>
          ${DB.products().map(p=>`<tr>
            <td><span style="font-size:1.2rem">${p.emoji}</span> <strong>${p.name}</strong></td>
            <td><span class="badge" style="background:${CAT_COLORS[p.category]?.bg||'rgba(99,102,241,0.1)'};color:${CAT_COLORS[p.category]?.color||'var(--accent)'}">${p.category}</span></td>
            <td style="font-weight:700">₹${p.price.toLocaleString()}</td>
            <td>
              <span style="font-weight:700;color:${p.stock===0?'var(--rose)':(p.stock<10?'var(--amber)':'var(--emerald)')}">${p.stock} units</span>
              ${p.stock<15 ? `<button class="action-btn" style="background:var(--emerald-light);color:var(--emerald);margin-left:8px;padding:3px 8px;font-size:0.72rem" onclick="quickRestockProduct(${p.id}, 10)">+10 Stock</button>` : ''}
            </td>
            <td>
              <button class="action-btn" style="background:var(--accent-light);color:var(--accent);margin-right:6px" onclick="editProduct(${p.id})">✏️ Edit</button>
              <button class="action-btn" style="background:var(--rose-light);color:var(--rose)" onclick="deleteProduct(${p.id})">🗑 Delete</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  } else if(tab==='orders'){
    const STATUS=['Pending','Confirmed','Shipped','Out for Delivery','Delivered','Cancelled'];
    let orders = DB.orders();
    if(adminOrderFilter === 'Active') {
      orders = orders.filter(o => (o.status !== 'Delivered' && o.status !== 'Cancelled' && o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled'));
    } else if(adminOrderFilter === 'History') {
      orders = orders.filter(o => (o.status === 'Delivered' || o.status === 'Cancelled' || o.orderStatus === 'Delivered' || o.orderStatus === 'Cancelled'));
    } else if(adminOrderFilter !== 'All') {
      orders = orders.filter(o => (o.status === adminOrderFilter || o.orderStatus === adminOrderFilter));
    }

    if(adminOrderSearch) {
      orders = orders.filter(o => {
        const oid = o.id || o.orderId || '';
        return oid.toLowerCase().includes(adminOrderSearch) ||
               (o.customerName && o.customerName.toLowerCase().includes(adminOrderSearch)) ||
               (o.phone && o.phone.includes(adminOrderSearch));
      });
    }

    const pendingOrders = DB.orders().filter(o => (o.status === 'Pending' || o.orderStatus === 'Pending'));
    const activeCount = DB.orders().filter(o => (o.status !== 'Delivered' && o.status !== 'Cancelled')).length;
    const historyCount = DB.orders().filter(o => (o.status === 'Delivered' || o.status === 'Cancelled')).length;

    el.innerHTML=`
    ${pendingOrders.length > 0 ? `
    <div style="background:linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(245, 158, 11, 0.15));border:1px solid var(--accent);padding:1.25rem;border-radius:var(--r-md);margin-bottom:1.25rem;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="font-size:2rem">🔔</div>
        <div>
          <div style="font-weight:900;font-size:1.05rem;color:var(--text)">Incoming Order Requests (${pendingOrders.length})</div>
          <div style="font-size:0.85rem;color:var(--text-muted)">You have ${pendingOrders.length} customer order request(s) waiting for approval and processing.</div>
        </div>
      </div>
      <button class="action-btn" style="background:var(--accent);color:#fff;padding:8px 18px;font-weight:800;font-size:0.88rem" onclick="handleAdminOrderFilter('Pending')">⚡ View Request Inbox (${pendingOrders.length})</button>
    </div>` : ''}

    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:1rem;flex-wrap:wrap;background:var(--bg-secondary);padding:1rem;border-radius:var(--r-md);border:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <button class="action-btn" style="background:${adminOrderFilter==='Active'||adminOrderFilter==='All'?'var(--accent)':'var(--bg-tertiary)'};color:${adminOrderFilter==='Active'||adminOrderFilter==='All'?'#fff':'var(--text)'};padding:6px 14px;font-weight:700" onclick="handleAdminOrderFilter('Active')">⚡ Active Requests (${activeCount})</button>
        <button class="action-btn" style="background:${adminOrderFilter==='History'?'var(--emerald)':'var(--bg-tertiary)'};color:${adminOrderFilter==='History'?'#fff':'var(--text)'};padding:6px 14px;font-weight:700" onclick="handleAdminOrderFilter('History')">📦 Completed History (${historyCount})</button>

        <select onchange="handleAdminOrderFilter(this.value)" style="padding:6px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-tertiary);color:var(--text);font-weight:600;font-size:0.85rem">
          <option value="All" ${adminOrderFilter==='All'?'selected':''}>All Orders (${DB.orders().length})</option>
          <option value="Pending" ${adminOrderFilter==='Pending'?'selected':''}>🔔 Pending Requests (${pendingOrders.length})</option>
          <option value="Active" ${adminOrderFilter==='Active'?'selected':''}>⚡ Active Orders (${activeCount})</option>
          <option value="History" ${adminOrderFilter==='History'?'selected':''}>📦 Order History (${historyCount})</option>
          ${STATUS.map(s=>`<option value="${s}" ${adminOrderFilter===s?'selected':''}>${s} (${DB.orders().filter(o=>(o.status===s || o.orderStatus===s)).length})</option>`).join('')}
        </select>
        ${(adminOrderFilter !== 'All' || adminOrderSearch !== '') ? `<button class="action-btn" style="background:var(--rose-light);color:var(--rose);padding:6px 12px;font-weight:700" onclick="adminOrderFilter='All';adminOrderSearch='';renderAdmin()">✕ Clear Filters</button>` : ''}
      </div>
      <div style="flex:1;max-width:340px;display:flex;align-items:center;gap:8px;background:var(--bg-tertiary);padding:4px 12px;border-radius:8px;border:1px solid var(--border)">
        <span style="font-size:0.85rem">🔍</span>
        <input type="text" placeholder="Search Order ID, Name, Phone..." value="${adminOrderSearch}" oninput="handleAdminOrderSearch(this.value)" style="background:transparent;border:none;outline:none;color:var(--text);font-size:0.85rem;width:100%">
      </div>
    </div>

    <div class="table-wrap">
      <div class="table-head">
        <div class="table-head-title">Customer Orders (${orders.length})</div>
        <div style="display:flex;gap:8px">
          <button class="action-btn" style="background:var(--bg-tertiary);color:var(--text);padding:8px 14px;border:1px solid var(--border);font-weight:700" onclick="renderAdmin()">🔄 Refresh Orders</button>
          <button class="action-btn" style="background:var(--accent);color:#fff;padding:8px 16px;font-weight:700" onclick="openAdminOrderModal()">+ Create Manual Order</button>
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer & Contact</th>
            <th>Items Ordered</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${orders.length ? orders.map(o => {
            const oid = o.id || o.orderId || 'ORD-000';
            const currentStatus = o.status || o.orderStatus || 'Pending';
            const u = DB.users().find(u => u.id === o.userId);
            const custName = o.customerName || u?.name || 'Customer';
            const rawItems = o.items || o.orderItems || [];
            const itemsText = rawItems.map(i => `${i.name} (x${i.qty || i.quantity || 1})`).join(', ') || 'Item';
            const orderTotal = o.total !== undefined ? o.total : (o.totalAmount || 0);
            const orderDate = o.date || o.createdAt || Date.now();

            return `<tr>
              <td><span style="font-family:var(--font-mono);font-weight:800;color:var(--accent)">${oid}</span></td>
              <td>
                <div style="font-weight:700;color:var(--text)">${custName}</div>
                <div style="font-size:0.78rem;color:var(--text-muted)">📞 ${o.phone || 'N/A'}</div>
              </td>
              <td style="max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${itemsText}">
                <span style="font-size:0.82rem;color:var(--text-muted)">${itemsText}</span>
              </td>
              <td style="font-weight:800;color:var(--text)">₹${orderTotal.toLocaleString()}</td>
              <td>
                <select onchange="updateOrderStatus('${oid}',this.value)" style="padding:4px 10px;border-radius:6px;border:1px solid var(--border);font-family:var(--font-body);font-size:.8rem;background:var(--bg-secondary);color:var(--text);font-weight:700">
                  ${STATUS.map(s=>`<option ${s===currentStatus?'selected':''}>${s}</option>`).join('')}
                </select>
              </td>
              <td style="color:var(--text-muted);font-size:.8rem">${new Date(orderDate).toLocaleDateString('en-IN')}</td>
              <td>
                <button class="action-btn" style="background:var(--accent-light);color:var(--accent);margin-right:4px" onclick="viewOrderDetails('${oid}')">👁 Details</button>
                ${currentStatus === 'Pending' ? `<button class="action-btn" style="background:var(--accent-light);color:var(--accent);margin-right:4px;font-weight:700" onclick="updateOrderStatus('${oid}','Confirmed')">✓ Confirm Order</button>` : ''}
                ${currentStatus === 'Confirmed' ? `<button class="action-btn" style="background:var(--amber-light);color:var(--amber);margin-right:4px;font-weight:700" onclick="updateOrderStatus('${oid}','Out for Delivery')">🚚 Out for Delivery</button>` : ''}
                ${currentStatus === 'Out for Delivery' || currentStatus === 'Shipped' ? `<button class="action-btn" style="background:var(--emerald-light);color:var(--emerald);margin-right:4px;font-weight:700" onclick="updateOrderStatus('${oid}','Delivered')">✅ Mark Delivered</button>` : ''}
                <button class="action-btn" style="background:var(--rose-light);color:var(--rose)" onclick="deleteOrder('${oid}')">🗑</button>
              </td>
            </tr>`;
          }).join('') : `<tr><td colspan="7" style="text-align:center;padding:2.5rem;color:var(--text-muted)">No matching orders found.</td></tr>`}
        </tbody>
      </table>
    </div>`;
  } else if(tab==='users'){
    el.innerHTML=`<div class="table-wrap">
      <div class="table-head">
        <div class="table-head-title">Registered Accounts (${DB.users().length})</div>
        <button class="action-btn" style="background:var(--accent);color:#fff;padding:8px 16px;font-weight:700" onclick="openUserModal()">+ Add User</button>
      </div>
      <table class="data-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
        <tbody>
          ${DB.users().map(u=>`<tr>
            <td><strong>${u.name}</strong></td>
            <td>${u.email}</td>
            <td><span class="badge ${u.role==='admin'?'badge-red':'badge-blue'}">${u.role.toUpperCase()}</span></td>
            <td>
              <button class="action-btn" style="background:var(--amber-light);color:var(--amber);margin-right:6px" onclick="toggleUserRole(${u.id})">${u.role==='admin'?'Make User':'Make Admin'}</button>
              ${u.id !== currentUser.id ? `<button class="action-btn" style="background:var(--rose-light);color:var(--rose)" onclick="deleteUser(${u.id})">Delete</button>` : ''}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  }
}
async function updateOrderStatus(id, status){
  const orders = DB.orders();
  const o = orders.find(o => (o.id === id || o.orderId === id));
  if (o) {
    o.status = status;
    o.orderStatus = status;
    DB.save('orders', orders);
  }

  try {
    const token = localStorage.getItem('token') || localStorage.getItem('ss_token');
    await fetch(`/api/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ orderStatus: status })
    }).catch(() => null);
  } catch (err) {
    console.warn('Backend API update skipped (using local sync)');
  }

  if (currentPage === 'admin') renderAdmin();
  if (currentPage === 'orders') renderOrders();
  showToast(`Order ${id} updated → "${status}"`, 'success');
}
function deleteOrder(id){
  DB.save('orders',DB.orders().filter(o=>o.id!==id));
  if(currentPage==='admin') renderAdmin();
  if(currentPage==='orders') renderOrders();
  showToast('Order deleted.','error');
}
function toggleUserRole(id){
  const users=DB.users(),u=users.find(u=>u.id===id);
  if(!u)return;
  u.role=u.role==='admin'?'user':'admin';
  DB.save('users',users);
  renderAdmin();
  showToast(u.name+' role updated to '+u.role,'info');
}
function openProductModal(id){
  editProdId=id||null;
  document.getElementById('productModalTitle').textContent=id?'Edit Product':'Add Product';
  if(id){const p=DB.products().find(p=>p.id===id);if(!p)return;document.getElementById('pName').value=p.name;document.getElementById('pPrice').value=p.price;document.getElementById('pOriginal').value=p.original||'';document.getElementById('pCat').value=p.category;document.getElementById('pStock').value=p.stock;document.getElementById('pDesc').value=p.desc||'';document.getElementById('pEmoji').value=p.emoji||'';document.getElementById('pBadge').value=p.badge||'';}
  else{['pName','pPrice','pOriginal','pStock','pDesc','pEmoji'].forEach(i=>document.getElementById(i).value='');document.getElementById('pBadge').value='';document.getElementById('pCat').value='Electronics';}
  document.getElementById('productModal').classList.add('open');
}
function editProduct(id){openProductModal(id);}
function saveProduct(){
  const name=document.getElementById('pName').value.trim(),price=parseFloat(document.getElementById('pPrice').value);
  if(!name||!price){showToast('Name and price required!','error');return;}
  const prods=DB.products(),data={name,price,original:parseFloat(document.getElementById('pOriginal').value)||0,category:document.getElementById('pCat').value,stock:parseInt(document.getElementById('pStock').value)||100,desc:document.getElementById('pDesc').value,emoji:document.getElementById('pEmoji').value||'📦',badge:document.getElementById('pBadge').value,rating:4.5,reviews:0};
  if(editProdId){const idx=prods.findIndex(p=>p.id===editProdId);if(idx!==-1)prods[idx]={...prods[idx],...data};showToast('Product updated!','success');}
  else{prods.push({id:Date.now(),...data});showToast('Product added!','success');}
  DB.save('products',prods);closeModal('productModal');renderAdmin();
}
function deleteProduct(id){DB.save('products',DB.products().filter(p=>p.id!==id));renderAdmin();showToast('Product deleted.','error');}

function openModal(id){
  const el = document.getElementById(id);
  if(el) el.classList.add('open');
}

function openDevModal(){
  openModal('devModal');
}

function closeModal(id){document.getElementById(id).classList.remove('open');}
function closeModalOutside(e,id){if(e.target.id===id)closeModal(id);}
function showToast(msg,type='success'){const t=document.getElementById('toast');document.getElementById('toastMsg').textContent=msg;document.getElementById('toastIcon').textContent=type==='success'?'✓':type==='error'?'✕':'ℹ';t.className='toast '+type+' show';setTimeout(()=>t.classList.remove('show'),3000);}

// THEME SWITCHER SYSTEM
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const isLight = savedTheme === 'light';
  document.body.classList.toggle('light-theme', isLight);
  updateThemeUI(isLight);
}
function toggleTheme() {
  const isLight = document.body.classList.toggle('light-theme');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  updateThemeUI(isLight);
  showToast(isLight ? '☀️ Light Mode Enabled' : '🌙 Dark Mode Enabled', 'info');
}
function updateThemeUI(isLight) {
  document.querySelectorAll('.theme-icon').forEach(icon => {
    icon.textContent = isLight ? '☀️' : '🌙';
  });
  document.querySelectorAll('.theme-label').forEach(label => {
    label.textContent = isLight ? 'Light Mode' : 'Dark Mode';
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  initDB();
  initTheme();
  const s=DB.session();if(s)startApp(s);
  document.getElementById('loginPass').addEventListener('keydown',e=>{if(e.key==='Enter')handleLogin();});
});
