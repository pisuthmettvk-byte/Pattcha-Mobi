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
// CUSTOM ALERT HELPER FUNCTIONS
// ==========================================
function customAlert(message, title = "NOTICE") {
  return new Promise((resolve) => {
    const overlay = document.getElementById('customAlertOverlay');
    document.getElementById('customAlertTitle').innerText = title;
    document.getElementById('customAlertMessage').innerText = message;
    
    const btnOk = document.getElementById('customAlertOk');
    const btnCancel = document.getElementById('customAlertCancel');
    
    btnCancel.classList.add('hide'); // ซ่อนปุ่ม Cancel (มีแค่ OK)
    overlay.classList.remove('hide');
    
    btnOk.onclick = () => {
      overlay.classList.add('hide');
      resolve(true);
    };
  });
}

function customConfirm(message, title = "CONFIRM") {
  return new Promise((resolve) => {
    const overlay = document.getElementById('customAlertOverlay');
    document.getElementById('customAlertTitle').innerText = title;
    document.getElementById('customAlertMessage').innerText = message;
    
    const btnOk = document.getElementById('customAlertOk');
    const btnCancel = document.getElementById('customAlertCancel');
    
    btnCancel.classList.remove('hide'); // แสดงปุ่ม Cancel ให้เลือก
    overlay.classList.remove('hide');
    
    btnOk.onclick = () => {
      overlay.classList.add('hide');
      resolve(true);
    };
    btnCancel.onclick = () => {
      overlay.classList.add('hide');
      resolve(false);
    };
  });
}




// ==========================================
// GLOBAL STATE
// ==========================================
let localProductDatabase = [];
let currentBranch = "";
let currentStockView = 'category';
let searchTimeout = null;

// ==========================================
// UTILITY FUNCTIONS (Security & Core Logic)
// ==========================================
function escapeHTML(str) {
  if (str == null) return '';
  return str.toString().replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}

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

function getCategoryIcon(catName) {
  const name = (catName || "").toLowerCase();
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (name.includes(key)) return icon;
  }
  return 'fa-box-open';
}

// ==========================================
// INITIALIZATION & EVENT LISTENERS
// ==========================================
function initEventListeners() {
  // หน้า Login
  const btnSubmit = document.getElementById('btnSubmitLogin');
  if (btnSubmit) btnSubmit.addEventListener('click', submitLogin);
  
  // กด Enter เพื่อล็อกอินได้เลย
  const inputLogin = document.getElementById('branchCodeInput');
  if (inputLogin) {
    inputLogin.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') submitLogin();
    });
  }
  
  // หน้า Main Menu (5 ปุ่มใหม่)
  const btnStock = document.getElementById('btnMenuStock');
  if (btnStock) btnStock.addEventListener('click', openStockInHouse);
  
  const btnMovement = document.getElementById('btnMenuMovement');
  if (btnMovement) btnMovement.addEventListener('click', () => alert('PRODUCT MOVEMENT: Transfer In/Out, Hold, Defective (กำลังพัฒนา)'));
  
  const btnTake = document.getElementById('btnMenuTake');
  if (btnTake) btnTake.addEventListener('click', () => alert('STOCK TAKE - กำลังพัฒนา'));
  
  const btnAdjust = document.getElementById('btnMenuAdjust');
  if (btnAdjust) btnAdjust.addEventListener('click', () => alert('ADJUST STOCK - กำลังพัฒนา'));
  
  const btnLocation = document.getElementById('btnMenuLocation');
  if (btnLocation) btnLocation.addEventListener('click', () => alert('LOCATION - กำลังพัฒนา'));

  const btnQuickScan = document.getElementById('btnMenuQuickScan');
  if (btnQuickScan) {
    btnQuickScan.addEventListener('click', () => {
      // 1. สั่งให้พาเข้าไปหน้า Stock In House ทันที
      openStockInHouse();

      // 2. สั่งเรียกฟังก์ชันเปิดกล้องสแกนบาร์โค้ดขึ้นมาอัตโนมัติ
      if (typeof toggleScanner === 'function') {
        setTimeout(() => toggleScanner(), 300); // หน่วงเวลา 0.3 วิให้หน้าจอเฟดเสร็จก่อน ค่อยดึงกล้องขึ้นมาให้สมูทๆ
      }
    });
  }
  
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) btnLogout.addEventListener('click', logoutBranch);

  // หน้า Stock
  const btnBack = document.getElementById('btnStockBack');
  if (btnBack) btnBack.addEventListener('click', handleStockBack);
  
  const btnClear = document.getElementById('clearSearchBtn');
  if (btnClear) btnClear.addEventListener('click', clearSearch);
  
  // กล้องสแกน
  const toggleCam = () => { if (typeof toggleScanner === 'function') toggleScanner(); };
  const btnCamOpen = document.getElementById('btnScannerOpen');
  if (btnCamOpen) btnCamOpen.addEventListener('click', toggleCam);
  
  const btnCamClose = document.getElementById('btnScannerClose');
  if (btnCamClose) btnCamClose.addEventListener('click', toggleCam);

  // ช่องค้นหา
  const searchInput = document.getElementById('searchStockInput');
  if (searchInput) searchInput.addEventListener('input', debounceSearch(handleMagicSearch, CONFIG.SEARCH_DELAY));

  // หน้า Modal Detail
  const btnCloseMod = document.getElementById('btnCloseModal');
  if (btnCloseMod) btnCloseMod.addEventListener('click', closeProductDetail);
}

