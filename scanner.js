// ==========================================
// 🌟 SCANNER CONFIGURATION & STATE
// ==========================================
let html5QrCode = null;
let isScannerRunning = false;
let isTransitioning = false; // ระบบล็อกป้องกันกล้องสำลักคำสั่ง (Transition Lock)
let currentScanMode = "BARCODE";
let isFlashOn = false;

// ==========================================
// 1. ฟังก์ชันเปิดกล้อง (Start Scanner)
// ==========================================
async function startScanner() {
  // ดักจับ Error: Cannot transition... อย่างเด็ดขาด
  if (isTransitioning) return;
  if (
    html5QrCode &&
    typeof html5QrCode.getState === "function" &&
    html5QrCode.getState() === 2
  ) {
    isScannerRunning = true;
    return;
  }

  isTransitioning = true;

  try {
    const readerContainer = document.getElementById("readerContainer");
    const stockScrollArea = document.getElementById("stockScrollArea");
    if (readerContainer) readerContainer.style.display = "block";
    if (stockScrollArea) stockScrollArea.classList.add("hide");

    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }

    // โหลดฟอร์แมตรองรับทั้ง 2 โหมดพร้อมกัน เพื่อความลื่นไหลที่สุด
    const allFormats = [
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.QR_CODE,
    ];

    // 🌟 สั่งเปิดกล้องแบบ "เต็มเฟรม" (ถอดคำสั่ง qrbox ออก) เพื่อให้ภาพสมูทที่สุด
    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 15,
        formatsToSupport: allFormats,
        aspectRatio: 1.0,
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
        /* ซ่อนข้อความ Error ยิบย่อยระหว่างเล็งภาพ */
      },
    );

    isScannerRunning = true;

    // เรียกสร้างกรอบโฟกัสอัจฉริยะ (Custom Overlay) ทันทีหลังกล้องพร้อม
    updateScanRegionUI();
  } catch (err) {
    console.error("Camera start failed:", err);
    isScannerRunning = false;
  } finally {
    isTransitioning = false;
  }
}

// ==========================================
// 2. ฟังก์ชันปิดกล้อง (Stop Scanner - คืนค่า 100%)
// ==========================================
async function stopScanner() {
  if (isTransitioning) return;

  // หากสถานะไม่ได้สแกนอยู่ บังคับเคลียร์หน้าจอได้เลยทันที
  if (
    !html5QrCode ||
    typeof html5QrCode.getState !== "function" ||
    html5QrCode.getState() !== 2
  ) {
    forceResetUI();
    return;
  }

  isTransitioning = true;

  try {
    await html5QrCode.stop();
  } catch (err) {
    console.warn(
      "ไลบรารีปิดขัดข้อง ระบบสั่งล้างค่า UI นิรภัยให้ทันทีครับ:",
      err,
    );
  } finally {
    forceResetUI();
    isTransitioning = false;
  }
}

// ระบบจัดระเบียบหน้าจอและเคลียร์ไฟแฟลชให้กลับสู่สภาวะปกติ
function forceResetUI() {
  isScannerRunning = false;
  isFlashOn = false;

  const btnFlash = document.getElementById("btnToggleFlash");
  if (btnFlash) {
    btnFlash.style.color = "#fff";
    btnFlash.style.borderColor = "#fff";
  }

  const readerContainer = document.getElementById("readerContainer");
  const stockScrollArea = document.getElementById("stockScrollArea");
  if (readerContainer) readerContainer.style.display = "none";
  if (stockScrollArea) stockScrollArea.classList.remove("hide");
}

// ==========================================
// 3. ฟังก์ชันควบคุมสากล (ชื่อและหน้าที่เดิม 100%)
// ==========================================

function toggleScanner() {
  if (isScannerRunning) {
    stopScanner();
  } else {
    startScanner();
  }
}

