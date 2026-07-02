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

//📍 [ลอจิกซ่อน-แสดงหน้าจอพร้อม Animation]
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
      }
    }, 150);
  }
};

// ---🔍 [ผูก Event การกดปุ่มเมนูเข้าออกหน้าต่างๆ ทั้งระบบ]
document.addEventListener("DOMContentLoaded", () => {
  const mainMenuView = document.getElementById("mainMenuView");
  const productMovementView = document.getElementById("productMovementView");
  const viewTaskHub = document.getElementById("transferOutTaskHubView");
  const viewDest = document.getElementById("transferOutDestView");
  const viewLobby = document.getElementById("transferOutLobbyView");
  const sharedHeader = document.getElementById("sharedHeader");

  const btnMenuMovement = document.getElementById("btnMenuMovement");
  const btnBackToMain = document.getElementById("btnBackToMain");

  if (btnMenuMovement) {
    btnMenuMovement.addEventListener("click", () => {
      document
        .getElementById("btnMenuStock")
        ?.classList.add("anim-shrink-fade");
      sharedHeader?.classList.add("anim-shrink-fade");
      btnMenuMovement.classList.add("anim-move-up");
      setTimeout(() => {
        mainMenuView?.classList.add("hide");
        sharedHeader?.classList.add("hide");
        productMovementView?.classList.remove("hide");
      }, 400);
    });
  }

  if (btnBackToMain) {
    btnBackToMain.addEventListener("click", () => {
      productMovementView?.classList.add("hide");
      mainMenuView?.classList.remove("hide");
      sharedHeader?.classList.remove("hide");
      document
        .getElementById("btnMenuStock")
        ?.classList.remove("anim-shrink-fade");
      btnMenuMovement?.classList.remove("anim-move-up");
    });
  }

  document
    .getElementById("btnTransferOut")
    ?.addEventListener("click", () =>
      navigationTo(productMovementView, viewTaskHub),
    );
  document
    .getElementById("btnBackToMovement")
    ?.addEventListener("click", () =>
      navigationTo(viewTaskHub, productMovementView),
    );
  document
    .getElementById("btnBackFromTaskHub")
    ?.addEventListener("click", () =>
      navigationTo(viewTaskHub, productMovementView),
    );
  document
    .getElementById("btnCancelDest")
    ?.addEventListener("click", () => navigationTo(viewDest, viewTaskHub));
  document
    .getElementById("btnBackFromDest")
    ?.addEventListener("click", () => navigationTo(viewDest, viewTaskHub));
  document
    .getElementById("btnCancelFromLobby")
    ?.addEventListener("click", () => navigationTo(viewLobby, viewTaskHub));
  document
    .getElementById("btnBackToDest")
    ?.addEventListener("click", () => navigationTo(viewLobby, viewTaskHub));

  const btnCreateNewTask =
    document.getElementById("btnCreateNewTask") ||
    document.getElementById("btnNewTask");
  if (btnCreateNewTask) {
    btnCreateNewTask.addEventListener("click", () => {
      const selectDest = document.getElementById("selectDestination");
      if (selectDest) selectDest.selectedIndex = 0;
      navigationTo(viewTaskHub, viewDest);
    });
  }

  document
    .querySelectorAll(".task-list-item, .pending-task-row")
    .forEach((row) => {
      row.addEventListener("click", function () {
        const textContainer = this.querySelector("div");
        if (textContainer) {
          const branchInfo =
            textContainer.innerText.split("\n")[1] || "สาขาปลายทาง";
          const lobbyHeader = document.getElementById("lobbyBranchHeaderName");
          if (lobbyHeader) lobbyHeader.innerText = branchInfo;
        }
        navigationTo(viewTaskHub, viewLobby);
      });
    });

  const btnSubmitDest =
    document.getElementById("btnSubmitDest") ||
    document.getElementById("btnNextDest");
  if (btnSubmitDest) {
    btnSubmitDest.addEventListener("click", () => {
      const destDropdown = document.getElementById("selectDestination");
      if (!destDropdown || !destDropdown.value) {
        safeAlert(
          "ข้อมูลไม่ครบถ้วน",
          "กรุณาเลือกสาขาที่ต้องการสร้างงานก่อนครับ",
        );
        return;
      }
      const lobbyHeader = document.getElementById("lobbyBranchHeaderName");
      if (lobbyHeader)
        lobbyHeader.innerText =
          destDropdown.options[destDropdown.selectedIndex].text;
      navigationTo(viewDest, viewLobby);
    });
  }
});

// [System Navigation Controller] END
//===============





/* ======================================================
   ฟังก์ชันกลางสำหรับสร้าง Card Task (Universal Card Factory)
   ใช้ได้ทุกหน้าในระบบ START
   ====================================================== */
function createUniversalCard(branchName, docNo, status = 'pending') {
    
    // 1. ตั้งค่าสีตามสถานะ
    const colorMap = {
        'pending': '#dc3545', // สีแดง (ตามที่เจเลอร์ชอบ)
        'done': '#28a745',    // สีเขียว
        'issue': '#ffc107'    // สีเหลือง/ส้ม
    };

    const borderColor = colorMap[status] || '#ccc';

    // 2. สร้างโครงสร้าง Card
    const card = document.createElement('div');
    card.className = 'task-list-item';
    card.style.cssText = `
        width: 100%; 
        border-left: 6px solid ${borderColor}; 
        border-bottom: 1px solid #e0e0e0; 
        padding: 15px 20px; 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        background: white;
        cursor: pointer;
    `;

    // 3. ใส่เนื้อหาข้างใน
    card.innerHTML = `
        <div style="text-align: left;">
            <div style="font-weight: bold; font-size: 14px; color: #333;">Doc No: ${docNo}</div>
            <span style="font-size: 12px; color: #777;">คลังสินค้ากลาง -> ${branchName}</span>
        </div>
        <i class="fas fa-chevron-right" style="color: #ccc; font-size: 14px;"></i>
    `;

    // 4. เพิ่มลูกเล่นให้คลิกได้
    card.addEventListener('click', () => {
        console.log(`Clicked on: ${docNo}`);
    });

    return card;
}

/* ======================================================
   ฟังก์ชันกลางสำหรับสร้าง Card Task (Universal Card Factory)
   ใช้ได้ทุกหน้าในระบบ END
   ====================================================== */






//======================================================
// START ฟังก์ชัน  สร้างรหัส  SHIPMENT (SHIPMENT ID GENERATE )
//====================================================== 

async function generateSmartShipmentID(typeKey, targetBranchID) {
    // 1. ดึงวันที่ (YYMMDD)
    const dateStamp = new Date().toISOString().slice(2, 10).replace(/-/g, ''); 
    
    // 2. ดึงประเภท (ถ้า typeKey คือ 'TO' จะได้รหัสอย่างเช่น 'TO')
    // เจเลอร์สามารถดึงค่าจาก Object Config ที่โหลดมาได้เลย
    const typeCode = Config.transferTypes[typeKey] || "TO"; 
    
    // 3. กำหนด Source และ Target ตาม Pattern ที่ต้องการ
    const sourcePart = `01${currentBranch}`;
    const targetPart = `02${targetBranchID}`;
    
    // 4. Sequence (แนะนำให้บวกเพิ่มในอนาคต: ดึงเลขจาก Sheets)
    const sequence = "001"; 
    
    // ประกอบร่าง
    return `${dateStamp}-${sourcePart}-${targetPart}-${typeCode}-${sequence}`;
}

//======================================================
// END ฟังก์ชัน  สร้างรหัส  SHIPMENT (SHIPMENT ID GENERATE )
//====================================================== 
