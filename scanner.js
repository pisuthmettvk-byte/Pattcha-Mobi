// ==========================================
// SCANNER CONFIGURATION & STATE
// ==========================================
let currentScanMode = 'BARCODE'; // เริ่มต้นที่ Barcode
let isTorchOn = false;
let mediaStream = null; // เก็บสายไฟกล้องเพื่อไว้สั่งเปิดแฟลช

// 🌟 ตั้งค่ากล้องแบบ Hybrid (พยายามขอ 720p และ Auto-focus ก่อน)
const hybridCameraConstraints = {
  video: {
    facingMode: "environment",
    width: { ideal: 1280 },
    height: { ideal: 720 },
    advanced: [{ focusMode: "continuous" }]
  }
};

// ==========================================
// CAMERA CONTROLS (โหมด & แฟลช)
// ==========================================
function toggleScanMode() {
  const modeText = document.getElementById('scanModeText');
  const modeIcon = document.getElementById('scanModeIcon');
  
  if (currentScanMode === 'BARCODE') {
    currentScanMode = 'QR';
    modeText.innerText = 'QR CODE';
    modeIcon.className = 'fas fa-qrcode';
  } else {
    currentScanMode = 'BARCODE';
    modeText.innerText = 'BARCODE';
    modeIcon.className = 'fas fa-barcode';
  }
  
 // ==========================================
// CAMERA CONTROLS (เวอร์ชันอัปเกรดความปลอดภัยสูงสุด)
// ==========================================
async function toggleFlash() {
  // 🟢 แก้ไขจุดที่ 2: ดึงสตรีมตรงจากแท็ก video ที่กำลังทำงานอยู่บนจอ ป้องกันค่า null 
  const videoElem = document.querySelector('#scannerContainer video');
  if (!videoElem || !videoElem.srcObject) {
    alert("⚠️ กรุณาเปิดกล้องสแกนเนอร์ก่อนเปิดไฟแฟลชครับ");
    return;
  }
  
  mediaStream = videoElem.srcObject;
  const track = mediaStream.getVideoTracks()[0];
  
  // 🟢 แก้ไขจุดที่ 1: ดักจับความปลอดภัย ป้องกันแอปแครชบน iPhone/iOS
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





// 🌟 1. ดึงตัวแปรหน้าจอมาเก็บไว้ครั้งเดียว (Cache DOM) เพื่อความรวดเร็ว
const searchContainer = document.getElementById('searchContainer');
const readerContainer = document.getElementById('readerContainer');
const searchInput = document.getElementById('searchStockInput');

let html5QrCode = null;
let isScannerMode = false;

// 🌟 2. ฟังก์ชันแยกสำหรับปิดกล้องและล้าง Memory ทิ้ง 100%
function stopScanner() {
  if (!html5QrCode) return Promise.resolve();
  return html5QrCode.stop()
    .then(() => {
      html5QrCode.clear();
      html5QrCode = null;

      // 🟢 [เพิ่มใหม่] รีเซ็ตสถานะปุ่มไฟแฟลชให้กลับเป็นค่าเริ่มต้นทุกครั้งเมื่อปิดกล้องสำเร็จ
      isTorchOn = false;
      const flashBtn = document.getElementById('btnToggleFlash');
      if (flashBtn) {
        flashBtn.style.color = "#fff";
        flashBtn.style.borderColor = "#fff";
      }
    })
    .catch(err => console.error("Error stopping camera:", err));
}

// 🌟 เปลี่ยนเป็น Async เพื่อให้ระบบรอจังหวะการปิด/เปิดกล้องอย่างสมบูรณ์
async function toggleScanner() {
  // 🌟 3. เช็กความเข้ากันได้ของเบราว์เซอร์
  if (!('mediaDevices' in navigator)) {
    alert("❌ เบราว์เซอร์หรืออุปกรณ์นี้ไม่รองรับการใช้งานกล้องครับ");
    return;
  }

  isScannerMode = !isScannerMode;

  if (isScannerMode) {
    searchContainer.style.display = 'none';
    readerContainer.style.display = 'block';

    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }

    html5QrCode.start(
      { facingMode: "environment" },
      { 
        fps: 30, // ความเร็ว 30 เฟรม/วินาที
        qrbox: { width: 280, height: 120 }, // กรอบสี่เหลี่ยมผืนผ้าสำหรับบาร์โค้ด
        disableFlip: false 
      },
      async (decodedText) => {
        searchInput.value = decodedText;
        searchInput.disabled = true; // 🌟 4. ล็อกช่องค้นหากันกดเบิ้ล

        await stopScanner(); // 🌟 5. สั่งปิดกล้องให้สนิทก่อน (จะรีเซ็ตแฟลชออโต้ในนี้)
        
        searchContainer.style.display = 'block';
        readerContainer.style.display = 'none';
        isScannerMode = false;

        try {
          handleMagicSearch(); // 🌟 ดึงข้อมูลสินค้า
        } catch (err) {
          console.error("Search failed:", err);
          alert("❌ ค้นหาล้มเหลว กรุณาลองใหม่ครับ");
        } finally {
          searchInput.disabled = false; // ปลดล็อกช่องค้นหา
        }
      },
      (errorMessage) => {
        // 🌟 6. ซ่อนเฉพาะแจ้งเตือนหาโฟกัสภาพ แต่โชว์ Error หลัก
        if (!errorMessage.includes('NotFoundError')) {
         // console.warn("QR warning:", errorMessage);
        }
      }
    ).catch((err) => {
      console.error("Camera error:", err);
      isScannerMode = false;
      searchContainer.style.display = 'block';
      readerContainer.style.display = 'none';
      alert("❌ เปิดกล้องไม่ได้: กรุณากด 'อนุญาต' (Allow) กล้องในเบราว์เซอร์");
    });
  } else {
    searchContainer.style.display = 'block';
    readerContainer.style.display = 'none';
    await stopScanner(); // สั่งปิดกล้องแบบล้าง Memory และรีเซ็ตแฟลชทันที
  }
}
