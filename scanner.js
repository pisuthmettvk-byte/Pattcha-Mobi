// ==============================================================================
// 🌟 SCANNER CORE (Ironclad Edition - แก้บั๊กกล้องค้าง & สแกนเบิ้ล 100%)
// ==============================================================================

let html5QrCode;
let isTransitioning = false;
let isFlashOn = false;

window.currentScannerMode = window.currentScannerMode || "barcode";
window.currentScannerContext = window.currentScannerContext || "stock"; // ค่าเริ่มต้น

// ======================================================
// 🛡️ [THE BULLETPROOF CONTEXT LOCK] - ป้องกัน Context ตีกัน
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
// 🎯 [GLOBAL ROUTER] - ควบคุมการสแกนและล็อกการทำงานซ้ำซ้อน
// ======================================================
async function globalScanSuccessCallback(decodedText, decodedResult) {
  // 🚨 1. HARD LOCK: ถ้ากำลังประมวลผลอยู่ ห้ามรับค่าใดๆ เพิ่มเด็ดขาด!
  if (window.isProcessingScan) return;

  if (decodedResult && decodedResult.result && decodedResult.result.format) {
    const formatName = decodedResult.result.format.formatName;
    const isQR = formatName === "QR_CODE";

    if (window.currentScannerMode === "qr" && !isQR) return;
    if (window.currentScannerMode === "barcode" && isQR) return;
  }

  // 🚨 ล็อกประตูทันทีที่สแกนติดชิ้นแรก (ป้องกันผีสแกนเบิ้ล 2-3 ชิ้น)
  window.isProcessingScan = true;

  if (navigator.vibrate) navigator.vibrate(100);

  if (window.currentScannerContext === "box") {
    // 📦 โหมด Box Detail (Continuous Scan)
    if (typeof window.addScannedItemToBox === "function") {
      window.addScannedItemToBox(decodedText);
    }
    // หน่วงเวลา 1.5 วินาที ค่อยปลดล็อกให้สแกนชิ้นต่อไปได้
    setTimeout(() => {
      window.isProcessingScan = false;
    }, 1500);
  } else {
    // 🏪 โหมด Stock In-house (Single Scan)
    await stopScanner(); // สั่งปิดกล้องทันที

    if (typeof window.qrCodeSuccessCallback === "function") {
      window.qrCodeSuccessCallback(decodedText, decodedResult);
    } else if (typeof processScanResult === "function") {
      processScanResult(decodedText);
    }

    // 🚨 ไม่ต้องปลดล็อก isProcessingScan ตรงนี้! ปล่อยให้มันล็อกค้างไว้
    // จนกว่าพนักงานจะกดปุ่ม "เปิดกล้อง" ใหม่อีกครั้ง ถึงจะยอมให้สแกนใหม่ได้
  }
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
      await startScanner();
    }, 300);
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

  // 🚨 ปลดล็อกประตู เมื่อเริ่มเปิดกล้องใหม่เท่านั้น!
  window.isProcessingScan = false;

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
      console.warn("บังคับเปิดกล้องหลังด้วยวิธีที่ 2...", camErr);
      await html5QrCode.start(
        { facingMode: { exact: "environment" } },
        config,
        globalScanSuccessCallback,
      );
    }

    window.isScannerMode = true;
  } catch (err) {
    console.error("ระบบกล้องถูกปฏิเสธ:", err);
    window.isScannerMode = false;
    forceResetUI();
    alert("ไม่สามารถเข้าถึงกล้องหลังได้ กรุณาตรวจสอบการอนุญาต (Permission)");
  } finally {
    isTransitioning = false;
  }
}
//===============

//===============
// [stopScanner] START (🚨 เพิ่มคำสั่งตัดไฟฮาร์ดแวร์โดยตรง)
async function stopScanner() {
  if (isTransitioning) return;
  isTransitioning = true;

  try {
    if (html5QrCode && window.isScannerMode) {
      try {
        await html5QrCode.stop();
      } catch (stopErr) {
        console.warn(
          "ไลบรารีหยุดกล้องไม่สมบูรณ์ กำลังใช้คำสั่งตัดฮาร์ดแวร์...",
        );
      }

      // 🚨 HARDWARE KILLER: ควานหาสตรีมกล้องที่ค้างอยู่ แล้วสั่ง "ถอดปลั๊ก" ฆ่าทิ้งทันที
      const videoElement = document.querySelector("#reader video");
      if (videoElement && videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        videoElement.srcObject = null;
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

    // ตั้งเวลาหน่วงให้สเตตัสรีเซ็ตตัวเองเสมอ ป้องกันปุ่มค้าง
    setTimeout(() => {
      isTransitioning = false;
    }, 200);
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

  // ไม่ต้องปลดล็อก isProcessingScan ตรงนี้ ปล่อยให้ startScanner เป็นคนปลด
  window.isScannerMode = false;

  if (window.currentScannerContext === "box") {
    const boxDetailsView = document.getElementById("boxDetailsView");
    if (boxDetailsView) {
      boxDetailsView.classList.remove("hide");
    }
  }
}
//===============

// ======================================================
// 🌟 ผูก Event ให้ปุ่ม UI หน้าจอ
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
