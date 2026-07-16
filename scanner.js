// ======================================================
// 🚀 Scanner V.2.0 (OS Native + Format Lock + Smart Router)
// ======================================================

// 📍 [แก้ไขด่วน]: ประกาศตัวแปรหลักที่ระบบกล้องต้องใช้ เพื่อป้องกัน Error "is not defined"
let html5QrCode;
let isTransitioning = false;
let isFlashOn = false;

// 📍 ตัวแปรเก็บสถานะโหมดกล้อง (ค่าเริ่มต้นคือ barcode)
window.currentScannerMode = window.currentScannerMode || "barcode";

// 📍 ตัวแปรเก็บว่าตอนนี้เปิดกล้องจากที่ไหน (ค่าเริ่มต้นคือ stock)
window.currentScannerContext = window.currentScannerContext || "stock";

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
    useBarCodeDetectorIfSupported: true, // 🌟 เปิดใช้ AI ถอดรหัสของตัวเครื่อง (OS Native)
    formatsToSupport: isQRMode
      ? [Html5QrcodeSupportedFormats.QR_CODE] // 🌟 โหมด QR: อ่านเฉพาะ QR
      : [
          // 🌟 โหมด Barcode: อ่านเฉพาะบาร์โค้ด
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
        ],
  };
}

// ======================================================
// 🎯 ตัวสลับราง (Smart Router): ส่งผลลัพธ์การสแกนไปให้ถูกหน้า
// ======================================================
function globalScanSuccessCallback(decodedText, decodedResult) {
  console.log(
    `[SCANNER] สแกนสำเร็จ: ${decodedText} | จากหน้า: ${window.currentScannerContext}`,
  );

  if (window.currentScannerContext === "box") {
    // 📦 ถ้าเปิดกล้องจากหน้า Box Details (Transfer Out) -> ส่งไปเข้ากล่อง
    if (typeof window.addScannedItemToBox === "function") {
      window.addScannedItemToBox(decodedText);
    } else {
      console.error("ไม่พบฟังก์ชัน addScannedItemToBox สำหรับหน้า Box Details");
    }
  } else {
    // 🏪 ถ้าเปิดกล้องจากหน้า Stock In-house (หรือหน้าอื่นๆ) -> ใช้การค้นหาแบบเดิม
    if (typeof window.onScanSuccess === "function") {
      window.onScanSuccess(decodedText, decodedResult);
    } else if (typeof processScanResult === "function") {
      processScanResult(decodedText);
    } else {
      console.warn("ไม่พบฟังก์ชันรับค่าสแกนสำหรับโหมด Stock (onScanSuccess)");
    }
  }
}

// ======================================================
// 🎛️ ฟังก์ชันสำหรับให้ปุ่ม UI เรียกใช้เพื่อสลับโหมด (QR / Barcode)
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

//===============
// [toggleScanner] START (ฟังก์ชันหลักที่ใช้เปิด/ปิดกล้อง)
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
// [startScanner] START (ฉบับเปลี่ยนมารับค่าผ่านตัวสลับราง 100%)
async function startScanner() {
  if (isTransitioning) return;
  isTransitioning = true;

  try {
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }

    const config = getOptimizedScannerConfig();

    try {
      // 📍 บังคับกล้องหลัง และเรียกใช้ Router (globalScanSuccessCallback)
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        globalScanSuccessCallback, // 👈 จุดสำคัญ: เปลี่ยนมาใช้ Router
      );
    } catch (camErr) {
      console.warn(
        "เกิดข้อผิดพลาด ลองบังคับเปิดกล้องหลังด้วยวิธีที่ 2...",
        camErr,
      );
      // 📍 แผนสำรอง
      await html5QrCode.start(
        { facingMode: { exact: "environment" } },
        config,
        globalScanSuccessCallback, // 👈 เปลี่ยนมาใช้ Router
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
  window.isProcessingScan = false; // ปลดล็อกบาร์โค้ดเสมอเมื่อ UI รีเซ็ต

  // ดึงหน้า Box Details กลับมา
  if (window.currentScannerContext === "box") {
    const boxDetailsView = document.getElementById("boxDetailsView");
    if (boxDetailsView) {
      boxDetailsView.classList.remove("hide");
    }
  }
}
// [forceResetUI] END
//===============