window.onload = function() {
  initEventListeners();
  const savedBranch = localStorage.getItem('pattcha_branch');
  if (savedBranch) {
    const inputLogin = document.getElementById('branchCodeInput');
    if(inputLogin) inputLogin.value = savedBranch;
    submitLogin();
  }
};

// ==========================================
// MAIN FUNCTIONALITIES
// ==========================================

async function submitLogin() {
  const inputLogin = document.getElementById('branchCodeInput');
  if (!inputLogin) return;
  const code = inputLogin.value.trim().toUpperCase();
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

      // เฟดหน้าจอ Login ออก
      loginView.classList.add('fade-out');
      
      // สั่งแชร์เฮดเดอร์สไลด์ขึ้นไปจอดด้านบน
      if (sharedHeader) {
        sharedHeader.classList.remove('header-center');
        sharedHeader.classList.add('header-top');
      }

     // เปิดหน้าเมนูอย่างนุ่มนวลตามลำดับบล็อก Flow
      loginView.addEventListener('transitionend', function onEnd(e) {
        if (e.propertyName !== 'opacity') return;
        loginView.removeEventListener('transitionend', onEnd); 

        loginView.classList.add('hide');
        mainMenuView.classList.remove('hide');
        mainMenuView.classList.add('fade-in');
        
        document.getElementById('branchLabel').innerText = "LOCATION : " + escapeHTML(currentBranch);
      });

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

async function logoutBranch() {
  const isConfirm = await customConfirm("ต้องการออกจากระบบสาขาใช่หรือไม่?", "LOGOUT");
  if (isConfirm) {
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
    
    // ดึงและคัดกรองความปลอดภัยของข้อมูลสถานะสต็อกทั้งหมด
    const safeSku = escapeHTML(item.sku || '-');
    const safeName = escapeHTML(item.name || '-');
    const priceStr = Number(item.price || 0).toLocaleString();
    const stockAvail = escapeHTML(item.availableStock || 0);
    const stockHold = escapeHTML(item.holdQty || 0);
    const stockDefect = escapeHTML(item.defectiveQty || 0);

    div.innerHTML = `
      <img class="prod-img" src="${parseDriveImage(item.imageUrl)}">
      <div class="prod-info-wrapper" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; flex: 1;">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; margin-top: 0 !important;">
          <div class="prod-text">
            <div class="prod-name" style="margin-top: 0;">${safeName}</div>
            <div class="prod-sku">${safeSku}</div>
          </div>
          <div class="prod-price" style="margin-top: 0 !important;">฿${priceStr}</div>
        </div>
        
        <div style="display: flex; justify-content: flex-end; align-items: center; gap: 15px; width: 100%; margin-top: auto !important; padding-top: 5px;">
          
          <span style="color: #10b981; font-weight: bold; display: flex; align-items: center; gap: 4px; font-size: 13px;">
            <i class="fas fa-thumbs-up"></i> ${stockAvail}
          </span>
          
          <span style="color: #fab919; font-weight: bold; display: flex; align-items: center; gap: 4px; font-size: 13px;">
            <i class="fas fa-exclamation-triangle"></i> ${stockHold}
          </span>
          
          <span style="color: #ef4444; font-weight: bold; display: flex; align-items: center; gap: 4px; font-size: 13px;">
            <i class="fas fa-times-circle"></i> ${stockDefect}
          </span>
          
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
      // ในฟังก์ชัน openProductDetail แก้ความสูงบาร์โค้ดกลับมาที่ 45 ครับ
      JsBarcode("#detailBarcode", item.sku, {
        format: "CODE128",
        lineColor: "#333",
        width: 2,
        height: 45, // 🌟 คืนความสูงที่พอดีต่อการสแกน
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
  
  // 🌟 ส่งข้อมูลเข้าเลย์เอาต์ใหม่ ซ้าย-ขวา และ Card UI ได้ทันที
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

// ==========================================================
  // 🌟 [เพิ่มใหม่] คำสั่งยิงเช็กสต็อกต่างสาขาอัตโนมัติเมื่อเปิดดูรายละเอียดสินค้า
  // ==========================================================
  const btnCrossBranch = document.getElementById('btnCrossBranch');
  if (btnCrossBranch) {
    btnCrossBranch.classList.add('hide'); // สั่งซ่อนไอคอนบ้านซ้อนไว้ก่อนทุกครั้งเป็นค่าเริ่มต้น
    
    // ดึง URL ตัวหลังบ้านของเจเลอร์ (แนะนำให้ใช้ URL ตัวแปรหลักของระบบ หรือใส่ลิงก์นี้ได้เลยครับ)
    const scriptUrl = "https://script.google.com/macros/s/AKfycbwHxRAUGZbbFyjHcAYL_444G-IGiAnefrR99SAw03R1/exec"; 
    
    // ยิงไปถามหลังบ้านแบบเบื้องหลัง (Async) พนักงานไม่ต้องนั่งรอโหลดหน้าจอ
    fetch(`${scriptUrl}?action=check_cross_branch&sku=${encodeURIComponent(item.sku)}`)
      .then(res => res.json())
      .then(response => {
        if (response.status === "success" && response.data && response.data.length > 0) {
          
          // 🟢 เงื่อนไขตรงตามโจทย์: ถ้าสาขาอื่นมีของ ให้แสดงไอคอนบ้านซ้อนทันที
          btnCrossBranch.classList.remove('hide');
          
          // ผูกข้อมูลสต็อกต่างสาขาเก็บไว้ในตัวไอคอนชั่วคราว เพื่อเอาไปวาดต่อตอนกดคลิก
          btnCrossBranch.onclick = () => {
            renderCrossBranchModal(response.data);
          };
        }
      })
      .catch(err => console.warn("Cross branch fetch failed:", err));
  }
  
}

function closeProductDetail() { 
  document.getElementById('productDetailModal').classList.add('hide'); 
}

// ==========================================================
// 🌟 [เพิ่มใหม่] ฟังก์ชันสำหรับวาดรายชื่อสาขาที่มีสต็อกลงในหน้าต่างลอย
// ==========================================================
function renderCrossBranchModal(branchData) {
  const listContainer = document.getElementById('crossBranchList');
  const modal = document.getElementById('crossBranchModal');
  if (!listContainer || !modal) return;

  listContainer.innerHTML = ""; // ล้างข้อมูลเก่าออกก่อน

  // วนลูปวาดรายชื่อสาขาที่มีของเฉพาะที่มีแต้มมากกว่า 0 ตามที่เรากรองมาจากหลังบ้าน
  branchData.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cross-branch-item';
    div.innerHTML = `
      <span><i class="fas fa-store"></i> สาขา ${escapeHTML(item.branch)}</span>
      <span class="branch-stock-badge">${escapeHTML(item.stock)} ชิ้น</span>
    `;
    listContainer.appendChild(div);
  });

  // เปิดแสดงหน้าต่างลอยข้ามสาขา
  modal.classList.remove('hide-modal');
}

// 🌟 ผูกเหตุการณ์กดปิดหน้าต่างลอยข้ามสาขา (รันคำสั่งครั้งแรกเมื่อแอปโหลด)
document.addEventListener("DOMContentLoaded", () => {
  const btnClose = document.getElementById('btnCloseCrossBranch');
  const modal = document.getElementById('crossBranchModal');
  
  if (btnClose && modal) {
    btnClose.addEventListener('click', () => {
      modal.classList.add('hide-modal'); // สั่งซ่อนหน้าต่างลอยเมื่อกดกากบาท
    });
  }
});
