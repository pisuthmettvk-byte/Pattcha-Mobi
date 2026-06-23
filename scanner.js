// ==========================================
// 🌟 SCANNER CORE CONFIGURATION & STATE
// ==========================================
let html5QrCode = null;
let isScannerRunning = false;
let currentScanMode = "BARCODE";
let isFlashOn = false;

// ==========================================
// 1. ฟังก์ชันสั่งเปิดกล้อง (Start Scanner)
// ==========================================
async function startScanner() {
  if (isScannerRunning) return;

  try {
    const readerContainer = document.getElementById("readerContainer");
    const stockScrollArea = document.getElementById("stockScrollArea");
    const readerElement = document.getElementById("reader");

    // จัดการสลับหน้าต่าง UI พื้นที่ตรงกลาง
    if (readerContainer) readerContainer.style.display = "block";
    if (stockScrollArea) stockScrollArea.classList.add("hide");

    // 🌟 ล็อกขนาดโครงสร้างป้องกันเลย์เอาต์พัง/บีบหน้าจอให้เล็กลง
    if (readerElement) {
      readerElement.style.width = "100%";
      readerElement.style.height = "320px"; // บังคับสัดส่วนพื้นที่กล้องตรงกลาง
      readerElement.style.overflow = "hidden";
    }

    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }

    const formats = [
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
        qrbox: function (viewfinderWidth, viewfinderHeight) {
          // คำนวณกรอบสีขาวให้สัมพันธ์กับขนาดโหมดปัจจุบัน
          if (currentScanMode === "BARCODE") {
            return { width: 260, height: 120 };
          } else {
            return { width: 220, height: 220 };
          }
        },
        formatsToSupport: formats,
        aspectRatio: 1.0,
      },
      (decodedText) => {
        stopScanner(); // สแกนติดแล้วปิดระบบทันที
        const searchInput = document.getElementById("searchStockInput");
        if (searchInput) {
          searchInput.value = decodedText;
          searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      },
      (errorMessage) => {
        /* ข้ามข้อความตรวจสอบระว่างเฟรม */
      },
    );

    isScannerRunning = true;
  } catch (err) {
    console.error("Camera start failed:", err);
    forceResetUI();
  }
}

// ==========================================
// 2. ฟังก์ชันสั่งปิดกล้อง (Stop Scanner)
// ==========================================
async function stopScanner() {
  if (!isScannerRunning) return;

  try {
    if (html5QrCode) {
      await html5QrCode.stop();
    }
  } catch (err) {
    console.warn("Camera stop issue, triggering force cleanup:", err);
  } finally {
    forceResetUI();
  }
}

// ฟังก์ชันล้างสถานะและคืนโครงสร้างหน้าจอดั้งเดิมหน้าร้าน
function forceResetUI() {
  isScannerRunning = false;
  isFlashOn = false;

  const readerContainer = document.getElementById("readerContainer");
  const stockScrollArea = document.getElementById("stockScrollArea");
  if (readerContainer) readerContainer.style.display = "none";
  if (stockScrollArea) stockScrollArea.classList.remove("hide");

  const btnFlash = document.getElementById("btnToggleFlash");
  if (btnFlash) {
    btnFlash.style.color = "#fff";
    btnFlash.style.borderColor = "#fff";
  }
}

// ==========================================
// 3. ฟังก์ชันควบคุมสากลรองรับชื่อและหน้าที่ดั้งเดิม 100%
// ==========================================

function toggleScanner() {
  if (isScannerRunning) {
    stopScanner();
  } else {
    startScanner();
  }
}

async function toggleFlash() {
  if (!isScannerRunning || !html5QrCode) return;

  try {
    isFlashOn = !isFlashOn;
    await html5QrCode.applyVideoConstraints({ torch: isFlashOn });

    const btnFlash = document.getElementById("btnToggleFlash");
    if (btnFlash) {
      btnFlash.style.color = isFlashOn ? "#fab919" : "#fff";
      btnFlash.style.borderColor = isFlashOn ? "#fab919" : "#fff";
    }
  } catch (err) {
    console.warn("Flash constraint not supported:", err);
    isFlashOn = false;
  }
}

async function toggleScanMode() {
  currentScanMode = currentScanMode === "BARCODE" ? "QR" : "BARCODE";

  const textEl = document.getElementById("scanModeText");
  const iconEl = document.getElementById("scanModeIcon");
  if (textEl) textEl.innerText = currentScanMode;
  if (iconEl)
    iconEl.className =
      currentScanMode === "BARCODE" ? "fas fa-barcode" : "fas fa-qrcode";

  // 🌟 ถ้ากล้องเปิดอยู่ ทำการรีสตาร์ทเฟรมเล็งอย่างปลอดภัยเพื่อเปลี่ยนรูปทรงกรอบสีขาว
  if (isScannerRunning) {
    if (html5QrCode) {
      await html5QrCode.stop();
      isScannerRunning = false;
      await startScanner();
    }
  }
}

// ==========================================
// 4. ผูกเหตุการณ์คำสั่ง (Event Listeners)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // ผูกปุ่มหลักภายในหน้างานตาม ID ดั้งเดิมของระบบ
  document
    .getElementById("btnScannerOpen")
    ?.addEventListener("click", toggleScanner);
  document
    .getElementById("btnToggleScanMode")
    ?.addEventListener("click", toggleScanMode);
  document
    .getElementById("btnToggleFlash")
    ?.addEventListener("click", toggleFlash);

  // ดักฟังปุ่มกากบาทปิดกล้อง (หากมีการประกาศ Element ไว้ที่มุมหน้าจอ)
  document
    .getElementById("btnScannerClose")
    ?.addEventListener("click", stopScanner);

  // ปุ่ม Quick Scan หน้าแรกเมนูหลัก
  document.getElementById("btnMenuQuickScan")?.addEventListener("click", () => {
    setTimeout(() => {
      startScanner();
    }, 320);
  });

  // ปุ่ม BACK หน้ารายการสินค้า
  document.getElementById("btnStockBack")?.addEventListener("click", () => {
    if (isScannerRunning) stopScanner();
  });
});
