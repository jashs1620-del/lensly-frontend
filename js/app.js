// ═══════════════════════════════════════
//  API CONFIG — change this ONE line to switch environments
// ═══════════════════════════════════════
const API_BASE_URL = "https://lensly-backend.onrender.com";
// For local backend testing, swap to: const API_BASE_URL = "http://localhost:5000";

// ── Splash stars ──
(function(){
  const w=document.getElementById('splashStars');if(!w)return;
  for(let i=0;i<60;i++){
    const s=document.createElement('div');s.className='star-p';
    const sz=Math.random()*2.5+.8;
    s.style.cssText=`width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;animation-duration:${1.5+Math.random()*3}s;animation-delay:${Math.random()*4}s;`;
    w.appendChild(s);
  }
})();

// ═══════════════════════════════════════
//  PRODUCTS
// ═══════════════════════════════════════
let PRODUCTS = [];

async function loadAllProducts() {
    try {
        const response = await withSlowLoader(fetch(`${API_BASE_URL}/api/products?limit=100`), 'Loading products...');
        const result = await response.json();
        if (result.success) {
          console.log('raw result from /api/products:', result);
            PRODUCTS = result.data.data.map(row => ({
                id : row.id,
                img : row.image_url,
                images : row.images || [row.image_url],
                brand : row.brand,
                name : row.name,
                material : row.material,
                type : row.lens_type,
                wearDays : row.wear_days,
                desc : row.description,
                badges : row.badges || [],
                price : parseFloat(row.price),
                oldPrice : row.old_price ? parseFloat(row.old_price) : null,
                rating : parseFloat(row.rating),
                reviews : row.reviews || 0,
                forAstig : row.for_astig || false,
                isNew : row.is_new || false,
                color : row.color,
                tags : row.tags || [],
                powers : row.powers || []
            }));
            filteredProds = [...PRODUCTS];
        } else {
            showToast('could not load products:');
        }
    } catch (err) {
        console.error('Failed to load products:', err);
        showToast('could not load products');
    }
}

// ═══════════════════════════════════════
//  COLLECTIONS — each maps to a real tag, so products are correctly segregated
// ═══════════════════════════════════════
const COLLECTIONS=[
  {key:'pretty',icon:'🌷',name:'Pretty Eyes Club',slogan:'Pretty eyes deserve premium care.',bg:'#FFE8F0',iconBg:'#FFE8F0'},
  {key:'dreamers',icon:'⭐',name:'Dreamers Collection',slogan:'For the eyes chasing big dreams.',bg:'#FFF8E1',iconBg:'#FFF8E1'},
  {key:'work',icon:'💻',name:'Work Warrior Collection',slogan:'Your eyes work overtime. Give them a raise.',bg:'#E3F2FD',iconBg:'#E3F2FD'},
  {key:'gamer',icon:'🎮',name:'Gamer Collection',slogan:'Lag in game? Fine. Lag in vision? Never.',bg:'#E8F5E9',iconBg:'#E8F5E9'},
  {key:'travel',icon:'✈️',name:'Travel Collection',slogan:'Serving looks and eye comfort.',bg:'#F3E5F5',iconBg:'#F3E5F5'},
  {key:'all',icon:'🛍️',name:'All Products',slogan:'Browse our full collection',bg:'#FFF3E0',iconBg:'#FFF3E0',isAll:true}
];

// ═══════════════════════════════════════
//  SLOGANS
// ═══════════════════════════════════════
const SLOGANS={
  home:["Life's blurry enough. Your vision doesn't have to be.","Staring at screens. Not settling for strain.","Focus on your goals. We'll handle the focus."],
  emptyCart:["Your future is loading... your cart should too.","Nothing here yet. Your eyes are waiting."],
  checkout:["Your eyes just filed a thank-you note.","Future you can already see the difference."],
  orderConfirm:["Your order is officially in sight. 👀 Thank you for ordering!","Your vision upgrade is on the way. Thank you for ordering!"],
  reorder:["Your lenses called. They deserve retirement.","Your eyes noticed. We noticed too. Time for a fresh pair?"]
};
function pickSlogan(arr){
  const k='lsi_'+arr[0].substring(0,8);
  let i=(parseInt(sessionStorage.getItem(k)||'-1')+1)%arr.length;
  sessionStorage.setItem(k,String(i));return arr[i];
}

// ═══════════════════════════════════════
//  SECURITY
// ═══════════════════════════════════════
const _e=s=>String(s).replace(/[<>"'`&]/g,c=>({'<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;','&':'&amp;'}[c]));
function safeStore(k,v){try{localStorage.setItem('lensly_'+k,JSON.stringify(v));}catch(e){}}
function safeRead(k,d){try{const v=localStorage.getItem('lensly_'+k);return v!=null?JSON.parse(v):d;}catch(e){return d;}}

// ═══════════════════════════════════════
//  SPLASH
// ═══════════════════════════════════════
const SPLASH_MS=7000;
function runSplash(){
  const bar=document.getElementById('splashBarFill');
  const start=Date.now();
  const biv=setInterval(()=>{const p=Math.min(100,((Date.now()-start)/SPLASH_MS)*100);if(bar)bar.style.width=p+'%';if(p>=100)clearInterval(biv);},60);
  const show=i=>{
    document.querySelectorAll('.sp-sl').forEach(s=>s.classList.remove('in','out'));
    document.querySelectorAll('.sp-dot').forEach(d=>d.classList.remove('on'));
    const el=document.getElementById('spl'+i),dt=document.getElementById('dot'+i);
    if(el)el.classList.add('in');if(dt)dt.classList.add('on');
  };
  const sk='splash_si';
  let si=(parseInt(sessionStorage.getItem(sk)||'-1')+1)%3;
  sessionStorage.setItem(sk,String(si));
  show(si);
  setTimeout(()=>{const e=document.getElementById('spl'+si);if(e)e.classList.add('out');si=(si+1)%3;setTimeout(()=>show(si),420);},2200);
  setTimeout(()=>{const e=document.getElementById('spl'+si);if(e)e.classList.add('out');si=(si+1)%3;setTimeout(()=>show(si),420);},4600);
  setTimeout(()=>{
    goToPage('homePage');
    renderCollections();
    renderRec('recScroll',0);
    updateBadges();
  },SPLASH_MS);
}

// ═══════════════════════════════════════
//  STATE
// ═══════════════════════════════════════
let isLoggedIn=false;
let cart=[];
let currentProduct=null,selectedPower=null,selPayment=null,selectedAddressId=null;
let pageHistory=[],filteredProds=[...PRODUCTS];
let orderNum=1000+Math.floor(Math.random()*900);
let userProfile=safeRead('profile',{name:'',email:'',phone:''});
let pendingTryOnProduct=null;

// ═══════════════════════════════════════
//  AUTO-LOGIN — restore session if a valid token exists
// ═══════════════════════════════════════
async function tryAutoLogin() {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) {
      localStorage.removeItem('token'); // expired/invalid token — clean up
      return false;
    }
    isLoggedIn = true;
    document.getElementById('userAvatar').textContent = (userProfile.name || 'U').charAt(0).toUpperCase();
    return true;
  } catch (err) {
    console.error('Auto-login check failed:', err);
    return false;
  }
}

function requireLogin(){
  showToast('Please login first');
  const cur = document.querySelector('.page.active');
  if(cur) pageHistory.push(cur.id);
  goToPage('loginPage');
}

function showAuthLoading(msg){
  const el = document.getElementById('authLoadingOverlay');
  const txt = document.getElementById('authLoadingText');
  if(txt) txt.textContent = msg || 'Loading…';
  if(el) el.style.display = 'flex';
}
function hideAuthLoading(){
  const el = document.getElementById('authLoadingOverlay');
  if(el) el.style.display = 'none';
}
function withSlowLoader(promise, msg){
  let shown = false;
  const timer = setTimeout(()=>{ shown = true; showAuthLoading(msg); }, 10000);
  return promise.finally(()=>{
    clearTimeout(timer);
    if(shown) hideAuthLoading();
  });
}

