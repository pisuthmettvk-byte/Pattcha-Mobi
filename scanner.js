// ==========================================
// 🌟 SCANNER MASTER CONFIGURATION & STATE
// ==========================================
let html5QrCode = null;
let isTransitioning = false;
let lastScanTime = 0;
let isFlashOn = false; // ตัวแปรเก็บสถานะเปิด/ปิดแฟลช

// ป้องกันการกดปุ่มกล้องรัวๆ จนฮาร์ดแวร์ค้าง (ย้ายไปขวางตอนสแกนติดเท่านั้น)
function preventDoubleTrigger() {
  const now = Date.now();
  if (now - lastScanTime < 1000) return true; // ล็อก 1 วินาที
  lastScanTime = now;
  return false;
}

// ==========================================
// 🌟 CORE SCANNER FUNCTIONS
// ==========================================

//===============
// [startScanner] START
async function startScanner() {
  if (isTransitioning || window.isScannerMode) return; 
  isTransitioning = true;
  window.isProcessingScan = false; // 📍 ประกาศตัวล็อกแต่เนิ่นๆ ป้องกัน Undefined

  const searchInput = document.getElementById("searchStockInput") || document.getElementById("searchInput");
  if (searchInput) {
    searchInput.value = "";
    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
  }

  try {
    const scanView = document.getElementById("scannerView");
    if (scanView) {
      scanView.classList.add("active");
      scanView.style.position = "fixed";
      scanView.style.zIndex = "99999";
    }

    // 🛠️ ล้าง Memory กล้องเก่าทิ้งทุกครั้งก่อนเปิดใหม่ ป้องกันอาการจอขาว/ค้าง 100%
    if (html5QrCode) {
        try { await html5QrCode.stop(); } catch(e){}
        html5QrCode.clear();
        html5QrCode = null;
    }
    
    // 🚀 [TECH 1: LIMIT FORMATS] จำกัดประเภทบาร์โค้ด
    const formatsToSupport = [
      Html5QrcodeSupportedFormats.QR_CODE,
      Html5QrcodeSupportedFormats.EAN_13,   // บาร์โค้ดสินค้าสากล
      Html5QrcodeSupportedFormats.CODE_128, // บาร์โค้ดรหัสยาว/ซีเรียล
      Html5QrcodeSupportedFormats.CODE_39
    ];
    html5QrCode = new Html5Qrcode("reader", { formatsToSupport: formatsToSupport });

    // 🚀 [TECH 2: FORCE HD & FOCUS] ย้ายตั้งค่า HD มาไว้ใน config ให้ถูกกฎ Library
    const config = { 
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      videoConstraints: {
        width: { min: 1280, ideal: 1280 },
        height: { min: 720, ideal: 720 },
        advanced: [{ focusMode: "continuous" }]
      }
    };

    try {
      // 📍 แผน A: พยายามเปิดกล้องหลัง + บังคับ HD + โฟกัสต่อเนื่อง
      await html5QrCode.start(
        { facingMode: "environment" }, // บังคับกล้องหลัง
        config,
        qrCodeSuccessCallback
      );
    } catch (camErr) {
      console.warn("กล้อง HD มีปัญหา สลับไปใช้กล้องหลังแบบมาตรฐาน...", camErr);
      // 📍 แผน B (Fallback): หากเครื่องไม่รองรับ HD ให้เปิดกล้องหลังแบบธรรมดา (ห้ามเปิดกล้องหน้า)
      await html5QrCode.start(
        { facingMode: "environment" }, // บังคับกล้องหลังเหมือนเดิม!
        { fps: 10, qrbox: { width: 250, height: 250 } }, // ถอดคำสั่งวิดีโอ HD ออก
        qrCodeSuccessCallback
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
  // 🚨 แก้บั๊กจอขาว: ถอด preventDoubleTrigger ออกจากตรงนี้
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
  if (window.currentScannerContext === 'box') {
      const boxDetailsView = document.getElementById("boxDetailsView");
      if (boxDetailsView) {
          boxDetailsView.classList.remove("hide");
      }
  }
}
// [forceResetUI] END
//===============


// ==========================================
// [Scanner Callback / Data Routing]
// ==========================================

//===============
// [qrCodeSuccessCallback] START
const qrCodeSuccessCallback = async (decodedText, decodedResult) => {
  // 📍 [The Shield: ป้องกันสแกนเบิ้ลและป้องกันจอค้าง]
  if (window.isProcessingScan || preventDoubleTrigger()) return;
  window.isProcessingScan = true; 

  const sku = decodedText ? decodedText.trim() : "";
  if (!sku) {
      window.isProcessingScan = false;
      return;
  }

  // 📦 [Context: Box Details View (โหมดลงกล่อง)]
  if (window.currentScannerContext === 'box') {
      setTimeout(async () => {
          // โยนบาร์โค้ดไปก่อนเลย ให้ UI รับรู้ทันที
          if (typeof window.addScannedItemToBox === 'function') {
              window.addScannedItemToBox(sku);
          }
          
          // แล้วค่อยปิดกล้องตามไปติดๆ
          if (window.isScannerMode) {
              if (typeof stopScanner === 'function') await stopScanner();
          }
      }, 300);
      
  } 
  // 🏠 [Context: Stock In House (โหมดปกติ)]
  else {
      setTimeout(async () => {
          if (window.isScannerMode) {
              if (typeof stopScanner === 'function') await stopScanner();
          }

          const targetInput = document.getElementById("searchStockInput") || document.getElementById("searchInput");
          if (targetInput) {
            targetInput.value = sku;
            targetInput.dispatchEvent(new Event("input", { bubbles: true }));
          }
      }, 300);
  }
};
// [qrCodeSuccessCallback] END
//===============







// ==========================================
// 🌟 CROSS-FILE BRIDGE & UI CONTROLS (ปุ่มควบคุมกล้อง)
// ==========================================
window.toggleScanner = async function () {
  if (isTransitioning) return;
  if (window.isScannerMode) {
    await stopScanner();
  } else {
    await startScanner();
  }
};

// 🌟 เพิ่มระบบเปิด-ปิดไฟแฟลชมือถือ (Torch)
window.toggleFlash = async function () {
  if (!html5QrCode || !window.isScannerMode) return;
  try {
    isFlashOn = !isFlashOn;
    // สั่งเปิดแฟลชผ่าน API กล้อง
    await html5QrCode.applyVideoConstraints({
      advanced: [{ torch: isFlashOn }],
    });

    // เปลี่ยนสีปุ่มแฟลชให้เป็นสีเหลืองทองเมื่อทำงาน
    const flashBtn = document.getElementById("btnToggleFlash");
    if (flashBtn) {
      flashBtn.style.color = isFlashOn ? "#fab919" : "#fff";
      flashBtn.style.borderColor = isFlashOn ? "#fab919" : "#fff";
    }
  } catch (err) {
    console.warn("อุปกรณ์นี้ไม่รองรับระบบเปิดแฟลชผ่านเบราว์เซอร์:", err);
    isFlashOn = false;
    alert("ฮาร์ดแวร์หรือเบราว์เซอร์ของอุปกรณ์นี้ ไม่รองรับการสั่งเปิดแฟลชครับ");
  }
};

window.toggleScanMode = function() {
  const modeText = document.getElementById("scanModeText");
  const modeIcon = document.getElementById("scanModeIcon");
  const shadedRegion = document.getElementById("qr-shaded-region");
  
  if (!modeText || !modeIcon || !shadedRegion) return;

  // 1. จำค่าความหนา "ขอบซ้าย/ขวา" ดั้งเดิมที่ Library คำนวณให้พอดีกับจอไว้
  if (!window.originalSideBorder) {
    window.originalSideBorder = shadedRegion.style.borderLeftWidth; 
  }

  if (modeText.innerText === "BARCODE") {
    // 🔙 สลับกลับเป็น QR CODE (จัตุรัส)
    modeText.innerText = "QR CODE";
    modeIcon.className = "fas fa-qrcode";
    
    // คืนค่าขอบซ้าย/ขวา ให้กลับไปเป็นค่าที่ Library คำนวณไว้แต่แรก
    shadedRegion.style.borderLeftWidth = window.originalSideBorder;
    shadedRegion.style.borderRightWidth = window.originalSideBorder;
  } else {
    // ↔️ สลับไปเป็น BARCODE (ผืนผ้า)
    modeText.innerText = "BARCODE";
    modeIcon.className = "fas fa-barcode";
    
    // ลดขอบเงาด้านซ้าย/ขวาลงเหลือแค่ 25px (เป็นระยะขอบปลอดภัย) 
    shadedRegion.style.borderLeftWidth = "25px";
    shadedRegion.style.borderRightWidth = "25px";
  }
};

function mockReceiveSignal(hasPendingDelivery, qty = 0) {
  const badge = document.getElementById("badgeInbound");
  const countDisplay = badge.querySelector(".badge-count");

  if (hasPendingDelivery) {
    badge.classList.remove("hide"); // 🌟 ใช้คำว่า hide
    countDisplay.innerText = qty; 
  } else {
    badge.classList.add("hide"); // 🌟 ใช้คำว่า hide
  }
}
