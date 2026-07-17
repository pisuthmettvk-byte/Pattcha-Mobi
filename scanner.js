// ==============================================================================
// 🌟 SCANNER CORE (Classic Edition - เสถียร 100% + หด/ขยายกรอบด้วย CSS)
// ==============================================================================

let html5QrCode;
let isTransitioning = false;
let isFlashOn = false;

window.currentScannerMode = window.currentScannerMode || "barcode";
window.currentScannerContext = window.currentScannerContext || "stock"; // ค่าเริ่มต้น

// ======================================================
// 🎯 ตัวสลับราง (ส่งข้อมูลให้ถูกหน้า)
// ======================================================
function globalScanSuccessCallback(decodedText, decodedResult) {
  if (navigator.vibrate) navigator.vibrate(100);

  if (window.currentScannerContext === "box") {
    if (typeof window.addScannedItemToBox === "function") {
      window.addScannedItemToBox(decodedText);
    }
  } else {
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
// [startScanner] START
async function startScanner() {
  if (isTransitioning) return;
  isTransitioning = true;

  try {
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    // 📍 รีเซ็ตขนาดกรอบให้ตรงกับโหมดปัจจุบันก่อนเปิดกล้อง
    const readerContainer = document.getElementById("reader");
    if (readerContainer) {
      readerContainer.style.transition = "all 0.3s ease";
      if (window.currentScannerMode === "barcode") {
        readerContainer.style.height = "150px";
        readerContainer.style.minHeight = "150px";
      } else {
        readerContainer.style.height = "300px";
        readerContainer.style.minHeight = "300px";
      }
    }

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

  // คืนหน้าจอให้ถูกโหมด
  if (window.currentScannerContext === "box") {
    const boxDetailsView = document.getElementById("boxDetailsView");
    if (boxDetailsView) {
      boxDetailsView.classList.remove("hide");
    }
  }
}
//===============

// ==============================================================================
// 🌟 UI CONTROLS (ปุ่ม Taco หด-ขยายกรอบของแทร่!)
// ==============================================================================
document.addEventListener("DOMContentLoaded", () => {
  // 🛡️ 1. ดักหน้า Stock
  const btnStockScanner = document.getElementById("btnScannerOpen");
  if (btnStockScanner) {
    btnStockScanner.addEventListener("click", () => {
      window.currentScannerContext = "stock";
    });
  }

  // 🌮 2. ปุ่ม Taco (หด/ขยายกรอบด้วย CSS ล้วนๆ ไม่แตะการทำงานของฮาร์ดแวร์กล้อง)
  const btnToggleScanMode = document.getElementById("btnToggleScanMode");
  const scanModeIcon = document.getElementById("scanModeIcon");
  const scanModeText = document.getElementById("scanModeText");
  const readerContainer = document.getElementById("reader");

  if (btnToggleScanMode) {
    const newBtnToggle = btnToggleScanMode.cloneNode(true);
    btnToggleScanMode.parentNode.replaceChild(newBtnToggle, btnToggleScanMode);

    newBtnToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (window.currentScannerMode === "qr") {
        // สลับไปโหมด Barcode
        window.currentScannerMode = "barcode";
        if (scanModeIcon) scanModeIcon.className = "fas fa-barcode";
        if (scanModeText) scanModeText.textContent = "BARCODE";

        // 📍 หดกรอบเป็นสี่เหลี่ยมผืนผ้า (Visual Effect แบบเก่าที่เพอร์เฟกต์)
        if (readerContainer) {
          readerContainer.style.transition = "all 0.3s ease";
          readerContainer.style.height = "150px";
          readerContainer.style.minHeight = "150px";
        }
      } else {
        // สลับไปโหมด QR
        window.currentScannerMode = "qr";
        if (scanModeIcon) scanModeIcon.className = "fas fa-qrcode";
        if (scanModeText) scanModeText.textContent = "QR CODE";

        // 📍 ขยายกรอบเป็นจัตุรัส
        if (readerContainer) {
          readerContainer.style.transition = "all 0.3s ease";
          readerContainer.style.height = "300px";
          readerContainer.style.minHeight = "300px";
        }
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
