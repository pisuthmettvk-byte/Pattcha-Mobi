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
  [ ระบบนำทาง TRANSFER OUT : 2-TIER LOBBY (เวอร์ชันอัปเดต Task Hub) ]
   ========================================================= */

// 1. ประกาศตัวแปรอ้างอิงหน้า
const viewProductMovement = document.getElementById('productMovementView');
const viewTaskHub = document.getElementById('transferOutTaskHubView'); // 🌟 เพิ่มหน้า Task Hub
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

// ด่าน 1: เข้า Transfer Out ➔ เจอหน้า Task Hub
document.getElementById('btnTransferOut').addEventListener('click', () => {
    navigationTo(viewProductMovement, viewTaskHub);
});

// ด่าน 2: กดสร้างงานใหม่จาก Task Hub ➔ ไปหน้ากรอกพนักงาน
document.getElementById('btnCreateNewTask').addEventListener('click', () => {
    navigationTo(viewTaskHub, viewStaff);
});

// ด่าน 3: กรอกพนักงาน ➔ ไปหน้าเลือกสาขา
document.getElementById('btnSubmitStaff').addEventListener('click', () => {
    if (document.getElementById('inputStaffId').value.trim() === "") {
        alert("กรุณากรอกรหัสพนักงานก่อนครับ");
        return;
    }
    navigationTo(viewStaff, viewDest);
});

// ด่าน 4: เลือกสาขา ➔ ไปหน้าระบุประเภท
document.getElementById('btnSubmitDest').addEventListener('click', () => {
    if (!document.getElementById('selectDestination').value) {
        alert("กรุณาเลือกสาขาปลายทางก่อนครับ");
        return;
    }
    navigationTo(viewDest, viewType);
});

// ด่าน 5: เลือกประเภท ➔ จำลองเข้าหน้า Lobby จัดการกล่อง
document.getElementById('btnSubmitType').addEventListener('click', () => {
    const selectedType = document.getElementById('selectTransferType').value;
    const selectedBranch = document.getElementById('selectDestination').value;
    
    if (!selectedType) {
        alert("กรุณาระบุวัตถุประสงค์ในการจัดส่งก่อนครับ");
        return;
    }
    
    alert(`สร้างรหัส Shipment: SM-${selectedType}-${selectedBranch}-260626-01 สำเร็จ!\n(เตรียมเข้าหน้าสแกนสินค้า)`);
    
    // ทริกเกอร์เปลี่ยนหน้าโถงกล่องให้เป็นโหมด Active 
    document.getElementById('lobbyEmptyContainer').classList.add('hide');
    document.getElementById('footerEmptyControl').classList.add('hide');
    document.getElementById('lobbyActiveContainer').classList.remove('hide');
    document.getElementById('footerActiveControl').classList.remove('hide');
    
    // สลับจากหน้า Type เข้าหน้า Lobby
    navigationTo(viewType, viewLobby);
});

// --- ⏪ ระบบปุ่มกดย้อนกลับ (Seamless Backward Flow) ---

// ปุ่ม BACK จาก Task Hub ➔ ถอยกลับ Main Menu
document.getElementById('btnBackFromTaskHub').addEventListener('click', () => {
    navigationTo(viewTaskHub, viewProductMovement);
});

// ปุ่ม CANCEL จากหน้า Staff ➔ ถอยกลับ Task Hub
document.getElementById('btnBackFromStaff').addEventListener('click', () => {
    navigationTo(viewStaff, viewTaskHub);
});

// ปุ่ม BACK จากหน้า Dest ➔ ถอยกลับ Staff
document.getElementById('btnBackFromDest').addEventListener('click', () => {
    navigationTo(viewDest, viewStaff);
});

// ปุ่ม BACK จากหน้า Type ➔ ถอยกลับ Dest
document.getElementById('btnBackFromType').addEventListener('click', () => {
    navigationTo(viewType, viewDest);
});

// ปุ่ม BACK จากโถง Active Lobby ➔ ถอยกลับ Task Hub (เพื่อไปเลือกงานอื่น)
document.getElementById('btnBackFromLobbyActive').addEventListener('click', () => {
    navigationTo(viewLobby, viewTaskHub);
});

