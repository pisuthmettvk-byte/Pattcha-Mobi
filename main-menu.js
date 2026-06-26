// ==========================================
// MODULE 1: จัดการระบบเมนูหลักและการแจ้งเตือน (ของเดิม)
// ==========================================
function mockReceiveSignal(hasPendingDelivery, qty = 0) {
  const badge = document.getElementById("badgeInbound");
  const countDisplay = badge.querySelector(".badge-count");
  if (!badge || !countDisplay) return;

  if (hasPendingDelivery) {
    badge.classList.remove("hide");
    countDisplay.innerText = qty;
  } else {
    badge.classList.add("hide");
  }
}

/* ==========================================
   MODULE 2: MAIN MENU NAVIGATION CONTROLLER
========================================== */
document.addEventListener("DOMContentLoaded", () => {
  const mainMenuView = document.getElementById("mainMenuView");
  const productMovementView = document.getElementById("productMovementView");

  // 🌟 เพิ่มตัวแปร sharedHeader (หัวใจของปัญหา)
  const sharedHeader = document.getElementById("sharedHeader");

  const btnMenuStock = document.getElementById("btnMenuStock");
  const btnMenuMovement = document.getElementById("btnMenuMovement");
  const btnBackToMain = document.getElementById("btnBackToMain");

  // 🌟 กดเข้าสู่หน้า PRODUCT MOVEMENT
  if (btnMenuMovement) {
    btnMenuMovement.addEventListener("click", () => {
      // 1. สั่งปุ่มอื่น ให้หดตัวจางหาย
      if (btnMenuStock) btnMenuStock.classList.add("anim-shrink-fade");

      // 🌟 2. สั่งให้ sharedHeader (และโลโก้ที่อยู่ข้างใน) เฟดหายไปด้วย!
      if (sharedHeader) sharedHeader.classList.add("anim-shrink-fade");

      // 3. สั่งปุ่มตัวเองลอยขึ้น (ตอนนี้จะเห็นชัดแล้ว เพราะไม่มี Header มาบัง)
      btnMenuMovement.classList.add("anim-move-up");

      setTimeout(() => {
        // สลับหน้าจอ
        mainMenuView.classList.add("hide");
        productMovementView.classList.remove("hide");

        // 🌟 4. ซ่อน sharedHeader ทิ้งไปเลย เพื่อไม่ให้กวนพื้นที่หน้าต่างใหม่
        if (sharedHeader) sharedHeader.classList.add("hide");

        const subMenus = productMovementView.querySelectorAll(".menu-card");
        subMenus.forEach((btn) => {
          btn.classList.remove("anim-pop-out");
          void btn.offsetWidth;
          btn.classList.add("anim-pop-out");
        });
      }, 400);
    });
  }

  // 🌟 กดปุ่ม ❮ BACK ถอยกลับ
  if (btnBackToMain) {
    btnBackToMain.addEventListener("click", () => {
      // สลับหน้าจอกลับ
      productMovementView.classList.add("hide");
      mainMenuView.classList.remove("hide");

      // 🌟 5. เปิด sharedHeader กลับมา
      if (sharedHeader) sharedHeader.classList.remove("hide");

      // เคลียร์อนิเมชั่นทิ้งให้หมด
      if (btnMenuStock) btnMenuStock.classList.remove("anim-shrink-fade");
      if (btnMenuMovement) btnMenuMovement.classList.remove("anim-move-up");

      // 🌟 6. ล้างอนิเมชั่นให้ sharedHeader เพื่อให้โลโก้กลับมาโชว์ปกติ
      if (sharedHeader) sharedHeader.classList.remove("anim-shrink-fade");
    });
  }
});

/* =========================================================
   [ ระบบนำทาง TRANSFER OUT (Navigation Logic เต็มรูปแบบ) ]
   ========================================================= */

// 1. ประกาศตัวแปรอ้างอิงหน้า
const viewProductMovement = document.getElementById('productMovementView');
const viewLobby = document.getElementById('transferOutLobbyView');
const viewStaff = document.getElementById('transferOutStaffView');
const viewDest = document.getElementById('transferOutDestView');
const viewType = document.getElementById('transferOutTypeView');

// 2. ฟังก์ชันช่วยสลับหน้าจอ (ซ่อนหน้าเก่า โชว์หน้าใหม่)
function navigationTo(hideView, showView) {
    if (hideView) hideView.classList.add('hide');
    if (showView) showView.classList.remove('hide');
}

// --- ⏩ โฟลว์ขาเดินหน้า (Forward Flow) ---
document.getElementById('btnTransferOut').addEventListener('click', () => {
    navigationTo(viewProductMovement, viewLobby);
});

document.getElementById('btnTransferOutNew').addEventListener('click', () => {
    navigationTo(viewLobby, viewStaff);
});

// *หมายเหตุ: หากกดจากปุ่ม NEW BRANCH ในโหมดมีงานค้าง ก็ให้ไปหน้า Staff เหมือนกัน
document.getElementById('btnAddNewFromLobbyActive').addEventListener('click', () => {
    navigationTo(viewLobby, viewStaff);
});

document.getElementById('btnSubmitStaff').addEventListener('click', () => {
    if (document.getElementById('inputStaffId').value.trim() === "") {
        alert("กรุณากรอกรหัสพนักงานก่อนครับ");
        return;
    }
    navigationTo(viewStaff, viewDest);
});

document.getElementById('btnSubmitDest').addEventListener('click', () => {
    if (!document.getElementById('selectDestination').value) {
        alert("กรุณาเลือกสาขาปลายทางก่อนครับ");
        return;
    }
    navigationTo(viewDest, viewType);
});

document.getElementById('btnSubmitType').addEventListener('click', () => {
    const selectedType = document.getElementById('selectTransferType').value;
    const selectedBranch = document.getElementById('selectDestination').value;
    
    if (!selectedType) {
        alert("กรุณาระบุวัตถุประสงค์ในการจัดส่งก่อนครับ");
        return;
    }
    
    alert(`สร้างรหัส Shipment: SM-${selectedType}-${selectedBranch}-260626-01 สำเร็จ!\n(เตรียมเข้าหน้าสแกนสินค้า)`);
    
    // ทริกเกอร์เปลี่ยนหน้าโถงกลางให้กลายเป็นโหมดมีงานค้างอัตโนมัติ (เพื่อการทดสอบ)
    document.getElementById('lobbyEmptyContainer').classList.add('hide');
    document.getElementById('footerEmptyControl').classList.add('hide');
    document.getElementById('lobbyActiveContainer').classList.remove('hide');
    document.getElementById('footerActiveControl').classList.remove('hide');
    
    navigationTo(viewType, viewLobby);
});

// --- ⏪ ระบบปุ่มกดย้อนกลับ (Seamless Backward Flow) ---
document.getElementById('btnBackFromLobbyEmpty').addEventListener('click', () => {
    navigationTo(viewLobby, viewProductMovement);
});

document.getElementById('btnBackFromLobbyActive').addEventListener('click', () => {
    navigationTo(viewLobby, viewProductMovement);
});

document.getElementById('btnBackFromStaff').addEventListener('click', () => {
    navigationTo(viewStaff, viewLobby);
});

document.getElementById('btnBackFromDest').addEventListener('click', () => {
    navigationTo(viewDest, viewStaff);
});

document.getElementById('btnBackFromType').addEventListener('click', () => {
    navigationTo(viewType, viewDest);
});

