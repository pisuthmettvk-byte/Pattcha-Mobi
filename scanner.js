// ==========================================
// SCANNER CONFIGURATION & STATE
// ==========================================
let currentScanMode = 'BARCODE'; // เริ่มต้นที่ Barcode
let isTorchOn = false;
let mediaStream = null; // เก็บสายไฟกล้องเพื่อไว้สั่งเปิดแฟลช

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
} // 🟢 แก้ไขเสร็จสิ้น: เติมปีกกาปิดฟังก์ชันป้องกัน SyntaxError ดักปุ่ม Submit พัง

async function toggleFlash() {
  // ดึงสตรีมตรงจากแท็ก video ที่กำลังทำงานอยู่บนจอ ป้องกันค่า null 
  const videoElem = document.querySelector('#scannerContainer video');
  if (!videoElem || !videoElem.srcObject) {
    alert("⚠️ กรุณาเปิดกล้องสแกนเนอร์ก่อนเปิดไฟแฟลชครับ");
    return;
  }
  
  mediaStream = videoElem.srcObject;
  const track = mediaStream.getVideoTracks()[0];
  
  // ดักจับความปลอดภัย ป้องกันแอปแครชบน iPhone/iOS
  if (!track.getCapabilities || !track.getCapabilities().torch) {
    alert("⚠️ อุปกรณ์หรือเบราว์เซอร์นี้ ไม่รองรับการเปิดไฟแฟลชผ่านระบบเว็บแอปพลิเคชันครับ");
    return;
  }
  
  isTorchOn = !isTorchOn;
  try {
    await track.applyConstraints({
      advanced: [{ torch: isTorchOn }]
    });
    
    // อัปเดตสีปุ่มไฮไลต์ตามสถานะไฟจริง
    const flashBtn = document.getElementById('btnToggleFlash');
    if (flashBtn) {
      flashBtn.style.color = isTorchOn ? "#fbbf24" : "#fff";
      flashBtn.style.borderColor = isTorchOn ? "#fbbf24" : "#fff";
    }
  } catch (err) {
    console.warn("ไม่สามารถปรับแต่งสถานะไฟแฟลชได้:", err);
  }
}

// 🌟 คงไว้ตามระบบเดิม: ดึงตัวแปรหน้าจอมาเก็บไว้ครั้งเดียวเพื่อความรวดเร็ว
const searchContainer = document.getElementById('searchContainer');
const readerContainer = document.getElementById('readerContainer'); // 🟢 แก้ไขกลับมาใช้ ID เดิมป้องกัน Layout พัง
const searchInput = document.getElementById('searchStockInput');

let html5QrCode = null;
let isScannerMode = false;

// 🌟 ฟังก์ชันปิดกล้องและล้าง Memory ทิ้ง 100% พร้อมรีเซ็ตแฟลช
function stopScanner() {
  if (!html5QrCode) return Promise.resolve();
  return html5QrCode.stop()
    .then(() => {
      html5QrCode.clear();
      html5QrCode = null;

      // รีเซ็ตสถานะปุ่มไฟแฟลชให้กลับเป็นค่าเริ่มต้นทุกครั้งเมื่อปิดกล้องสำเร็จ
      isTorchOn = false;
      const flashBtn = document.getElementById('btnToggleFlash');
      if (flashBtn) {
        flashBtn.style.color = "#fff";
        flashBtn.style.borderColor = "#fff";
      }
    })
    .catch(err => console.error("Error stopping camera:", err));
}

// 🌟 ฟังก์ชันเปิด/ปิดกล้องทำงานสอดประสานกันแบบ Async
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

    // ปรับขนาดกล่องเล็งอัตโนมัติตามโหมดเพื่อให้เหมาะกับประเภทโค้ดและสแกนไวขึ้น
    const targetQrBox = currentScanMode === 'BARCODE' 
      ? { width: 280, height: 120 } 
      : { width: 220, height: 220 };

    // 🟢 ระบบ True Hybrid สตาร์ทกล้อง: ลองออปชันแรงก่อน ถ้าเครื่องไม่ไหวให้ถอยกลับไปแบบมาตรฐานอัตโนมัติ
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
          searchInput.disabled = true; // ล็อกช่องค้นหากันกดเบิ้ล
        }

        await stopScanner(); // สั่งปิดกล้องให้สนิทล้างหน่วยความจำ
        
        if (searchContainer) searchContainer.style.display = 'block';
        if (readerContainer) readerContainer.style.display = 'none';
        isScannerMode = false;

        try {
          if (typeof handleMagicSearch === 'function') {
            handleMagicSearch(); // ค้นหาสินค้าอัตโนมัติ
          }
        } catch (err) {
          console.error("Search failed:", err);
          alert("❌ ค้นหาล้มเหลว กรุณาลองใหม่ครับ");
        } finally {
          if (searchInput) searchInput.disabled = false; // ปลดล็อกช่องค้นหา
        }
      },
      (errorMessage) => {
        // ซ่อนข้อความเตือนโฟกัสเฟรมภาพเพื่อให้ Console สะอาดลื่นไหล
      }
    ).catch((err) => {
      // 🟢 แผนสำรองระดับ Hybrid: หาก constraints ชั้นสูงทำเครื่องแครช ให้รันกล้องโหมดธรรมดาทันที
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
        () => {}
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
    await stopScanner(); // ล้างระบบปิดกล้องคืนพลังงานทันที
  }
}
