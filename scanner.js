// ======================================================
// 🚀 Scanner Performance Optimization (OS Native + Format Lock)
// ======================================================

let html5QrCode;
let isTransitioning = false;
let isFlashOn = false;

window.currentScannerMode = window.currentScannerMode || "barcode";
window.currentScannerContext = window.currentScannerContext || "stock"; // 📍 เพิ่มตัวแปรแยกหน้าจอ

// ======================================================
// 🛡️ [THE BULLETPROOF CONTEXT LOCK] - ป้องกัน Box Details หลอกหลอน
// ======================================================
document.addEventListener(
  "click",
  (e) => {
    if (
      e.target.closest("#btnScannerOpen") ||
      e.target.closest("#btnMenuQuickScan")
    ) {
      window.currentScannerContext = "stock";
    } else if (e.target.closest("#btnBoxScanner")) {
      window.currentScannerContext = "box";
    }
  },
  true,
);

// ======================================================
// 🎯 [GLOBAL ROUTER] - สแกนทีละรายการ (กล้องปิดทันทีที่สแกนติด)
// ======================================================
async function globalScanSuccessCallback(decodedText, decodedResult) {
  if (window.isProcessingScan) return;

  // 1. กรองรหัสผิดประเภททิ้ง (ดักจับตามโหมดที่เลือก)
  if (decodedResult && decodedResult.result && decodedResult.result.format) {
    const formatName = decodedResult.result.format.formatName;
    const isQR = formatName === "QR_CODE";

    if (window.currentScannerMode === "qr" && !isQR) return;
    if (window.currentScannerMode === "barcode" && isQR) return;
  }

  window.isProcessingScan = true;

  if (navigator.vibrate) navigator.vibrate(100); // โทรศัพท์สั่นเตือน

  // 🔴 [พระเอกอยู่ตรงนี้]: สั่งปิดกล้องทันที "ทุกกรณี" ไม่ว่าหน้าไหน
  await stopScanner();

  // 2. สับรางข้อมูลให้ถูกหน้า (หลังกล้องปิดแล้ว)
  if (window.currentScannerContext === "box") {
    // 📦 โหมดแพ็กของ: โยนรหัสลงกล่อง -> ลิสต์สินค้าโผล่ -> อยากสแกนอีกก็กดเปิดกล้องใหม่
    if (typeof window.addScannedItemToBox === "function") {
      window.addScannedItemToBox(decodedText);
    }
  } else {
    // 🏪 โหมดค้นหาสต็อก: โยนรหัสไปค้นหา -> โชว์ข้อมูล
    if (typeof window.qrCodeSuccessCallback === "function") {
      window.qrCodeSuccessCallback(decodedText, decodedResult);
    } else if (typeof processScanResult === "function") {
      processScanResult(decodedText);
    }
  }

  window.isProcessingScan = false;
}

// ======================================================
// ⚙️ ตั้งค่าความแม่นยำกล้อง (คงความดั้งเดิม)
// ======================================================
function getOptimizedScannerConfig() {
  const isQRMode = window.currentScannerMode === "qr";

  return {
    fps: 15,
    qrbox: function (viewfinderWidth, viewfinderHeight) {
      let minEdgePercentage = 0.7;
      let minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
      let qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
      if (qrboxSize > 250) qrboxSize = 250;
      return { width: qrboxSize, height: qrboxSize };
    },
    useBarCodeDetectorIfSupported: true,
    formatsToSupport: isQRMode
      ? [Html5QrcodeSupportedFormats.QR_CODE]
      : [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
        ],
  };
}

// ======================================================
// 🎛️ ปุ่มสลับโหมด Taco (รีบูตกล้องเพื่อปรับขนาดกรอบ)
// ======================================================
window.switchScannerFormat = async function (mode) {
  if (window.currentScannerMode === mode) return;

  window.currentScannerMode = mode;
  console.log(`[SCANNER] สลับเป็นโหมด: ${mode}`);

  if (window.isScannerMode) {
    await stopScanner();
    setTimeout(async () => {
      await startScanner(); // เปิดกล้องใหม่เพื่อรับ Config ใหม่
    }, 300); // ใส่ดีเลย์นิดนึงให้ฮาร์ดแวร์พัก ป้องกันจอขาว
  }
};

//===============
// [toggleScanner] START
window.toggleScanner = async function () {
  const scanView = document.getElementById("scannerView");

  if (window.isScannerMode) {
    await stopScanner();
  } else {
    if (scanView) {
      scanView.classList.add("active");
      scanView.style.zIndex = "9999";
    }
    await startScanner();
  }
};
//===============

