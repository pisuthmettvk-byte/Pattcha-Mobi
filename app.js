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
  if(!code) return alert("⚠️ กรุณากรอกรหัสสาขาครับ");
  
  btn.innerText = "⏳ LOADING...";
  btn.disabled = true;

  try {
    const response = await fetch(API_URL + "?action=login&branch=" + code);
    const res = await response.json();

    if(res.success) {
      localStorage.setItem('pattcha_branch', code);
      localProductDatabase = res.products;
      currentBranch = res.branch;
      
      const loginView = document.getElementById('loginView');
      const mainMenuView = document.getElementById('mainMenuView');
      
      loginView.classList.add('login-fade-out');
      
      setTimeout(() => {
        loginView.classList.add('hide');
        loginView.classList.remove('login-fade-out');
        document.getElementById('branchLabel').innerText = "LOCATION : " + currentBranch;
        mainMenuView.classList.remove('hide');
        mainMenuView.classList.add('menu-fade-in');
      }, 800);

    } else {
      alert("❌ " + res.message);
      btn.innerText = "SUBMIT";
      btn.disabled = false;
    }
  } catch (err) {
    alert("❌ ระบบขัดข้อง: ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้");
    btn.innerText = "SUBMIT";
    btn.disabled = false;
  }
}

function logoutBranch() {
  if(confirm("ต้องการออกจากระบบสาขาใช่หรือไม่?")) {
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
  const name = catName.toLowerCase();
  if (name.includes('bag')) return 'fa-shopping-bag';
  if (name.includes('shoe')) return 'fa-shoe-prints';
  if (name.includes('watch')) return 'fa-clock';
  return 'fa-box-open';
}

function openStockInHouse() {
  document.getElementById('mainMenuView').classList.add('hide');
  document.getElementById('stockInHouseView').classList.remove('hide');
  renderCategories();
}

function handleStockBack() {
  if (typeof isScannerMode !== 'undefined' && isScannerMode) toggleScanner();
  if (currentStockView === 'product') {
    clearSearch();
  } else {
    document.getElementById('stockInHouseView').classList.add('hide');
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
    const mainCat = (item.mainCategoryCode && item.mainCategoryCode !== '-') ? item.mainCategoryCode : '';
    const subCat = (item.subCategoryCode && item.subCategoryCode !== '-') ? item.subCategoryCode : '';
    const prefixCode = (mainCat + subCat).trim();
    const catName = item.category || "Uncategorized";
    
    const displayCatName = prefixCode ? `${prefixCode} - ${catName}` : catName;
    
    if(!categoriesMap.has(displayCatName)) {
      categoriesMap.set(displayCatName, { displayName: displayCatName, originalName: catName });
    }
  });

  Array.from(categoriesMap.values()).sort((a,b) => a.displayName.localeCompare(b.displayName)).forEach(catObj => {
    const div = document.createElement('div');
    div.className = 'category-row';
    div.innerHTML = `<div class="cat-icon-box"><i class="fas ${getCategoryIcon(catObj.originalName)}"></i></div><span style="flex-grow: 1;">${catObj.displayName}</span>`;
    
    div.onclick = () => filterByCategory(catObj.originalName, catObj.displayName);
    container.appendChild(div);
  });
}

function filterByCategory(originalCatName, fullDisplayName) {
  currentStockView = 'product';
  document.getElementById('stockHeaderTitle').innerText = fullDisplayName; 
  document.getElementById('categoryListContainer').classList.add('hide');
  document.getElementById('productListContainer').classList.remove('hide');
  renderProducts(localProductDatabase.filter(item => (item.category || "Uncategorized") === originalCatName));
}

function handleMagicSearch() {
  const query = document.getElementById('searchStockInput').value.trim().toLowerCase();
  const clearBtn = document.getElementById('clearSearchBtn');
  if (!query) { clearBtn.style.display = 'none'; renderCategories(); return; }
  
  clearBtn.style.display = 'flex';
  currentStockView = 'product';
  document.getElementById('stockHeaderTitle').innerText = "SEARCH RESULTS";
  document.getElementById('categoryListContainer').classList.add('hide');
  document.getElementById('productListContainer').classList.remove('hide');
  
  renderProducts(localProductDatabase.filter(item => Object.values(item).some(val => val && val.toString().toLowerCase().includes(query))));
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
    container.innerHTML = '<div style="text-align:center; color:#999; padding: 40px 20px;">❌ ไม่พบข้อมูลสินค้าในสาขานี้</div>';
    return;
  }

  products.forEach(item => {
    const div = document.createElement('div');
    div.className = 'product-row';
    div.onclick = () => openProductDetail(item.sku);
    
    div.innerHTML = `
      <img class="prod-img" src="${parseDriveImage(item.imageUrl)}" onerror="this.onerror=null; this.src='https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';">
      <div class="prod-info-wrapper">
        <div class="prod-text">
          <div class="prod-sku">${item.sku}</div>
          <div class="prod-name">${item.name}</div>
        </div>
        <div class="prod-numbers">
          <div class="prod-price">฿${Number(item.price).toLocaleString()}</div>
          <div class="prod-stats-row">
            <span style="color: #10b981;" title="พร้อมขาย"><i class="fas fa-thumbs-up"></i> ${item.availableStock || 0}</span>
            <span style="color: #fab919;" title="Hold"><i class="fas fa-exclamation-triangle"></i> ${item.holdQty || 0}</span>
            <span style="color: #ef4444;" title="เสียหาย"><i class="fas fa-times-circle"></i> ${item.defectiveQty || 0}</span>
          </div>
        </div>
      </div>`;
    container.appendChild(div);
  });
}

function openProductDetail(sku) {
  const item = localProductDatabase.find(p => p.sku === sku);
  
  document.getElementById('detailImage').src = parseDriveImage(item.imageUrl);
  document.getElementById('detailSku').innerText = item.sku;
  document.getElementById('detailName').innerText = item.name || "-";
  document.getElementById('detailPrice').innerText = '฿' + Number(item.price).toLocaleString(); // ถอด ⧉ ออก

  // ดึงข้อมูล 5 รายการ Material
  document.getElementById('detailMainCat').innerText = item.mainCategoryCode || "-";
  document.getElementById('detailSubCat').innerText = item.subCategoryCode || "-";
  document.getElementById('detailMatCode').innerText = item.materialCode || "-";
  document.getElementById('detailStyleCode').innerText = item.styleCode || "-";
  document.getElementById('detailProdCode').innerText = item.productCode || item.sku || "-";

  // ดึงข้อมูล 5 รายการ สต็อก
  document.getElementById('detailCurrent').innerText = item.currentStock || 0;
  document.getElementById('detailAvail').innerText = item.availableStock || 0;
  document.getElementById('detailHold').innerText = item.holdQty || 0;
  document.getElementById('detailDefect').innerText = item.defectiveQty || 0;
  document.getElementById('detailSale').innerText = item.soldQty || item.saleQty || 0;

  document.getElementById('productDetailModal').classList.remove('hide');
}

function closeProductDetail() { 
    document.getElementById('productDetailModal').classList.add('hide'); 
}