// ═══════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════
function pushNavState(id){
  history.pushState({page:id}, '', location.href);
}

function goToPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const pg=document.getElementById(id);if(pg)pg.classList.add('active');
  window.scrollTo(0,0);
}
const AUTH_REQUIRED_PAGES = ['cartPage','checkoutPage','paymentPage','ordersPage','profilePage'];
function goTo(id){
  if(!isLoggedIn && AUTH_REQUIRED_PAGES.includes(id)){ requiredLogin();return; }
  const cur=document.querySelector('.page.active');
  if(cur){
    pageHistory.push(cur.id);
    pushNavState(id);
  }
  goToPage(id);
  if(id==='cartPage')renderCart();
  if(id==='homePage'){renderCollections();renderRec('recScroll',0);}
  if(id==='checkoutPage')renderCheckoutSlogan();
  if(id==='profilePage') renderProfile();
  if(id==='ordersPage')renderOrdersPage();
  updateBadges();
}
function goBack(){
  if(pageHistory.length>0){
    const p=pageHistory.pop();goToPage(p);
    if(p==='cartPage')renderCart();
    if(p==='homePage'){renderCollections();renderRec('recScroll',0);}
    updateBadges();
  }else goHome();
}
function goHome(){
  pageHistory=[];pushNavState('homePage');goToPage('homePage');
  renderCollections();renderRec('recScroll',0);updateBadges();
}

// ═══════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════
function hasAcceptedPrivacy(){
  return safeRead('privacy_accepted', false) === true;
}

function goToPrivacyGate(){
  window.location.href = 'privacy.html?next=login';
}

function applyPrivacyGateState(){
  const overlay = document.getElementById('privacyGateOverlay');
  if(!overlay) return;
  overlay.style.display = hasAcceptedPrivacy() ? 'none' : 'block';
}

const GOOGLE_CLIENT_ID = "605806233246-eclmmrpimkimjvbk2uthab5dvtf0iq3j.apps.googleusercontent.com";

window.addEventListener('load', () => {
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredential
  });

  google.accounts.id.renderButton(
    document.getElementById('hiddenGoogleBtn'),
    { type: 'standard', width: 300 }
  );

  applyPrivacyGateState();
});

async function handleGoogleCredential(response) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: response.credential })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.data.token);
      isLoggedIn = true;
      userProfile = {
        name: data.data.user?.name || '',
        email: data.data.user?.email || '',
        phone: data.data.user?.phone || ''
      };
      safeStore('profile', userProfile);
      document.getElementById('userAvatar').textContent = (userProfile.name || 'U').charAt(0).toUpperCase();

      showToast('✅ Logged in with Google!');
      await Promise.all([loadWishlist(), loadCartFromBackend()]);
      goHome();
    } else {
      showToast('❌ Google login failed: ' + (data.message || 'Unknown error'));
    }
  } catch (err) {
    console.error('Google login error:', err);
    showToast('❌ Network error during Google login');
  }
}

// ═══════════════════════════════════════
//  SEARCH
// ═══════════════════════════════════════
function openSearch(){document.getElementById('searchOverlay').classList.add('show');document.getElementById('searchInput').focus();}
function closeSearch(){document.getElementById('searchOverlay').classList.remove('show');document.getElementById('searchInput').value='';}
function handleSearch(q){
  const t=q.toLowerCase().trim();
  if(!t)return;
  const res=PRODUCTS.filter(p=>p.name.toLowerCase().includes(t)||p.brand.toLowerCase().includes(t)||p.type.toLowerCase().includes(t));
  openProdOverlayWithList(res,'Search results');
}
function handleOverlaySearch(q){
  const t=q.toLowerCase().trim();
  const base=window._overlayBaseList||PRODUCTS;
  if(!t){renderOverlayGrid(base);return;}
  renderOverlayGrid(base.filter(p=>p.name.toLowerCase().includes(t)||p.brand.toLowerCase().includes(t)||p.type.toLowerCase().includes(t)));
}

// ═══════════════════════════════════════
//  FILTER
// ═══════════════════════════════════════
function openFilter(){document.getElementById('filterDrawer').classList.add('open');document.getElementById('filterOverlay').classList.add('show');}
function closeFilter(){document.getElementById('filterDrawer').classList.remove('open');document.getElementById('filterOverlay').classList.remove('show');}
function toggleChip(el){el.classList.toggle('active');}
function toggleColorChip(el){el.classList.toggle('active');}
function clearBrandFilter(){
  document.querySelectorAll('#brandChips .chip').forEach(c=>c.classList.remove('active'));
  showToast('Brand filter cleared');
}
function applyFilter(){
  const brandsOn=[...document.querySelectorAll('#brandChips .chip.active')].map(c=>c.textContent.trim());
  const typeOn=[...document.querySelectorAll('#typeChips .chip.active')].map(c=>c.textContent.trim());
  const powerOn=[...document.querySelectorAll('#powerChips .chip.active')].map(c=>c.textContent.trim());
  const colorsOn=[...document.querySelectorAll('.cc-wrap.active .cc-label')].map(c=>c.textContent.trim());
  const min=parseInt(document.getElementById('priceMin').value)||0;
  const max=parseInt(document.getElementById('priceMax').value)||99999;
  filteredProds=PRODUCTS.filter(p=>{
    const brandOk=!brandsOn.length||brandsOn.includes(p.brand);
    const typeOk=!typeOn.length||typeOn.some(t=>(t==='For Astigmatism'&&p.forAstig)||(t==='Regular'&&!p.forAstig)||(t==='HD Vision'&&p.type.includes('HD'))||(t==='Monthly'&&p.wearDays===30)||(t==='UV Blocking'&&p.type.toLowerCase().includes('uv')));
    const powerOk=!powerOn.length||powerOn.some(t=>(t.startsWith('Negative')&&p.powers.some(pw=>pw.startsWith('-')))||(t.startsWith('Positive')&&p.powers.some(pw=>pw.startsWith('+'))));
    const colorOk=!colorsOn.length||colorsOn.includes(p.color);
    const priceOk=p.price>=min&&p.price<=max;
    return brandOk&&typeOk&&powerOk&&colorOk&&priceOk;
  });
  closeFilter();
  showToast(filteredProds.length?`✅ ${filteredProds.length} lens${filteredProds.length!==1?'es':''} found`:'😕 No lenses match those filters');
  window._overlayBaseList=filteredProds;
  if(document.getElementById('prodOverlay').classList.contains('open')){
    renderOverlayGrid(filteredProds);
  }else{
    openProdOverlayWithList(filteredProds,'Filtered Results');
  }
}
function clearFilter(){
  document.querySelectorAll('#brandChips .chip').forEach(c=>c.classList.add('active'));
  document.querySelectorAll('#typeChips .chip').forEach(c=>c.classList.remove('active'));
  document.querySelectorAll('#powerChips .chip').forEach(c=>c.classList.remove('active'));
  document.querySelectorAll('.cc-wrap').forEach(c=>c.classList.remove('active'));
  document.querySelector('.cc-wrap').classList.add('active'); // keep Clear colour default on
  document.getElementById('priceMin').value=300;
  document.getElementById('priceMax').value=3000;
  filteredProds=[...PRODUCTS];closeFilter();showToast('Filters cleared');
  window._overlayBaseList=filteredProds;
  if(document.getElementById('prodOverlay').classList.contains('open')){
    renderOverlayGrid(filteredProds);
  }
}

// ═══════════════════════════════════════
//  STARS
// ═══════════════════════════════════════
const stars=r=>[1,2,3,4,5].map(i=>`<span class="star" style="color:${i<=Math.round(r)?'#FFC107':'#E2E8F0'}">★</span>`).join('');

