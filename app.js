// ==========================================
// CONFIGURATION & CONSTANTS
// ==========================================
const CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbwzwaDlMarLw7tvgm6dFRnnORWdgZ5o3M01NhNf9lNm0tvwOw2WvB9CkOP5jYcnDFMjhA/exec",
  SEARCH_DELAY: 250 // หน่วงเวลา 250ms เพื่อลดการกระตุกเวลาพิมพ์
};

const ICON_MAP = {
  'bag': 'fa-shopping-bag',
  'shoe': 'fa-shoe-prints',
  'heel': 'fa-shoe-prints',
  'watch': 'fa-clock'
};

// ==========================================
// GLOBAL STATE
// ==========================================
let localProductDatabase = [];
let currentBranch = "";
let currentStockView = 'category';
let searchTimeout = null; // ตัวแปรเก็บเวลาสำหรับล้าง Debounce

// ==========================================
// UTILITY FUNCTIONS (Security & Core Logic)
// ==========================================

// 🌟 1. ระบบทำความสะอาดข้อมูล (ป้องกัน XSS Attack ตามที่ Copilot แนะนำ)
function escapeHTML(str) {
  if (str == null) return '';
  return str.toString().replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}

// 🌟 2. ระบบหน่วงเวลา (Debounce) แบบล้างค่าได้
function debounceSearch(func, wait) {
  return function(...args) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function parseDriveImage(url) {
  if (!url || url === 'CellImage') return 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';
  let match = url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return 'https://drive.google.com/thumbnail?id=' + match[1] + '&sz=w500';
  return url;
}

// 🌟 3. จัดระเบียบการหาไอคอนหมวดหมู่ (Clean Code)
function getCategoryIcon(catName) {
  const name = (catName || "").toLowerCase();
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (name.includes(key)) return icon;
  }
  return 'fa-box-open'; // ค่าเริ่มต้น
}

// ==========================================
// INITIALIZATION & EVENT LISTENERS
// ==========================================
function initEventListeners() {
  // หน้า Login
  document.getElementById('btnSubmitLogin').addEventListener('click', submitLogin);
  
  // 🌟 หน้า Main Menu (อัปเดตใหม่ 5 ปุ่ม) 🌟
  document.getElementById('btnMenuStock').addEventListener('click', openStockInHouse);
  document.getElementById('btnMenuMovement').addEventListener('click', () => alert('PRODUCT MOVEMENT: Transfer In/Out, Hold, Defective (กำลังพัฒนา)'));
  document.getElementById('btnMenuTake').addEventListener('click', () => alert('STOCK TAKE - กำลังพัฒนา'));
  document.getElementById('btnMenuAdjust').addEventListener('click', () => alert('ADJUST STOCK - กำลังพัฒนา'));
  document.getElementById('btnMenuLocation').addEventListener('click', () => alert('LOCATION - กำลังพัฒนา'));
  document.getElementById('btnLogout').addEventListener('click', logoutBranch);

  // หน้า Stock
  document.getElementById('btnStockBack').addEventListener('click', handleStockBack);
  document.getElementById('clearSearchBtn').addEventListener('click', clearSearch);
  
  // กล้องสแกน
  const toggleCam = () => { if (typeof toggleScanner === 'function') toggleScanner(); };
  document.getElementById('btnScannerOpen').addEventListener('click', toggleCam);
  document.getElementById('btnScannerClose').addEventListener('click', toggleCam);

  // ช่องค้นหาพร้อม Debounce
  const searchInput = document.getElementById('searchStockInput');
  searchInput.addEventListener('input', debounceSearch(handleMagicSearch, CONFIG.SEARCH_DELAY));

  // หน้า Modal Detail
  document.getElementById('btnCloseModal').addEventListener('click', closeProductDetail);
}

window.onload = function() {
  initEventListeners();
  const savedBranch = localStorage.getItem('pattcha_branch');
  if (savedBranch) {
    document.getElementById('branchCodeInput').value = savedBranch;
    submitLogin();
  }
};

// ==========================================
// MAIN FUNCTIONALITIES
// ==========================================

