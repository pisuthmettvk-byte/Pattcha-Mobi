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

// 1. ประกาศตัวแปรหน้าจอ 
const viewProductMovement = document.getElementById('productMovementView');
const viewTaskHub = document.getElementById('transferOutTaskHubView');
const viewDest = document.getElementById('transferOutDestView');
const viewLobby = document.getElementById('transferOutLobbyView');

// 2. ฟังก์ชันช่วยสลับหน้าจอ
function navigationTo(hideView, showView) {
    if (hideView) hideView.classList.add('hide');
    if (showView) showView.classList.remove('hide');
}

// จำลองฐานข้อมูลสาขาที่เปิดค้างไว้ (สำหรับด่าน 2 เช็กบ้านซ้ำ)
const activePendingBranches = ['B001']; 

// ฟังก์ชันเปิดเข้าบ้าน Lobby สาขา และเซ็ตหัวข้อ Dynamic
function enterLobby(branchFullName) {
    document.getElementById('lobbyBranchHeaderName').innerText = branchFullName;
    navigationTo(viewDest, viewLobby);
    
    // รีเซ็ตปุ่มกดยืนยัน Modal ให้กลับเป็นค่าเริ่มต้น
    document.getElementById('btnModalAlertOk').onclick = () => {
        document.getElementById('customAlertModal').classList.add('hide');
    };
}

// --- ⏩ โฟลว์ขาเดินหน้า (Forward Flow) ---

// หน้าแรกสุด -> ด่าน 1 (Task Hub)
document.getElementById('btnTransferOut').addEventListener('click', () => {
    navigationTo(viewProductMovement, viewTaskHub);
});

// ด่าน 1 -> ด่าน 2 (สร้างงานใหม่/เลือกสาขา)
document.getElementById('btnCreateNewTask').addEventListener('click', () => {
    document.getElementById('selectDestination').selectedIndex = 0;
    navigationTo(viewTaskHub, viewDest);
});

// ด่าน 2 -> ด่าน 3 (ตรวจความซ้ำซ้อน -> เข้าบ้าน Lobby สาขา)
document.getElementById('btnSubmitDest').addEventListener('click', () => {
    const destDropdown = document.getElementById('selectDestination');
    const selectedBranchValue = destDropdown.value;
    
    if (!selectedBranchValue) {
        showCustomAlert("ข้อมูลไม่ครบถ้วน", "กรุณาเลือกสาขาที่ต้องการสร้างงานก่อนครับ");
        return;
    }
    
    // เช็กเงื่อนไขถ้าเปิดบ้านค้างไว้แล้ว
    if (activePendingBranches.includes(selectedBranchValue)) {
        showCustomAlert(
            "สาขานี้เปิดใช้งานอยู่แล้ว", 
            "พบว่ามีการสร้างงานของสาขานี้ค้างไว้ ต้องการเข้าไปยังหน้าจัดการสาขาเลยหรือไม่?"
        );
        
        // ถ้ากด OK บน Custom Modal ให้ทะลุเข้าบ้านเก่าทันที
        document.getElementById('btnModalAlertOk').onclick = () => {
            document.getElementById('customAlertModal').classList.add('hide');
            enterLobby(destDropdown.options[destDropdown.selectedIndex].text);
        };
    } else {
        // ถ้าเป็นสาขาใหม่ เข้าบ้านได้เลย
        enterLobby(destDropdown.options[destDropdown.selectedIndex].text);
    }
});

// --- ⏪ โฟลว์ขากดย้อนกลับ (Backward Flow) ---

// จากด่าน 2 (เลือกสาขา) กดยกเลิก -> ถอยกลับด่าน 1 (Task Hub)
document.getElementById('btnBackFromDest').addEventListener('click', () => {
    navigationTo(viewDest, viewTaskHub);
});

// จากด่าน 3 (Lobby สาขา) กดยกเลิก -> ถอยกลับด่าน 1 (Task Hub)
document.getElementById('btnCancelFromLobby').addEventListener('click', () => {
    navigationTo(viewLobby, viewTaskHub);
});

// ปุ่มรถบรรทุก + สำหรับกดสร้างชิปเมนต์ใหม่ในด่านถัดไป
document.getElementById('btnAddShipmentTruck').addEventListener('click', () => {
    console.log("เตรียมวิ่งเข้าหน้าระบุ Reason เพื่อสร้างหัวคอลัมน์ชิปเมนต์");
});



// =========================================================
// 🌟 [CONTROL STATE LOGIC] ปุ่ม EXPORT ล็อกสีตามสถานะติ๊กกล่อง
// =========================================================

const mainShipmentCheckbox = document.getElementById('selectAllBoxesInShipment');
const childBoxCheckboxes = document.querySelectorAll('.box-select-checkbox');
const exportBtn = document.getElementById('btnExportShipment');

// ฟังก์ชันสำหรับคำนวณและอัปเดตสี/สถานะของปุ่มส่งออก
function updateExportButtonState() {
    // นับจำนวนกล่องลูกที่ถูกติ๊กเลือกอยู่ ณ ปัจจุบัน
    const checkedCount = document.querySelectorAll('.box-select-checkbox:checked').length;
    
    if (checkedCount > 0) {
        // หากมีกล่องถูกเลือกอย่างน้อย 1 กล่อง ➔ เปิดระบบปุ่ม เปลี่ยนเป็นสีน้ำเงินตามแบรนด์
        exportBtn.disabled = false;
        exportBtn.style.background = '#007bff';
        exportBtn.style.color = '#ffffff';
        exportBtn.style.cursor = 'pointer';
    } else {
        // หากไม่มีการเลือกเลย ➔ ปิดระบบ ล็อกสีเทา
        exportBtn.disabled = true;
        exportBtn.style.background = '#cccccc';
        exportBtn.style.color = '#666666';
        exportBtn.style.cursor = 'not-allowed';
    }
}

// 1. ลอจิกเมื่อกด Checkbox ตัวแม่ที่แถบหัวข้อชิปเมนต์ (ติ๊กเลือกทั้งหมด / ล้างทั้งหมด)
mainShipmentCheckbox.addEventListener('change', function() {
    const isChecked = this.checked;
    childBoxCheckboxes.forEach(cb => {
        cb.checked = isChecked;
    });
    updateExportButtonState();
});

// 2. ลอจิกเมื่อพนักงานกดติ๊กเลือกกล่องลูกรายตัว
childBoxCheckboxes.forEach(cb => {
    cb.addEventListener('change', function() {
        // ถ้ากล่องลูกถูกติ๊กไม่ครบทุกอัน ให้ถอนติ๊กตัวแม่ชั่วคราว
        const totalCount = childBoxCheckboxes.length;
        const checkedCount = document.querySelectorAll('.box-select-checkbox:checked').length;
        
        mainShipmentCheckbox.checked = (totalCount === checkedCount);
        updateExportButtonState();
    });
});