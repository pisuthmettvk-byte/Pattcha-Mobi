// ==========================================
// 🌟 SCANNER CORE STATE (จุดแรก: กู้ระบบเปิด-ปิดกล้องเสถียร)
// ==========================================
let html5QrCode = null;
let isScannerRunning = false;
let currentScanMode = "BARCODE"; // เก็บสแตนด์บายไว้

// ==========================================
// 1. ฟังก์ชันสั่งสตาร์ทกล้อง (Start)
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

    // ฟอร์แมตดั้งเดิมที่เสถียรและทำงานร่วมกับปุ่มกล้องได้ดีที่สุด
    const formats = [
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
    ];

    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 150 }, // ดึงมิติกล่องดั้งเดิมกลับมาก่อนเพื่อความเสถียร
        formatsToSupport: formats,
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
        /* ข้าม Error เล็งภาพ */
      },
    );

    isScannerRunning = true;
  } catch (err) {
    console.error("Camera start failed:", err);
    isScannerRunning = false;
  }
}

// ==========================================
// 2. ฟังก์ชันสั่งหยุดกล้อง (Stop)
// ==========================================
async function stopScanner() {
  if (!isScannerRunning) return;

  try {
    if (html5QrCode) {
      await html5QrCode.stop();
    }
  } catch (err) {
    console.warn("Camera stop layout mismatch:", err);
  } finally {
    // บังคับคืนหน้าจอปกติหน้าร้านเสมอ มั่นใจได้ว่าไม่ค้างหน้าจอกล้องดำ
    isScannerRunning = false;

    const readerContainer = document.getElementById("readerContainer");
    const stockScrollArea = document.getElementById("stockScrollArea");
    if (readerContainer) readerContainer.style.display = "none";
    if (stockScrollArea) stockScrollArea.classList.remove("hide");

    // รีเซ็ตปุ่มแฟลชกลับเป็นสีปกติ
    const btnFlash = document.getElementById("btnToggleFlash");
    if (btnFlash) {
      btnFlash.style.color = "#fff";
      btnFlash.style.borderColor = "#fff";
    }
  }
}

// ==========================================
// 3. ฟังก์ชันสากลรองรับชื่อปุ่มเดิมในระบบ 100%
// ==========================================
function toggleScanner() {
  if (isScannerRunning) {
    stopScanner();
  } else {
    startScanner();
  }
}

// ผูกฟังก์ชันชั่วคราวเพื่อให้ปุ่มอื่นไม่เออเร่อระหว่างทดสอบจุดแรก
function toggleFlash() {
  console.log("สแตนด์บายแก้ไขในจุดถัดไป");
}
function toggleScanMode() {
  console.log("สแตนด์บายแก้ไขในจุดถัดไป");
}

// ==========================================
// 4. ผูกเหตุการณ์ปุ่ม (Event Listeners)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // ดักจับปุ่มกดรูปกล้องหลักทั้งในหน้า Stock และปุ่ม Quick Scan ให้เปิด-ปิดได้อย่างมั่นคง
  document
    .getElementById("btnScannerOpen")
    ?.addEventListener("click", toggleScanner);

  document.getElementById("btnMenuQuickScan")?.addEventListener("click", () => {
    setTimeout(() => {
      startScanner();
    }, 300);
  });

  document.getElementById("btnStockBack")?.addEventListener("click", () => {
    if (isScannerRunning) stopScanner();
  });
});
