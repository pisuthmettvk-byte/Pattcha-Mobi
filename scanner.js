// ==========================================
// 🌟 SCANNER MASTER CONFIGURATION & STATE
// ==========================================
let html5QrCode = null;
let isTransitioning = false;
let lastScanTime = 0;
let isFlashOn = false; // ตัวแปรเก็บสถานะเปิด/ปิดแฟลช

// ป้องกันการกดปุ่มกล้องรัวๆ จนฮาร์ดแวร์ค้าง
function preventDoubleTrigger() {
  const now = Date.now();
  if (now - lastScanTime < 1000) return true; // ล็อก 1 วินาที
  lastScanTime = now;
  return false;
}



//===============
// [stopScanner] START
async function stopScanner() {
  if (preventDoubleTrigger() || isTransitioning) return;
  isTransitioning = true;

  try {
    if (html5QrCode && window.isScannerMode) {
      try {
        await html5QrCode.stop();
      } catch (stopErr) {
        console.warn("ข้ามการหยุดฮาร์ดแวร์: เลนส์กล้องอาจจะยังไม่เปิดสมบูรณ์");
      }
      html5QrCode.clear();
    }
  } catch (err) {
    console.warn("Stop scanner error:", err);
  } finally {
    window.isScannerMode = false;
    isFlashOn = false; // รีเซ็ตสถานะแฟลชเมื่อปิดกล้อง

    // รีเซ็ต UI ปุ่มแฟลชให้กลับเป็นสีขาวเดิม
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
    scanView.style.zIndex = "-1"; // ซ่อนกลับไปข้างหลัง
  }
  
  window.isScannerMode = false;

  // 📍 [The Absolute Fix: ดึงหน้า Box Details กลับมา เมื่อปิดกล้อง!]
  // ถ้าเราอยู่ในโหมดสแกนลงกล่อง ให้โชว์หน้ากล่องกลับมา
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
  // 📍 [The Bulletproof Fix: ล็อกบาร์โค้ดทันที ป้องกันการสแกนเบิ้ลหรือฮาร์ดแวร์ค้าง]
  if (window.isProcessingScan || isTransitioning) return;
  window.isProcessingScan = true; // ล็อกทันทีเมื่อสแกนติด 1 ครั้ง

  const sku = decodedText ? decodedText.trim() : "";
  if (!sku) {
      window.isProcessingScan = false;
      return;
  }

  // 📦 [Context: Box Details View (โหมดลงกล่อง)]
  if (window.currentScannerContext === 'box') {
      
      // 1. ดีเลย์ 300ms ให้ฮาร์ดแวร์กล้องพักหายใจ และ Render เสร็จสมบูรณ์ (ป้องกันกล้องค้าง)
      setTimeout(async () => {
          if (window.isScannerMode) {
              if (typeof stopScanner === 'function') await stopScanner();
          }
          
          // 2. ปิดกล้องเสร็จ ค่อยโยนข้อมูลให้ transferout.js ทำงานต่อ
          if (typeof window.addScannedItemToBox === 'function') {
              window.addScannedItemToBox(sku);
          }
          
          // ปลดล็อกข้อมูล (เผื่อเรียกกล้องขึ้นมาใหม่)
          window.isProcessingScan = false; 
      }, 300);
      
  } 
  // 🏠 [Context: Stock In House (โหมดปกติ - รักษา Golden Standard)]
  else {
      // ใช้ดีเลย์ 300ms เพื่อปกป้องฮาร์ดแวร์เช่นเดียวกัน
      setTimeout(async () => {
          if (window.isScannerMode) {
              if (typeof stopScanner === 'function') await stopScanner();
          }

          const targetInput = document.getElementById("searchStockInput") || document.getElementById("searchInput");
          if (targetInput) {
            targetInput.value = sku;
            targetInput.dispatchEvent(new Event("input", { bubbles: true }));
          }
          
          window.isProcessingScan = false;
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
    // ทำให้พื้นที่ใสๆ ตรงกลางถูกดันขยายออกไปด้านข้างอัตโนมัติ โดยที่ขอบบน/ล่างยังมีความสูงเท่าเดิม!
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

// 🛠️ วิธีทดสอบ: เจเลอร์สามารถเปิด F12 (Console) แล้วพิมพ์คำสั่งนี้เพื่อทดสอบ:
// mockReceiveSignal(true, 3);  <-- รถโผล่มาพร้อมเลข 3
// mockReceiveSignal(false);    <-- รถหายไป