async function submitLogin() {
  const code = document.getElementById('branchCodeInput').value.trim().toUpperCase();
  const btn = document.getElementById('btnSubmitLogin');
  if (!code) return alert("⚠️ กรุณากรอกรหัสสาขาครับ");
  
  btn.innerText = "⏳ LOADING...";
  btn.disabled = true;
  
  try {
    const response = await fetch(CONFIG.API_URL + "?action=login&branch=" + code);
    const res = await response.json();
    
 if (res.success) {
      localStorage.setItem('pattcha_branch', code);
      localProductDatabase = res.products || [];
      currentBranch = res.branch;

      const sharedHeader = document.getElementById('sharedHeader');
      const loginView = document.getElementById('loginView');
      const mainMenuView = document.getElementById('mainMenuView');

      // 1. สั่งให้ช่องกรอกรหัสจางหายไป
      loginView.classList.add('fade-out');
      
      // 2. สั่งให้โลโก้แชร์เฮดเดอร์พุ่งขึ้นไปข้างบนสุด
      sharedHeader.classList.remove('header-center');
      sharedHeader.classList.add('header-top');

      // 3. รออนิเมชั่นเฟดเสร็จเป๊ะๆ แล้วเปิดหน้าเมนูหลัก
      loginView.addEventListener('transitionend', function onEnd(e) {
        if (e.propertyName !== 'opacity') return;
        loginView.removeEventListener('transitionend', onEnd); 

        loginView.classList.add('hide');
        mainMenuView.classList.remove('hide');
        mainMenuView.classList.add('fade-in');
        
        document.getElementById('branchLabel').innerText = "LOCATION : " + escapeHTML(currentBranch);
      });
    }

    } else {
      alert("❌ " + escapeHTML(res.message));
    }
  } catch (err) {
    console.error("Login Error:", err);
    alert("❌ ระบบขัดข้อง: ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้");
  } finally {
    btn.innerText = "SUBMIT";
    btn.disabled = false;
  }
}

function logoutBranch() {
  if (confirm("ต้องการออกจากระบบสาขาใช่หรือไม่?")) {
    localStorage.removeItem('pattcha_branch');
    location.reload();
  }
}

function openStockInHouse() {
  document.getElementById('sharedHeader').classList.add('hide'); 
  document.getElementById('mainMenuView').classList.add('hide');
  document.getElementById('stockInHouseView').classList.remove('hide');
  renderCategories();
}

function handleStockBack() {
  // 🌟 ยกเลิกการค้นหาที่ค้างอยู่ (Cancel Pending Debounce)
  clearTimeout(searchTimeout); 
  
  if (typeof isScannerMode !== 'undefined' && isScannerMode) {
    toggleScanner();
  }
  if (currentStockView === 'product') {
    clearSearch();
  } else {
    document.getElementById('stockInHouseView').classList.add('hide');
    document.getElementById('sharedHeader').classList.remove('hide'); 
    document.getElementById('mainMenuView').classList.remove('hide');
  }
}

function renderCategories() {
  currentStockView = 'category';
  document.getElementById('stockHeaderTitle').innerText = "STOCK IN HOUSE";
  document.getElementById('categoryListContainer').classList.remove('hide');
  document.getElementById('productListContainer').classList.add('hide');
  
  const container = document.getElementById('categoryListContainer');
  container.innerHTML = "";
  
  const categoriesMap = new Map();
  localProductDatabase.forEach(item => {
    const catName = item.category || "Uncategorized";
    if (!categoriesMap.has(catName)) categoriesMap.set(catName, catName);
  });
  
  Array.from(categoriesMap.values()).sort().forEach(cat => {
    const div = document.createElement('div');
    div.className = 'category-row';
    // ใช้ escapeHTML ป้องกันข้อมูล
    div.innerHTML = `<div class="cat-icon-box"><i class="fas ${getCategoryIcon(cat)}"></i></div><span style="flex-grow: 1;">${escapeHTML(cat)}</span><i class="fas fa-chevron-right" style="color:#e7a08c; font-size:12px;"></i>`;
    div.addEventListener('click', () => filterByCategory(cat));
    container.appendChild(div);
  });
}

