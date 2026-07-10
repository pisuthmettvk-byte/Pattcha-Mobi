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

// ==========================================
// 🌟 CORE SCANNER FUNCTIONS
// ==========================================
async function startScanner() {
  if (preventDoubleTrigger() || window.isScannerMode || isTransitioning) return;
  isTransitioning = true;

  // 1. เคลียร์ช่องค้นหาในหน้า Stock ให้พร้อมรับบาร์โค้ดใหม่
  const searchInput = document.getElementById("searchStockInput");
  if (searchInput) {
    searchInput.value = "";
    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
  }

  try {
    // 2. โชว์ UI กล้องและดึงเลเยอร์ขึ้นมาบนสุด
    const scanView = document.getElementById("scannerView");
    if (scanView) {
      scanView.classList.add("active");
      scanView.style.position = "fixed";
      scanView.style.zIndex = "99999";
    }

    // 3. เตรียมฮาร์ดแวร์
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    try {
      // 🟢 ด่านที่ 1: พยายามเปิดกล้องหลัง (มือถือ)
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
      );
    } catch (camErr) {
      console.warn("กล้องหลังไม่พร้อมใช้งาน สลับไปใช้เว็บแคม...", camErr);
      // 🟡 ด่านที่ 2: สลับไปกล้องหน้า (คอมพิวเตอร์/โน้ตบุ๊ก)
      await html5QrCode.start(
        { facingMode: "user" },
        config,
        qrCodeSuccessCallback,
      );
    }

    // 4. แจ้ง app.js ว่ากล้องเปิดสมบูรณ์แล้ว
    window.isScannerMode = true;
  } catch (err) {
    console.error("ระบบกล้องถูกปฏิเสธโดยสมบูรณ์:", err);
    window.isScannerMode = false;
    forceResetUI();
    alert(
      "ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบการอนุญาตสิทธิ (Permission) ของเบราว์เซอร์ครับ",
    );
  } finally {
    isTransitioning = false;
  }
}

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

function forceResetUI() {
  const scanView = document.getElementById("scannerView");
  if (scanView) {
    scanView.classList.remove("active");
    scanView.style.zIndex = "-1"; // ซ่อนกลับไปข้างหลัง
  }
  window.isScannerMode = false;
}

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

// ==========================================
// 🌟 SCAN SUCCESS CALLBACK (เมื่อสแกนติด)
// ==========================================
const qrCodeSuccessCallback = async (decodedText, decodedResult) => {
  if (window.isScannerMode) {
    await stopScanner();
  }

  // โยนตัวเลขที่สแกนได้ ส่งข้ามไฟล์ไปให้ช่องค้นหาใน app.js ทำงานต่อ
  const searchInput = document.getElementById("searchStockInput");
  if (searchInput) {
    searchInput.value = decodedText;
    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
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