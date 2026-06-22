// ==========================================
// 🌟 SCANNER CONFIGURATION & STATE
// ==========================================
let html5QrCode = null;
let isScannerRunning = false;
let isTransitioning = false;
let currentScanMode = "BARCODE";
let isFlashOn = false;

// ==========================================
// 1. ฟังก์ชันหลักเปิดกล้อง (Core Start)
// ==========================================
async function startScanner() {
  if (isTransitioning || isScannerRunning) return;
  isTransitioning = true;

  try {
    const readerContainer = document.getElementById("readerContainer");
    const stockScrollArea = document.getElementById("stockScrollArea");
    if (readerContainer) readerContainer.style.display = "block";
    if (stockScrollArea) stockScrollArea.classList.add("hide");

    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }

    // รองรับทั้งคู่พร้อมกันเพื่อความเสถียรตอนสลับกรอบเล็ง
    const allFormats = [
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.QR_CODE,
    ];

    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 12,
        qrbox: { width: 250, height: 250 },
        formatsToSupport: allFormats,
        aspectRatio: 1.0,
      },
      (decodedText) => {
        stopScanner();
        const searchInput = document.getElementById("searchStockInput");
        if (searchInput) {
          searchInput.value = decodedText;
          searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      },
      (errorMessage) => {
        /* ข้าม Error ยิบย่อย */
      },
    );

    isScannerRunning = true;

    // อัปเดตขนาดกรอบให้ตรงกับโหมดปัจจุบันหลังเปิดกล้องเสร็จ
    setTimeout(() => {
      updateScanRegionUI();
    }, 100);
  } catch (err) {
    console.error("Camera start failed:", err);
  } finally {
    isTransitioning = false;
  }
}

// ==========================================
// 2. ฟังก์ชันหลักปิดกล้อง (Core Stop)
// ==========================================
async function stopScanner() {
  if (isTransitioning || !isScannerRunning) return;
  isTransitioning = true;

  try {
    await html5QrCode.stop();
    isScannerRunning = false;
    isFlashOn = false;

    const btnFlash = document.getElementById("btnToggleFlash");
    if (btnFlash) {
      btnFlash.style.color = "#fff";
      btnFlash.style.borderColor = "#fff";
    }

    const readerContainer = document.getElementById("readerContainer");
    const stockScrollArea = document.getElementById("stockScrollArea");
    if (readerContainer) readerContainer.style.display = "none";
    if (stockScrollArea) stockScrollArea.classList.remove("hide");
  } catch (err) {
    console.error("Camera stop failed:", err);
  } finally {
    isTransitioning = false;
  }
}

// ==========================================
// 🌟 3. ฟังก์ชันสากลชื่อเดิม (รักษาสิทธิ์ชื่อเดิมไว้ 100%)
// ==========================================

// ชื่อฟังก์ชันเดิมสำหรับเปิด/ปิดกล้อง
function toggleScanner() {
  if (isScannerRunning) {
    stopScanner();
  } else {
    startScanner();
  }
}

// ชื่อฟังก์ชันเดิมสำหรับสลับเปิด/ปิดไฟแฟลช
async function toggleFlash() {
  if (!isScannerRunning || isTransitioning) return;

  try {
    isFlashOn = !isFlashOn;
    await html5QrCode.applyVideoConstraints({ torch: isFlashOn });

    const btnFlash = document.getElementById("btnToggleFlash");
    if (btnFlash) {
      btnFlash.style.color = isFlashOn ? "#fab919" : "#fff";
      btnFlash.style.borderColor = isFlashOn ? "#fab919" : "#fff";
    }
  } catch (err) {
    console.warn("อุปกรณ์ไม่รองรับไฟแฟลช:", err);
    isFlashOn = false;
  }
}

// ฟังก์ชันสลับโหมดและปรับความสูงกรอบเล็งแบบสมูท
function toggleScanMode() {
  if (isTransitioning) return;

  currentScanMode = currentScanMode === "BARCODE" ? "QR" : "BARCODE";

  const textEl = document.getElementById("scanModeText");
  const iconEl = document.getElementById("scanModeIcon");
  if (textEl) textEl.innerText = currentScanMode;
  if (iconEl)
    iconEl.className =
      currentScanMode === "BARCODE" ? "fas fa-barcode" : "fas fa-qrcode";

  if (isScannerRunning) {
    updateScanRegionUI();
  }
}

// ฟังก์ชันจัดการขยับมิติกรอบเล็งโหมดกล้องโดยไม่กระพริบ
function updateScanRegionUI() {
  const scanRegion = document.querySelector("#reader__scan_region");
  if (scanRegion) {
    scanRegion.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    if (currentScanMode === "BARCODE") {
      scanRegion.style.height = "120px";
    } else {
      scanRegion.style.height = "250px";
    }
  }
}

// ==========================================
// 4. จุดเช็กและผูกระบบตรวจจับเหตุการณ์ (Event Listeners)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // ปุ่ม QUICK SCAN บนเมนูหลัก สั่งหน่วงเวลาสลับหน้าแล้วเปิดกล้องทันที
  document.getElementById("btnMenuQuickScan")?.addEventListener("click", () => {
    setTimeout(() => {
      startScanner();
    }, 300);
  });

  // ผูกปุ่มภายในหน้า Stock (รองรับทั้งเคสกดผ่านแอปและดักฟัง ID)
  document
    .getElementById("btnScannerOpen")
    ?.addEventListener("click", toggleScanner);
  document
    .getElementById("btnToggleScanMode")
    ?.addEventListener("click", toggleScanMode);
  document
    .getElementById("btnToggleFlash")
    ?.addEventListener("click", toggleFlash);
});
