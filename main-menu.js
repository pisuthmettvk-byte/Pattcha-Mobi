// ==========================================
// [MODULE 1: CORE UTILITIES & GLOBAL SETTINGS]
// หน้าที่: ฟังก์ชันพื้นฐานทั้งหมดที่ใช้ร่วมกันทั่วทั้งระบบ (ป๊อปอัปแจ้งเตือน และ คำนวณระบบ)
// ==========================================

//===============
// [Global System Utilities] START



//📍 [แจ้งเตือนแบบป๊อปอัป 3 สี]
window.safeAlert = function (title, message, type = "error") {
  const overlay = document.createElement("div");
  overlay.className = "sys-alert-element";
  overlay.style.cssText =
    "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1000006; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(3px);";



  let headerBg, iconClass, btnBg, btnText;
  if (type === "success") {
    headerBg = "#28a745";
    iconClass = "fas fa-check-circle";
    btnBg = "#28a745";
    btnText = "white";
  } else if (type === "warning" || type === "question") {
    headerBg = "#ffc107";
    iconClass = "fas fa-exclamation-circle";
    btnBg = "#ffc107";
    btnText = "#000";
  } else {
    headerBg = "#dc3545";
    iconClass = "fas fa-exclamation-triangle";
    btnBg = "#dc3545";
    btnText = "white";
  }

  overlay.innerHTML = `
    <div style="background: white; width: 90%; max-width: 350px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); overflow: hidden; display: flex; flex-direction: column; animation: popIn 0.3s ease-out;">
      <div style="background: ${headerBg}; padding: 20px; text-align: center;">
        <i class="${iconClass}" style="font-size: 40px; color: white;"></i>
      </div>
      <div style="padding: 25px 20px; text-align: center;">
        <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #333;">${title}</h3>
        <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">${message}</p>
      </div>
      <div style="padding: 15px; background: #f8f9fa; border-top: 1px solid #eee; display: flex; justify-content: center;">
        <button class="btn-ok" style="background: ${btnBg}; color: ${btnText}; border: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); width: 100%;">รับทราบ</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay
    .querySelector(".btn-ok")
    .addEventListener("click", () => document.body.removeChild(overlay));
};




//📍 [หน้าต่างยืนยันการทำรายการ]
window.safeConfirm = function (title, message, onConfirm, type = "question") {
  const overlay = document.createElement("div");
  overlay.className = "sys-alert-element";
  overlay.style.cssText =
    "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1000006; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(3px);";

  let headerBg, iconClass, btnBg, btnText;
  if (type === "delete" || type === "error") {
    headerBg = "#dc3545";
    iconClass = "fas fa-exclamation-triangle";
    btnBg = "#dc3545";
    btnText = "white";
  } else {
    headerBg = "#ffc107";
    iconClass = "fas fa-question-circle";
    btnBg = "#ffc107";
    btnText = "#000";
  }

  overlay.innerHTML = `
    <div style="background: white; width: 90%; max-width: 350px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); overflow: hidden; display: flex; flex-direction: column;">
      <div style="background: ${headerBg}; padding: 20px; text-align: center;">
        <i class="${iconClass}" style="font-size: 40px; color: white;"></i>
      </div>
      <div style="padding: 25px 20px; text-align: center;">
        <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #333;">${title}</h3>
        <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">${message}</p>
      </div>
      <div style="padding: 15px; background: #f8f9fa; border-top: 1px solid #eee; display: flex; justify-content: space-between; gap: 10px;">
        <button class="btn-cancel" style="background: #6c757d; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; flex: 1;">ยกเลิก</button>
        <button class="btn-confirm" style="background: ${btnBg}; color: ${btnText}; border: none; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; flex: 1; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">ตกลง</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay
    .querySelector(".btn-cancel")
    .addEventListener("click", () => document.body.removeChild(overlay));
  overlay.querySelector(".btn-confirm").addEventListener("click", () => {
    document.body.removeChild(overlay);
    onConfirm();
  });
};


