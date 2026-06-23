// ==========================================
// 🌟 SCANNER MASTER CONFIGURATION & STATE
// ==========================================
let html5QrCode = null;
let isScannerRunning = false;
let isTransitioning = false;
let currentScanMode = "BARCODE";
let isFlashOn = false;
let lastExecutionTime = 0;

// 🌟 ระบบป้องกันคำสั่งเบิ้ลซ้อนกันข้ามไฟล์ (Debounce Guard สำหรับ onclick + addEventListener)
function preventDoubleTrigger() {
  const now = Date.now();
  if (now - lastExecutionTime < 350) return true; // หากกดซ้อนกันใน 350ms ให้บล็อกคำสั่งที่สองทันที
  lastExecutionTime = now;
  return false;
}

// ==========================================
// 🌟 1. ฟังก์ชันเปิดกล้อง (อัปเกรดระบบ Auto-Fallback กันกล้องค้าง)
// ==========================================
async function startScanner() {
  if (preventDoubleTrigger() || isScannerRunning || isTransitioning) return;
  isTransitioning = true; // ล็อกป้ายไฟ

  const searchInput = document.getElementById("searchStockInput");
  if (searchInput) {
    searchInput.value = "";
    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
  }

  try {
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    try {
      // ด่านที่ 1: พยายามเปิดกล้องหลังก่อน (สำหรับมือถือ)
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
      );
    } catch (camErr) {
      console.warn(
        "กล้องหลังไม่พร้อมใช้งาน สลับไปใช้กล้องหน้า/เว็บแคมแทน...",
        camErr,
      );
      // ด่านที่ 2: ถ้าไม่มีกล้องหลัง (เช่น เปิดบนคอมพิวเตอร์) ให้บังคับเปิดกล้องหน้าแทน
      await html5QrCode.start(
        { facingMode: "user" },
        config,
        qrCodeSuccessCallback,
      );
    }

    isScannerRunning = true; // เปิดกล้องติดจริงๆ ค่อยสลับสถานะ

    // โชว์ UI กล้องให้ลอยขึ้นมา
    const scanView = document.getElementById("scannerView");
    if (scanView) scanView.classList.add("active");
  } catch (err) {
    console.error("ระบบกล้องถูกปฏิเสธโดยสมบูรณ์:", err);
    isScannerRunning = false; // 🛑 ถ้ารันไม่ผ่านเลย ต้องกู้สถานะกลับ
  } finally {
    isTransitioning = false; // 🛑 ปลดล็อกปุ่มเสมอ เพื่อไม่ให้แอปค้าง
  }
}

// ==========================================
// 🌟 2. ฟังก์ชันปิดกล้อง (อัปเกรดให้สั่งเคลียร์ UI ได้แม้ฮาร์ดแวร์จะรวน)
// ==========================================
async function stopScanner() {
  if (preventDoubleTrigger() || isTransitioning) return;
  isTransitioning = true;

  try {
    if (html5QrCode) {
      try {
        // ลองสั่งหยุดเลนส์กล้อง
        await html5QrCode.stop();
      } catch (stopErr) {
        // หากกล้องไม่ได้เปิดอยู่ ให้ข้ามไปล้าง UI ได้เลย ไม่ต้อง Error พังทั้งแอป
        console.warn("ข้ามการหยุดฮาร์ดแวร์ เนื่องจากกล้องไม่ได้เปิดอยู่");
      }
      html5QrCode.clear(); // ล้างกรอบบาร์โค้ด
    }
  } catch (err) {
    console.warn("Stop scanner error:", err);
  } finally {
    isScannerRunning = false; // บังคับสลับสถานะกลับเป็นปิด
    forceResetUI(); // สั่งพับหน้าจอกล้องเก็บเสมอ

    const scanView = document.getElementById("scannerView");
    if (scanView) scanView.classList.remove("active");

    isTransitioning = false; // ปลดล็อก
  }
}

function forceResetUI() {
  isScannerRunning = false;
  isFlashOn = false;

  const readerContainer = document.getElementById("readerContainer");
  const stockScrollArea = document.getElementById("stockScrollArea");
  if (readerContainer) readerContainer.style.display = "none";
  if (stockScrollArea) stockScrollArea.classList.remove("hide");

  const btnFlash = document.getElementById("btnToggleFlash");
  if (btnFlash) {
    btnFlash.style.color = "#fff";
    btnFlash.style.borderColor = "#fff";
  }

  // ซ่อนกรอบเล็งจำลองออกไปเมื่อปิดกล้อง
  const customOverlay = document.getElementById("custom-scan-border");
  if (customOverlay) customOverlay.style.display = "none";
}

// ==========================================
// ✅ 3. ฟังก์ชันควบคุมสากล ปลอดภัย ไร้รอยต่อ 100%
// ==========================================
async function toggleScanner() {
  // 🛡️ ป้องกันการกดซ้ำซ้อนในขณะที่กล้องกำลังเปลี่ยนสถานะ (จังหวะโหลดฮาร์ดแวร์)
  if (preventDoubleTrigger() || isTransitioning) return;

  if (isScannerRunning) {
    await stopScanner(); // 🌟 บังคับให้ระบบรอจนเลนส์และเซนเซอร์ดับสนิทจริง
  } else {
    await startScanner(); // 🌟 บังคับให้ระบบเปิดตัวสแกนเนอร์และเซตโฟกัสให้เสร็จสิ้นก่อนรับคำสั่งถัดไป
  }
}

