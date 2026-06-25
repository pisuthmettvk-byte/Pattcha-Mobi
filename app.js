// ==========================================
// CONFIGURATION & CONSTANTS
// ==========================================
const CONFIG = {
  API_URL:
    "https://script.google.com/macros/s/AKfycbwzwaDlMarLw7tvgm6dFRnnORWdgZ5o3M01NhNf9lNm0tvwOw2WvB9CkOP5jYcnDFMjhA/exec",
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

function parseDriveImage(url) {
  if (!url || url === "CellImage")
    return "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";
  let match =
    url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1])
    return "https://drive.google.com/thumbnail?id=" + match[1] + "&sz=w500";
  return url;
}

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

  const btnMovement = document.getElementById("btnMenuMovement");
  if (btnMovement)
    btnMovement.addEventListener("click", () =>
      alert("PRODUCT MOVEMENT: Transfer In/Out, Hold, Defective (กำลังพัฒนา)"),
    );

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

async function submitLogin() {
  const inputLogin = document.getElementById("branchCodeInput");
  if (!inputLogin) return;
  const code = inputLogin.value.trim().toUpperCase();
  const btn = document.getElementById("btnSubmitLogin");

  if (!code) return alert("⚠️ กรุณากรอกรหัสสาขาครับ");

  // 🌟 1. เก็บข้อความเดิมของปุ่มไว้ก่อน (เพื่อเอาไว้คืนค่า)
  const originalText = btn.innerHTML;

  // 🌟 2. เริ่มสถานะ LOADING (ล็อกปุ่ม + ไอคอนหมุน)
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> LOADING...';
  btn.disabled = true;
  btn.style.opacity = "0.7";

  try {
    const response = await fetch(
      CONFIG.API_URL + "?action=login&branch=" + code,
    );
    const res = await response.json();

    if (res.success) {
      localStorage.setItem("pattcha_branch", code);
      localProductDatabase = res.products || [];
      currentBranch = res.branch;

      const sharedHeader = document.getElementById("sharedHeader");
      const loginView = document.getElementById("loginView");
      const mainMenuView = document.getElementById("mainMenuView");

      // (ลอจิกการสลับหน้าจอของเจเลอร์ที่อยู่ด้านล่างตรงนี้... ให้คงไว้เหมือนเดิมได้เลยครับ)
    } else {
      // กรณี API ส่งข้อมูลกลับมาว่าไม่พบสาขา
      alert("⚠️ เข้าสู่ระบบไม่สำเร็จ: ไม่พบข้อมูลสาขา");
    }
  } catch (error) {
    // 🌟 จับ Error กรณีเน็ตเวิร์กล่มหรือหา API ไม่เจอ
    console.error("Login Error:", error);
    alert("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
  } finally {
    // 🌟 3. ปลดล็อกปุ่มเสมอ (ไม่ว่าจะล็อกอินผ่าน หรือเกิด Error)
    btn.innerHTML = originalText;
    btn.disabled = false;
    btn.style.opacity = "1";
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
  const item = localProductDatabase.find((p) => p.sku === sku);
  if (!item) return;

  const detailImg = document.getElementById("detailImage");
  if (detailImg) detailImg.src = parseDriveImage(item.imageUrl);

  const barcodeElement = document.getElementById("detailBarcode");
  if (barcodeElement && item.sku) {
    try {
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
    } catch (e) {
      console.warn("Barcode error:", e);
      barcodeElement.style.display = "none";
    }
  }

  const safeSetText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  };

  safeSetText("detailCategory", item.category || "NO CATEGORY");
  safeSetText("detailSku", item.sku || "-");
  safeSetText("detailName", item.name || "-");
  safeSetText("detailPrice", "฿" + Number(item.price || 0).toLocaleString());
  safeSetText("detailCurrent", item.currentStock || 0);
  safeSetText("detailAvail", item.availableStock || 0);
  safeSetText("detailHold", item.holdQty || 0);
  safeSetText("detailDefect", item.defectiveQty || 0);
  safeSetText("detailSold", item.saleStock || 0);

  document.getElementById("productDetailModal").classList.remove("hide");

  const btnCrossBranch = document.getElementById("btnCrossBranch");
  if (btnCrossBranch) {
    btnCrossBranch.classList.add("hide");

    fetch(
      `${CONFIG.CROSS_BRANCH_URL}?action=check_cross_branch&sku=${encodeURIComponent(item.sku)}`,
    )
      .then((res) => res.json())
      .then((response) => {
        if (response.status === "success" && response.data) {
          const otherBranches = response.data.filter(
            (b) => b.branch !== currentBranch,
          );

          if (otherBranches.length > 0) {
            btnCrossBranch.classList.remove("hide");

            btnCrossBranch.onclick = () => {
              renderCrossBranchModal(otherBranches);
            };
          }
        }
      })
      .catch((err) => console.warn("Cross branch fetch failed:", err));
  }
}

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
