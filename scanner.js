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

    // เปิดโหมดอ่านพร้อมกันทัังหมดเพื่อความเร็วและตัดปัญหากล้องรีสตาร์ท
    const allFormats = [
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.QR_CODE
    ];

    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 15,
        qrbox: { width: 260, height: 260 }, // จองพื้นที่ขนาดกล่องเล็งสูงสุดไว้
        formatsToSupport: allFormats,
        aspectRatio: 1.0
      },
      (decodedText) => {
        stopScanner();
        const searchInput = document.getElementById("searchStockInput");
        if (searchInput) {
          searchInput.value = decodedText;
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
      (errorMessage) => { /* ข้ามข้อความตรวจสอบระหว่างเล็งเฟรม */ }
    );

    isScannerRunning = true;

    // หน่วงเวลาเล็กน้อยเพื่อให้โครงสร้าง HTML โหลดเสร็จ แล้วดัดทรงกรอบทันที
    setTimeout(() => {
      updateScanRegionUI();
    }, 150);

  } catch (err) {
    console.error("Camera start failed:", err);
    isScannerRunning = false;
  }
}

// ==========================================
// 2. ฟังก์ชันปิดกล้อง (Stop Scanner)
// ==========================================
async function stopScanner() {
  try {
    if (html5QrCode) {
      await html5QrCode.stop();
    }
  } catch (err) {
    console.warn("ไลบรารีกล้องปิดตัวแบบติดขัด กำลังบังคับเคลียร์ระบบหลังบ้านให้ครับ:", err);
  } finally {
    // 🌟 ระบบสวิตช์นิรภัย: มั่นใจได้ว่าหน้าต่างกล้องจะถูกปิดทิ้งและรีเซ็ตค่าเสมอแน่นอน
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
// 3. ฟังก์ชันสากลเพื่อรักษาสิทธิ์ระบบเดิม (ชื่อและหน้าที่เดิม 100%)
// ==========================================

// ปุ่มภายนอกเรียกสั่งเปิด/ปิดสลับกัน
function toggleScanner() {
  if (isScannerRunning) {
    stopScanner();
  } else {
    startScanner();
  }
}

// ปุ่มควบคุมดวงไฟแฟลชอัปเกรดใหม่ (เจาะตรงเข้าหาแทร็กวิดีโอฮาร์ดแวร์)
async function toggleFlash() {
  if (!isScannerRunning) return;

  try {
    const videoElement = document.querySelector("#reader video");
    if (videoElement && videoElement.srcObject) {
      const videoTrack = videoElement.srcObject.getVideoTracks()[0];
      if (videoTrack) {
        isFlashOn = !isFlashOn;
        
        // สั่งเปิดไฟฉายแบบ Advanced บนแทร็กกล้องโดยตรง ไม่กระพริบดับแน่นอน
        await videoTrack.applyConstraints({
          advanced: [{ torch: isFlashOn }]
        });

        // เปลี่ยนสีไอคอนปุ่มแจ้งเตือนหน้าร้าน
        const btnFlash = document.getElementById("btnToggleFlash");
        if (btnFlash) {
          btnFlash.style.color = isFlashOn ? "#fab919" : "#fff";
          btnFlash.style.borderColor = isFlashOn ? "#fab919" : "#fff";
        }
      }
    }
  } catch (err) {
    console.warn("เบราว์เซอร์หรืออุปกรณ์นี้ไม่รองรับระบบควบคุมไฟแฟลชตรง:", err);
    isFlashOn = false;
  }
}

// ฟังก์ชันสลับโหมดการทำงาน
function toggleScanMode() {
  currentScanMode = currentScanMode === "BARCODE" ? "QR" : "BARCODE";

  const textEl = document.getElementById("scanModeText");
  const iconEl = document.getElementById("scanModeIcon");
  if (textEl) textEl.innerText = currentScanMode;
  if (iconEl) iconEl.className = currentScanMode === "BARCODE" ? "fas fa-barcode" : "fas fa-qrcode";

  if (isScannerRunning) {
    updateScanRegionUI();
  }
}

// ฟังก์ชันดัดปรับเฉพาะมิติกรอบโฟกัสสีขาวแบบ Smooth ไร้รอยต่อ
function updateScanRegionUI() {
  const scanRegion = document.getElementById("reader__scan_region");
  if (scanRegion) {
    // ใส่ Transition ให้กรอบยืดหดแบบนุ่มนวล สบายตา
    scanRegion.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    
    if (currentScanMode === "BARCODE") {
      scanRegion.style.width = "260px";
      scanRegion.style.height = "110px"; // ทรงสี่เหลี่ยมผืนผ้าแนวนอนสแกนบาร์โค้ด
    } else {
      scanRegion.style.width = "220px";
      scanRegion.style.height = "220px"; // ทรงสี่เหลี่ยมจัตุรัสสแกน QR Code
    }
  }
}

// ==========================================
// 4. ผูกการดักฟังเหตุการณ์ปุ่มต่างๆ (Event Listeners)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  
  // ปุ่ม Quick Scan หน้าแรก: กดแล้วกระโดดเข้าหน้า Stock พร้อมหน่วงเปิดกล้องออโต้ทันที
  document.getElementById("btnMenuQuickScan")?.addEventListener("click", () => {
    setTimeout(() => {
      startScanner();
    }, 320);
  });

  // ผูกการทำงานปุ่มคำสั่งควบคุมภายในหน้าจอ
  document.getElementById("btnScannerOpen")?.addEventListener("click", toggleScanner);
  document.getElementById("btnToggleScanMode")?.addEventListener("click", toggleScanMode);
  document.getElementById("btnToggleFlash")?.addEventListener("click", toggleFlash);
});