// ═══════════════════════════════════════
//  COLLECTIONS (vertical stack, properly mapped)
// ═══════════════════════════════════════
function renderCollections(){
  const el=document.getElementById('collectionsStack');if(!el)return;
  el.innerHTML=COLLECTIONS.map(c=>{
    const count=c.isAll?PRODUCTS.length:PRODUCTS.filter(p=>p.tags.includes(c.key)).length;
    return `<div class="col-row" onclick="openCollection('${c.key}')">
      <div class="col-icon-circle" style="background:${c.iconBg};">${c.icon}</div>
      <div class="col-row-text">
        <div class="col-row-name">${_e(c.name)}</div>
        <div class="col-row-slogan">${_e(c.slogan)}</div>
        <div class="col-row-count">${count} lens${count!==1?'es':''} available</div>
      </div>
      <div class="col-row-arrow">›</div>
    </div>`;
  }).join('');
}

function openCollection(key){
  const coll=COLLECTIONS.find(c=>c.key===key);
  const list=key==='all'?PRODUCTS:PRODUCTS.filter(p=>p.tags.includes(key));
  openProdOverlayWithList(list,coll?coll.name:'Products');
}
function openProdOverlayWithList(list,title){
  window._overlayBaseList=list;
  document.getElementById('poTitle').textContent=title;
  renderOverlayGrid(list);
  document.getElementById('prodOverlay').classList.add('open');
  document.getElementById('prodOverlay').scrollTop=0;
}
function closeProdOverlay(){document.getElementById('prodOverlay').classList.remove('open');}

// ═══════════════════════════════════════
//  RENDER PRODUCT GRID
// ═══════════════════════════════════ ════
function renderOverlayGrid(list){
    console.log("Full product list first item:", list[0]);
    console.log("All product img values:", list.map(p => p.img));
  const g=document.getElementById('prodOverlayGrid');
  if(!list||!list.length){
    g.innerHTML='<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🔍</div><p>No products found.<br>Try adjusting your filters.</p></div>';return;
  }
  g.innerHTML=list.map(p=>`
    <div class="product-card" onclick="openProduct('${p.id}')">
      <div class="product-img-wrap">
        ${p.isNew?'<div class="prod-new-tag">NEW</div>':''}
        <div class="prod-brand-tag">${_e(p.brand)}</div>
        <button class="wishlist-heart-btn" data-pid="${p.id}" onclick="event.stopPropagation();toggleWishlist('${p.id}',this)">${isWished(p.id)?'❤️':'🤍'}</button>
        <img src="${p.img}" alt="${_e(p.name)}" loading="lazy">
      </div>
      <div class="product-info">
        <div class="product-brand">${_e(p.brand)}</div>
        <div class="product-name">${_e(p.name)}</div>
        <div class="product-meta">${_e(p.type)} • ${_e(p.material)}</div>
        <div class="product-meta" style="opacity:.8;">🎨 ${_e(p.color)}</div>
        <div class="product-price">₹${p.price} <span class="per">/ box &nbsp;<s style="color:#ccc;font-size:.74rem;">₹${p.oldPrice}</s></span></div>
        <div class="stars">${stars(p.rating)}<span class="star-count">${p.rating} (${p.reviews})</span></div>
        <button class="add-cart-btn" onclick="event.stopPropagation();quickAdd('${p.id}')">+ Add to Cart</button>
      </div>
    </div>`).join('');
}

// ═══════════════════════════════════════
//  REC
// ═══════════════════════════════════════
function renderRec(id,excl){
  const el=document.getElementById(id);if(!el)return;
  el.innerHTML=PRODUCTS.filter(p=>p.id!==excl).slice(0,6).map(p=>`
    <div class="rec-card" onclick="openProduct('${p.id}')">
      <div class="rec-img"><img src="${p.img}" alt="${_e(p.name)}" loading="lazy"></div>
      <div class="rec-name">${_e(p.name)}</div>
      <div class="rec-price">₹${p.price}</div>
    </div>`).join('');
}

// ═══════════════════════════════════════
//  CART
// ═══════════════════════════════════════
function renderCart(){
  const b=document.getElementById('cartBody');updateBadges();
  if(!cart.length){
    const s=pickSlogan(SLOGANS.emptyCart);
    b.innerHTML=`<div class="empty-state"><div class="empty-icon">🛒</div>
      <div class="empty-slogan">"${_e(s)}"</div>
      <p style="font-size:.84rem;">Your cart is empty. Shop some lenses!</p><br>
      <button onclick="openCollection('all')" style="margin-top:13px;padding:11px 26px;border-radius:10px;border:none;background:var(--primary);color:white;font-weight:700;font-size:.93rem;cursor:pointer;font-family:Manrope,sans-serif;">Shop Now</button></div>`;
    return;
  }
  const sub=cart.reduce((s,i)=>s+i.price*i.qty,0),del=sub>1500?0:60,tot=sub+del;
  b.innerHTML=cart.map((item,idx)=>`
    <div class="cart-item">
      <div class="cart-item-img"><img src="${item.img}" alt="${_e(item.name)}"></div>
      <div style="flex:1;">
        <div class="cart-item-name">${_e(item.name)}</div>
        <div class="cart-item-meta">Power: ${_e(item.power)} • 6 lenses/box</div>
        <div class="cart-item-price">₹${item.price}</div>
        <div class="qty-control">
          <button class="qty-btn" onclick="changeQty(${idx},-1)">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${idx},1)">+</button>
          <button class="remove-btn" onclick="removeItem(${idx})">🗑 Remove</button>
        </div>
      </div>
    </div>`).join('')+`
    <div class="cart-summary">
      <div class="cart-row"><span>Subtotal</span><span>₹${sub}</span></div>
      <div class="cart-row"><span>Delivery</span><span>${del===0?'<span style="color:var(--success)">FREE</span>':'₹'+del}</span></div>
      ${del>0?'<div style="font-size:.74rem;color:var(--text-light);margin-bottom:8px;">Free delivery on orders above ₹1500</div>':''}
      <div class="cart-row total"><span>Total</span><span>₹${tot}</span></div>
      <button class="checkout-btn" onclick="goToCheckout()">Proceed to Checkout →</button>
    </div>`;
}

// ═══════════════════════════════════════
//  PRODUCT DETAIL
// ═══════════════════════════════════════
async function openProduct(id){
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`);
    const result = await response.json();
    if (!result.success) { showToast('Could not load product details.'); return; }

    currentProduct = result.data;
    closeProdOverlay();

    document.getElementById('detailImg').src = currentProduct.image_url || currentProduct.img || '';
    document.getElementById('detailBrand').textContent = currentProduct.brand || '';
    document.getElementById('detailName').textContent = currentProduct.name || '';
    document.getElementById('detailPrice').innerHTML = `₹${currentProduct.price}`;

    const descEl = document.getElementById('detailDesc');
    if (descEl) descEl.textContent = currentProduct.description || 'No description available.';

    const ratingRow = document.getElementById('detailRatingRow');
    const rating = parseFloat(currentProduct.rating);
    if (ratingRow) {
      ratingRow.innerHTML = (!isNaN(rating) && rating > 0)
        ? `${stars(rating)}<span class="star-count">${rating} (${currentProduct.reviews||0})</span>`
        : '';
    }

    const oldPriceEl = document.getElementById('detailOldPrice');
    const discountEl = document.getElementById('detailDiscount');
    if (oldPriceEl && discountEl) {
      if (currentProduct.old_price && parseFloat(currentProduct.old_price) > currentProduct.price) {
        const op = parseFloat(currentProduct.old_price);
        const pct = Math.round((1 - currentProduct.price / op) * 100);
        oldPriceEl.textContent = `₹${op}`;
        discountEl.textContent = `${pct}% OFF`;
      } else {
        oldPriceEl.textContent = '';
        discountEl.textContent = '';
      }
    }

    const perBoxEl = document.getElementById('detailPerBox');
    if (perBoxEl) perBoxEl.textContent = `${currentProduct.lens_type || ''} • ${currentProduct.power_type || ''}`;

    const specsE1 = document.getElementById('detailSpecs');
    if (specsE1) {
      const specs = [
        ['Material', currentProduct.material],
        ['Water Content', currentProduct.water_content],
        ['Base Curve', currentProduct.base_curve],
        ['Diameter', currentProduct.diameter],
        ['Power Range', currentProduct.spec_power_range]
      ].filter(([,v]) => v);
      specsE1.innerHTML = specs.length
        ? specs.map(([label,val]) => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;font-size:.82rem;"><span style="color:var(--text-light);">${_e(label)}</span><span style="font-weight:600;align:right;max-width:60%;">${_e(val)}</span></div>`).join('')
        : '';
    }

    renderPowerDropdowns(currentProduct);
    renderRec('detailRec', id);
    goTo('detailPage');
  } catch (err) {
    console.error('openProduct error:', err);
    showToast('Could not load product details.');
  }
}