// ---🔍 [ลอจิกรันเลข Audit วันที่]
window.getFormattedDate = function () {
  const d = new Date();
  const yy = String(d.getFullYear()).substring(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return yy + mm + dd;
};


// ---🔍 [ลอจิกรับรหัสสาขาจริงและพรางตัวรหัส]
window.getRealBranchCode = function (branchId) {
  const branchCodeMap = { B001: "CKC01", B002: "KKN02", B003: "ICS03" };
  return branchCodeMap[branchId] || "UNKN";
};


// ---🔍 [ลอจิกพรางตัวรหัสสาขา]
window.obfuscateBranchCode = function (code) {
  if (!code || code === "UNKN") return "00XX";
  const clean = code.replace(/[^a-zA-Z0-9]/g, "");
  if (clean.length < 4) return clean;
  return (
    clean.substring(clean.length - 2) + clean.substring(0, 2).toUpperCase()
  );
};

// [Global System Utilities] END
//===============


// ==========================================
// [MODULE 2: NAVIGATION & MENU ROUTING]
// หน้าที่: ควบคุมการเปลี่ยนหน้าจอและการนำทางทั้งหมดในแอปพลิเคชัน
// ==========================================

//===============
// [System Navigation Controller] START

//📍 [ลอจิกซ่อน-แสดงหน้าจอพร้อม Animation + อัปเกรดคืนชีพ Header/โลโก้/กระดิ่งอัตโนมัติ]
window.navigationTo = function (hideView, showView) {
  if (hideView) {
    hideView.style.opacity = "0";
    setTimeout(() => {
      hideView.classList.add("hide");
      if (showView) {
        showView.classList.remove("hide");
        showView.style.opacity = "0";
        setTimeout(() => {
          showView.style.transition = "opacity 0.15s ease-in-out";
          showView.style.opacity = "1";
        }, 10);

        // 🌟 [จุดอัปเกรด]: ตรวจสอบอัตโนมัติว่า ถ้ากำลังจะกลับมาหน้า Main Menu หรือ Task Hub
        // ให้บังคับเปิด Header (โลโก้ + กระดิ่ง 🔔) กลับมาแสดงผลเหมือนเดิมทันทีทุกครั้ง!
        const sharedHeader = document.getElementById("sharedHeader");
        const mainMenuView = document.getElementById("mainMenuView");
        
        if (sharedHeader) {
            // ถ้าหน้าจอเป้าหมายคือหน้า Main Menu ให้ดัน Header ไปไว้ข้างบนสุด
            if (showView === mainMenuView || showView.id === "mainMenuView") {
                sharedHeader.classList.remove("hide");
                sharedHeader.classList.remove("header-center");
                sharedHeader.classList.add("header-top");
            } 
            // ถ้าเป็นหน้าจอเมนูย่อยอื่นๆ ที่ไม่ใช่หน้า Login ให้โชว์ Header ไว้ตามปกติ
            else if (showView.id !== "loginView") {
                sharedHeader.classList.remove("hide");
            }
        }
      }
    }, 150);
  }
};

// ไปวางในไฟล์ เมนูกลาง (menu.js หรือ app.js)
document.addEventListener("DOMContentLoaded", () => {
  const mainMenuView = document.getElementById("mainMenuView");
  const productMovementView = document.getElementById("productMovementView");
  const sharedHeader = document.getElementById("sharedHeader");

  const btnMenuMovement = document.getElementById("btnMenuMovement");
  const btnBackToMain = document.getElementById("btnBackToMain");

  // แอนิเมชันตอนกดเข้าเมนู Movement
  if (btnMenuMovement) {
    btnMenuMovement.addEventListener("click", () => {
      document.getElementById("btnMenuStock")?.classList.add("anim-shrink-fade");
      sharedHeader?.classList.add("anim-shrink-fade");
      btnMenuMovement.classList.add("anim-move-up");
      setTimeout(() => {
        mainMenuView?.classList.add("hide");
        sharedHeader?.classList.add("hide");
        productMovementView?.classList.remove("hide");
      }, 400);
    });
  }

// แอนิเมชันตอนกดย้อนกลับหน้าหลัก (แทนที่ด้วยอันนี้ครับ)
  if (btnBackToMain) {
    btnBackToMain.addEventListener("click", () => {
      productMovementView?.classList.add("hide");

      if (sharedHeader) {
        sharedHeader.classList.remove("hide", "header-center", "anim-shrink-fade");
        sharedHeader.classList.add("header-top");
        sharedHeader.style.opacity = "1";
      }

      document.getElementById("btnMenuStock")?.classList.remove("anim-shrink-fade");
      btnMenuMovement?.classList.remove("anim-move-up");

      if (mainMenuView) {
        mainMenuView.classList.remove("hide", "fade-out");
        mainMenuView.style.opacity = "0";
        setTimeout(() => {
          mainMenuView.style.transition = "opacity 0.3s ease-in-out";
          mainMenuView.style.opacity = "1";
          mainMenuView.classList.add("fade-in");
        }, 10);
      }
    });
  }