function filterByCategory(catName) {
  currentStockView = 'product';
  document.getElementById('stockHeaderTitle').innerText = catName;
  document.getElementById('categoryListContainer').classList.add('hide');
  document.getElementById('productListContainer').classList.remove('hide');
  renderProducts(localProductDatabase.filter(item => (item.category || "Uncategorized") === catName));
}

function handleMagicSearch() {
  const query = document.getElementById('searchStockInput').value.trim().toLowerCase();
  const clearBtn = document.getElementById('clearSearchBtn');
  if (!query) { 
    clearBtn.style.display = 'none'; 
    renderCategories(); 
    return; 
  }
  
  clearBtn.style.display = 'flex';
  currentStockView = 'product';
  document.getElementById('stockHeaderTitle').innerText = "SEARCH RESULTS";
  document.getElementById('categoryListContainer').classList.add('hide');
  document.getElementById('productListContainer').classList.remove('hide');
  
  renderProducts(localProductDatabase.filter(item => {
    // 🌟 Null Check: ป้องกันแอปค้างถ้า Sheet มีข้อมูลแหว่ง
    return Object.values(item).some(val => val != null && val.toString().toLowerCase().includes(query));
  }));
}

function clearSearch() { 
  document.getElementById('searchStockInput').value = ""; 
  document.getElementById('clearSearchBtn').style.display = 'none'; 
  handleMagicSearch(); 
}

function renderProducts(products) {
  const container = document.getElementById('productListContainer');
  container.innerHTML = "";
  
  if (products.length === 0) {
    container.innerHTML = '<div style="text-align:center; color:#999; padding: 40px 20px;">❌ ไม่พบข้อมูลสินค้า</div>';
    return;
  }
  
  products.forEach(item => {
    const div = document.createElement('div');
    div.className = 'product-row';
    div.addEventListener('click', () => openProductDetail(item.sku));
    
    // 🌟 นำข้อมูลมากรอง (Escape) ก่อนพิมพ์ลงหน้าเว็บ
    const safeSku = escapeHTML(item.sku || '-');
    const safeName = escapeHTML(item.name || '-');
    const priceStr = Number(item.price || 0).toLocaleString();
    const stockAvail = escapeHTML(item.availableStock || 0);

    div.innerHTML = `
      <img class="prod-img" src="${parseDriveImage(item.imageUrl)}">
      <div class="prod-info-wrapper">
        <div class="prod-text">
          <div class="prod-sku">${safeSku}</div>
          <div class="prod-name">${safeName}</div>
        </div>
        <div class="prod-numbers">
          <div class="prod-price">฿${priceStr}</div>
          <div class="prod-stats-row">
            <span style="color: #10b981;"><i class="fas fa-thumbs-up"></i> ${stockAvail}</span>
          </div>
        </div>
      </div>`;
    container.appendChild(div);
  });
}

function openProductDetail(sku) {
  const item = localProductDatabase.find(p => p.sku === sku);
  if (!item) return;
  
  const detailImg = document.getElementById('detailImage');
  if (detailImg) detailImg.src = parseDriveImage(item.imageUrl);
  
  const barcodeElement = document.getElementById('detailBarcode');
  if (barcodeElement && item.sku) {
    try {
      JsBarcode("#detailBarcode", item.sku, {
        format: "CODE128",
        lineColor: "#333",
        width: 2,
        height: 40,
        displayValue: false
      });
      barcodeElement.style.display = 'block';
    } catch (e) {
      console.warn("Barcode error:", e);
      barcodeElement.style.display = 'none';
    }
  }
  
  const safeSetText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  };
  
  safeSetText('detailCategory', item.category || 'NO CATEGORY');
  safeSetText('detailSku', item.sku || '-');
  safeSetText('detailName', item.name || '-');
  safeSetText('detailPrice', '฿' + Number(item.price || 0).toLocaleString());
  safeSetText('detailCurrent', item.currentStock || 0);
  safeSetText('detailAvail', item.availableStock || 0);
  safeSetText('detailHold', item.holdQty || 0);
  safeSetText('detailDefect', item.defectiveQty || 0);
  safeSetText('detailSold', item.saleStock || 0);
  
  document.getElementById('productDetailModal').classList.remove('hide');
}

function closeProductDetail() { 
  document.getElementById('productDetailModal').classList.add('hide'); 
}