function generateStandardPowers(){
  const opts = ['Plano (0.00)'];
  for(let v=0.25; v<=6.00; v+=0.25) opts.push('+'+v.toFixed(2));
  for(let v=0.25; v<=12.00; v+=0.25) opts.push('-'+v.toFixed(2));
  return opts;
}

function renderPowerDropdowns(product){
  const list = (product.powers && product.powers.length) ? product.powers : generateStandardPowers();
  const fill = (selId) => {
    const sel = document.getElementById(selId);
    if(!sel) return;
    sel.innerHTML = '<option value="">Select</option>' + list.map(p=>`<option value="${_e(p)}">${_e(p)}</option>`).join('');
  };
  fill('powerRight');
  fill('powerLeft');
  const laterBox = document.getElementById('submitPowerLater');
  if(laterBox){ laterBox.checked = false; togglePowerLater(laterBox); }
}

function togglePowerLater(checkbox){
  const disable = checkbox.checked;
  ['powerRight','powerLeft','boxesRight','boxesLeft'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.disabled = disable;
  });
}

function collectPowerSelection(){
  const laterBox = document.getElementById('submitPowerLater');
  const later = laterBox && laterBox.checked;
  if(later){
    return { power: 'Power to be submitted later', qty: 1 };
  }
  const pr = document.getElementById('powerRight').value;
  const pl = document.getElementById('powerLeft').value;
  const br = parseInt(document.getElementById('boxesRight').value) || 1;
  const bl = parseInt(document.getElementById('boxesLeft').value) || 1;
  if(!pr || !pl){
    showToast('⚠️ Please select a power for both eyes, or choose "submit later"');
    return null;
  }
  return { power: `R: ${pr} (${br} box${br>1?'es':''}) / L: ${pl} (${bl} box${bl>1?'es':''})`, qty: br + bl };
}

function addFromDetail(){
  const sel = collectPowerSelection();
  if(!sel) return;
  addToCart(currentProduct, sel.power, sel.qty);
}
function buyNowClick(){
  const sel = collectPowerSelection();
  if(!sel) return;
  addToCart(currentProduct, sel.power, sel.qty).then(()=>goToCheckout());
}
function quickAdd(id){
  if(!isLoggedIn){requireLogin();return;}
  const p=PRODUCTS.find(x=>x.id===id);
  addToCart(p,'Ask seller',1);
}

// ═══════════════════════════════════════
//  TRY-ON — MediaPipe Face Mesh powered (real eye tracking)
// ═══════════════════════════════════════
let tryStream=null;
let faceMesh=null;
let mpFrameLoop=false;
let fallbackAnimId=null;
let tryOnCtx=null;
let latestLandmarks=null;
let faceDetected=false;

// MediaPipe Face Mesh landmark indices (refineLandmarks:true gives 478 points,
// the last 10 are the iris rings — these give real, per-frame eye positions).
const RIGHT_IRIS_CENTER=468, RIGHT_IRIS_L=469, RIGHT_IRIS_R=471;
const LEFT_IRIS_CENTER=473,  LEFT_IRIS_L=474,  LEFT_IRIS_R=476;

// Lens tint styles keyed by the product's `color` field (see PRODUCTS above),
// so try-on always matches what the filter/product card says the lens colour is.
// core = saturated iris colour, ring = darker limbal-ring colour drawn at the rim.
// Rendered with 'multiply' blend so it tints the real iris instead of sitting
// on top as a flat, barely-visible translucent disc.
const COLOR_STYLES={
  Clear:{core:'rgba(214,232,255,0.45)',ring:'rgba(160,190,225,0.55)'},
  Blue:{core:'rgba(64,140,205,0.85)',ring:'rgba(20,75,130,0.9)'},
  Green:{core:'rgba(70,170,95,0.85)',ring:'rgba(20,105,45,0.9)'},
  Violet:{core:'rgba(140,105,195,0.85)',ring:'rgba(80,50,130,0.9)'},
  Aqua:{core:'rgba(35,180,195,0.85)',ring:'rgba(5,110,120,0.9)'},
  Hazel:{core:'rgba(195,120,55,0.85)',ring:'rgba(130,70,20,0.9)'},
  Grey:{core:'rgba(140,140,140,0.85)',ring:'rgba(80,80,80,0.9)'},
  Brown:{core:'rgba(120,68,10,0.85)',ring:'rgba(75,40,5,0.9)'}
};
function lensStyleFor(product){
  return COLOR_STYLES[product&&product.color] || COLOR_STYLES.Clear;
}

function requestTryOn(){
  if(!currentProduct)return;
  pendingTryOnProduct=currentProduct;
  document.getElementById('camPermModal').classList.add('show');
}
function closeCamPermModal(){document.getElementById('camPermModal').classList.remove('show');}
function proceedToCamera(){
  closeCamPermModal();
  document.getElementById('tryOnModal').classList.add('show');
  document.getElementById('tryOnProductName').textContent=currentProduct.name;
  document.getElementById('tryOnStatus').textContent='';
  startTryOn();
}
function closeTryOn(){document.getElementById('tryOnModal').classList.remove('show');stopTryOn();}

function stopTryOn(){
  mpFrameLoop=false;
  if(fallbackAnimId){cancelAnimationFrame(fallbackAnimId);fallbackAnimId=null;}
  if(faceMesh){try{faceMesh.close();}catch(e){}faceMesh=null;}
  if(tryStream){tryStream.getTracks().forEach(t=>t.stop());tryStream=null;}
  const v=document.getElementById('tryOnVideo');if(v)v.srcObject=null;
  const c=document.getElementById('tryOnCanvas');
  if(c){const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);}
  document.getElementById('tryOnLoading').style.display='none';
  latestLandmarks=null;faceDetected=false;
}

function startTryOn(){
  const video=document.getElementById('tryOnVideo');
  const status=document.getElementById('tryOnStatus');
  const loading=document.getElementById('tryOnLoading');
  const loadingText=document.getElementById('tryOnLoadingText');
  status.textContent='';
  loading.style.display='flex';
  loadingText.textContent='Requesting camera access…';

  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    loading.style.display='none';
    status.textContent='Camera is not supported in this browser. Please try Chrome or Safari.';
    return;
  }

  // Try ideal constraints first, fall back to basic if it fails
  const constraintsList=[
    {video:{facingMode:'user',width:{ideal:640},height:{ideal:480}}},
    {video:{facingMode:'user'}},
    {video:true}
  ];

  function tryNext(i){
    if(i>=constraintsList.length){
      loading.style.display='none';
      status.textContent='📷 Unable to start camera. Please check your device has a working camera.';
      return;
    }
    navigator.mediaDevices.getUserMedia(constraintsList[i])
      .then(stream=>{
        tryStream=stream;
        video.srcObject=stream;
        loadingText.textContent='Loading face tracking model…';
        video.onloadedmetadata=()=>{
          video.play().then(()=>{
            initFaceMesh(video);
          }).catch(err=>{
            loading.style.display='none';
            status.textContent='Could not start video preview: '+err.message;
          });
        };
      })
      .catch(err=>{
        if(i<constraintsList.length-1){tryNext(i+1);return;}
        loading.style.display='none';
        if(err.name==='NotAllowedError'||err.name==='PermissionDeniedError'){
          status.textContent='📷 Camera access was denied. Please allow camera permission in your browser settings and try again.';
        }else if(err.name==='NotFoundError'||err.name==='DevicesNotFoundError'){
          status.textContent='📷 No camera found on this device.';
        }else if(err.name==='NotReadableError'){
          status.textContent='📷 Camera is already in use by another app. Close it and try again.';
        }else{
          status.textContent='📷 Camera error: '+err.message;
        }
      });
  }
  tryNext(0);
}

