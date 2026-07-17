// ==============================================================================
// 🌟 SCANNER CORE (The Perfect Illusion - ยืดหดกรอบในด้วย CSS + สแกนไวระดับ Snap!)
// ==============================================================================

let html5QrCode;
let isTransitioning = false;
let isFlashOn = false;

window.currentScannerMode = window.currentScannerMode || "barcode";
window.currentScannerContext = window.currentScannerContext || "stock"; // ค่าเริ่มต้น

// ======================================================
// 🎯 ตัวสลับราง & ดักจับชนิดบาร์โค้ด (Software Format Lock)
// ======================================================
function globalScanSuccessCallback(decodedText, decodedResult) {
  // 1. จำลองการล็อกเป้าหมาย (ป้องกันสแกนผิดประเภทโดยไม่ต้องรีบูตกล้อง)
  if (decodedResult && decodedResult.result && decodedResult.result.format) {
    const formatName = decodedResult.result.format.formatName;
    const isQR = formatName === "QR_CODE";

    // ถ้าโหมดปัจจุบันเป็น QR แต่ดันไปสแกนโดนบาร์โค้ด ให้เมินทิ้งไปเลย
    if (window.currentScannerMode === "qr" && !isQR) return;
    // ถ้าโหมดปัจจุบันเป็น Barcode แต่ดันไปสแกนโดน QR ให้เมินทิ้งเช่นกัน
    if (window.currentScannerMode === "barcode" && isQR) return;
  }

  // 2. สั่นเตือนเมื่อสแกนสำเร็จ
  if (navigator.vibrate) navigator.vibrate(100);

  // 3. สับรางข้อมูลส่งไปถูกหน้า
  if (window.currentScannerContext === "box") {
    // 📦 โหมด Transfer Out (Box Details)
    if (typeof window.addScannedItemToBox === "function") {
      window.addScannedItemToBox(decodedText);
    }
  } else {
    // 🏪 โหมด Stock In-house
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
//===============

//===============
// 🎨 [Custom Frame Builder] สร้างและยืดหดกรอบด้านใน
//===============
function ensureCustomOverlay() {
  const reader = document.getElementById("reader");
  if (!reader) return;
  reader.style.position = "relative"; // ให้กรอบแดงนอกเป็นจุดอ้างอิง

  let overlay = document.getElementById("custom-scanner-overlay");

  // ถ้ายังไม่มีกรอบใน ให้สร้างขึ้นมาใหม่
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "custom-scanner-overlay";
    overlay.style.cssText =
      "position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;";

    const box = document.createElement("div");
    box.id = "custom-scanner-box";
    // 📍 นี่คือเวทมนตร์ CSS! สร้างพื้นที่สว่างตรงกลาง และถมดำรอบนอก
    box.style.cssText =
      "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); border: 3px solid rgba(255, 255, 255, 0.8); border-radius: 12px; box-shadow: 0 0 0 4000px rgba(0,0,0,0.55); transition: all 0.3s ease-in-out; overflow: hidden;";

    // 📍 เพิ่มเส้นสแกนสีชมพูวิ่งขึ้นลง (ลูกเล่นความสวยงาม)
    const scanLine = document.createElement("div");
    scanLine.style.cssText =
      "position: absolute; top: 0; left: 0; width: 100%; height: 3px; background: #e7a08c; box-shadow: 0 0 10px #e7a08c; animation: scanLineAnim 2s linear infinite;";

    if (!document.getElementById("scan-line-style")) {
      const style = document.createElement("style");
      style.id = "scan-line-style";
      style.innerHTML = `@keyframes scanLineAnim { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }`;
      document.head.appendChild(style);
    }

    box.appendChild(scanLine);
    overlay.appendChild(box);
    reader.appendChild(overlay);
  }

  // ปรับขนาดยืด-หดของกรอบด้านใน ตามโหมดปัจจุบัน
  const box = document.getElementById("custom-scanner-box");
  if (box) {
    if (window.currentScannerMode === "qr") {
      box.style.width = "220px";
      box.style.height = "220px";
    } else {
      box.style.width = "260px";
      box.style.height = "130px";
    }
  }
}
//===============

//===============
// [startScanner] START (เปิดกล้องเต็มจอ + AI + ปิดการวาดกรอบของไลบรารี)
async function startScanner() {
  if (isTransitioning) return;
  isTransitioning = true;

  try {
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }

    // 📍 ไม่ใส่คำสั่ง qrbox เพื่อให้กล้องอ่านเต็มจอแบบ 100% (ไวทะลุนรก)
    const config = {
      fps: 15,
      useBarCodeDetectorIfSupported: true,
    };

    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        globalScanSuccessCallback,
      );
    } catch (camErr) {
      console.warn("เกิดข้อผิดพลาด ลองบังคับเปิดกล้องหลัง...", camErr);
      await html5QrCode.start(
        { facingMode: { exact: "environment" } },
        config,
        globalScanSuccessCallback,
      );
    }

    window.isScannerMode = true;

    // 📍 วาดกรอบด้านในของเราเอง ทันทีที่กล้องเปิดเสร็จ
    ensureCustomOverlay();
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
// [stopScanner] START
async function stopScanner() {
  if (isTransitioning) return;
  isTransitioning = true;

  try {
    if (html5QrCode && window.isScannerMode) {
      try {
        await html5QrCode.stop();
      } catch (stopErr) {
        console.warn("ข้ามการหยุดฮาร์ดแวร์...");
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

  // คืนหน้าจอให้ถูกต้อง (แก้ปัญหา Box Details โผล่ทับ)
  if (window.currentScannerContext === "box") {
    const boxDetailsView = document.getElementById("boxDetailsView");
    if (boxDetailsView) {
      boxDetailsView.classList.remove("hide");
    }
  }
}
//===============

// ==============================================================================
// 🌟 UI CONTROLS (ปุ่ม Taco รุ่นสมบูรณ์แบบ - ยืดหดกรอบใน ไม่รีบูตกล้อง!)
// ==============================================================================
document.addEventListener("DOMContentLoaded", () => {
  // 🛡️ 1. ดักจับเมื่อกดเปิดกล้องจากหน้า Stock
  const btnStockScanner = document.getElementById("btnScannerOpen");
  if (btnStockScanner) {
    btnStockScanner.addEventListener("click", () => {
      window.currentScannerContext = "stock";
    });
  }

  // 🌮 2. ปุ่ม Taco (สั่งยืดหดกรอบ Custom ของเราอย่างเดียว)
  const btnToggleScanMode = document.getElementById("btnToggleScanMode");
  const scanModeIcon = document.getElementById("scanModeIcon");
  const scanModeText = document.getElementById("scanModeText");

  if (btnToggleScanMode) {
    const newBtnToggle = btnToggleScanMode.cloneNode(true);
    btnToggleScanMode.parentNode.replaceChild(newBtnToggle, btnToggleScanMode);

    newBtnToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // 1. สลับตัวแปร UI
      if (window.currentScannerMode === "qr") {
        window.currentScannerMode = "barcode";
        if (scanModeIcon) scanModeIcon.className = "fas fa-barcode";
        if (scanModeText) scanModeText.textContent = "BARCODE";
      } else {
        window.currentScannerMode = "qr";
        if (scanModeIcon) scanModeIcon.className = "fas fa-qrcode";
        if (scanModeText) scanModeText.textContent = "QR CODE";
      }

      // 2. 📍 สั่งยืดหดกรอบด้านในทันที! (ไม่มีการดับกล้อง ไม่มีการสตาร์ทใหม่ กล้องลื่นไหล 100%)
      if (window.isScannerMode) {
        ensureCustomOverlay();
      }
    });
  }

  // ⚡ 3. คืนชีพปุ่ม Flash
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
