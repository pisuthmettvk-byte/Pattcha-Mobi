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

// 1. ประกาศตัวแปรอ้างอิง Element หน้าจอต่างๆ
const viewProductMovement = document.getElementById("productMovementView");
const viewLobby = document.getElementById("transferOutLobbyView");
const viewStaff = document.getElementById("transferOutStaffView");
const viewDest = document.getElementById("transferOutDestView");

// 2. ฟังก์ชันส่วนกลางสำหรับสลับหน้าจออย่างปลอดภัย
function navigationTo(hideView, showView) {
  if (hideView) hideView.classList.add("hide");
  if (showView) showView.classList.remove("hide");
}

// 3. ผูกคำสั่งควบคุมปุ่มกดเดินหน้า (Forward Flow)
// 3.1 จากหน้าหลักเข้าสู่โถงกลาง Transfer Out
document.getElementById("btnTransferOut").addEventListener("click", () => {
  navigationTo(viewProductMovement, viewLobby);
});

// 3.2 จากโถงกลาง กด NEW ไปหน้ากรอกรหัสพนักงาน
document.getElementById("btnTransferOutNew").addEventListener("click", () => {
  navigationTo(viewLobby, viewStaff);
});

// 3.3 จากหน้ากรอกรหัสพนักงาน ไปหน้าเลือกสาขาปลายทาง
document.getElementById("btnSubmitStaff").addEventListener("click", () => {
  const staffIdInput = document.getElementById("inputStaffId").value.trim();
  if (staffIdInput === "") {
    alert("กรุณากรอกรหัสพนักงานก่อนไปขั้นตอนถัดไปครับ");
    return;
  }
  navigationTo(viewStaff, viewDest);
});

// 3.4 จากหน้าเลือกสาขา ยืนยันเปิดกล่องอัตโนมัติ (สเต็ปถัดไปจะเชื่อมกับหน้า Scanner)
document.getElementById("btnSubmitDest").addEventListener("click", () => {
  const selectedBranch = document.getElementById("selectDestination").value;
  if (!selectedBranch) {
    alert("กรุณาเลือกสาขาปลายทางก่อนครับ");
    return;
  }
  alert(
    `ระบบสร้างกล่องใบแรกของสาขา ${selectedBranch} สำเร็จ! (เตรียมเปิดกล้องสแกนสินค้า)`,
  );
  // โน้ต: เมื่อหน้า Scanner พร้อม ตรงนี้จะเปลี่ยนเป็นสั่งเปิดหน้ากล้องทันที
  navigationTo(viewDest, viewLobby); // ตัวอย่าง: เด้งกลับมาโถงกลางเพื่อดูผลลัพธ์ก่อน
});

// 4. ผูกคำสั่งควบคุมปุ่มกดย้อนกลับ (Seamless Back-tracking)
// 4.1 จากโถงกลาง ถอยกลับหน้า PRODUCT MOVEMENT
document.getElementById("btnBackFromLobby").addEventListener("click", () => {
  navigationTo(viewLobby, viewProductMovement);
});

// 4.2 จากหน้ากรอกรหัสพนักงาน ถอยกลับหน้าโถงกลาง
document.getElementById("btnBackFromStaff").addEventListener("click", () => {
  navigationTo(viewStaff, viewLobby);
});

// 4.3 จากหน้าเลือกสาขา ถอยกลับหน้ากรอกรหัสพนักงาน
document.getElementById("btnBackFromDest").addEventListener("click", () => {
  navigationTo(viewDest, viewStaff);
});
