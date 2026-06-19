
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
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");

    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        searchInput.value = decodedText;
        toggleScanner(); 
        handleMagicSearch(); 
      },
      () => {}
    ).catch(err => {
      isScannerMode = false;
      searchContainer.style.display = 'block';
      readerContainer.style.display = 'none';
      alert("❌ เปิดกล้องไม่ได้");
    });
  } else {
    searchContainer.style.display = 'block';
    readerContainer.style.display = 'none';
    if (html5QrCode) html5QrCode.stop().then(() => html5QrCode.clear()).catch(err => console.log(err));
  }
}
