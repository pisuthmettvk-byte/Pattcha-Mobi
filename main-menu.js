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
        subMenus.forEach(btn => {
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
