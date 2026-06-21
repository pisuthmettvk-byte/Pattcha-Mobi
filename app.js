const API_URL = "https://script.google.com/macros/s/AKfycbwzwaDlMarLw7tvgm6dFRnnORWdgZ5o3M01NhNf9lNm0tvwOw2WvB9CkOP5jYcnDFMjhA/exec";
let localProductDatabase = [];
let currentBranch = "";
let currentStockView = 'category';

// 🌟 1. ฟังก์ชันหน่วงเวลา (Debounce) ป้องกันแอปกระตุก 🌟
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// 🌟 2. ศูนย์รวม Event Listeners (ย้ายมาจาก HTML) 🌟
function initEventListeners() {
  // หน้า Login
  document.getElementById('btnSubmitLogin').addEventListener('click', submitLogin);
  
  // 🌟 หน้า Main Menu (อัปเดตใหม่ 5 ปุ่ม) 🌟
  document.getElementById('btnMenuStock').addEventListener('click', openStockInHouse);
  
  // แจ้งเตือนว่าปุ่มนี้มีเมนูย่อยซ่อนอยู่ด้านใน
  document.getElementById('btnMenuMovement').addEventListener('click', () => alert('PRODUCT MOVEMENT: Transfer In/Out, Hold, Defective (กำลังพัฒนา)'));
  
  document.getElementById('btnMenuTake').addEventListener('click', () => alert('STOCK TAKE - กำลังพัฒนา'));
  document.getElementById('btnMenuAdjust').addEventListener('click', () => alert('ADJUST STOCK - กำลังพัฒนา'));
  document.getElementById('btnMenuLocation').addEventListener('click', () => alert('LOCATION - กำลังพัฒนา'));
  document.getElementById('btnLogout').addEventListener('click', logoutBranch);

  // หน้า Stock
  // ... (โค้ดด้านล่างปล่อยไว้เหมือนเดิมครับ) ...
  // หน้า Stock
  document.getElementById('btnStockBack').addEventListener('click', handleStockBack);
  document.getElementById('clearSearchBtn').addEventListener('click', clearSearch);
  
  // กล้องสแกน
  const toggleCam = () => { if (typeof toggleScanner === 'function') toggleScanner(); };
  document.getElementById('btnScannerOpen').addEventListener('click', toggleCam);
  document.getElementById('btnScannerClose').addEventListener('click', toggleCam);

  // ช่องค้นหาพร้อม Debounce (200ms)
  const searchInput = document.getElementById('searchStockInput');
  searchInput.addEventListener('input', debounce(handleMagicSearch, 200));

  // หน้า Modal Detail
  document.getElementById('btnCloseModal').addEventListener('click', closeProductDetail);
}

window.onload = function() {
  initEventListeners(); // เรียกใช้งานการเชื่อมต่อปุ่มกดทั้งหมด
  
  const savedBranch = localStorage.getItem('pattcha_branch');
  if (savedBranch) {
    document.getElementById('branchCodeInput').value = savedBranch;
    submitLogin();
  }
};

async function submitLogin() {
  const code = document.getElementById('branchCodeInput').value.trim().toUpperCase();
  const btn = document.getElementById('btnSubmitLogin');
  if (!code) return alert("⚠️ กรุณากรอกรหัสสาขาครับ");
  
  btn.innerText = "⏳ LOADING...";
  btn.disabled = true;
  
  try {
    const response = await fetch(API_URL + "?action=login&branch=" + code);
    const res = await response.json();
    if (res.success) {
      localStorage.setItem('pattcha_branch', code);
      localProductDatabase = res.products || [];
      currentBranch = res.branch;

      const sharedHeader = document.getElementById('sharedHeader');
      const loginView = document.getElementById('loginView');
      const mainMenuView = document.getElementById('mainMenuView');
      const mainMenuTitleGroup = document.getElementById('mainMenuTitleGroup');

      loginView.classList.add('fade-out');
      sharedHeader.classList.remove('header-center');
      sharedHeader.classList.add('header-top');

      // 🌟 3. อนิเมชั่นแม่นยำ 100% ด้วย transitionend 🌟
      loginView.addEventListener('transitionend', function onEnd(e) {
        if (e.propertyName !== 'opacity') return; // ดักรอให้เฟดเสร็จเท่านั้น
        loginView.removeEventListener('transitionend', onEnd); // ล้างทิ้งกันซ้ำซ้อน

        loginView.classList.add('hide');
        mainMenuView.classList.remove('hide');
        
        document.getElementById('branchLabel').innerText = "LOCATION : " + currentBranch;
        mainMenuTitleGroup.classList.remove('hide');
        mainMenuTitleGroup.classList.add('fade-in-text'); 
      });

    } else {
      alert("❌ " + res.message);
    }
  } catch (err) {
    console.error(err);
    alert("❌ ระบบขัดข้อง: ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้");
  }
  
  btn.innerText = "SUBMIT";
  btn.disabled = false;
}

function logoutBranch() {
  if (confirm("ต้องการออกจากระบบสาขาใช่หรือไม่?")) {
    localStorage.removeItem('pattcha_branch');
    location.reload();
  }
}

function parseDriveImage(url) {
  if (!url || url === 'CellImage') return 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';
  let match = url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return 'https://drive.google.com/thumbnail?id=' + match[1] + '&sz=w500';
  return url;
}

function getCategoryIcon(catName) {
  const name = catName ? catName.toLowerCase() : "";
  if (name.includes('bag')) return 'fa-shopping-bag';
  if (name.includes('shoe') || name.includes('heel')) return 'fa-shoe-prints';
  if (name.includes('watch')) return 'fa-clock';
  return 'fa-box-open';
}

function openStockInHouse() {
  document.getElementById('sharedHeader').classList.add('hide'); 
  document.getElementById('mainMenuView').classList.add('hide');
  document.getElementById('stockInHouseView').classList.remove('hide');
  renderCategories();
}

function handleStockBack() {
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
    div.innerHTML = `<div class="cat-icon-box"><i class="fas ${getCategoryIcon(cat)}"></i></div><span style="flex-grow: 1;">${cat}</span><i class="fas fa-chevron-right" style="color:#e7a08c; font-size:12px;"></i>`;
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
    return Object.values(item).some(val => val && val.toString().toLowerCase().includes(query));
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
    div.innerHTML = `
      <img class="prod-img" src="${parseDriveImage(item.imageUrl)}">
      <div class="prod-info-wrapper">
        <div class="prod-text">
          <div class="prod-sku">${item.sku || '-'}</div>
          <div class="prod-name">${item.name || '-'}</div>
        </div>
        <div class="prod-numbers">
          <div class="prod-price">฿${Number(item.price || 0).toLocaleString()}</div>
          <div class="prod-stats-row">
            <span style="color: #10b981;"><i class="fas fa-thumbs-up"></i> ${item.availableStock || 0}</span>
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
