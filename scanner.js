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
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE
        ]
      },
      (decodedText) => {
        searchInput.value = decodedText;
        toggleScanner(); // สแกนเสร็จ ปิดกล้องทันที
        handleMagicSearch(); // ดึงข้อมูลทันที
      },
      () => { /* ไม่ต้อง Log ระหว่างหาสัญญาณภาพ */ }
    ).catch(err => {
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
        html5QrCode = null;
      }).catch(err => console.log("Error stopping camera: ", err));
    }
  }
}
