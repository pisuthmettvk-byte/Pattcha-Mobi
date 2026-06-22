// ==========================================
// 🌟 SCANNER CONFIGURATION & STATE
// ==========================================
let html5QrCode = null;
let isScannerRunning = false;
let isTransitioning = false; 
let currentScanMode = "BARCODE"; 
let isFlashOn = false;

// ==========================================
// 1. ฟังก์ชันเปิดกล้อง (Start Scanner)
// ==========================================
async function startScanner() {
  if (isTransitioning || isScannerRunning) return;
  isTransitioning = true; 

  try {
    const readerContainer = document.getElementById("readerContainer");
    const stockScrollArea = document.getElementById("stockScrollArea");
    if (readerContainer) readerContainer.style.display = "block";
    if (stockScrollArea) stockScrollArea.classList.add("hide");

    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }

    const formats = currentScanMode === "BARCODE"
      ? [Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8, Html5QrcodeSupportedFormats.UPC_A]
      : [Html5QrcodeSupportedFormats.QR_CODE];

    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: currentScanMode === "BARCODE" ? 120 : 250 },
        formatsToSupport: formats,
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
      (errorMessage) => { /* ข้าม Error ระหว่างเล็งภาพ */ }
    );

    isScannerRunning = true;

  } catch (err) {
    console.error("Camera start failed:", err);
    alert("ไม่สามารถเปิดกล้องได้ โปรดตรวจสอบสิทธิ์ครับ");
  } finally {
    isTransitioning = false; 
  }
}

// ==========================================
// 2. ฟังก์ชันปิดกล้อง (Stop Scanner)
// ==========================================
async function stopScanner() {
  if (isTransitioning || !isScannerRunning) return;
  isTransitioning = true;

  try {
    await html5QrCode.stop();
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

  } catch (err) {
    console.error("Camera stop failed:", err);
  } finally {
    isTransitioning = false;
  }
}

// ==========================================
// 3. ผูกคำสั่งควบคุมกับปุ่มหน้างาน
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  
  // 🔘 ปุ่มหลักเปิด/ปิดกล้องด้านล่าง
  document.getElementById("btnScannerOpen")?.addEventListener("click", () => {
    if (isScannerRunning) { stopScanner(); } else { startScanner(); }
  });

  // 🔘 ปุ่มสลับโหมด BARCODE / QR CODE
  document.getElementById("btnToggleScanMode")?.addEventListener("click", async () => {
    if (isTransitioning) return;

    currentScanMode = currentScanMode === "BARCODE" ? "QR" : "BARCODE";

    const textEl = document.getElementById("scanModeText");
    const iconEl = document.getElementById("scanModeIcon");
    if (textEl) textEl.innerText = currentScanMode;
    if (iconEl) iconEl.className = currentScanMode === "BARCODE" ? "fas fa-barcode" : "fas fa-qrcode";

    if (isScannerRunning) {
      await stopScanner();
      await startScanner();
    }
  });

  // 🔘 ปุ่มควบคุมไฟแฟลช
  document.getElementById("btnToggleFlash")?.addEventListener("click", async () => {
    if (!isScannerRunning || isTransitioning) return;

    try {
      isFlashOn = !isFlashOn;
      await html5QrCode.applyVideoConstraints({ torch: isFlashOn });

      const btnFlash = document.getElementById("btnToggleFlash");
      if (btnFlash) {
        btnFlash.style.color = isFlashOn ? "#fab919" : "#fff";
        btnFlash.style.borderColor = isFlashOn ? "#fab919" : "#fff";
      }
    } catch (err) {
      console.warn("อุปกรณ์ไม่รองรับไฟแฟลช:", err);
      isFlashOn = false;
    }
  });
});

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
