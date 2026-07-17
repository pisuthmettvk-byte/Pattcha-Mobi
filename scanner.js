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

//===============
// [startScanner] START
async function startScanner() {
  if (preventDoubleTrigger() || window.isScannerMode || isTransitioning) return;
  isTransitioning = true;
  window.isProcessingScan = false; // 📍 ประกาศตัวล็อกแต่เนิ่นๆ ป้องกัน Undefined

  const searchInput = document.getElementById("searchStockInput");
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

    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }

    // FPS 10 เสถียรสุด ไม่ทำเครื่องค้าง
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
      );
    } catch (camErr) {
      console.warn("กล้องหลังไม่พร้อมใช้งาน สลับไปใช้เว็บแคม...", camErr);
      await html5QrCode.start(
        { facingMode: "user" },
        config,
        qrCodeSuccessCallback,
      );
    }

    window.isScannerMode = true;
  } catch (err) {
    console.error("ระบบกล้องถูกปฏิเสธ:", err);
    window.isScannerMode = false;
    forceResetUI();
    alert("ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบการอนุญาต (Permission)");
  } finally {
    isTransitioning = false;
  }
}
// [startScanner] END
//===============

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

// ==========================================
// [Scanner Callback / Data Routing]
// ==========================================

//===============
// [qrCodeSuccessCallback] START
const qrCodeSuccessCallback = async (decodedText, decodedResult) => {
  // 📍 [The Shield: ป้องกันสแกนเบิ้ลและป้องกันจอค้าง]
  if (window.isProcessingScan) return;
  window.isProcessingScan = true;

  const sku = decodedText ? decodedText.trim() : "";
  if (!sku) {
    window.isProcessingScan = false;
    return;
  }

  // 📦 [Context: Box Details View (โหมดลงกล่อง)]
  if (window.currentScannerContext === "box") {
    setTimeout(async () => {
      // โยนบาร์โค้ดไปก่อนเลย ให้ UI รับรู้ทันที (แก้ปัญหาจอล่องหน/จอขาว)
      if (typeof window.addScannedItemToBox === "function") {
        window.addScannedItemToBox(sku);
      }

      // แล้วค่อยปิดกล้องตามไปติดๆ
      if (window.isScannerMode) {
        if (typeof stopScanner === "function") await stopScanner();
      }
    }, 300);
  }
  // 🏠 [Context: Stock In House (โหมดปกติ)]
  else {
    setTimeout(async () => {
      if (window.isScannerMode) {
        if (typeof stopScanner === "function") await stopScanner();
      }

      const targetInput =
        document.getElementById("searchStockInput") ||
        document.getElementById("searchInput");
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

window.toggleScanMode = function () {
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
