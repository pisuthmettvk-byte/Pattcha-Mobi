let html5QrCode = null;
let isScannerMode = false;

function toggleScanner() {
  const searchContainer = document.getElementById('searchContainer');
  const readerContainer = document.getElementById('readerContainer');
  const searchInput = document.getElementById('searchStockInput');
  
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
        fps: 30, // 🌟 อัปเกรดความเร็ว: เร่งการจับภาพเป็น 30 เฟรม/วินาที (สแกนไวขึ้น 3 เท่า)
        qrbox: { width: 280, height: 120 }, // 🌟 อัปเกรดกรอบสแกน: เป็นสี่เหลี่ยมผืนผ้าแนวนอน เข้ากับบาร์โค้ดสินค้า
        disableFlip: false // 🌟 ช่วยให้อ่านบาร์โค้ดที่กลับหัวได้
      },
      (decodedText) => {
        searchInput.value = decodedText;
        toggleScanner(); // สแกนเสร็จ ปิดกล้องทันที
        handleMagicSearch(); // ดึงข้อมูลทันที
      },
      (errorMessage) => { /* ซ่อน Error จุกจิกเวลากล้องกำลังโฟกัส */ }
    ).catch((err) => {
      console.error(err);
      isScannerMode = false;
      searchContainer.style.display = 'block';
      readerContainer.style.display = 'none';
      alert("❌ เปิดกล้องไม่ได้: กรุณากด 'อนุญาต' (Allow) กล้องในเบราว์เซอร์");
    });
  } else {
    searchContainer.style.display = 'block';
    readerContainer.style.display = 'none';
    
    if (html5QrCode) {
      html5QrCode.stop().then(() => {
        html5QrCode.clear();
        html5QrCode = null; // 🌟 คืนพื้นที่ Memory ให้ iPhone ป้องกันแอปค้าง
      }).catch(err => console.log("Error stopping camera: ", err));
    }
  }
}
