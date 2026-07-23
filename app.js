// ==========================================
// CONFIGURATION & CONSTANTS
// ==========================================
const CONFIG = {
  API_URL:
    "https://script.google.com/macros/s/AKfycbxl3g-8afxNG-q4UhOxVsffv-qO7Dum2koHWAKEbr98086bvPq-RwNQrEwGvzMZ5Jm7zQ/exec",
  CROSS_BRANCH_URL:
    "https://script.google.com/macros/s/AKfycbzPJweCC9wgdKzqnWV5kuPWMiUbM9uNgjaO3rfCRaXtTW80nLflLORQIizxay9LbTkbHg/exec",
  SEARCH_DELAY: 250,
};

const ICON_MAP = {
  bag: "fa-shopping-bag",
  shoe: "fa-shoe-prints",
  heel: "fa-shoe-prints",
  watch: "fa-clock",
};

// ==========================================
// CUSTOM ALERT HELPER FUNCTIONS
// ==========================================
function customAlert(message, title = "NOTICE") {
  return new Promise((resolve) => {
    const overlay = document.getElementById("customAlertOverlay");
    document.getElementById("customAlertTitle").innerText = title;
    document.getElementById("customAlertMessage").innerText = message;

    const btnOk = document.getElementById("customAlertOk");
    const btnCancel = document.getElementById("customAlertCancel");

    btnCancel.classList.add("hide");
    overlay.classList.remove("hide");

    btnOk.onclick = () => {
      overlay.classList.add("hide");
      resolve(true);
    };
  });
}

function customConfirm(message, title = "CONFIRM") {
  return new Promise((resolve) => {
    const overlay = document.getElementById("customAlertOverlay");
    document.getElementById("customAlertTitle").innerText = title;
    document.getElementById("customAlertMessage").innerText = message;

    const btnOk = document.getElementById("customAlertOk");
    const btnCancel = document.getElementById("customAlertCancel");

    btnCancel.classList.remove("hide");
    overlay.classList.remove("hide");

    btnOk.onclick = () => {
      overlay.classList.add("hide");
      resolve(true);
    };
    btnCancel.onclick = () => {
      overlay.classList.add("hide");
      resolve(false);
    };
  });
}

// ==========================================
// GLOBAL STATE
// ==========================================
let localProductDatabase = [];
let currentBranch = "";
let currentStockView = "category";
let searchTimeout = null;
window.isScannerMode = false;

let idleTimeout = null;
const IDLE_TIME_LIMIT = 5 * 60 * 1000;

// ==========================================
// IDLE TIMEOUT FUNCTIONS
// ==========================================
function resetIdleTimer() {
  const stockView = document.getElementById("stockInHouseView");

  if (!stockView || stockView.classList.contains("hide")) {
    clearTimeout(idleTimeout);
    return;
  }

  clearTimeout(idleTimeout);
  idleTimeout = setTimeout(returnToMainMenuOnIdle, IDLE_TIME_LIMIT);
}

function returnToMainMenuOnIdle() {
  if (window.isScannerMode) {
    if (typeof window.toggleScanner === "function") window.toggleScanner();
  }

  const detailModal = document.getElementById("productDetailModal");
  const crossModal = document.getElementById("crossBranchModal");
  if (detailModal) detailModal.classList.add("hide");
  if (crossModal) crossModal.classList.add("hide-modal");

  clearSearch();

  const stockView = document.getElementById("stockInHouseView");
  if (stockView) stockView.classList.add("hide");

  const sharedHeader = document.getElementById("sharedHeader");
  const mainMenuView = document.getElementById("mainMenuView");
  if (sharedHeader) sharedHeader.classList.remove("hide");
  if (mainMenuView) mainMenuView.classList.remove("hide");
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function escapeHTML(str) {
  if (str == null) return "";
  return str.toString().replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[tag] || tag,
  );
}

function debounceSearch(func, wait) {
  return function (...args) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => func.apply(this, args), wait);
  };
}

//===============
// [Image Parser] START
// 🚨 [HOT FIX]: ประกาศฟังก์ชันแปลงรูปภาพระดับ Global ป้องกัน Error ข้ามไฟล์ 100%
window.parseDriveImage = function (url) {
  if (!url || url === "CellImage")
    return "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";
  let match =
    url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/d\/([a-zA-Z0-9_-]+)/);

  if (match && match[1]) {
    // ทะลุบล็อก CORB เบราว์เซอร์
    return "https://lh3.googleusercontent.com/d/" + match[1] + "=w500";
  }
  return url;
};
// [Image Parser] END
//===============