// Sets up MediaPipe Face Mesh for real, per-frame eye landmark tracking.
// If the library failed to load (e.g. offline / CSP blocked), we degrade
// gracefully to a fixed-position overlay instead of breaking the feature.
function initFaceMesh(video){
  const canvas=document.getElementById('tryOnCanvas');
  tryOnCtx=canvas.getContext('2d');
  const loading=document.getElementById('tryOnLoading');
  const status=document.getElementById('tryOnStatus');

  const hasMediaPipe=(typeof FaceMesh!=='undefined');

  if(!hasMediaPipe){
    loading.style.display='none';
    status.textContent='⚠️ Live face tracking unavailable (offline?) — showing basic overlay.';
    drawLensOverlayFallback(canvas,video);
    return;
  }

  try{
    faceMesh=new FaceMesh({
      locateFile:(file)=>`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`
    });
    faceMesh.setOptions({
      maxNumFaces:1,
      refineLandmarks:true,      // enables the iris landmarks (indices 468-477)
      minDetectionConfidence:0.6,
      minTrackingConfidence:0.6
    });
    faceMesh.onResults(onFaceMeshResults);
  }catch(e){
    faceMesh=null;
    loading.style.display='none';
    status.textContent='⚠️ Could not start face tracking — showing basic overlay.';
    drawLensOverlayFallback(canvas,video);
    return;
  }

  loading.style.display='none';
  mpFrameLoop=true;

  (async function pump(){
    if(!mpFrameLoop||!tryStream||!faceMesh)return;
    try{
      await faceMesh.send({image:video});
    }catch(e){
      // transient per-frame failure — keep the loop alive
    }
    if(mpFrameLoop)requestAnimationFrame(pump);
  })();
}

// Called by MediaPipe with the detected face landmarks for the current frame.
function onFaceMeshResults(results){
  const canvas=document.getElementById('tryOnCanvas');
  if(!canvas||!tryStream)return;
  const rect=canvas.getBoundingClientRect();
  if(canvas.width!==Math.round(rect.width))canvas.width=Math.round(rect.width)||320;
  if(canvas.height!==Math.round(rect.height))canvas.height=Math.round(rect.height)||240;
  const ctx=tryOnCtx||canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const status=document.getElementById('tryOnStatus');

  if(!results.multiFaceLandmarks||results.multiFaceLandmarks.length===0){
    faceDetected=false;
    latestLandmarks=null;
    if(status)status.textContent='🙂 No face detected — center your face in the frame.';
    return;
  }

  faceDetected=true;
  if(status)status.textContent='';
  latestLandmarks=results.multiFaceLandmarks[0];
  drawLensOverlay(ctx,canvas.width,canvas.height,latestLandmarks,false);
}

// Turns raw iris landmarks into on-canvas eye position + radius.
// mirror=true flips X (used only for the saved/downloaded photo, since that
// canvas isn't CSS-mirrored the way the live preview canvas is).
//
// IMPORTANT: MediaPipe's landmarks are normalized (0-1) against the camera's
// *native* video frame (video.videoWidth x video.videoHeight), not against
// the canvas's displayed CSS size. The video/canvas are shown with
// `object-fit: cover`, which crops the native frame to fill the box — so a
// naive `lm.x * canvasWidth` mapping drifts off the eyes whenever the
// camera's native aspect ratio doesn't match the preview box (the common
// case, since most webcams are 16:9 but the preview is 4:3). This replicates
// the same cover-crop math so the overlay lines up with the real eyes.
function eyeGeometry(landmarks,canvasW,canvasH,mirror){
  const video=document.getElementById('tryOnVideo');
  const vw=(video&&video.videoWidth)||canvasW;
  const vh=(video&&video.videoHeight)||canvasH;
  const scale=Math.max(canvasW/vw,canvasH/vh);
  const offX=(vw*scale-canvasW)/2;
  const offY=(vh*scale-canvasH)/2;
  const pt=(idx)=>{
    const lm=landmarks[idx];
    const nx=mirror?(1-lm.x):lm.x;
    return{x:nx*vw*scale-offX,y:lm.y*vh*scale-offY};
  };
  const leftC=pt(LEFT_IRIS_CENTER), leftA=pt(LEFT_IRIS_L), leftB=pt(LEFT_IRIS_R);
  const rightC=pt(RIGHT_IRIS_CENTER), rightA=pt(RIGHT_IRIS_L), rightB=pt(RIGHT_IRIS_R);
  const leftR=Math.hypot(leftA.x-leftB.x,leftA.y-leftB.y)/2*1.3;
  const rightR=Math.hypot(rightA.x-rightB.x,rightA.y-rightB.y)/2*1.3;
  return[{x:leftC.x,y:leftC.y,r:leftR},{x:rightC.x,y:rightC.y,r:rightR}];
}

function drawLensOverlay(ctx,w,h,landmarks,mirror){
  const style=lensStyleFor(currentProduct);
  const eyes=eyeGeometry(landmarks,w,h,!!mirror);
  eyes.forEach(eye=>{
    // Tint the actual iris using a multiply blend — this darkens/colours
    // whatever eye colour is really there instead of drawing a flat,
    // barely-visible translucent disc on top of it.
    ctx.save();
    ctx.globalCompositeOperation='multiply';
    const grad=ctx.createRadialGradient(eye.x,eye.y,eye.r*0.12,eye.x,eye.y,eye.r);
    grad.addColorStop(0,style.core);
    grad.addColorStop(0.6,style.core);
    grad.addColorStop(1,'rgba(255,255,255,1)');
    ctx.beginPath();ctx.arc(eye.x,eye.y,eye.r,0,Math.PI*2);ctx.fillStyle=grad;ctx.fill();
    ctx.restore();

    // Limbal ring — the darker rim real coloured contacts have at the edge.
    ctx.save();
    ctx.globalCompositeOperation='multiply';
    ctx.beginPath();ctx.arc(eye.x,eye.y,eye.r,0,Math.PI*2);
    ctx.strokeStyle=style.ring;ctx.lineWidth=Math.max(1.5,eye.r*0.14);ctx.stroke();
    ctx.restore();

    // Specular highlight so the lens still looks glossy/alive.
    ctx.beginPath();ctx.arc(eye.x-eye.r*0.28,eye.y-eye.r*0.28,eye.r*0.16,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,0.55)';ctx.fill();
  });
}

// Fallback overlay (fixed proportional eye positions) — only used if the
// MediaPipe Face Mesh library couldn't be loaded, so try-on still works.
function drawLensOverlayFallback(canvas,video){
  const style=lensStyleFor(currentProduct);
  let frame=0;
  function animate(){
    if(!tryStream)return;
    const rect=canvas.getBoundingClientRect();
    if(canvas.width!==Math.round(rect.width))canvas.width=Math.round(rect.width)||320;
    if(canvas.height!==Math.round(rect.height))canvas.height=Math.round(rect.height)||240;
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const cx=canvas.width,cy=canvas.height;
    const eyes=[{x:cx*0.37,y:cy*0.40},{x:cx*0.63,y:cy*0.40}];
    const r=Math.min(cx,cy)*0.088;
    const pulse=1+0.025*Math.sin(frame*0.05);
    eyes.forEach(eye=>{
      ctx.save();ctx.globalCompositeOperation='multiply';
      const grad=ctx.createRadialGradient(eye.x,eye.y,r*0.15,eye.x,eye.y,r*pulse);
      grad.addColorStop(0,style.core);grad.addColorStop(0.6,style.core);grad.addColorStop(1,'rgba(255,255,255,1)');
      ctx.beginPath();ctx.arc(eye.x,eye.y,r*pulse,0,Math.PI*2);ctx.fillStyle=grad;ctx.fill();
      ctx.beginPath();ctx.arc(eye.x,eye.y,r*pulse,0,Math.PI*2);ctx.strokeStyle=style.ring;ctx.lineWidth=2.5;ctx.stroke();
      ctx.restore();
      ctx.beginPath();ctx.arc(eye.x-r*0.25,eye.y-r*0.25,r*0.18,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.5)';ctx.fill();
    });
    frame++;
    if(tryStream)fallbackAnimId=requestAnimationFrame(animate);
  }
  animate();
}

