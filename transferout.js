//======================
//TRANSFER OUT TASK
//======================

// [START] TRANSFER OUT TASK - INITIALIZATION
window.to_task_init = function () {
  // [START] TRANSFER OUT TASK - VIEW VARIABLES
  // ระบุตัวแปรหน้าจอที่ต้องใช้งานใน Flow นี้
  const viewMovement = document.getElementById("productMovementView"); // หน้าเมนูก่อนหน้า
  const viewTaskHub = document.getElementById("transferOutTaskHubView"); // หน้าปัจจุบัน (Task Hub)
  const viewDest = document.getElementById("transferOutDestView"); // หน้าเลือกสาขาปลายทาง
  // [END] TRANSFER OUT TASK - VIEW VARIABLES

  // [START] TRANSFER OUT TASK - BUTTON VARIABLES
  // ระบุตัวแปรปุ่มกด
  const btnBackToMovement = document.getElementById("btnBackToMovement");
  const btnCreateNewTask = document.getElementById("btnCreateNewTask");
  // [END] TRANSFER OUT TASK - BUTTON VARIABLES

  // [START] TRANSFER OUT TASK - BACK BUTTON LOGIC
  // ลอจิกปุ่ม BACK: ถอยกลับไปยังหน้าเมนู Movement
  if (btnBackToMovement) {
    btnBackToMovement.addEventListener("click", () => {
      if (typeof window.navigationTo === "function") {
        window.navigationTo(viewTaskHub, viewMovement);
      }
    });
  }
  // [END] TRANSFER OUT TASK - BACK BUTTON LOGIC

  // [START] TRANSFER OUT TASK - NEW TASK BUTTON LOGIC
  // ลอจิกปุ่ม NEW TASK: เดินหน้าเข้าสู่หน้าจอเลือกสาขา
  if (btnCreateNewTask) {
    btnCreateNewTask.addEventListener("click", () => {
      // รีเซ็ตค่า Dropdown เลือกสาขา (ถ้ามี) ให้กลับเป็นค่าเริ่มต้น (Index 0)
      const selectDest = document.getElementById("selectDestination");
      if (selectDest) selectDest.selectedIndex = 0;

      // สลับหน้าจอไปยังหน้าเลือกสาขา
      if (typeof window.navigationTo === "function") {
        window.navigationTo(viewTaskHub, viewDest);
      }
    });
  }
  // [END] TRANSFER OUT TASK - NEW TASK BUTTON LOGIC
};
// [END] TRANSFER OUT TASK - INITIALIZATION

// [START] TRANSFER OUT TASK - DOM CONTENT LOADED EVENT
// สั่งให้ลอจิกทั้งหมดของ TRANSFER OUT TASK ทำงานเมื่อโหลดหน้าจอเสร็จ
document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.to_task_init === "function") {
    window.to_task_init();
  }
});
// [END] TRANSFER OUT TASK - DOM CONTENT LOADED EVENT
