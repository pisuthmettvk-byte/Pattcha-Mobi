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

    // เปิดโหมดอ่านพร้อมกันทัังหมดเพื่อความเร็วและตัดปัญหากล้องรีสตาร์ทตอนสลับโหมด
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
        qrbox: { width: 260, height: 260 }, // จองพื้นที่เล็งสูงสุดของสตรีมกล้องไว้
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

    // ดัดรูปทรงกรอบเล็งให้ตรงกับโหมดปัจจุบันหลังกล้องเริ่มทำงานสำเร็จ
    setTimeout(() => {
      updateScanRegionUI();
    }, 150);

  } catch (err) {
    console.error("Camera start failed:", err);
    isScannerRunning = false;
  }
}

// ==========================================
// 2. ฟังก์ชันปิดกล้อง (Stop Scanner - คืนค่าระบบสมบูรณ์ 100%)
// ==========================================
async function stopScanner() {
  try {
    if (html5QrCode) {
      await html5QrCode.stop();
    }
  } catch (err) {
    console.warn("ไลบรารีกล้องปิดตัวแบบติดขัด ระบบกำลังบังคับเคลียร์ UI ให้ทันทีครับ:", err);
  } finally {
    // 🌟 ระบบสวิตช์นิรภัย: การันตีหน้าต่างกล้องปิดตัวและคืนหน้างานปกติแน่นอนต่อให้ระบบภายในเออเร่อ
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
// 3. ฟังก์ชันสากลเพื่อรักษาสิทธิ์ระบบดั้งเดิม (ชื่อเดิม หน้าที่เดิม 100%)
// ==========================================

// ปุ่มกดเปิด/ปิดสลับกันภายในหน้างาน Stock In House
function toggleScanner() {
  if (isScannerRunning) {
    stopScanner();
  } else {
    startScanner();
  }
}

// ปุ่มควบคุมดวงไฟแฟลชอัปเกรด (เจาะตรงเข้าหาฮาร์ดแวร์แทร็กก่อนเพื่อความนิ่งสนิท ไม่กระพริบดับ)
async function toggleFlash() {
  if (!isScannerRunning) return;

  try {
    const videoElement = document.querySelector("#reader video");
    if (videoElement && videoElement.srcObject) {
      const videoTrack = videoElement.srcObject.getVideoTracks()[0];
      if (videoTrack) {
        isFlashOn = !isFlashOn;
        
        // สั่งเปิดไฟฉายบนแทร็กฮาร์ดแวร์โดยตรง ไม่ทำให้กล้องรีสตาร์ทกระพริบวูบแน่นอน
        await videoTrack.applyConstraints({
          advanced: [{ torch: isFlashOn }]
        });

        // เปลี่ยนสีปุ่มแจ้งเตือนหน้าร้าน (สีเหลืองทองเวลาเปิด)
        const btnFlash = document.getElementById("btnToggleFlash");
        if (btnFlash) {
          btnFlash.style.color = isFlashOn ? "#fab919" : "#fff";
          btnFlash.style.borderColor = isFlashOn ? "#fab919" : "#fff";
        }
      }
    }
  } catch (err) {
    console.warn("ระบบควบคุมตรงติดขัด กำลังลองใช้คำสั่งสำรองผ่านไลบรารีครับ:", err);
    try {
      if (html5QrCode) {
        await html5QrCode.applyVideoConstraints({ torch: isFlashOn });
        const btnFlash = document.getElementById("btnToggleFlash");
        if (btnFlash) {
          btnFlash.style.color = isFlashOn ? "#fab919" : "#fff";
          btnFlash.style.borderColor = isFlashOn ? "#fab919" : "#fff";
        }
      }
    } catch (libErr) {
      console.error("อุปกรณ์นี้ไม่รองรับระบบเปิดไฟแฟลชผ่านเว็บเบราว์เซอร์:", libErr);
      isFlashOn = false;
    }
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

// ฟังก์ชันดัดมิติเฉพาะกรอบโฟกัสสีขาวด้วย CSS แบบ Smooth ไร้รอยต่อ
function updateScanRegionUI() {
  const scanRegion = document.getElementById("reader__scan_region");
  if (scanRegion) {
    // ใส่อนิเมชันการยืดหดกรอบให้สมูท สบายตากรรมการ
    scanRegion.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    
    if (currentScanMode === "BARCODE") {
      scanRegion.style.width = "260px";
      scanRegion.style.height = "120px"; // ทรงสี่เหลี่ยมผืนผ้าแนวนอน สำหรับสแกนแท็กบาร์โค้ดสินค้า
    } else {
      scanRegion.style.width = "220px";
      scanRegion.style.height = "220px"; // ทรงสี่เหลี่ยมจัตุรัส สำหรับสแกน QR Code
    }
  }
}

// ==========================================
// 4. ผูกเหตุการณ์กับปุ่มต่างๆ (Event Listeners)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  
  // ปุ่ม Quick Scan เมนูหลัก: กดปุ๊บ สลับหน้าจอเสร็จแล้วสั่งสตาร์ทกล้องขึ้นทันทีอัตโนมัติ
  document.getElementById("btnMenuQuickScan")?.addEventListener("click", () => {
    setTimeout(async () => {
      if (isScannerRunning) { await stopScanner(); }
      startScanner();
    }, 320);
  });

  // ผูกการทำงานปุ่มคำสั่งควบคุมภายในหน้าร้านตามไอดีดั้งเดิมในระบบ
  document.getElementById("btnScannerOpen")?.addEventListener("click", toggleScanner);
  document.getElementById("btnToggleScanMode")?.addEventListener("click", toggleScanMode);
  document.getElementById("btnToggleFlash")?.addEventListener("click", toggleFlash);
});