//===============
// [startScanner] START
async function startScanner() {
  if (isTransitioning) return;
  isTransitioning = true;

  try {
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }

    const config = getOptimizedScannerConfig();

    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        globalScanSuccessCallback,
      );
    } catch (camErr) {
      console.warn(
        "เกิดข้อผิดพลาด ลองบังคับเปิดกล้องหลังด้วยวิธีที่ 2...",
        camErr,
      );
      await html5QrCode.start(
        { facingMode: { exact: "environment" } },
        config,
        globalScanSuccessCallback,
      );
    }

    window.isScannerMode = true;
  } catch (err) {
    console.error("ระบบกล้องถูกปฏิเสธอย่างสมบูรณ์:", err);
    window.isScannerMode = false;
    forceResetUI();
    alert("ไม่สามารถเข้าถึงกล้องหลังได้ กรุณาตรวจสอบการอนุญาต (Permission)");
  } finally {
    isTransitioning = false;
  }
}
//===============

//===============
// [stopScanner] START
async function stopScanner() {
  if (isTransitioning) return;
  isTransitioning = true;

  try {
    if (html5QrCode && window.isScannerMode) {
      try {
        await html5QrCode.stop();
      } catch (stopErr) {
        console.warn("ข้ามการหยุดฮาร์ดแวร์: เลนส์อาจจะยังไม่เปิดสมบูรณ์");
      }
      html5QrCode.clear();
    }
  } catch (err) {
    console.warn("Stop scanner error:", err);
  } finally {
    window.isScannerMode = false;
    isFlashOn = false;

    const flashBtn = document.getElementById("btnToggleFlash");
    if (flashBtn) {
      flashBtn.style.color = "#fff";
      flashBtn.style.borderColor = "#fff";
    }

    forceResetUI();
    isTransitioning = false;
  }
}
//===============

//===============
// [forceResetUI] START
function forceResetUI() {
  const scanView = document.getElementById("scannerView");
  if (scanView) {
    scanView.classList.remove("active");
    scanView.style.zIndex = "-1";
  }

  window.isScannerMode = false;
  window.isProcessingScan = false;

  // 📍 ดึงหน้า Box Details กลับมา (เฉพาะตอนอยู่โหมด box เท่านั้น)
  if (window.currentScannerContext === "box") {
    const boxDetailsView = document.getElementById("boxDetailsView");
    if (boxDetailsView) {
      boxDetailsView.classList.remove("hide");
    }
  }
}
//===============

// ======================================================
// 🌟 ผูก Event ให้ปุ่ม UI หน้าจอ (เพื่อเรียกใช้ switchScannerFormat)
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
  const btnToggleScanMode = document.getElementById("btnToggleScanMode");
  const scanModeIcon = document.getElementById("scanModeIcon");
  const scanModeText = document.getElementById("scanModeText");

  if (btnToggleScanMode) {
    const newBtnToggle = btnToggleScanMode.cloneNode(true);
    btnToggleScanMode.parentNode.replaceChild(newBtnToggle, btnToggleScanMode);

    newBtnToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // สลับ UI และเรียกใช้ฟังก์ชันดั้งเดิม
      if (window.currentScannerMode === "qr") {
        if (scanModeIcon) scanModeIcon.className = "fas fa-barcode";
        if (scanModeText) scanModeText.textContent = "BARCODE";
        window.switchScannerFormat("barcode");
      } else {
        if (scanModeIcon) scanModeIcon.className = "fas fa-qrcode";
        if (scanModeText) scanModeText.textContent = "QR CODE";
        window.switchScannerFormat("qr");
      }
    });
  }

  const btnToggleFlash = document.getElementById("btnToggleFlash");
  if (btnToggleFlash) {
    const newBtnFlash = btnToggleFlash.cloneNode(true);
    btnToggleFlash.parentNode.replaceChild(newBtnFlash, btnToggleFlash);

    newBtnFlash.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!html5QrCode || !window.isScannerMode) return;

      try {
        isFlashOn = !isFlashOn;
        await html5QrCode.applyVideoConstraints({
          advanced: [{ torch: isFlashOn }],
        });
        if (isFlashOn) {
          newBtnFlash.style.color = "#ffeb3b";
          newBtnFlash.style.borderColor = "#ffeb3b";
        } else {
          newBtnFlash.style.color = "#fff";
          newBtnFlash.style.borderColor = "#fff";
        }
      } catch (err) {
        console.warn("Flash not supported:", err);
        isFlashOn = false;
        alert("อุปกรณ์ของคุณไม่รองรับไฟแฟลชครับ");
      }
    });
  }
});
