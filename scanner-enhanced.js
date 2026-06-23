// ==========================================
// 🌟 ENHANCED SCANNER v2.0
// Speed: 60 FPS | Accuracy: Auto-focus + exposure
// ==========================================
let html5QrCode = null;
let isScannerRunning = false;
let isTransitioning = false;
let currentScanMode = "BARCODE";
let isFlashOn = false;
let lastExecutionTime = 0;
let lastSuccessfulScan = 0;

// 🌟 ระบบป้องกันคำสั่งเบิ้ลซ้อนกันข้ามไฟล์ (Debounce Guard)
function preventDoubleTrigger() {
  const now = Date.now();
  if (now - lastExecutionTime < 350) return true;
  lastExecutionTime = now;
  return false;
}

// ==========================================
// 1. ฟังก์ชันเปิดกล้อง (Start Scanner) - ENHANCED
// ==========================================
async function startScanner() {
  if (isScannerRunning || isTransitioning) return;
  isTransitioning = true;

  try {
    const readerContainer = document.getElementById("readerContainer");
    const stockScrollArea = document.getElementById("stockScrollArea");
    const readerElement = document.getElementById("reader");

    if (readerContainer) {
      readerContainer.style.display = "flex";
      readerContainer.style.flexDirection = "column";
      readerContainer.style.flex = "1";
      readerContainer.style.width = "100%";
      readerContainer.style.height = "100%";
      readerContainer.style.overflow = "hidden";
    }
    if (stockScrollArea) stockScrollArea.classList.add("hide");

    if (readerElement) {
      readerElement.style.width = "100%";
      readerElement.style.height = "100%";
      readerElement.style.flex = "1";
      readerElement.style.backgroundColor = "#000";
    }

    injectScannerCSS();

    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }

    // 🌟 ENHANCED: Support all barcode formats
    const allFormats = [
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,      // ✅ Added
      Html5QrcodeSupportedFormats.CODE_39,    // ✅ Added
      Html5QrcodeSupportedFormats.CODABAR,    // ✅ Added
      Html5QrcodeSupportedFormats.QR_CODE,
    ];

    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 60,  // 🌟 ENHANCED: 60 FPS for faster detection (was 30)
        qrbox: currentScanMode === "BARCODE" ? 
          { width: 280, height: 140 } :  // Wider for barcodes
          { width: 250, height: 250 },   // Square for QR
        formatsToSupport: allFormats,
        aspectRatio: 1.77,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
        videoConstraints: {
          facingMode: { exact: "environment" },
          focusMode: "continuous",
          exposureMode: "continuous",       // 🌟 ENHANCED: Auto-exposure
          exposureCompensation: 0,          // 🌟 ENHANCED: Neutral exposure
          whiteBalanceMode: "continuous",   // 🌟 ENHANCED: Auto white balance
          // torch: false,                   // Disable to avoid flash interference
        },
      },

      // 🌟 SUCCESS HANDLER with validation
      (decodedText) => {
        // Validate barcode quality before processing
        if (validateBarcode(decodedText)) {
          lastSuccessfulScan = Date.now();
          stopScanner();
          const searchInput = document.getElementById("searchStockInput");
          if (searchInput) {
            searchInput.value = decodedText;
            searchInput.dispatchEvent(new Event("input", { bubbles: true }));
          }
          showScanNotification("✓ Barcode Scanned", "#10b981"); // Green
        }
      },

      // 🌟 ERROR HANDLER - Silent to avoid noise
      (errorMessage) => {
        /* Silently continue scanning */
      },
    );

    isScannerRunning = true;
    updateScanRegionUI();
  } catch (err) {
    console.error("Camera start failed:", err);
    showScanNotification("Camera Error: " + err.message, "#ef4444"); // Red
    forceResetUI();
  } finally {
    isTransitioning = false;
  }
}

// ==========================================
// 2. ฟังก์ชันปิดกล้อง (Stop Scanner)
// ==========================================
async function stopScanner() {
  if (!isScannerRunning || isTransitioning) {
    forceResetUI();
    return;
  }
  isTransitioning = true;

  try {
    if (html5QrCode) {
      await html5QrCode.stop();
    }
  } catch (err) {
    console.warn("Forcing UI cleanup:", err);
  } finally {
    forceResetUI();
    isTransitioning = false;
  }
}

function forceResetUI() {
  isScannerRunning = false;
  isFlashOn = false;

  const readerContainer = document.getElementById("readerContainer");
  const stockScrollArea = document.getElementById("stockScrollArea");
  if (readerContainer) readerContainer.style.display = "none";
  if (stockScrollArea) stockScrollArea.classList.remove("hide");

  const btnFlash = document.getElementById("btnToggleFlash");
  if (btnFlash) {
    btnFlash.style.color = "#fff";
    btnFlash.style.borderColor = "#fff";
  }

  const customOverlay = document.getElementById("custom-scan-border");
  if (customOverlay) customOverlay.style.display = "none";
}

// ==========================================
// 3. 🌟 VALIDATION: Check barcode quality
// ==========================================
function validateBarcode(text) {
  if (!text) return false;
  
  // 🌟 ENHANCED: Validate barcode format
  const cleanText = text.trim();
  
  // Minimum length check
  if (cleanText.length < 6) return false;
  
  // Reject obviously invalid patterns
  if (/^0+$/.test(cleanText)) return false; // All zeros
  if (cleanText.length > 50) return false;  // Suspiciously long
  
  return true;
}