// 🌐 ส่งออกฟังก์ชันไปที่ window เพื่อให้ไฟล์ app.js เรียกใช้งานข้ามระบบได้สมบูรณ์
window.toggleScanner = toggleScanner;

async function toggleFlash() {
  if (preventDoubleTrigger()) return;
  if (!isScannerRunning || !html5QrCode) return;

  try {
    const videoElement = document.querySelector("#reader video");
    if (videoElement && videoElement.srcObject) {
      const videoTrack = videoElement.srcObject.getVideoTracks()[0];
      if (videoTrack) {
        isFlashOn = !isFlashOn;
        await videoTrack.applyConstraints({ advanced: [{ torch: isFlashOn }] });

        const btnFlash = document.getElementById("btnToggleFlash");
        if (btnFlash) {
          btnFlash.style.color = isFlashOn ? "#fab919" : "#fff";
          btnFlash.style.borderColor = isFlashOn ? "#fab919" : "#fff";
        }
      }
    }
  } catch (err) {
    console.warn(
      "Direct hardware flash approach failed, fallback to core:",
      err,
    );
    try {
      isFlashOn = !isFlashOn;
      await html5QrCode.applyVideoConstraints({ torch: isFlashOn });
    } catch (e) {
      isFlashOn = false;
    }
  }
}

function toggleScanMode() {
  if (preventDoubleTrigger()) return;

  currentScanMode = currentScanMode === "BARCODE" ? "QR" : "BARCODE";

  const textEl = document.getElementById("scanModeText");
  const iconEl = document.getElementById("scanModeIcon");
  if (textEl) textEl.innerText = currentScanMode;
  if (iconEl)
    iconEl.className =
      currentScanMode === "BARCODE" ? "fas fa-barcode" : "fas fa-qrcode";

  if (isScannerRunning) {
    updateScanRegionUI();
  }
}

// 🌟 ฟังก์ชันจัดการกรอบสีขาวจำลอง ปรับทรง Barcode / QR ได้อย่างนุ่มนวล สบายตา 100%
function updateScanRegionUI() {
  const reader = document.getElementById("reader");
  if (!reader) return;

  let customOverlay = document.getElementById("custom-scan-border");
  if (!customOverlay) {
    reader.style.position = "relative";
    customOverlay = document.createElement("div");
    customOverlay.id = "custom-scan-border";
    customOverlay.style.position = "absolute";
    customOverlay.style.top = "50%";
    customOverlay.style.left = "50%";
    customOverlay.style.transform = "translate(-50%, -50%)";
    customOverlay.style.border = "3px solid #fff";
    customOverlay.style.borderRadius = "12px";
    customOverlay.style.boxShadow = "0 0 0 5000px rgba(0, 0, 0, 0.5)"; // ทำแรเงาขอบมืดรอบด้านนอก
    customOverlay.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    customOverlay.style.pointerEvents = "none";
    customOverlay.style.zIndex = "99";
    reader.appendChild(customOverlay);
  }

  customOverlay.style.display = "block";
  if (currentScanMode === "BARCODE") {
    customOverlay.style.width = "85%";
    customOverlay.style.height = "130px"; // เปลี่ยนเป็นสี่เหลี่ยมผืนผ้าแนวนอนรับแถบบาร์โค้ด
  } else {
    customOverlay.style.width = "230px";
    customOverlay.style.height = "230px"; // เปลี่ยนเป็นสี่เหลี่ยมจัตุรัสรับแผ่น QR
  }
}

function injectScannerCSS() {
  if (document.getElementById("scanner-core-css")) return;
  const style = document.createElement("style");
  style.id = "scanner-core-css";
  style.innerHTML = `
    #reader__scan_region { display:none !important; }
    #reader__dashboard { display:none !important; }
    #reader video { width: 100% !important; height: 100% !important; object-fit: cover !important; }
  `;
  document.head.appendChild(style);
}

// ==========================================
// 4. ผูกการทำงานระบบ (Event Listeners ป้องกันรันซ้ำ)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // บล็อกตรวจสิทธิ์ปุ่มกู้ระบบ ถ้าปุ่มไม่มีสิทธิ์ onclick ฝังอยู่ จะเปิดใช้งานดักฟังตรงนี้ให้ทันทีอย่างปลอดภัย
  const btnOpen = document.getElementById("btnScannerOpen");
  if (btnOpen && !btnOpen.getAttribute("onclick")) {
    btnOpen.addEventListener("click", toggleScanner);
  }

  const btnMode = document.getElementById("btnToggleScanMode");
  if (btnMode && !btnMode.getAttribute("onclick")) {
    btnMode.addEventListener("click", toggleScanMode);
  }

  const btnFlash = document.getElementById("btnToggleFlash");
  if (btnFlash && !btnFlash.getAttribute("onclick")) {
    btnFlash.addEventListener("click", toggleFlash);
  }

  // ปุ่ม Quick Scan เมนูหลัก
  document.getElementById("btnMenuQuickScan")?.addEventListener("click", () => {
    setTimeout(() => {
      startScanner();
    }, 350);
  });

  // ปุ่ม BACK คืนค่าปิดกล้องทุกกรณี
  document.getElementById("btnStockBack")?.addEventListener("click", () => {
    stopScanner();
  });
});
