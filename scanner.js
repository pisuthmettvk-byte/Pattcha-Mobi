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

        await stopScanner(); // 🌟 5. สั่งปิดกล้องให้สนิทก่อน
        
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
          console.warn("QR warning:", errorMessage);
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
    await stopScanner(); // สั่งปิดกล้องแบบล้าง Memory ทันที
  }
}
