// ======================================================
// 🚀 Scanner Performance Optimization (OS Native + Format Lock)
// ======================================================

let html5QrCode;
let isTransitioning = false;
let isFlashOn = false;

window.currentScannerMode = window.currentScannerMode || "barcode";
window.currentScannerContext = window.currentScannerContext || "stock"; // 📍 ล็อกค่าเริ่มต้นเป็น stock ให้ปลอดภัยที่สุด

// ======================================================
// 🛡️ [THE BULLETPROOF CONTEXT LOCK] - ป้องกัน Box Details หลอกหลอน
// ======================================================
// 📍 คำสั่งนี้จะดักจับทันทีที่นิ้วแตะปุ่มกล้อง เพื่อบอกระบบว่าตอนนี้กำลังสแกนให้หน้าไหน
document.addEventListener(
  "click",
  (e) => {
    if (
      e.target.closest("#btnScannerOpen") ||
      e.target.closest("#btnMenuQuickScan")
    ) {
      window.currentScannerContext = "stock"; // 🏪 ถ้ากดจากหน้าสต็อก ให้จำว่าคือสต็อก
    } else if (e.target.closest("#btnBoxScanner")) {
      window.currentScannerContext = "box"; // 📦 ถ้ากดจากหน้าแพ็กของ ให้จำว่าคือกล่อง
    }
  },
  true,
);



// ======================================================
// 🎯 [GLOBAL ROUTER] - ตัวสับรางข้อมูล (THE PERFECT SINGLE SCAN FIX)
// ======================================================
async function globalScanSuccessCallback(decodedText, decodedResult) {
  if (window.isProcessingScan) return;
  
  // 1. กรองประเภทบาร์โค้ด (ป้องกันสแกนผิดประเภท)
  if (decodedResult && decodedResult.result && decodedResult.result.format) {
    const formatName = decodedResult.result.format.formatName;
    const isQR = (formatName === "QR_CODE");
    if (window.currentScannerMode === "qr" && !isQR) return; 
    if (window.currentScannerMode === "barcode" && isQR) return;
  }

  window.isProcessingScan = true;
  if (navigator.vibrate) navigator.vibrate(100);

  // 🔴 ลำดับที่ 1: สั่ง "ปิดกล้องทันที" 100% ไม่ว่าจะอยู่หน้าไหน!
  // (เคลียร์ปัญหา ผีกล้องซ่อนอยู่หลังหน้า Box Detail)
  await stopScanner(); 

  // 🟢 ลำดับที่ 2: สับรางส่งข้อมูลให้ถูกต้องตามหน้า
  if (window.currentScannerContext === "box") {
    
    // 📦 โหมด Box Detail
    if (typeof window.addScannedItemToBox === "function") {
      window.addScannedItemToBox(decodedText);
    }
    
  } else {
    
    // 🏪 โหมด Stock In-house (คืนชีพโค้ดคลาสสิกดั้งเดิม 100%)
    const searchInput = document.getElementById("searchStockInput");
    if (searchInput) {
      searchInput.value = decodedText; // ยัดตัวเลขลงช่องค้นหา
      // จำลองการพิมพ์เพื่อให้ระบบหน้า Stock ค้นหาข้อมูลอัตโนมัติ
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    } else if (typeof window.qrCodeSuccessCallback === "function") {
      window.qrCodeSuccessCallback(decodedText, decodedResult);
    } else if (typeof processScanResult === "function") {
      processScanResult(decodedText);
    }
    
  }
  
  // ปลดล็อกให้พร้อมกดปุ่มสแกนรอบใหม่
  setTimeout(() => { window.isProcessingScan = false; }, 500);
}




// ======================================================
// ⚙️ ตั้งค่าความแม่นยำกล้อง
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
// 🎛️ ปุ่มสลับโหมด Taco
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
// [toggleScanner & startScanner & stopScanner & forceResetUI]
//===============
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

async function startScanner() {
  if (isTransitioning) return;
  isTransitioning = true;
  try {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    const config = getOptimizedScannerConfig();
    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        globalScanSuccessCallback,
      );
    } catch (camErr) {
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
    alert("ไม่สามารถเข้าถึงกล้องหลังได้ กรุณาตรวจสอบการอนุญาต");
  } finally {
    isTransitioning = false;
  }
}

async function stopScanner() {
  if (isTransitioning) return;
  isTransitioning = true;
  try {
    if (html5QrCode && window.isScannerMode) {
      try {
        await html5QrCode.stop();
      } catch (stopErr) {}

      // 🚨 HARDWARE KILLER: ปิดไฟกล้อง 100% ดับเครื่องชน
      const videoElement = document.querySelector("#reader video");
      if (videoElement && videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        videoElement.srcObject = null;
      }
      html5QrCode.clear();
    }
  } catch (err) {
  } finally {
    window.isScannerMode = false;
    isFlashOn = false;
    const flashBtn = document.getElementById("btnToggleFlash");
    if (flashBtn) {
      flashBtn.style.color = "#fff";
      flashBtn.style.borderColor = "#fff";
    }
    forceResetUI();
    setTimeout(() => {
      isTransitioning = false;
    }, 200);
  }
}

function forceResetUI() {
  const scanView = document.getElementById("scannerView");
  if (scanView) {
    scanView.classList.remove("active");
    scanView.style.zIndex = "-1";
  }
  window.isScannerMode = false;
  window.isProcessingScan = false;

  // 📍 [ล็อกป้องกันการเด้ง]: จะโชว์หน้า Box Details กลับมาเฉพาะเมื่อกดกล้องจากหน้า Box เท่านั้น!
  if (window.currentScannerContext === "box") {
    const boxDetailsView = document.getElementById("boxDetailsView");
    if (boxDetailsView) {
      boxDetailsView.classList.remove("hide");
    }
  }
}




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
        isFlashOn = false;
        alert("อุปกรณ์ของคุณไม่รองรับไฟแฟลชครับ");
      }
    });
  }
});
