// ==========================================
// 🌟 SCANNER MASTER CONFIGURATION & STATE
// ==========================================
let html5QrCode = null;
let isScannerRunning = false;
let isTransitioning = false;
let currentScanMode = "BARCODE";
let isFlashOn = false;
let lastExecutionTime = 0;

// 🌟 ระบบป้องกันคำสั่งเบิ้ลซ้อนกันข้ามไฟล์ (Debounce Guard สำหรับ onclick + addEventListener)
function preventDoubleTrigger() {
  const now = Date.now();
  if (now - lastExecutionTime < 350) return true; // หากกดซ้อนกันใน 350ms ให้บล็อกคำสั่งที่สองทันที
  lastExecutionTime = now;
  return false;
}

// ==========================================
// 1. ฟังก์ชันเปิดกล้อง (Start Scanner)
// ==========================================
async function startScanner() {
  if (isScannerRunning || isTransitioning) return;
  isTransitioning = true;

  try {
    const readerContainer = document.getElementById("readerContainer");
    const stockScrollArea = document.getElementById("stockScrollArea");
    const readerElement = document.getElementById("reader");

    // 🌟 ดัดเลย์เอาต์ดึงสัดส่วนพื้นที่ตรงกลางให้เต็มผืนพอดีระหว่าง Header และปุ่มด้านล่าง
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

    // ฉีด CSS ด่วนซ่อนกรอบเล็งแข็งๆ ของเก่าทิ้ง เพื่อเปิดทางให้กรอบแบบยืดหดสมูททำงานแทน
    injectScannerCSS();

    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }

    // โหลดสิทธิ์ให้อ่านได้ทั้งสองระบบตั้งแต่แรก เพื่อความเร็วสูงสุดและกล้องไม่กระตุก
    const allFormats = [
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.QR_CODE,
    ];

    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 30,
        formatsToSupport: allFormats,
        aspectRatio: 1.77,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true, // ใช้ตัวอ่านระดับฮาร์ดแวร์ของ Browser (อ่านติดไวขึ้นมาก)
        },
      },
      (decodedText) => {
        stopScanner();
        const searchInput = document.getElementById("searchStockInput");
        if (searchInput) {
          searchInput.value = decodedText;
          searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      },
      (errorMessage) => {
        /* ซ่อนข้อความ Error ระหว่างเล็งเฟรม */
      },
    );

    isScannerRunning = true;

    // วาดและอัปเดตรูปทรงกรอบเล็งสีขาวทันทีตามโหมดปัจจุบัน
    updateScanRegionUI();
  } catch (err) {
    console.error("Camera start failed:", err);
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
    console.warn("Forcing UI cleanup due to library stop constraint:", err);
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

  // ซ่อนกรอบเล็งจำลองออกไปเมื่อปิดกล้อง
  const customOverlay = document.getElementById("custom-scan-border");
  if (customOverlay) customOverlay.style.display = "none";
}

// ==========================================
// 3. ฟังก์ชันควบคุมสากลรองรับชื่อดั้งเดิมข้ามระบบ 100%
// ==========================================

function toggleScanner() {
  if (preventDoubleTrigger()) return; // ล็อกบั๊กกดเบิ้ลซ้อนกันข้ามไฟล์
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
        await videoTrack.applyConstraints({ advanced: [{ torch: isFlashOn }] });

        const btnFlash = document.getElementById("btnToggleFlash");
        if (btnFlash) {
          btnFlash.style.color = isFlashOn ? "#fab919" : "#fff";
          btnFlash.style.borderColor = isFlashOn ? "#fab919" : "#fff";
        }
      }
    }
  } catch (err) {
    console.warn(
      "Direct hardware flash approach failed, fallback to core:",
      err,
    );
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

  if (isScannerRunning) {
    updateScanRegionUI();
  }
}

// 🌟 ฟังก์ชันจัดการกรอบสีขาวจำลอง ปรับทรง Barcode / QR ได้อย่างนุ่มนวล สบายตา 100%
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
    customOverlay.style.boxShadow = "0 0 0 5000px rgba(0, 0, 0, 0.5)"; // ทำแรเงาขอบมืดรอบด้านนอก
    customOverlay.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    customOverlay.style.pointerEvents = "none";
    customOverlay.style.zIndex = "99";
    reader.appendChild(customOverlay);
  }

  customOverlay.style.display = "block";
  if (currentScanMode === "BARCODE") {
    customOverlay.style.width = "85%";
    customOverlay.style.height = "130px"; // เปลี่ยนเป็นสี่เหลี่ยมผืนผ้าแนวนอนรับแถบบาร์โค้ด
  } else {
    customOverlay.style.width = "230px";
    customOverlay.style.height = "230px"; // เปลี่ยนเป็นสี่เหลี่ยมจัตุรัสรับแผ่น QR
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
  `;
  document.head.appendChild(style);
}

// ==========================================
// 4. ผูกการทำงานระบบ (Event Listeners ป้องกันรันซ้ำ)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // บล็อกตรวจสิทธิ์ปุ่มกู้ระบบ ถ้าปุ่มไม่มีสิทธิ์ onclick ฝังอยู่ จะเปิดใช้งานดักฟังตรงนี้ให้ทันทีอย่างปลอดภัย
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

  // ปุ่ม Quick Scan เมนูหลัก
  document.getElementById("btnMenuQuickScan")?.addEventListener("click", () => {
    setTimeout(() => {
      startScanner();
    }, 350);
  });

  // ปุ่ม BACK คืนค่าปิดกล้องทุกกรณี
  document.getElementById("btnStockBack")?.addEventListener("click", () => {
    stopScanner();
  });
});