async function toggleFlash() {
  if (!isScannerRunning) return;

  try {
    const videoElement = document.querySelector("#reader video");
    if (videoElement && videoElement.srcObject) {
      const videoTrack = videoElement.srcObject.getVideoTracks()[0];
      if (videoTrack) {
        isFlashOn = !isFlashOn;

        // 🌟 สั่งเปิด/ปิดแฟลชที่ตัวฮาร์ดแวร์โดยตรง ภาพวิดีโอจะไม่กระพริบ ไม่ดับวูบ!
        await videoTrack.applyConstraints({
          advanced: [{ torch: isFlashOn }],
        });

        const btnFlash = document.getElementById("btnToggleFlash");
        if (btnFlash) {
          btnFlash.style.color = isFlashOn ? "#fab919" : "#fff";
          btnFlash.style.borderColor = isFlashOn ? "#fab919" : "#fff";
        }
      }
    }
  } catch (err) {
    console.warn("อุปกรณ์นี้ไม่รองรับระบบคุมแฟลช:", err);
    isFlashOn = false;
  }
}

function toggleScanMode() {
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

// 🌟 สร้างเวทมนตร์กรอบเล็งแบบ Custom UI ยืด-หดได้ดั่งใจ
function updateScanRegionUI() {
  let customOverlay = document.getElementById("custom-scanner-overlay");

  // สร้างกล่องเล็งจำลองขึ้นมาครอบกล้องหลัก (ถ้ายังไม่มี)
  if (!customOverlay) {
    const reader = document.getElementById("reader");
    if (reader) {
      reader.style.position = "relative";
      reader.style.overflow = "hidden"; // ตัดส่วนที่แรเงาเกินขอบทิ้ง

      customOverlay = document.createElement("div");
      customOverlay.id = "custom-scanner-overlay";
      customOverlay.style.position = "absolute";
      customOverlay.style.top = "50%";
      customOverlay.style.left = "50%";
      customOverlay.style.transform = "translate(-50%, -50%)";
      customOverlay.style.border = "3px solid rgba(255, 255, 255, 0.9)"; // เส้นขอบสีขาวสว่าง
      customOverlay.style.borderRadius = "12px";
      // ทริกขั้นเทพ: สร้างกรอบเงาดำมืดทึบขนาด 4000px ครอบล้อมรอบรูตรงกลางไว้
      customOverlay.style.boxShadow = "0 0 0 4000px rgba(0, 0, 0, 0.55)";
      customOverlay.style.transition = "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)";
      customOverlay.style.pointerEvents = "none"; // สั่งให้ทัชสกรีนทะลุผ่านได้
      customOverlay.style.zIndex = "10";

      reader.appendChild(customOverlay);
    }
  }

  // ปรับเปลี่ยนมิติกรอบอย่างนุ่มนวลตามโหมดที่เจเลอร์สั่ง
  if (customOverlay) {
    if (currentScanMode === "BARCODE") {
      customOverlay.style.width = "85%";
      customOverlay.style.height = "120px"; // ทรงสี่เหลี่ยมผืนผ้า รับบาร์โค้ดสินค้า
    } else {
      customOverlay.style.width = "220px";
      customOverlay.style.height = "220px"; // ทรงสี่เหลี่ยมจัตุรัส รับแผ่นคิวอาร์
    }
  }
}

// ==========================================
// 4. ผูกเหตุการณ์กับปุ่มทำงาน (Event Listeners)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // 🔘 เมนู Quick Scan หน้าแรก (ป้องกันการเรียกทับซ้อน)
  document.getElementById("btnMenuQuickScan")?.addEventListener("click", () => {
    setTimeout(() => {
      if (!isScannerRunning && !isTransitioning) {
        startScanner();
      }
    }, 320);
  });

  // 🔘 ปุ่มกดภายในหน้าจอ Stock In House
  document
    .getElementById("btnScannerOpen")
    ?.addEventListener("click", toggleScanner);
  document
    .getElementById("btnToggleScanMode")
    ?.addEventListener("click", toggleScanMode);
  document
    .getElementById("btnToggleFlash")
    ?.addEventListener("click", toggleFlash);

  // 🌟 ดักปุ่ม BACK ของหน้าสต็อก: ปิดกล้องให้ทันทีก่อนสลับจอเสมอ
  document.getElementById("btnStockBack")?.addEventListener("click", () => {
    if (isScannerRunning) {
      stopScanner();
    }
  });
});
