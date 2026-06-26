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
   PROJECT: Pattcha-Mobi
   MODULE: Transfer Out Navigation Logic (Express Flow)
   ========================================================= */

// 1. ผูกตัวแปรหน้าจอ
const viewProductMovement = document.getElementById("productMovementView");
const viewLobby = document.getElementById("transferOutLobbyView");
const viewStaff = document.getElementById("transferOutStaffView");
const viewDest = document.getElementById("transferOutDestView");

// 2. ฟังก์ชันช่วยสลับหน้าจอ
function navigationTo(hideView, showView) {
  if (hideView) hideView.classList.add("hide");
  if (showView) showView.classList.remove("hide");
}

// --- โฟลว์ขาเดินหน้า (Forward Flow) ---
document.getElementById("btnTransferOut").addEventListener("click", () => {
  navigationTo(viewProductMovement, viewLobby);
});

document.getElementById("btnTransferOutNew").addEventListener("click", () => {
  navigationTo(viewLobby, viewStaff);
});

document.getElementById("btnSubmitStaff").addEventListener("click", () => {
  if (document.getElementById("inputStaffId").value.trim() === "") {
    alert("กรุณากรอกรหัสพนักงานก่อนครับ");
    return;
  }
  navigationTo(viewStaff, viewDest);
});

document.getElementById("btnSubmitDest").addEventListener("click", () => {
  if (!document.getElementById("selectDestination").value) {
    alert("กรุณาเลือกสาขาปลายทางก่อนครับ");
    return;
  }
  // เมื่อทำรายการเลือกสาขาจบเสร็จสิ้น ให้เปลี่ยนสถานะโถงกลางเป็นแบบมีงานค้างชั่วคราวเพื่อแสดงผลลัพธ์
  document.getElementById("lobbyEmptyContainer").classList.add("hide");
  document.getElementById("footerEmptyControl").classList.add("hide");
  document.getElementById("lobbyActiveContainer").classList.remove("hide");
  document.getElementById("footerActiveControl").classList.remove("hide");

  navigationTo(viewDest, viewLobby);
});

// --- 🛠️ ซ่อมแซมระบบปุ่มกดย้อนกลับ (Fixed Backward Flow) ---
// 4.1 ปุ่ม BACK จากโถงกลางหน้าว่างเปล่า ย้อนกลับหน้าแรกสุด
document
  .getElementById("btnBackFromLobbyEmpty")
  .addEventListener("click", () => {
    navigationTo(viewLobby, viewProductMovement);
  });

// 4.2 ปุ่ม BACK จากโถงกลางหน้ามีงานค้าง ย้อนกลับหน้าแรกสุด
document
  .getElementById("btnBackFromLobbyActive")
  .addEventListener("click", () => {
    navigationTo(viewLobby, viewProductMovement);
  });

// 4.3 ปุ่ม BACK จากหน้าสแกนรหัสพนักงาน ถอยกลับมาหน้าตั้งหลักโถงกลาง
document.getElementById("btnBackFromStaff").addEventListener("click", () => {
  navigationTo(viewStaff, viewLobby);
});

// 4.4 ปุ่ม BACK จากหน้าเลือกสาขาปลายทาง ถอยกลับมาหน้าสแกนรหัสพนักงาน
document.getElementById("btnBackFromDest").addEventListener("click", () => {
  navigationTo(viewDest, viewStaff);
});
