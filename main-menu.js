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


// ประกาศให้ระบบรู้จักหน้าต่างทั้ง 4 หน้า (ห้ามลบ 4 บรรทัดนี้นะครับ!)
const viewProductMovement = document.getElementById('productMovementView');
const viewTaskHub = document.getElementById('transferOutTaskHubView');
const viewDest = document.getElementById('transferOutDestView');
const viewLobby = document.getElementById('transferOutLobbyView');



// 🌟 เพิ่มความสมูทในการเปลี่ยนหน้า (Fade in/out เล็กน้อย)
function navigationTo(hideView, showView) {
    if (hideView) {
        hideView.style.opacity = '0'; // สั่งจางลง
        setTimeout(() => {
            hideView.classList.add('hide');
            if (showView) {
                showView.classList.remove('hide');
                showView.style.opacity = '0';
                // หน่วงเวลานิดนึงให้ DOM วาดเสร็จแล้วค่อย Fade in
                setTimeout(() => {
                    showView.style.transition = 'opacity 0.15s ease-in-out';
                    showView.style.opacity = '1';
                }, 10);
            }
        }, 150); // รอ 150ms ให้หน้าจอเก่าจางหายไปก่อน
    }
}

// 🌟 ฟังก์ชันแจ้งเตือนที่ปลอดภัย 100% (กันระบบพังถ้าหา Modal ไม่เจอ)
function safeAlert(title, message) {
    const modal = document.getElementById('customAlertModal');
    if (modal) {
        // ถ้ามี Custom Modal ให้ใช้ของหรู
        const header = document.getElementById('modalAlertHeader');
        const icon = document.getElementById('modalAlertIcon');
        document.getElementById('modalAlertTitle').innerText = title;
        document.getElementById('modalAlertMessage').innerHTML = message;
        header.style.background = '#dc3545';
        icon.className = 'fas fa-exclamation-circle';
        modal.classList.remove('hide');
    } else {
        // ถ้าหาไม่เจอ ให้ใช้ Alert มาตรฐานของ Browser (ป้องกัน JS ช็อก)
        alert(title + "\n\n" + message.replace(/<br>/g, '\n'));
    }
}

// ฐานข้อมูลสาขาที่เปิดค้างไว้
const activePendingBranches = ['B001']; 

function enterLobby(branchFullName) {
    document.getElementById('lobbyBranchHeaderName').innerText = branchFullName;
    navigationTo(viewDest, viewLobby);
    const modalBtn = document.getElementById('btnModalAlertOk');
    if(modalBtn) modalBtn.onclick = () => { document.getElementById('customAlertModal').classList.add('hide'); };
}

// ================= ⏩ โฟลว์เดินหน้า =================

// หน้าแรก -> เข้า Task Hub
document.getElementById('btnTransferOut').addEventListener('click', () => {
    navigationTo(viewProductMovement, viewTaskHub);
});

// ด่าน 1 -> ด่าน 2
document.getElementById('btnCreateNewTask').addEventListener('click', () => {
    document.getElementById('selectDestination').selectedIndex = 0;
    navigationTo(viewTaskHub, viewDest);
});

// 🌟 แก้บั๊ก: กดที่แถบรายการ Pending แล้วต้องพาทะลุเข้า Lobby
document.querySelectorAll('.pending-task-row').forEach(row => {
    row.addEventListener('click', function() {
        // ดึงชื่อจาก div ด้านในมาใช้ (ดึงข้อความสาขา)
        const branchName = this.querySelector('div').innerText;
        document.getElementById('lobbyBranchHeaderName').innerText = branchName;
        navigationTo(viewTaskHub, viewLobby);
    });
});

