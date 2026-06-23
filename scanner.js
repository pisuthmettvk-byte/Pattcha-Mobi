// ==========================================
// 🌟 SCANNER CONFIGURATION & STATE
// ==========================================
let html5QrCode = null;
let isScannerRunning = false;
let currentScanMode = "BARCODE";
let isFlashOn = false;

// ==========================================
// 1. ฟังก์ชันเปิดกล้อง (Start Scanner)
// ==========================================
async function startScanner() {
  if (isScannerRunning) return;

  try {
    const readerContainer = document.getElementById("readerContainer");
    const stockScrollArea = document.getElementById("stockScrollArea");
    if (readerContainer) readerContainer.style.display = "block";
    if (stockScrollArea) stockScrollArea.classList.add("hide");

    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }

    // โหลดฟอร์แมตรองรับทั้งคู่พร้อมกัน เพื่อไม่ให้กล้องต้องเปิดๆ ปิดๆ ตอนสลับโหมด
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
        fps: 15,
        qrbox: { width: 260, height: 260 }, // ล็อคพื้นที่เล็งสูงสุดของสตรีมกล้องไว้
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
        /* ข้ามข้อความแจ้งเตือนระหว่างเล็งเฟรม */
      },
    );

    isScannerRunning = true;

    // หน่วงเวลาเล็กน้อยเพื่อให้โครงสร้าง HTML ของไลบรารีนิ่ง แล้วดัดกรอบเล็งทันที
    setTimeout(() => {
      updateScanRegionUI();
    }, 150);
  } catch (err) {
    console.error("Camera start failed:", err);
    isScannerRunning = false;
  }
}

// ==========================================
// 2. ฟังก์ชันปิดกล้อง (Stop Scanner - แก้ไขให้ปิดได้ 100% ไม่ติดค้าง)
// ==========================================
async function stopScanner() {
  try {
    if (html5QrCode) {
      await html5QrCode.stop();
    }
  } catch (err) {
    console.warn(
      "ระบบกล้องปิดตัวแบบติดขัด กำลังบังคับเคลียร์ UI ให้ทันทีครับ:",
      err,
    );
  } finally {
    // 🌟 มั่นใจได้ว่าสวิตช์ปิดกล้องและคืนหน้าจอปกติจะทำงานได้เสมอ แม้ระบบไลบรารีจะติดขัด
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
}

// ==========================================
// 3. ฟังก์ชันสากลเพื่อรักษาสิทธิ์การเรียกใช้งานเดิม (ชื่อเดิม หน้าที่เดิม 100%)
// ==========================================

// ปุ่มกดเปิด/ปิดสลับกันภายในหน้างาน
function toggleScanner() {
  if (isScannerRunning) {
    stopScanner();
  } else {
    startScanner();
  }
}

// ปุ่มควบคุมไฟแฟลชอัปเกรดความเสถียร (คุมตรงผ่านฮาร์ดแวร์แทร็ก ไม่กระพริบดับแน่นอน)
async function toggleFlash() {
  if (!isScannerRunning || !html5QrCode) return;

  try {
    isFlashOn = !isFlashOn;
    // สั่งเปิดไฟส่องสว่างผ่านลอจิกมาตรฐานของไลบรารี
    await html5QrCode.applyVideoConstraints({
      torch: isFlashOn,
    });

    const btnFlash = document.getElementById("btnToggleFlash");
    if (btnFlash) {
      btnFlash.style.color = isFlashOn ? "#fab919" : "#fff";
      btnFlash.style.borderColor = isFlashOn ? "#fab919" : "#fff";
    }
  } catch (err) {
    console.warn(
      "คำสั่งแรกติดขัด กำลังใช้แผนสำรองเจาะเข้าแทร็กวิดีโอโดยตรง:",
      err,
    );
    try {
      const videoElement = document.querySelector("#reader video");
      if (videoElement && videoElement.srcObject) {
        const videoTrack = videoElement.srcObject.getVideoTracks()[0];
        if (videoTrack) {
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
    } catch (trackErr) {
      console.error(
        "อุปกรณ์นี้ไม่รองรับระบบไฟแฟลชผ่านเว็บเบราว์เซอร์:",
        trackErr,
      );
      isFlashOn = false;
    }
  }
}

// ฟังก์ชันสลับโหมดการทำงานบาร์โค้ด และ คิวอาร์โค้ด
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

// 🌟 ฟังก์ชันปรับแต่งมิติกรอบโฟกัสสีขาวแบบนุ่มนวล โดยไม่มีการกระตุกของภาพวิดีโอ
function updateScanRegionUI() {
  const scanRegion = document.getElementById("reader__scan_region");
  if (scanRegion) {
    // ใส่อนิเมชันให้กรอบยืดหดได้อย่างสบายตา ราบรื่น 100%
    scanRegion.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

    if (currentScanMode === "BARCODE") {
      scanRegion.style.width = "260px";
      scanRegion.style.height = "120px"; // ทรงสี่เหลี่ยมผืนผ้าแนวนอน เล็งแถบโค้ดสินค้า
    } else {
      scanRegion.style.width = "220px";
      scanRegion.style.height = "220px"; // ทรงสี่เหลี่ยมจัตุรัส เล็งแผ่น QR
    }
  }
}

// ==========================================
// 4. ผูกเหตุการณ์กับปุ่มต่างๆ (Event Listeners)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // ปุ่ม Quick Scan เมนูหลัก: กดปุ๊บ สลับหน้าจอเสร็จแล้วสั่งสตาร์ทกล้องขึ้นทันทีออโต้
  document.getElementById("btnMenuQuickScan")?.addEventListener("click", () => {
    setTimeout(async () => {
      if (isScannerRunning) {
        await stopScanner();
      }
      startScanner();
    }, 320);
  });

  // ผูกการทำงานปุ่มคำสั่งควบคุมภายในหน้าร้านตามไอดีดั้งเดิม
  document
    .getElementById("btnScannerOpen")
    ?.addEventListener("click", toggleScanner);
  document
    .getElementById("btnToggleScanMode")
    ?.addEventListener("click", toggleScanMode);
  document
    .getElementById("btnToggleFlash")
    ?.addEventListener("click", toggleFlash);
});