// ==========================================
// 4. 🌟 NOTIFICATION: Visual feedback
// ==========================================
function showScanNotification(message, color) {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${color};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: bold;
    font-size: 14px;
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
  `;
  notification.innerText = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// ==========================================
// 5. ควบคุมสากล (Global Controls)
// ==========================================
function toggleScanner() {
  if (preventDoubleTrigger()) return;
  if (isScannerRunning) {
    stopScanner();
  } else {
    startScanner();
  }
}

async function toggleFlash() {
  if (preventDoubleTrigger()) return;
  if (!isScannerRunning || !html5QrCode) return;

  try {
    const videoElement = document.querySelector("#reader video");
    if (videoElement && videoElement.srcObject) {
      const videoTrack = videoElement.srcObject.getVideoTracks()[0];
      if (videoTrack) {
        isFlashOn = !isFlashOn;
        await videoTrack.applyConstraints({ 
          advanced: [{ torch: isFlashOn }] 
        });

        const btnFlash = document.getElementById("btnToggleFlash");
        if (btnFlash) {
          btnFlash.style.color = isFlashOn ? "#fab919" : "#fff";
          btnFlash.style.borderColor = isFlashOn ? "#fab919" : "#fff";
        }
        showScanNotification(
          isFlashOn ? "📷 Flash ON" : "📷 Flash OFF", 
          "#fab919"
        );
      }
    }
  } catch (err) {
    console.warn("Flash toggle failed:", err);
    try {
      isFlashOn = !isFlashOn;
      await html5QrCode.applyVideoConstraints({ torch: isFlashOn });
    } catch (e) {
      isFlashOn = false;
    }
  }
}

function toggleScanMode() {
  if (preventDoubleTrigger()) return;

  currentScanMode = currentScanMode === "BARCODE" ? "QR" : "BARCODE";

  const textEl = document.getElementById("scanModeText");
  const iconEl = document.getElementById("scanModeIcon");
  if (textEl) textEl.innerText = currentScanMode;
  if (iconEl)
    iconEl.className =
      currentScanMode === "BARCODE" ? "fas fa-barcode" : "fas fa-qrcode";

  showScanNotification(
    `Switched to ${currentScanMode} Mode`,
    currentScanMode === "BARCODE" ? "#db8591" : "#e7a08c"
  );

  if (isScannerRunning) {
    updateScanRegionUI();
  }
}

// 🌟 ฟังก์ชันจัดการกรอบสีขาวจำลอง
function updateScanRegionUI() {
  const reader = document.getElementById("reader");
  if (!reader) return;

  let customOverlay = document.getElementById("custom-scan-border");
  if (!customOverlay) {
    reader.style.position = "relative";
    customOverlay = document.createElement("div");
    customOverlay.id = "custom-scan-border";
    customOverlay.style.position = "absolute";
    customOverlay.style.top = "50%";
    customOverlay.style.left = "50%";
    customOverlay.style.transform = "translate(-50%, -50%)";
    customOverlay.style.border = "3px solid #fff";
    customOverlay.style.borderRadius = "12px";
    customOverlay.style.boxShadow = "0 0 0 5000px rgba(0, 0, 0, 0.5)";
    customOverlay.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    customOverlay.style.pointerEvents = "none";
    customOverlay.style.zIndex = "99";
    reader.appendChild(customOverlay);
  }

  customOverlay.style.display = "block";
  if (currentScanMode === "BARCODE") {
    customOverlay.style.width = "85%";
    customOverlay.style.height = "130px"; // Optimized for barcodes
  } else {
    customOverlay.style.width = "230px";
    customOverlay.style.height = "230px"; // Square for QR codes
  }
}

function injectScannerCSS() {
  if (document.getElementById("scanner-core-css")) return;
  const style = document.createElement("style");
  style.id = "scanner-core-css";
  style.innerHTML = `
    #reader__scan_region { display:none !important; }
    #reader__dashboard { display:none !important; }
    #reader video { width: 100% !important; height: 100% !important; object-fit: cover !important; }
    
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// ==========================================
// 6. ผูกการทำงานระบบ (Event Listeners)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const btnOpen = document.getElementById("btnScannerOpen");
  if (btnOpen && !btnOpen.getAttribute("onclick")) {
    btnOpen.addEventListener("click", toggleScanner);
  }

  const btnMode = document.getElementById("btnToggleScanMode");
  if (btnMode && !btnMode.getAttribute("onclick")) {
    btnMode.addEventListener("click", toggleScanMode);
  }

  const btnFlash = document.getElementById("btnToggleFlash");
  if (btnFlash && !btnFlash.getAttribute("onclick")) {
    btnFlash.addEventListener("click", toggleFlash);
  }

  document.getElementById("btnMenuQuickScan")?.addEventListener("click", () => {
    setTimeout(() => {
      startScanner();
    }, 350);
  });

  document.getElementById("btnStockBack")?.addEventListener("click", () => {
    stopScanner();
  });
});
