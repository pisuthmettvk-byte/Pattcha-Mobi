// ==========================================
// SCANNER CONFIGURATION & STATE
// ==========================================
let currentScanMode = 'BARCODE'; 
let isTorchOn = false;
let mediaStream = null; 

// 🌟 ตั้งค่ากล้องแบบ Hybrid (พยายามขอความละเอียดสูงก่อน)
const hybridCameraConstraints = {
  facingMode: "environment",
  width: { ideal: 1280 },
  height: { ideal: 720 },
  advanced: [{ focusMode: "continuous" }]
};

// ==========================================
// CAMERA CONTROLS (โหมด & แฟลช)
// ==========================================
function toggleScanMode() {
  const modeText = document.getElementById('scanModeText');
  const modeIcon = document.getElementById('scanModeIcon');
  
  if (currentScanMode === 'BARCODE') {
    currentScanMode = 'QR';
    if (modeText) modeText.innerText = 'QR CODE';
    if (modeIcon) modeIcon.className = 'fas fa-qrcode';
  } else {
    currentScanMode = 'BARCODE';
    if (modeText) modeText.innerText = 'BARCODE';
    if (modeIcon) modeIcon.className = 'fas fa-barcode';
  }
}

async function toggleFlash() {
  // 🟢 ค้นหาแท็กวิดีโอแบบสากล (Universal Selector) ป้องกันสัดส่วน Layout คลาดเคลื่อน
  const videoElem = document.querySelector('video');
  if (!videoElem || !videoElem.srcObject) {
    alert("⚠️ กรุณารอให้ภาพจากกล้องแสดงขึ้นมาก่อนเปิดไฟแฟลชครับ");
    return;
  }
  
  mediaStream = videoElem.srcObject;
  const track = mediaStream.getVideoTracks()[0];
  
  if (!track.getCapabilities || !track.getCapabilities().torch) {
    alert("⚠️ อุปกรณ์หรือเบราว์เซอร์นี้ ไม่รองรับการเปิดไฟแฟลชผ่านระบบเว็บแอปพลิเคชันครับ");
    return;
  }
  
  isTorchOn = !isTorchOn;
  try {
    await track.applyConstraints({
      advanced: [{ torch: isTorchOn }]
    });
    
    const flashBtn = document.getElementById('btnToggleFlash');
    if (flashBtn) {
      flashBtn.style.color = isTorchOn ? "#fbbf24" : "#fff";
      flashBtn.style.borderColor = isTorchOn ? "#fbbf24" : "#fff";
    }
  } catch (err) {
    console.warn("ไม่สามารถปรับแต่งสถานะไฟแฟลชได้:", err);
  }
}

// 🌟 ตัวแปรหน้าจอ
const searchContainer = document.getElementById('searchContainer');
const readerContainer = document.getElementById('readerContainer'); 
const searchInput = document.getElementById('searchStockInput');

let html5QrCode = null;
let isScannerMode = false;

// 🌟 ฟังก์ชันปิดกล้องและล้าง Memory (อัปเกรดระบบเบรกแบบปลอดภัยสูงสุดป้องกันการแครช)
function stopScanner() {
  if (!html5QrCode) return Promise.resolve();
  
  // รีเซ็ตสถานะปุ่มไฟแฟลชให้กลับเป็นค่าเริ่มต้นเสมอ
  isTorchOn = false;
  const flashBtn = document.getElementById('btnToggleFlash');
  if (flashBtn) {
    flashBtn.style.color = "#fff";
    flashBtn.style.borderColor = "#fff";
  }

  try {
    return html5QrCode.stop().then(() => {
      html5QrCode.clear();
      html5QrCode = null;
    }).catch(err => {
      // 🟢 หากเกิด Error ระหว่างปิด (เช่นกล้องเพิ่งเริ่มทำงาน) ให้เคลียร์ค่าทิ้งอย่างปลอดภัย
      console.warn("Soft reset applied:", err);
      html5QrCode.clear();
      html5QrCode = null;
    });
  } catch(e) {
    html5QrCode.clear();
    html5QrCode = null;
    return Promise.resolve();
  }
}

// 🌟 ฟังก์ชันเปิด/ปิดกล้องแบบ Hybrid Fallback
async function toggleScanner() {
  if (!('mediaDevices' in navigator)) {
    alert("❌ เบราว์เซอร์หรืออุปกรณ์นี้ไม่รองรับการใช้งานกล้องครับ");
    return;
  }

  isScannerMode = !isScannerMode;

  if (isScannerMode) {
    if (searchContainer) searchContainer.style.display = 'none';
    if (readerContainer) readerContainer.style.display = 'block';

    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }

    const targetQrBox = currentScanMode === 'BARCODE' 
      ? { width: 280, height: 120 } 
      : { width: 220, height: 220 };

    html5QrCode.start(
      hybridCameraConstraints, 
      { 
        fps: 30, 
        qrbox: targetQrBox, 
        disableFlip: false 
      },
      async (decodedText) => {
        if (searchInput) {
          searchInput.value = decodedText;
          searchInput.disabled = true; 
        }

        await stopScanner(); 
        
        if (searchContainer) searchContainer.style.display = 'block';
        if (readerContainer) readerContainer.style.display = 'none';
        isScannerMode = false;

        try {
          if (typeof handleMagicSearch === 'function') {
            handleMagicSearch(); 
          }
        } catch (err) {
          console.error("Search failed:", err);
          alert("❌ ค้นหาล้มเหลว กรุณาลองใหม่ครับ");
        } finally {
          if (searchInput) searchInput.disabled = false; 
        }
      },
      (errorMessage) => {
        // ซ่อนข้อความ Error การหาโฟกัส
      }
    ).catch((err) => {
      console.warn("Retrying with standard camera setup...", err);
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 30, qrbox: targetQrBox, disableFlip: false },
        async (decodedText) => {
          if (searchInput) { searchInput.value = decodedText; searchInput.disabled = true; }
          await stopScanner();
          if (searchContainer) searchContainer.style.display = 'block';
          if (readerContainer) readerContainer.style.display = 'none';
          isScannerMode = false;
          if (typeof handleMagicSearch === 'function') handleMagicSearch();
          if (searchInput) searchInput.disabled = false;
        },
        () => {} // Ignored errors
      ).catch((finalErr) => {
        console.error("Critical camera failure:", finalErr);
        isScannerMode = false;
        if (searchContainer) searchContainer.style.display = 'block';
        if (readerContainer) readerContainer.style.display = 'none';
        alert("❌ เปิดกล้องไม่ได้: กรุณากด 'อนุญาต' (Allow) กล้องในเบราว์เซอร์");
      });
    });
  } else {
    if (searchContainer) searchContainer.style.display = 'block';
    if (readerContainer) readerContainer.style.display = 'none';
    await stopScanner(); 
  }
}
