const API_URL = "https://script.google.com/macros/s/AKfycbwzwaDlMarLw7tvgm6dFRnnORWdgZ5o3M01NhNf9lNm0tvwOw2WvB9CkOP5jYcnDFMjhA/exec";
let localProductDatabase = [];
let currentBranch = "";
let currentStockView = 'category';

window.onload = function() {
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

      // 🌟 โลจิกสไลด์โลโก้แบบใหม่ (One Logo Animation) 🌟
      const sharedHeader = document.getElementById('sharedHeader');
      const loginView = document.getElementById('loginView');
      const mainMenuView = document.getElementById('mainMenuView');
      const mainMenuTitleGroup = document.getElementById('mainMenuTitleGroup');

      // 1. ซ่อนช่องกรอกรหัสไปก่อน
      loginView.classList.add('fade-out');

      // 2. สั่งให้โลโก้ตรงกลาง "สไลด์พุ่งขึ้นไปข้างบน"
      sharedHeader.classList.remove('header-center');
      sharedHeader.classList.add('header-top');

      // 3. รอจังหวะโลโก้สไลด์เสร็จ (400ms) แล้วแสดงปุ่ม Main Menu พร้อมข้อความ
      setTimeout(() => {
        loginView.classList.add('hide');
        mainMenuView.classList.remove('hide');
        
        document.getElementById('branchLabel').innerText = "LOCATION : " + currentBranch;
        mainMenuTitleGroup.classList.remove('hide');
        mainMenuTitleGroup.classList.add('fade-in-text'); 
      }, 400);

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
  document.getElementById('sharedHeader').classList.add('hide'); // ซ่อนโลโก้เวลาเข้าหน้าสต๊อก
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
    document.getElementById('sharedHeader').classList.remove('hide'); // เอาโลโก้กลับมาเวลาถอยกลับมา Main Menu
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
    div.onclick = () => filterByCategory(cat);
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
    div.onclick = () => openProductDetail(item.sku);
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