function captureTryOn(){
  const video=document.getElementById('tryOnVideo');
  if(!video||!video.videoWidth){showToast('Camera not ready yet — please wait a moment');return;}
  const canvas=document.createElement('canvas');
  canvas.width=video.videoWidth;canvas.height=video.videoHeight;
  const ctx=canvas.getContext('2d');
  ctx.save();ctx.scale(-1,1);ctx.drawImage(video,-canvas.width,0);ctx.restore();

  if(faceDetected&&latestLandmarks){
    drawLensOverlay(ctx,canvas.width,canvas.height,latestLandmarks,true);
  }else{
    // No live landmarks (fallback mode, or face briefly lost) — approximate.
    const style=lensStyleFor(currentProduct);
    const cx=canvas.width,cy=canvas.height;
    const eyes=[{x:cx*0.37,y:cy*0.40},{x:cx*0.63,y:cy*0.40}];
    const r=Math.min(cx,cy)*0.088;
    eyes.forEach(eye=>{
      ctx.save();ctx.globalCompositeOperation='multiply';
      const grad=ctx.createRadialGradient(eye.x,eye.y,r*0.15,eye.x,eye.y,r);
      grad.addColorStop(0,style.core);grad.addColorStop(0.6,style.core);grad.addColorStop(1,'rgba(255,255,255,1)');
      ctx.beginPath();ctx.arc(eye.x,eye.y,r,0,Math.PI*2);ctx.fillStyle=grad;ctx.fill();
      ctx.beginPath();ctx.arc(eye.x,eye.y,r,0,Math.PI*2);ctx.strokeStyle=style.ring;ctx.lineWidth=3;ctx.stroke();
      ctx.restore();
    });
  }

  canvas.toBlob(blob=>{
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');link.download='lensly-tryon.png';link.href=url;link.click();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
    showToast('📸 Photo saved!');
  },'image/png');
}

// ═══════════════════════════════════════
//  WISHLIST
// ═══════════════════════════════════════
let wishlistMap = {}; // productId -> wishlistRowId

async function loadWishlist(){
  try {
    const res = await fetch(`${API_BASE_URL}/api/wishlist`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    const result = await res.json();
    if (result.success) {
      wishlistMap = {};
      result.data.forEach(item => {
        const pid = item.product_id || item.productId;
        wishlistMap[pid] = item.id;
      });
      updateAllHeartIcons();
    }
  } catch (err) {
    console.error('Failed to load wishlist:', err);
  }
}

function isWished(productId){
  return Object.prototype.hasOwnProperty.call(wishlistMap, productId);
}

async function toggleWishlist(productId, btnEl){
  if(!isLoggedIn){requireLogin();return;}
  const wished = isWished(productId);
  try {
    if (wished) {
      const wishlistId = wishlistMap[productId];
      const res = await fetch(`${API_BASE_URL}/api/wishlist/${wishlistId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      const result = await res.json();
      if (result.success) {
        delete wishlistMap[productId];
        showToast('💔 Removed from wishlist');
      } else {
        showToast('⚠️ ' + result.message);
        return;
      }
    } else {
      const res = await fetch(`${API_BASE_URL}/api/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ productId })
      });
      const result = await res.json();
      if (result.success) {
        await loadWishlist(); // refresh to get the new row's real id
        showToast('❤️ Added to wishlist');
      } else {
        showToast('⚠️ ' + result.message);
        return;
      }
    }
    updateAllHeartIcons();
  } catch (err) {
    console.error('Wishlist toggle error:', err);
    showToast('⚠️ Wishlist update failed');
  }
}

function openWishlistPage(){
  if(!isLoggedIn){requireLogin();return;}
  renderWishlistGrid();
  document.getElementById('wishlistOverlay').classList.add('open');
}
function closeWishlistOverlay(){
  document.getElementById('wishlistOverlay').classList.remove('open');
}
function renderWishlistGrid(){
  const g = document.getElementById('wishlistGrid');
  const wishedIds = Object.keys(wishlistMap);
  const list = PRODUCTS.filter(p => wishedIds.includes(String(p.id)));
  if (!list.length) {
    g.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🤍</div><p>Your wishlist is empty.<br>Tap the heart on any product to save it here.</p></div>';
    return;
  }
  g.innerHTML = list.map(p => `
    <div class="product-card" onclick="closeWishlistOverlay();openProduct('${p.id}')">
      <div class="product-img-wrap">
        <button class="wishlist-heart-btn active" data-pid="${p.id}" onclick="event.stopPropagation();toggleWishlist('${p.id}',this);renderWishlistGrid();">❤️</button>
        <img src="${p.img}" alt="${_e(p.name)}" loading="lazy">
      </div>
      <div class="product-info">
        <div class="product-brand">${_e(p.brand)}</div>
        <div class="product-name">${_e(p.name)}</div>
        <div class="product-price">₹${p.price}</div>
        <button class="add-cart-btn" onclick="event.stopPropagation();quickAdd('${p.id}')">+ Add to Cart</button>
      </div>
    </div>`).join('');
}

function updateAllHeartIcons(){
  document.querySelectorAll('.wishlist-heart-btn').forEach(btn => {
    const pid = btn.dataset.pid;
    btn.textContent = isWished(pid) ? '❤️' : '🤍';
    btn.classList.toggle('active', isWished(pid));
  });
  const badge = document.getElementById('wishlistBadge');
  if (badge) badge.textContent = Object.keys(wishlistMap).length;
}

// ═══════════════════════════════════════
//  CART LOGIC
// ═══════════════════════════════════════
async function addToCart(product,power,quantity){
  if(!isLoggedIn){requireLogin();return;}
  try {
    const res = await fetch(`${API_BASE_URL}/api/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ productId: product.id, quantity: quantity || 1, power })
    });
    const result = await res.json();
    if (result.success) {
      await loadCartFromBackend();
      showToastWithAction('✅ Added to cart!', 'view cart', () => goTo('cartPage'));
    } else {
      showToast('⚠️ ' + result.message);
    }
  } catch (err) {
    console.error('Add to cart error:', err);
    showToast('⚠️ Could not add to cart');
  }
}

async function loadCartFromBackend(){
  try {
    const res = await fetch(`${API_BASE_URL}/api/cart`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    const result = await res.json();
    if (result.success) {
      cart = result.data.items.map(item => ({
        cartItemId: item.id,
        id: item.product_id,
        img: item.image_url || item.img,
        name: item.name,
        price: Number(item.price),
        power: item.power,
        qty: item.quantity
      }));
      updateBadges();
    }
  } catch (err) {
    console.error('Failed to load cart:', err);
  }
}

async function loadOrdersFromBackend(){
  try {
    const res = await fetch(`${API_BASE_URL}/api/orders`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    const result = await res.json();
    if (result.success) {
      return result.data;
    }
    return [];
  } catch (err) {
    console.error('Failed to load orders:', err);
    return [];
  }
}

async function changeQty(idx,d){
  const item = cart[idx];
  const newQty = item.qty + d;
  if (newQty <= 0) {
    return removeItem(idx);
  }
  try {
    const res = await fetch(`${API_BASE_URL}/api/cart/${item.cartItemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ quantity: newQty })
    });
    const result = await res.json();
    if (result.success) {
      await loadCartFromBackend();
      renderCart();
    } else {
      showToast('⚠️ ' + result.message);
    }
  } catch (err) {
    console.error('Update quantity error:', err);
    showToast('⚠️ Could not update quantity');
  }
}