function getCategoryIcon(catName) {
  const name = (catName || "").toLowerCase();
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (name.includes(key)) return icon;
  }
  return "fa-box-open";
}

// ==========================================
// INITIALIZATION & EVENT LISTENERS
// ==========================================
function initEventListeners() {
  const btnSubmit = document.getElementById("btnSubmitLogin");
  if (btnSubmit) btnSubmit.addEventListener("click", submitLogin);

  const inputLogin = document.getElementById("branchCodeInput");
  if (inputLogin) {
    inputLogin.addEventListener("keypress", function (e) {
      if (e.key === "Enter") submitLogin();
    });
  }

  const btnStock = document.getElementById("btnMenuStock");
  if (btnStock) btnStock.addEventListener("click", openStockInHouse);

  const btnTake = document.getElementById("btnMenuTake");
  if (btnTake)
    btnTake.addEventListener("click", () => alert("STOCK TAKE - กำลังพัฒนา"));

  const btnAdjust = document.getElementById("btnMenuAdjust");
  if (btnAdjust)
    btnAdjust.addEventListener("click", () =>
      alert("ADJUST STOCK - กำลังพัฒนา"),
    );

  const btnLocation = document.getElementById("btnMenuLocation");
  if (btnLocation)
    btnLocation.addEventListener("click", () => alert("LOCATION - กำลังพัฒนา"));

  const btnQuickScan = document.getElementById("btnMenuQuickScan");
  if (btnQuickScan) {
    btnQuickScan.addEventListener("click", async () => {
      await openStockInHouse();

      if (typeof window.toggleScanner === "function") {
        const scanView = document.getElementById("scannerView");
        if (scanView) {
          scanView.style.position = "fixed";
          scanView.style.zIndex = "99999";
        }
        await window.toggleScanner();
      }
    });
  }

  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) btnLogout.addEventListener("click", logoutBranch);

  const btnBack = document.getElementById("btnStockBack");
  if (btnBack) btnBack.addEventListener("click", handleStockBack);

  const btnClear = document.getElementById("clearSearchBtn");
  if (btnClear) btnClear.addEventListener("click", clearSearch);

  const btnScannerOpen = document.getElementById("btnScannerOpen");
  if (btnScannerOpen) {
    btnScannerOpen.addEventListener("click", async () => {
      if (typeof window.toggleScanner === "function") {
        const scanView = document.getElementById("scannerView");
        if (scanView) {
          scanView.style.position = "fixed";
          scanView.style.zIndex = "99999";
        }
        await window.toggleScanner();
      }
    });
  }

  // 🌟 อัปเกรดความปลอดภัย เชื่อมฟังก์ชันปุ่ม Flash & Mode แบบระบุตัวตน (window.)
  const btnScanMode = document.getElementById("btnToggleScanMode");
  if (btnScanMode)
    btnScanMode.addEventListener("click", () => {
      if (typeof window.toggleScanMode === "function") window.toggleScanMode();
    });

  const btnFlash = document.getElementById("btnToggleFlash");
  if (btnFlash)
    btnFlash.addEventListener("click", () => {
      if (typeof window.toggleFlash === "function") window.toggleFlash();
    });

  const searchInput = document.getElementById("searchStockInput");
  if (searchInput)
    searchInput.addEventListener(
      "input",
      debounceSearch(handleMagicSearch, CONFIG.SEARCH_DELAY),
    );

  const btnCloseMod = document.getElementById("btnCloseModal");
  if (btnCloseMod) btnCloseMod.addEventListener("click", closeProductDetail);
}

