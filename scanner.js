// ==============================================================================
// 🌟 SCANNER CORE (ฉบับกู้คืนความเสถียร 100% + ระบบสลับโหมด QR/Barcode)
// ==============================================================================

let html5QrCode;
let isTransitioning = false;
let isFlashOn = false;

// ตัวแปรเก็บว่าตอนนี้เปิดกล้องจากที่ไหน (ค่าเริ่มต้นคือ stock)
window.currentScannerContext = window.currentScannerContext || "stock";

// ตัวแปรเก็บสถานะโหมดสแกนเนอร์ (QR หรือ Barcode)
window.currentScannerMode = window.currentScannerMode || "barcode";

// ======================================================
// ⚙️ ตัวสร้าง Config แบบปลอดภัย (ไม่ใช้ OS Native ที่ทำให้แอปพัง)
// ======================================================
function getSafeScannerConfig() {
  const isQRMode = window.currentScannerMode === "qr";

  return {
    fps: 10, // 📍 กลับมาใช้ FPS ที่ 10 ตามต้นฉบับ เพื่อความเสถียร
    qrbox: function (viewfinderWidth, viewfinderHeight) {
      let minEdgePercentage = 0.7;
      let minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
      let qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
      if (qrboxSize > 250) qrboxSize = 250;
      return { width: qrboxSize, height: qrboxSize };
    },
    // 📍 ล็อกเป้าหมายการอ่านตามโหมด โดยไม่ใช้ useBarCodeDetectorIfSupported
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
// 🎛️ ฟังก์ชันสำหรับสลับโหมดกล้อง (QR / Barcode)
// ======================================================
window.switchScannerFormat = async function (mode) {
  if (window.currentScannerMode === mode) return;
  window.currentScannerMode = mode;
  console.log(`[SCANNER] สลับเป็นโหมด: ${mode}`);

  if (window.isScannerMode) {
    await stopScanner();
    await startScanner();
  }
};

// ======================================================
// 🎯 ตัวสลับราง: ส่งผลลัพธ์ไปให้ถูกหน้าอย่างแม่นยำ
// ======================================================
function globalScanSuccessCallback(decodedText, decodedResult) {
  // สั่นเตือนเบาๆ เมื่อสแกนติด (ถ้ามือถือรองรับ)
  if (navigator.vibrate) navigator.vibrate(100);

  if (window.currentScannerContext === "box") {
    // 📦 โหมด Transfer Out (Box Details): ส่งรหัสเข้ากล่อง
    if (typeof window.addScannedItemToBox === "function") {
      window.addScannedItemToBox(decodedText);
    }
  } else {
    // 🏪 โหมด Stock In-house: กลับไปใช้ระบบค้นหาเดิม 100%
    if (typeof window.qrCodeSuccessCallback === "function") {
      window.qrCodeSuccessCallback(decodedText, decodedResult);
    } else if (typeof processScanResult === "function") {
      processScanResult(decodedText);
    }
  }
}

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
// [toggleScanner] END
//===============

//===============
// [startScanner] START (เครื่องยนต์ดั้งเดิม + Config สลับโหมด)
async function startScanner() {
  if (isTransitioning) return;
  isTransitioning = true;

  try {
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }

    // 📍 ดึงการตั้งค่าแบบปลอดภัยมาใช้ (ปรับขนาดกรอบ + ล็อกชนิดบาร์โค้ด)
    const config = getSafeScannerConfig();

    try {
      // 📍 บังคับกล้องหลัง
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        globalScanSuccessCallback, // 👈 ส่งค่าผ่านตัวสลับราง
      );
    } catch (camErr) {
      console.warn(
        "เกิดข้อผิดพลาด ลองบังคับเปิดกล้องหลังด้วยวิธีที่ 2...",
        camErr,
      );
      // 📍 แผนสำรองแบบดั้งเดิม
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
// [startScanner] END
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
// [stopScanner] END
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

  // คืนหน้าจอให้ถูกโหมด
  if (window.currentScannerContext === "box") {
    const boxDetailsView = document.getElementById("boxDetailsView");
    if (boxDetailsView) {
      boxDetailsView.classList.remove("hide");
    }
  }
}
// [forceResetUI] END
//===============

// ==============================================================================
// 🌟 CROSS-FILE BRIDGE & UI CONTROLS (ปุ่มควบคุมกล้องแบบดั้งเดิม 100%)
// ==============================================================================
document.addEventListener("DOMContentLoaded", () => {
  // 1. ปุ่มกากบาท ปิดกล้อง
  const btnCloseScanner = document.getElementById("btnCloseScanner");
  if (btnCloseScanner) {
    btnCloseScanner.addEventListener("click", async (e) => {
      e.preventDefault();
      await stopScanner();
    });
  }

  // 2. ปุ่มเปิด-ปิดไฟแฟลช
  const btnToggleFlash = document.getElementById("btnToggleFlash");
  if (btnToggleFlash) {
    btnToggleFlash.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!html5QrCode || !window.isScannerMode) return;

      try {
        isFlashOn = !isFlashOn;
        await html5QrCode.applyVideoConstraints({
          advanced: [{ torch: isFlashOn }],
        });

        if (isFlashOn) {
          btnToggleFlash.style.color = "#ffeb3b";
          btnToggleFlash.style.borderColor = "#ffeb3b";
        } else {
          btnToggleFlash.style.color = "#fff";
          btnToggleFlash.style.borderColor = "#fff";
        }
      } catch (err) {
        console.warn("Flash not supported:", err);
        isFlashOn = false;
        alert("อุปกรณ์ของคุณไม่รองรับการเปิดไฟแฟลชในเบราว์เซอร์ครับ");
      }
    });
  }
});