async function removeItem(idx){
  const item = cart[idx];
  try {
    const res = await fetch(`${API_BASE_URL}/api/cart/${item.cartItemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    const result = await res.json();
    if (result.success) {
      await loadCartFromBackend();
      renderCart();
      showToast('Removed from cart');
    } else {
      showToast('⚠️ ' + result.message);
    }
  } catch (err) {
    console.error('Remove item error:', err);
    showToast('⚠️ Could not remove item');
  }
}

async function resetCart(){
  try {
    await fetch(`${API_BASE_URL}/api/cart`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
  } catch (err) {
    console.error('Clear cart error:', err);
  }
  cart=[];
  updateBadges();
}

function updateBadges(){const n=cart.reduce((s,i)=>s+i.qty,0);document.querySelectorAll('#cartBadge,#cartBadge2').forEach(b=>b.textContent=n);}



// ═══════════════════════════════════════
//  CHECKOUT
// ═══════════════════════════════════════
function goToCheckout(){
  const sub=cart.reduce((s,i)=>s+i.price*i.qty,0),del=sub>1500?0:60;
  document.getElementById('coSummary').innerHTML=cart.map(i=>`<div class="cart-row"><span>${_e(i.name)} (${_e(i.power)}) ×${i.qty}</span><span>₹${i.price*i.qty}</span></div>`).join('')+`<div class="cart-row total"><span>Total</span><span>₹${sub+del}</span></div>`;
  goTo('checkoutPage');renderCheckoutSlogan();
  // pre-fill from profile
  if(userProfile.name)document.getElementById('coName').value=userProfile.name;
  if(userProfile.phone)document.getElementById('coPhone').value=userProfile.phone;
  if(userProfile.email)document.getElementById('coEmail').value=userProfile.email;
}
function renderCheckoutSlogan(){const e=document.getElementById('checkoutSlogan');if(e)e.textContent=pickSlogan(SLOGANS.checkout);}

async function goToPayment(){
  const name=document.getElementById('coName').value.trim();
  const phone=document.getElementById('coPhone').value.trim();
  const addr1=document.getElementById('coAddr1').value.trim();
  const city=document.getElementById('coCity').value.trim();
  const pin=document.getElementById('coPin').value.trim();
  if(!name){showToast('⚠️ Please enter your name');return;}
  if(!phone||phone.replace(/\D/g,'').length<10){showToast('⚠️ Enter a valid phone number');return;}
  if(!addr1){showToast('⚠️ Enter house / flat details');return;}
  if(!city){showToast('⚠️ Enter your city');return;}
  if(!pin||pin.length<6){showToast('⚠️ Enter a valid PIN code');return;}

  try {
    const response = await fetch(`${API_BASE_URL}/api/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({
        full_name: name,
        phone: phone,
        address: addr1,
        city: city,
        pincode: pin
      })
    });
    const result = await response.json();
    if (!result.success) {
      showToast('⚠️ Could not save address');
      return;
    }
    selectedAddressId = result.data.id;
  } catch (err) {
    console.error(err);
    showToast('⚠️ Could not save address');
    return;
  }

  const sub=cart.reduce((s,i)=>s+i.price*i.qty,0),del=sub>1500?0:60;
  document.getElementById('payAmount').textContent='₹'+(sub+del);
  selPayment=null;
  document.querySelectorAll('.payment-option').forEach(o=>o.classList.remove('selected'));
  document.getElementById('upiSec').style.display='none';
  document.getElementById('cardSec').style.display='none';
  goTo('paymentPage');
}
// ═══════════════════════════════════════
//  PAYMENT
// ═══════════════════════════════════════
function selPay(el,type){
  document.querySelectorAll('.payment-option').forEach(o=>o.classList.remove('selected'));
  el.classList.add('selected');selPayment=type;
  document.getElementById('upiSec').style.display=type==='upi'?'block':'none';
  document.getElementById('cardSec').style.display=type==='card'?'block':'none';
}
async function confirmPayment(){
  if(!selPayment){showToast('⚠️ Please select a payment method');return;}

  try {
    const response = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ addressId: selectedAddressId })
    });

    const result = await response.json();
    if (!result.success) {
      showToast('⚠️ ' + result.message);
      return;
    }

    const { order, razorpayOrder, key } = result.data;

    const options = {
      key: key,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      order_id: razorpayOrder.id,
      name: "Lensly",
      description: "Order Payment",
      handler: async function(response){
        await verifyPaymentWithBackend(response, order.id);
      },
      prefill: {
        name: userProfile.name,
        email: userProfile.email,
        contact: userProfile.phone
      },
      theme: { color: "#6C5CE7" }
    };

    const rzp = new Razorpay(options);
    rzp.open();

  } catch (err) {
    console.error(err);
    showToast('⚠️ Payment failed to start');
  }
}

