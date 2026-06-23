// ==========================================
// CONFIGURATION & CONSTANTS
// ==========================================
const CONFIG = {
  API_URL:
    "https://script.google.com/macros/s/AKfycbwzwaDlMarLw7tvgm6dFRnnORWdgZ5o3M01NhNf9lNm0tvwOw2WvB9CkOP5jYcnDFMjhA/exec", // 🌟 คืนค่าลิงก์หลักดั้งเดิมสำหรับ Login และดึงข้อมูลสต็อกสาขาตัวเอง
  CROSS_BRANCH_URL:
    "https://script.google.com/macros/s/AKfycbzPJweCC9wgdKzqnWV5kuPWMiUbM9uNgjaO3rfCRaXtTW80nLflLORQIizxay9LbTkbHg/exec", // 🌟 ใช้ลิงก์ใหม่ตัวนี้สำหรับการยิงเช็กสต็อกต่างสาขาโดยเฉพาะ
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

    btnCancel.classList.add("hide"); // ซ่อนปุ่ม Cancel (มีแค่ OK)
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

    btnCancel.classList.remove("hide"); // แสดงปุ่ม Cancel ให้เลือก
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
// ==========================================
// GLOBAL STATE (อัปเดตเพิ่มเติม)
// ==========================================
let idleTimeout = null;
const IDLE_TIME_LIMIT = 5 * 60 * 1000; // ตั้งเวลา 5 นาที (หน่วยเป็นมิลลิวินาที)

// ==========================================
// IDLE TIMEOUT FUNCTIONS (ระบบจับเวลาแสตนด์บาย)
// ==========================================
function resetIdleTimer() {
  const stockView = document.getElementById("stockInHouseView");

  // 🟢 ปรับปรุง: ถ้าไม่ได้เปิดหน้าจอสต็อกค้างไว้ ให้ล้างไทม์เมอร์ทิ้งทันที ประหยัดทรัพยากร CPU เครื่อง
  if (!stockView || stockView.classList.contains("hide")) {
    clearTimeout(idleTimeout);
    return;
  }

  clearTimeout(idleTimeout);
  idleTimeout = setTimeout(returnToMainMenuOnIdle, IDLE_TIME_LIMIT);
}

function returnToMainMenuOnIdle() {
  // 🟢 ปรับปรุง: สั่งปิดการทำงานของกล้องสแกนเนอร์ทันทีหากเปิดค้างไว้ เพื่อประหยัดแบตเตอรี่มือถือ
  if (typeof isScannerMode !== "undefined" && isScannerMode) {
    toggleScanner();
  }

  // ปิดหน้าต่างลอยทั้งหมดที่อาจจะเปิดค้างไว้ลึกๆ
  const detailModal = document.getElementById("productDetailModal");
  const crossModal = document.getElementById("crossBranchModal");
  if (detailModal) detailModal.classList.add("hide");
  if (crossModal) crossModal.classList.add("hide-modal");

  // เคลียร์ช่องค้นหา
  clearSearch();

  // ปิดหน้า Stock แล้วเด้งกลับ Main Menu
  const stockView = document.getElementById("stockInHouseView");
  if (stockView) stockView.classList.add("hide");

  const sharedHeader = document.getElementById("sharedHeader");
  const mainMenuView = document.getElementById("mainMenuView");
  if (sharedHeader) sharedHeader.classList.remove("hide");
  if (mainMenuView) mainMenuView.classList.remove("hide");
}

// ==========================================
// UTILITY FUNCTIONS (Security & Core Logic)
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
// INITIALIZATION & EVENT LISTENERS (เวอร์ชันแก้เลเยอร์กล้องซ้อนทับ)
// ==========================================
function initEventListeners() {
  // หน้า Login
  const btnSubmit = document.getElementById("btnSubmitLogin");
  if (btnSubmit) btnSubmit.addEventListener("click", submitLogin);

  // กด Enter เพื่อล็อกอินได้เลย
  const inputLogin = document.getElementById("branchCodeInput");
  if (inputLogin) {
    inputLogin.addEventListener("keypress", function (e) {
      if (e.key === "Enter") submitLogin();
    });
  }

  // หน้า Main Menu (5 ปุ่มใหม่)
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

  // ปุ่ม Quick Scan หน้า Main Menu
  const btnQuickScan = document.getElementById("btnMenuQuickScan");
  if (btnQuickScan) {
    btnQuickScan.addEventListener("click", async () => {
      // 1. สั่งเปิดหน้าและรอให้คำสั่งโหลดสต็อกสดจาก Google Sheets ทำงานเสร็จสิ้นก่อน 100%
      await openStockInHouse();

      // 2. เมื่อหน้าจอปรากฏตัวและพร้อมแสดงผลเรียบร้อยแล้ว ค่อยสั่งเปิดกล้องทำงานทันที
      if (typeof toggleScanner === "function") {
        if (typeof isScannerMode !== "undefined" && !isScannerMode) {
          // 🌟 บังคับจัดระเบียบชั้นเลเยอร์ให้ปุ่ม Quick Scan เปิดกล้องมาแล้วอยู่บนสุด
          const scanView = document.getElementById("scannerView");
          if (scanView) {
            scanView.style.position = "fixed";
            scanView.style.zIndex = "9999";
          }
          toggleScanner();
        }
      }
    });
  }

  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) btnLogout.addEventListener("click", logoutBranch);

  // หน้า Stock
  const btnBack = document.getElementById("btnStockBack");
  if (btnBack) btnBack.addEventListener("click", handleStockBack);

  const btnClear = document.getElementById("clearSearchBtn");
  if (btnClear) btnClear.addEventListener("click", clearSearch);

  // กล้องสแกนหลักด้านใน
  const toggleCam = () => {
    if (typeof toggleScanner === "function") {
      // 🌟 บังคับให้หน้าต่างกล้องลอยมาอยู่ชั้นบนสุดเหนือคอลัมน์หมวดหมู่เสมอ
      const scanView = document.getElementById("scannerView");
      if (scanView) {
        scanView.style.position = "fixed";
        scanView.style.zIndex = "9999";
      }
      toggleScanner();
    }
  };
  const btnCamOpen = document.getElementById("btnScannerOpen");
  if (btnCamOpen) btnCamOpen.addEventListener("click", toggleCam);

  const btnCamClose = document.getElementById("btnScannerClose");
  if (btnCamClose) btnCamClose.addEventListener("click", toggleCam);

  // ปุ่มควบคุมกล้อง (โหมด & แฟลช)
  const btnScanMode = document.getElementById("btnToggleScanMode");
  if (btnScanMode)
    btnScanMode.addEventListener("click", () => {
      if (typeof toggleScanMode === "function") toggleScanMode();
    });

  const btnFlash = document.getElementById("btnToggleFlash");
  if (btnFlash)
    btnFlash.addEventListener("click", () => {
      if (typeof toggleFlash === "function") toggleFlash();
    });

  // ช่องค้นหา
  const searchInput = document.getElementById("searchStockInput");
  if (searchInput)
    searchInput.addEventListener(
      "input",
      debounceSearch(handleMagicSearch, CONFIG.SEARCH_DELAY),
    );

  // หน้า Modal Detail
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

      const sharedHeader = document.getElementById("sharedHeader");
      const loginView = document.getElementById("loginView");
      const mainMenuView = document.getElementById("mainMenuView");

      // เฟดหน้าจอ Login ออก
      loginView.classList.add("fade-out");

      // สั่งแชร์เฮดเดอร์สไลด์ขึ้นไปจอดด้านบน
      if (sharedHeader) {
        sharedHeader.classList.remove("header-center");
        sharedHeader.classList.add("header-top");
      }

      // เปิดหน้าเมนูอย่างนุ่มนวลตามลำดับบล็อก Flow
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
// STOCK IN HOUSE VIEW MANAGEMENT (เวอร์ชันแก้บั๊กหน้าจอขาว)
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
    // ดึงข้อมูลสต็อกล่าสุดของสาขาตัวเองผ่านลิงก์หลักสม่ำเสมอ
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

  // ดักจับ Element เลเยอร์หน้าจอทั้งหมดเพื่อจัดระเบียบ
  const sharedHeader = document.getElementById("sharedHeader");
  const mainMenuView = document.getElementById("mainMenuView");
  const stockInHouseView = document.getElementById("stockInHouseView");
  const categoryContainer = document.getElementById("categoryListContainer");
  const productContainer = document.getElementById("productListContainer");
  const headerTitle = document.getElementById("stockHeaderTitle");

  if (sharedHeader) sharedHeader.classList.add("hide");
  if (mainMenuView) mainMenuView.classList.add("hide");
  if (stockInHouseView) stockInHouseView.classList.remove("hide");

  // 🟢 [จุดแก้ไขวิกฤต] บังคับปลดล็อกสถานะซ่อนตัวของหมวดหมู่ และซ่อนหน้ารายชื่อสินค้าทิ้ง ป้องกันอาการจอว่าง
  if (categoryContainer) categoryContainer.classList.remove("hide");
  if (productContainer) productContainer.classList.add("hide");
  if (headerTitle) headerTitle.innerText = "STOCK IN HOUSE";

  currentStockView = "category"; // รีเซ็ตมุมมองหลักกลับสู่หน้าหมวดหมู่
  renderCategories(); // สั่งวาดการ์ดหมวดหมู่สินค้าหลักลงบนจอ
  if (typeof resetIdleTimer === "function") resetIdleTimer(); // เริ่มจับเวลาแสตนด์บาย 5 นาที
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
  if (typeof isScannerMode !== "undefined" && isScannerMode) {
    toggleScanner();
  }
  if (currentStockView === "product") {
    clearSearch();
  } else {
    document.getElementById("stockInHouseView").classList.add("hide");
    document.getElementById("sharedHeader").classList.remove("hide");
    document.getElementById("mainMenuView").classList.remove("hide");

    // 🌟 หยุดระบบจับเวลาเมื่อพนักงานตั้งใจกดถอยหลังกลับมาที่ Main Menu เอง
    clearTimeout(idleTimeout);
  }
}