// ด่าน 2 -> ด่าน 3 (พร้อมระบบแจ้งเตือนที่ซ่อมแล้ว)
document.getElementById('btnSubmitDest').addEventListener('click', () => {
    const destDropdown = document.getElementById('selectDestination');
    const selectedBranchValue = destDropdown.value;
    
    if (!selectedBranchValue) {
        safeAlert("ข้อมูลไม่ครบถ้วน", "กรุณาเลือกสาขาที่ต้องการสร้างงานก่อนครับ");
        return;
    }
    
    if (activePendingBranches.includes(selectedBranchValue)) {
        safeAlert("สาขานี้เปิดใช้งานอยู่แล้ว", "พบว่ามีการสร้างงานของสาขานี้ค้างไว้ ต้องการเข้าไปยังหน้าจัดการสาขาเลยหรือไม่?");
        
        const modalBtn = document.getElementById('btnModalAlertOk');
        if(modalBtn) {
            modalBtn.onclick = () => {
                document.getElementById('customAlertModal').classList.add('hide');
                enterLobby(destDropdown.options[destDropdown.selectedIndex].text);
            };
        }
    } else {
        enterLobby(destDropdown.options[destDropdown.selectedIndex].text);
    }
});

// ================= ⏪ โฟลว์ถอยหลัง =================

// 🌟 แก้บั๊ก: ปุ่มถอยหลังจาก Task Hub กลับไป Product Movement
document.getElementById('btnBackFromTaskHub').addEventListener('click', () => {
    navigationTo(viewTaskHub, viewProductMovement);
});

// กดยกเลิกจาก ด่าน 2 -> กลับ ด่าน 1
document.getElementById('btnBackFromDest').addEventListener('click', () => {
    navigationTo(viewDest, viewTaskHub);
});

// กดยกเลิกจาก ด่าน 3 -> กลับ ด่าน 1
document.getElementById('btnCancelFromLobby').addEventListener('click', () => {
    navigationTo(viewLobby, viewTaskHub);
});

// ปุ่มรถบรรทุก (FAB) -> อนาคต
document.getElementById('btnAddShipmentTruck').addEventListener('click', () => {
    console.log("เตรียมวิ่งเข้าด่าน 4: ระบุ Reason สร้างหัวรถบรรทุก!");
    // โค้ดสำหรับเด้งหน้าต่างระบุ Reason จะอยู่ตรงนี้
});



// =========================================================
// 🌟 [CONTROL STATE LOGIC] ปุ่ม EXPORT ล็อกสีตามสถานะติ๊กกล่อง
// =========================================================

const mainShipmentCheckbox = document.getElementById('selectAllBoxesInShipment');
const childBoxCheckboxes = document.querySelectorAll('.box-select-checkbox');
const exportBtn = document.getElementById('btnExportShipment');

// ฟังก์ชันสำหรับคำนวณและอัปเดตสี/สถานะของปุ่มส่งออก
function updateExportButtonState() {
    const checkedCount = document.querySelectorAll('.box-select-checkbox:checked').length;
    
    // ป้องกัน Error ถ้าหาปุ่ม Export ไม่เจอ
    if (!exportBtn) return; 

    if (checkedCount > 0) {
        exportBtn.disabled = false;
        exportBtn.style.background = '#007bff';
        exportBtn.style.color = '#ffffff';
        exportBtn.style.cursor = 'pointer';
    } else {
        exportBtn.disabled = true;
        exportBtn.style.background = '#cccccc';
        exportBtn.style.color = '#666666';
        exportBtn.style.cursor = 'not-allowed';
    }
}

// 1. ลอจิกเมื่อกด Checkbox ตัวแม่ (ใส่ IF ป้องกัน Error ถ้าไม่มี Checkbox ในหน้าจอ)
if (mainShipmentCheckbox) {
    mainShipmentCheckbox.addEventListener('change', function() {
        const isChecked = this.checked;
        childBoxCheckboxes.forEach(cb => {
            cb.checked = isChecked;
        });
        updateExportButtonState();
    });
}

// 2. ลอจิกเมื่อพนักงานกดติ๊กเลือกกล่องลูกรายตัว (ทำงานเฉพาะเมื่อมีกล่องลูก)
if (childBoxCheckboxes.length > 0) {
    childBoxCheckboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            const totalCount = childBoxCheckboxes.length;
            const checkedCount = document.querySelectorAll('.box-select-checkbox:checked').length;
            
            if (mainShipmentCheckbox) {
                mainShipmentCheckbox.checked = (totalCount === checkedCount);
            }
            updateExportButtonState();
        });
    });
}