async function verifyPaymentWithBackend(razorpayResponse, orderId){
  try {
    const response = await fetch(`${API_BASE_URL}/api/payment/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
        orderId: orderId
      })
    });

    const result = await response.json();
    if (!result.success) {
      showToast('⚠️ Payment verification failed');
      return;
    }

    document.getElementById('trackingId').textContent = 'Order ID: ' + orderId;
    document.getElementById('confirmSlogan').textContent = pickSlogan(SLOGANS.orderConfirm);
    renderTrackingSteps('Processing');
    pageHistory = [];
    goTo('trackingPage');
    showToast('🎉 Order placed successfully!');
    resetCart();

  } catch (err) {
    console.error(err);
    showToast('⚠️ Payment verification failed');
  }
}

// ═══════════════════════════════════════
//  LIVE ORDER TRACKING
// ═══════════════════════════════════════
const STATUS_STEPS = ["Order Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered"];
const STATUS_TIMES = ["Just now", "Within 24 hours", "1-2 days", "2-4 days", "3-5 days"];

function renderTrackingSteps(currentStatus) {
  // "Order Confirmed" is always considered done once an order exists.
  // Map the real backend status onto the remaining 4 steps.
  const realSteps = ["Processing", "Shipped", "Out for Delivery", "Delivered"];
  let currentIndex = realSteps.indexOf(currentStatus);
  if (currentIndex === -1) currentIndex = 0; // fallback to Processing if unknown/null

  const activeStepIndex = currentIndex + 1; // +1 because "Order Confirmed" is step 0

  const el = document.getElementById('trackingSteps');
  if (!el) return;

  el.innerHTML = STATUS_STEPS.map((label, i) => {
    let dotClass = 'pending';
    let dotContent = '';
    if (i < activeStepIndex) { dotClass = 'done'; dotContent = '✓'; }
    else if (i === activeStepIndex) { dotClass = 'active'; dotContent = '→'; }

    return `<div class="t-step">
      <div class="t-step-dot ${dotClass}">${dotContent}</div>
      <div>
        <div class="t-step-label">${label}</div>
        <div class="t-step-time">${STATUS_TIMES[i]}</div>
      </div>
    </div>`;
  }).join('');
}

function viewOrderTracking(orderId, status) {
  document.getElementById('trackingId').textContent = 'Order ID: #' + String(orderId).slice(0,8).toUpperCase();
  renderTrackingSteps(status);
  goTo('trackingPage');
}

// ═══════════════════════════════════════
//  Sign Out
// ═══════════════════════════════════════
function signOut(){
  localStorage.removeItem('token');
  isLoggedIn = false;
  cart = [];
  wishlist = {};
  userProfile = { name: '', email: '', phone: '' };
  safeStore('profile', userProfile);
  document.getElementById('userAvatar').textContent = 'U';
  pageHistory = [];
  updateBadges();
  showToast('👋🏻 Signed out');
  goToPage('loginPage');
}

// ═══════════════════════════════════════
//  REORDER NOTIFICATIONS
// ═══════════════════════════════════════
function checkReorderNotifications(){
  const orders=safeRead('orders',[]);if(!orders.length)return;
  const now=Date.now();let changed=false;
  orders.forEach(order=>{
    if(order.reminded)return;
    const expiresAt=order.placedAt+(order.wearDays*86400000);
    if(now>=expiresAt-(2*86400000)){setTimeout(()=>showReorderBanner(order),1500);order.reminded=true;changed=true;}
  });
  if(changed)safeStore('orders',orders);
}
function showReorderBanner(order){
  const msg=pickSlogan(SLOGANS.reorder);
  document.getElementById('reorderMsg').textContent=msg;
  document.getElementById('reorderProduct').textContent='🔔 Reminder: '+order.productName+' is about to run out!';
  const b=document.getElementById('reorderBanner');
  b.style.display='flex';setTimeout(()=>b.style.opacity=1,50);
}
function dismissReorder(){const b=document.getElementById('reorderBanner');b.style.opacity=0;setTimeout(()=>b.style.display='none',400);}

// ═══════════════════════════════════════
//  PROFILE
// ═══════════════════════════════════════
async function renderProfile(){
  const orders = await loadOrdersFromBackend();

  document.getElementById('statOrders').textContent = orders.length;
  document.getElementById('statCart').textContent = cart.reduce((s,i)=>s+i.qty,0);
  const saved = PRODUCTS.reduce((s,p)=>s+(p.oldPrice-p.price),0);
  document.getElementById('statSaved').textContent = '₹0'; // no reliable "saved" data from real orders yet

  const name = userProfile.name || 'Guest User';
  document.getElementById('profileAvatarLg').textContent = name.charAt(0).toUpperCase();
  document.getElementById('profileNameLg').textContent = name;
  document.getElementById('profileMetaLg').textContent = userProfile.email || userProfile.phone || 'Member since today';
  document.getElementById('profName').value = userProfile.name || '';
  document.getElementById('profEmail').value = userProfile.email || '';
  document.getElementById('profPhone').value = userProfile.phone || '';

  const list = document.getElementById('profileOrdersList');
  if (!orders.length) {
    list.innerHTML = '<p style="font-size:.82rem;color:var(--text-light);">No orders yet.</p>';
  } else {
    list.innerHTML = orders.slice(0, 5).map(o => {
      const status = o.status || 'Processing';
      const amount = o.total ? `₹${o.total}` : '';
      const date = o.created_at ? new Date(o.created_at).toLocaleDateString() : '';
      return `<div class="profile-list-item" onclick="viewOrderTracking('${o.id}','${status}')">
        <div class="profile-list-icon">📦</div>
        <div class="profile-list-text">
          <div class="profile-list-title">Order #${_e(String(o.id).slice(0,8))}</div>
          <div class="profile-list-sub">${_e(status)} • ${amount} • ${date}</div>
        </div>
      </div>`;
    }).join('');
  }
}

async function renderOrdersPage(){
  const orders = await loadOrdersFromBackend();
  const list = document.getElementById('ordersPageList');

  if (!orders.length) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📦</div>
      <p>You haven't ordered anything yet.</p>
      <button onclick="openCollection('all')" style="margin-top:13px;padding:11px 26px;border-radius:10px;border:none;background:var(--primary);color:white;font-weight:700;font-size:.93rem;cursor:pointer;">Shop Now</button>
    </div>`;
    return;
  }

  list.innerHTML = orders.map(o => {
    const status = o.status || 'Processing';
    const amount = o.total ? `₹${o.total}` : '';
    const date = o.created_at ? new Date(o.created_at).toLocaleDateString() : '';
    const stepsHtml = buildMiniTrackerHtml(status);

    return `<div style="background:white;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.06);">
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <strong>Order #${_e(String(o.id).slice(0,8).toUpperCase())}</strong>
        <span>${amount}</span>
      </div>
      <div style="font-size:.78rem;color:var(--text-light);margin-bottom:12px;">${date}</div>
      ${stepsHtml}
    </div>`;
  }).join('');
}

function buildMiniTrackerHtml(currentStatus){
  const steps = ["Order Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered"];
  const realSteps = ["Processing", "Shipped", "Out for Delivery", "Delivered"];
  let currentIndex = realSteps.indexOf(currentStatus);
  if (currentIndex === -1) currentIndex = 0;
  const activeStepIndex = currentIndex + 1;

  return `<div style="display:flex;gap:4px;">
    ${steps.map((label, i) => {
      const color = i < activeStepIndex ? '#6C5CE7' : (i === activeStepIndex ? '#A29BFE' : '#E0E0E0');
      return `<div style="flex:1;height:5px;border-radius:3px;background:${color};" title="${label}"></div>`;
    }).join('')}
  </div>
  <div style="font-size:.74rem;color:var(--text-light);margin-top:6px;">Status: ${_e(currentStatus)}</div>`;
}

function saveProfile(){
  const name=document.getElementById('profName').value.trim();
  const email=document.getElementById('profEmail').value.trim();
  const phone=document.getElementById('profPhone').value.trim();
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showToast('⚠️ Enter a valid email address');return;}
  userProfile={name,email,phone};
  safeStore('profile',userProfile);
  renderProfile();
  showToast('✅ Profile updated!');
}

async function requestReturn() {
  const orders = await loadOrdersFromBackend();
  if (!orders.length) {
    showToast('⚠️ You have no orders to return');
    return;
  }
  // Use the most recent order for simplicity — can upgrade to a picker later
  const latestOrder = orders[0];
  const reason = prompt("Briefly tell us why you'd like to return this order:");
  if (reason === null) return; // user cancelled

  try {
    const res = await fetch(`${API_BASE_URL}/api/returns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ order_id: latestOrder.id, reason })
    });
    const result = await res.json();
    if (result.success) {
      showToast('✅ Return request submitted! We will email you.');
    } else {
      showToast('⚠️ ' + result.message);
    }
  } catch (err) {
    console.error('Return request error:', err);
    showToast('⚠️ Could not submit return request');
  }
}

// ═══════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════
function showToast(msg){
  const t=document.getElementById('toast');
  t.innerHTML='';
  t.textContent=msg;
  t.classList.add('show');
  clearTimeout(window._tt);window._tt=setTimeout(()=>t.classList.remove('show'),2800);
}

function showToastWithAction(msg, actionLabel, actionFn){
  const t=document.getElementById('toast');
  clearTimeout(window._tt);
  t.innerHTML = `<span>${_e(msg)}</span> <button id="toastActionBtn" style="margin-left:10px;background:white;color:#6C5CE7;border:none;border-radius:6px;padding:4px 10px;font-weight:700;font-size:.78rem;cursor:pointer;">${_e(actionLabel)}</button>`;
  t.classList.add('show');
  document.getElementById('toastActionBtn').onclick = () => {
    t.classList.remove('show');
    actionFn();
  };
  window._tt=setTimeout(()=>t.classList.remove('show'),4000);
}
// ═══════════════════════════════════════
//  INIT
// ═══════════════════════════════════════
updateBadges();

window.addEventListener('popstate', function(){
  goBack();
});

loadAllProducts().then(() => {
    renderOverlayGrid(PRODUCTS);
});

const _urlParams = new URLSearchParams(window.location.search);
const _skipSplashForPrivacy = _urlParams.get('fromPrivacy') === '1';

tryAutoLogin().then(async (loggedIn) => {
  if (loggedIn) {
    await Promise.all([loadWishlist(), loadCartFromBackend()]);
  }
    if (_skipSplashForPrivacy) {
      goToPage('homePage');
      renderCollections();
      renderRec('recScroll', 0);
      updateBadges();
    } else {
      runSplash();
    }
});