// ==========================================================
// 🌟 [นำกลับมาคืนระบบ] ฟังก์ชันสำหรับจัดการระบบค้นหาเวทมนตร์ (Magic Search)
// ==========================================================
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

    // ดึงและคัดกรองความปลอดภัยของข้อมูลสถานะสต็อกทั้งหมด
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
      // ในฟังก์ชัน openProductDetail แก้ความสูงบาร์โค้ดกลับมาที่ 45 ครับ
      JsBarcode("#detailBarcode", item.sku, {
        format: "CODE128",
        lineColor: "#333",
        width: 2,
        height: 45, // 🌟 คืนความสูงที่พอดีต่อการสแกน
        displayValue: false,
      });
      barcodeElement.style.display = "block";
    } catch (e) {
      console.warn("Barcode error:", e);
      barcodeElement.style.display = "none";
    }
  }

  const safeSetText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  };

  // 🌟 ส่งข้อมูลเข้าเลย์เอาต์ใหม่ ซ้าย-ขวา และ Card UI ได้ทันที
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

  // ==========================================================
  // 🌟 [ปรับปรุงล่าสุด] คำสั่งเช็กสต็อกต่างสาขา (กรองสาขาตัวเองออก 100%)
  // ==========================================================
  const btnCrossBranch = document.getElementById("btnCrossBranch");
  if (btnCrossBranch) {
    btnCrossBranch.classList.add("hide"); // ซ่อนไอคอนไว้ก่อนทุกครั้ง

    // 🌟 เปลี่ยนมาเรียกใช้งานผ่าน CONFIG.CROSS_BRANCH_URL เส้นใหม่
    fetch(
      `${CONFIG.CROSS_BRANCH_URL}?action=check_cross_branch&sku=${encodeURIComponent(item.sku)}`,
    )
      .then((res) => res.json())
      .then((response) => {
        if (response.status === "success" && response.data) {
          // 🌟 กรองเอาสาขาที่ล็อกอินปัจจุบันออกไปจากรายการผลลัพธ์
          const otherBranches = response.data.filter(
            (b) => b.branch !== currentBranch,
          );

          // 🟢 เงื่อนไขตรงโจทย์: จะแสดงไอคอนก็ต่อเมื่อสาขา "อื่น" มีสินค้าจริงๆ เท่านั้น
          if (otherBranches.length > 0) {
            btnCrossBranch.classList.remove("hide");

            btnCrossBranch.onclick = () => {
              renderCrossBranchModal(otherBranches); // ส่งเฉพาะสาขาอื่นไปวาดบนหน้าต่างลอย
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

// ==========================================================
// 🌟 [เพิ่มใหม่] ฟังก์ชันสำหรับวาดรายชื่อสาขาที่มีสต็อกลงในหน้าต่างลอย
// ==========================================================
function renderCrossBranchModal(branchData) {
  const listContainer = document.getElementById("crossBranchList");
  const modal = document.getElementById("crossBranchModal");
  if (!listContainer || !modal) return;

  listContainer.innerHTML = ""; // ล้างข้อมูลเก่าออกก่อน

  // วนลูปวาดรายชื่อสาขาที่มีของเฉพาะที่มีแต้มมากกว่า 0 ตามที่เรากรองมาจากหลังบ้าน
  branchData.forEach((item) => {
    const div = document.createElement("div");
    div.className = "cross-branch-item";
    div.innerHTML = `
      <span><i class="fas fa-store"></i> สาขา ${escapeHTML(item.branch)}</span>
      <span class="branch-stock-badge">${escapeHTML(item.stock)} ชิ้น</span>
    `;
    listContainer.appendChild(div);
  });

  // เปิดแสดงหน้าต่างลอยข้ามสาขา
  modal.classList.remove("hide-modal");
}

// ==========================================
// 🌟 ENGINE STARTER (สวิตช์สตาร์ทเครื่องยนต์หลักรวมศูนย์)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // 1. สตาร์ทสายไฟผูกปุ่มกดทั้งหมดในระบบ (แก้บั๊กปุ่ม Submit นิ่งสนิท)
  if (typeof initEventListeners === "function") {
    initEventListeners();
  }

  // 2. ผูกเหตุการณ์กดปิดหน้าต่างลอยข้ามสาขา (คงไว้ตามลอจิกล่าสุด)
  const btnCloseCross = document.getElementById("btnCloseCrossBranch");
  const crossModal = document.getElementById("crossBranchModal");
  if (btnCloseCross && crossModal) {
    btnCloseCross.addEventListener("click", () => {
      crossModal.classList.add("hide-modal");
    });
  }

  // 3. ระบบจดจำและล็อกอินอัตโนมัติเมื่อพนักงานเปิดแอปใหม่
  const savedBranch = localStorage.getItem("pattcha_branch");
  if (savedBranch) {
    const inputLogin = document.getElementById("branchCodeInput");
    if (inputLogin) {
      inputLogin.value = savedBranch;
      if (typeof submitLogin === "function") submitLogin();
    }
  }
});