// ==========================================
// MAIN FUNCTIONALITIES
// ==========================================
async function submitLogin() {
  const inputLogin = document.getElementById("branchCodeInput");
  if (!inputLogin) return;
  const code = inputLogin.value.trim().toUpperCase();
  const btn = document.getElementById("btnSubmitLogin");

  if (!code) return alert("⚠️ กรุณากรอกรหัสสาขาครับ");

  btn.innerText = "⏳ LOADING...";
  btn.disabled = true;

  try {
    const response = await fetch(
      CONFIG.API_URL + "?action=login&branch=" + code,
    );
    const res = await response.json();

    if (res.success) {
      localStorage.setItem("pattcha_branch", code);
      localProductDatabase = res.products || [];
      currentBranch = res.branch;

      // 📡 [โค้ดใหม่]: เปิดหูรับสัญญาณ Firebase ทันทีที่ล็อกอินเสร็จ
      if (typeof window.startFirebaseListener === "function") {
        window.startFirebaseListener();
      }

      const sharedHeader = document.getElementById("sharedHeader");
      const loginView = document.getElementById("loginView");
      const mainMenuView = document.getElementById("mainMenuView");

      loginView.classList.add("fade-out");

      if (sharedHeader) {
        sharedHeader.classList.remove("header-center");
        sharedHeader.classList.add("header-top");
      }

      loginView.addEventListener("transitionend", function onEnd(e) {
        if (e.propertyName !== "opacity") return;
        loginView.removeEventListener("transitionend", onEnd);

        loginView.classList.add("hide");
        mainMenuView.classList.remove("hide");
        mainMenuView.classList.add("fade-in");

        document.getElementById("branchLabel").innerText =
          "LOCATION : " + escapeHTML(currentBranch);
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
  const isConfirm = await customConfirm(
    "ต้องการออกจากระบบสาขาใช่หรือไม่?",
    "LOGOUT",
  );
  if (isConfirm) {
    localStorage.removeItem("pattcha_branch");
    location.reload();
  }
}

// ==========================================
// STOCK IN HOUSE VIEW MANAGEMENT
// ==========================================
async function openStockInHouse() {
  const btnStock = document.getElementById("btnMenuStock");
  let originalText = "";
  if (btnStock) {
    originalText = btnStock.innerHTML;
    btnStock.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> UPDATING...';
    btnStock.disabled = true;
  }

  try {
    const response = await fetch(
      CONFIG.API_URL + "?action=login&branch=" + currentBranch,
    );
    const res = await response.json();
    if (res.success && res.products) {
      localProductDatabase = res.products;
    }
  } catch (err) {
    console.warn("Failed to update stock live, using cached data:", err);
  }

  if (btnStock) {
    btnStock.innerHTML = originalText;
    btnStock.disabled = false;
  }

  const sharedHeader = document.getElementById("sharedHeader");
  const mainMenuView = document.getElementById("mainMenuView");
  const stockInHouseView = document.getElementById("stockInHouseView");
  const categoryContainer = document.getElementById("categoryListContainer");
  const productContainer = document.getElementById("productListContainer");
  const headerTitle = document.getElementById("stockHeaderTitle");

  if (sharedHeader) sharedHeader.classList.add("hide");
  if (mainMenuView) mainMenuView.classList.add("hide");
  if (stockInHouseView) stockInHouseView.classList.remove("hide");

  if (categoryContainer) categoryContainer.classList.remove("hide");
  if (productContainer) productContainer.classList.add("hide");
  if (headerTitle) headerTitle.innerText = "STOCK IN HOUSE";

  currentStockView = "category";
  renderCategories();
  if (typeof resetIdleTimer === "function") resetIdleTimer();
}

function renderCategories() {
  currentStockView = "category";
  document.getElementById("stockHeaderTitle").innerText = "STOCK IN HOUSE";
  document.getElementById("categoryListContainer").classList.remove("hide");
  document.getElementById("productListContainer").classList.add("hide");

  const container = document.getElementById("categoryListContainer");
  container.innerHTML = "";

  const categoriesMap = new Map();
  localProductDatabase.forEach((item) => {
    const catName = item.category || "Uncategorized";
    if (!categoriesMap.has(catName)) categoriesMap.set(catName, catName);
  });

  Array.from(categoriesMap.values())
    .sort()
    .forEach((cat) => {
      const div = document.createElement("div");
      div.className = "category-row";
      div.innerHTML = `<div class="cat-icon-box"><i class="fas ${getCategoryIcon(cat)}"></i></div><span style="flex-grow: 1;">${escapeHTML(cat)}</span><i class="fas fa-chevron-right" style="color:#e7a08c; font-size:12px;"></i>`;
      div.addEventListener("click", () => filterByCategory(cat));
      container.appendChild(div);
    });
}

function filterByCategory(catName) {
  currentStockView = "product";
  document.getElementById("stockHeaderTitle").innerText = catName;
  document.getElementById("categoryListContainer").classList.add("hide");
  document.getElementById("productListContainer").classList.remove("hide");
  renderProducts(
    localProductDatabase.filter(
      (item) => (item.category || "Uncategorized") === catName,
    ),
  );
}

function handleStockBack() {
  clearTimeout(searchTimeout);
  if (window.isScannerMode) {
    if (typeof window.toggleScanner === "function") window.toggleScanner();
  }
  if (currentStockView === "product") {
    clearSearch();
  } else {
    document.getElementById("stockInHouseView").classList.add("hide");
    document.getElementById("sharedHeader").classList.remove("hide");
    document.getElementById("mainMenuView").classList.remove("hide");

    clearTimeout(idleTimeout);
  }
}

function handleMagicSearch() {
  const query = document
    .getElementById("searchStockInput")
    .value.trim()
    .toLowerCase();
  const clearBtn = document.getElementById("clearSearchBtn");
  if (!query) {
    if (clearBtn) clearBtn.style.display = "none";
    renderCategories();
    return;
  }

  if (clearBtn) clearBtn.style.display = "flex";
  currentStockView = "product";
  document.getElementById("stockHeaderTitle").innerText = "SEARCH RESULTS";
  document.getElementById("categoryListContainer").classList.add("hide");
  document.getElementById("productListContainer").classList.remove("hide");

  renderProducts(
    localProductDatabase.filter((item) => {
      return Object.values(item).some(
        (val) => val != null && val.toString().toLowerCase().includes(query),
      );
    }),
  );
}

function clearSearch() {
  document.getElementById("searchStockInput").value = "";
  document.getElementById("clearSearchBtn").style.display = "none";
  handleMagicSearch();
}

window.getRealTimeLiveStock = function (sku) {
  let baseAvail = 0;
  let baseHold = 0;

  if (typeof localProductDatabase !== "undefined") {
    const product = localProductDatabase.find(
      (p) =>
        (p.sku || p.SKU || "").toString().toUpperCase() === sku.toUpperCase(),
    );
    if (product) {
      baseAvail = Number(product.availableStock || 0);
      baseHold = Number(product.holdQty || 0);
    }
  }

  let currentBoxQty = 0;
  // 🚨 เช็คว่ากล่องปิดไปแล้วหรือยัง ถ้าปิดไปแล้ว "ห้ามหักลบซ้ำ" เด็ดขาด! เพราะโดนหักไปตอน Wrap แล้ว
  let isClosedBox = false;
  if (window.currentBoxElement) {
    isClosedBox =
      window.currentBoxElement.getAttribute("data-status") === "Closed";
  }

  // หักเฉพาะตอนที่กล่องยังเปิด (Draft) เท่านั้น
  if (!isClosedBox) {
    window.currentBoxItems = window.currentBoxItems || [];
    const currItem = window.currentBoxItems.find(
      (p) => (p.sku || "").toString().toUpperCase() === sku.toUpperCase(),
    );
    if (currItem) {
      currentBoxQty = (currItem.scanQty || 0) + (currItem.manualQty || 0);
    }
  }

  let otherBoxesQty = 0;
  if (typeof window.checkCrossBoxStock === "function") {
    const crossCheck = window.checkCrossBoxStock(sku);
    otherBoxesQty = crossCheck.totalUsedInOtherBoxes || 0;
  }

  const liveAvail = Math.max(0, baseAvail - currentBoxQty - otherBoxesQty);
  const liveHold = baseHold + currentBoxQty + otherBoxesQty;

  return { avail: liveAvail, hold: liveHold };
};



// 📍 คำสั่งอัปเดตหน้าจอทันทีเมื่อมีการกดบวก/ลบ สินค้า
window.triggerRealTimeUIRefresh = function() {
    // รีเฟรชหน้าค้นหาสินค้าในกล่อง (โหมด A)
    if (typeof window.handleBoxSearch === "function") {
        window.handleBoxSearch();
    }
    // รีเฟรชหน้า Stock In House (ถ้าเปิดค้างไว้)
    if (typeof handleMagicSearch === "function" && !document.getElementById("stockInHouseView").classList.contains("hide")) {
        handleMagicSearch(); 
    }
};




// ==============================================================
// 🛒 ฟังก์ชันแสดงลิสต์รายการสินค้า (อัปเกรดเชื่อมต่อ Real-Time Radar 100%)
// ==============================================================
function renderProducts(products) {
  const container = document.getElementById("productListContainer");
  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML =
      '<div style="text-align:center; color:#999; padding: 40px 20px;">❌ ไม่พบข้อมูลสินค้า</div>';
    return;
  }

  products.forEach((item) => {
    const div = document.createElement("div");
    div.className = "product-row";
    div.addEventListener("click", () => openProductDetail(item.sku));

    const safeSku = escapeHTML(item.sku || "-");
    const safeName = escapeHTML(item.name || "-");
    const priceStr = Number(item.price || 0).toLocaleString();

    // 🚨 [REAL-TIME ENGINE]: ดึงตัวเลขสุทธิสดๆ จากเครื่องยนต์ศูนย์กลาง
    let displayAvail = Number(item.availableStock || 0);
    let displayHold = Number(item.holdQty || 0);

    if (typeof window.getRealTimeLiveStock === "function") {
      const liveStock = window.getRealTimeLiveStock(item.sku);
      displayAvail = liveStock.avail;
      displayHold = liveStock.hold;
    }

    const stockAvail = escapeHTML(displayAvail);
    const stockHold = escapeHTML(displayHold);
    const stockDefect = escapeHTML(item.defectiveQty || 0);

    // 🚨 ใช้งาน window.parseDriveImage ป้องกัน error
    const finalImgUrl =
      typeof window.parseDriveImage === "function"
        ? window.parseDriveImage(item.imageUrl)
        : item.imageUrl;

    div.innerHTML = `
      <img class="prod-img" src="${finalImgUrl}">
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

// ==============================================================
// 🌟 ระบบจัดการสต๊อกแบบเจาะลึก (Real-Time Engine & Scope Bridge)
// ==============================================================

// 1. ฟังก์ชันสะพานเชื่อม ให้ไฟล์อื่น(transferout.js) สั่งอัปเดตฐานข้อมูลหลักได้!
window.forceUpdateStockDatabase = function (sku, qty, isWrap) {
  if (typeof localProductDatabase === "undefined") return;
  const skuStr = String(sku).trim().toUpperCase();

  // พุ่งเป้าไปแก้ที่คลังหลักโดยตรง
  let product = localProductDatabase.find(
    (p) =>
      String(p.sku || "")
        .trim()
        .toUpperCase() === skuStr,
  );
  if (product) {
    let currentAvail = Number(product.availableStock || 0);
    let currentHold = Number(product.holdQty || 0);
    if (isWrap) {
      product.availableStock = currentAvail - qty;
      product.holdQty = currentHold + qty;
    } else {
      product.availableStock = currentAvail + qty;
      product.holdQty = currentHold - qty;
    }
    console.log(
      `✅ [Database Sync] อัปเดตสต๊อก ${skuStr} สำเร็จ! (Avail: ${product.availableStock})`,
    );
  }
};

// ==============================================================
// 🌟 ฟังก์ชันคำนวณและเปิดหน้าต่างรายละเอียดสินค้า (เวอร์ชันสมบูรณ์ 100%)
// ==============================================================
window.openProductDetail = function (sku) {
  try {
    const skuStr = String(sku).trim().toUpperCase();
    let item = null;

    // 🚨 1. ประกาศฟังก์ชันตัวช่วยอัปเดตข้อความก่อน! (ห้ามย้ายลงไปข้างล่าง)
    const safeSetText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.innerText = text;
    };

    // 2. หาข้อมูลตั้งต้นจากฐานข้อมูลหลัก
    if (typeof localProductDatabase !== "undefined") {
      item = localProductDatabase.find(
        (p) =>
          String(p.sku || "")
            .trim()
            .toUpperCase() === skuStr,
      );
    }

    // 2.2 ถ้าหาในคลังไม่เจอ ให้หาจาก "ของที่อยู่ในกล่องปัจจุบัน" (เผื่อสแกนของแปลกปลอมเข้ามา)
    if (
      !item &&
      typeof window.currentBoxItems !== "undefined" &&
      window.currentBoxItems.length > 0
    ) {
      item = window.currentBoxItems.find(
        (p) =>
          String(p.sku || "")
            .trim()
            .toUpperCase() === skuStr,
      );
    }

    if (!item) {
      if (typeof window.safeAlert === "function") {
        window.safeAlert(
          "ข้อผิดพลาด",
          `ไม่พบข้อมูลสินค้ารหัส: ${skuStr}`,
          "error",
        );
      }
      return;
    }

    // 3. 🚨 ใช้เครื่องยนต์ศูนย์กลางดึงยอด Real-Time (ห้ามใช้ยอดเดิม)
    let liveAvail = 0;
    let liveHold = 0;
    if (typeof window.getRealTimeLiveStock === "function") {
      const liveStock = window.getRealTimeLiveStock(skuStr);
      liveAvail = liveStock.avail;
      liveHold = liveStock.hold;
    } else {
      liveAvail = Number(item.availableStock || 0);
      liveHold = Number(item.holdQty || 0);
    }

    // 4. อัปเดตข้อมูลข้อความ (Text) ลงหน้าจอ
    safeSetText("detailCategory", item.category || "NO CATEGORY");
    safeSetText("detailSku", item.sku || "-");
    safeSetText("detailName", item.name || "-");
    safeSetText("detailPrice", "฿" + Number(item.price || 0).toLocaleString());
    safeSetText("detailCurrent", item.currentStock || 0);

    // 🚨 นำยอด Real-Time ที่คำนวณแล้วมาแสดงผลทันที!
    safeSetText("detailAvail", liveAvail);
    safeSetText("detailHold", liveHold);

    safeSetText("detailDefect", item.defectiveQty || 0);
    safeSetText("detailSold", item.saleStock || 0);

    // 5. อัปเดต UI รูปภาพและบาร์โค้ด
    const detailImg = document.getElementById("detailImage");
    if (detailImg) {
      // 🚨 เรียกใช้ parseDriveImage แบบ Global
      detailImg.src =
        typeof window.parseDriveImage === "function"
          ? window.parseDriveImage(item.imageUrl)
          : item.imageUrl;
    }

    const barcodeElement = document.getElementById("detailBarcode");
    if (barcodeElement && item.sku) {
      try {
        if (typeof JsBarcode !== "undefined") {
          JsBarcode("#detailBarcode", item.sku, {
            format: "CODE128",
            lineColor: "#333",
            width: 2,
            height: 45,
            displayValue: true,
            fontSize: 16,
            textMargin: 8,
            fontWeight: "bold",
            background: "transparent",
          });
          barcodeElement.style.display = "inline-block";
        }
      } catch (e) {
        barcodeElement.style.display = "none";
      }
    }

    // เปิดหน้าต่าง Modal
    const modal = document.getElementById("productDetailModal");
    if (modal) modal.classList.remove("hide");

    // 6. ส่วนของ Cross Branch
    const btnCrossBranch = document.getElementById("btnCrossBranch");
    if (
      btnCrossBranch &&
      typeof CONFIG !== "undefined" &&
      CONFIG.CROSS_BRANCH_URL
    ) {
      btnCrossBranch.classList.add("hide");
      fetch(
        `${CONFIG.CROSS_BRANCH_URL}?action=check_cross_branch&sku=${encodeURIComponent(item.sku)}`,
      )
        .then((res) => res.json())
        .then((response) => {
          if (response.status === "success" && response.data) {
            const myBranch =
              typeof currentBranch !== "undefined" ? currentBranch : "";
            const otherBranches = response.data.filter(
              (b) => b.branch !== myBranch,
            );
            if (otherBranches.length > 0) {
              btnCrossBranch.classList.remove("hide");
              btnCrossBranch.onclick = () => {
                if (typeof renderCrossBranchModal === "function")
                  renderCrossBranchModal(otherBranches);
              };
            }
          }
        })
        .catch((err) => console.warn("Cross branch fetch failed:", err));
    }
  } catch (err) {
    console.error("Open Detail Error:", err);
  }
};





function closeProductDetail() {
  document.getElementById("productDetailModal").classList.add("hide");
}

function renderCrossBranchModal(branchData) {
  const listContainer = document.getElementById("crossBranchList");
  const modal = document.getElementById("crossBranchModal");
  if (!listContainer || !modal) return;

  listContainer.innerHTML = "";

  branchData.forEach((item) => {
    const div = document.createElement("div");
    div.className = "cross-branch-item";
    div.innerHTML = `
      <span><i class="fas fa-store"></i> สาขา ${escapeHTML(item.branch)}</span>
      <span class="branch-stock-badge">${escapeHTML(item.stock)} ชิ้น</span>
    `;
    listContainer.appendChild(div);
  });

  modal.classList.remove("hide-modal");
}

// ==========================================
// ENGINE STARTER
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  if (typeof initEventListeners === "function") {
    initEventListeners();
  }

  const btnCloseCross = document.getElementById("btnCloseCrossBranch");
  const crossModal = document.getElementById("crossBranchModal");
  if (btnCloseCross && crossModal) {
    btnCloseCross.addEventListener("click", () => {
      crossModal.classList.add("hide-modal");
    });
  }

  const savedBranch = localStorage.getItem("pattcha_branch");
  if (savedBranch) {
    const inputLogin = document.getElementById("branchCodeInput");
    if (inputLogin) {
      inputLogin.value = savedBranch;
      if (typeof submitLogin === "function") submitLogin();
    }
  }
});



