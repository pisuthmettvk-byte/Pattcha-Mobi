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




// =========================================================
// MODULE: TRANSFER OUT - FLOW MANAGEMENT (Pattcha-Mobi)
// =========================================================

// --- [โฟลว์เดินหน้า - Forward Flow] ---

// หน้าแรก (Product Movement) -> เข้าด่าน 1 (Task Hub)
const btnTransferOut = document.getElementById('btnTransferOut');
if (btnTransferOut) {
    btnTransferOut.addEventListener('click', () => {
        navigationTo(viewProductMovement, viewTaskHub);
    });
}

// ด่าน 1 (Task Hub) -> ด่าน 2 (Select Branch)
const btnCreateNewTask = document.getElementById('btnCreateNewTask') || document.getElementById('btnNewTask');
if (btnCreateNewTask) {
    btnCreateNewTask.addEventListener('click', () => {
        const selectDest = document.getElementById('selectDestination');
        if (selectDest) selectDest.selectedIndex = 0; // รีเซ็ต Dropdown
        navigationTo(viewTaskHub, viewDest);
    });
}

// กดที่แถบรายการชิ้นงาน (Task Item) -> พาทะลุเข้าด่าน 3 (Lobby)
document.querySelectorAll('.task-list-item, .pending-task-row').forEach(row => {
    row.addEventListener('click', function() {
        const textContainer = this.querySelector('div');
        if (textContainer) {
            // ดึงข้อความสาขาปลายทางมาแสดงบนหัวของหน้า Lobby
            const branchInfo = textContainer.innerText.split('\n')[1] || "สาขาปลายทาง";
            const lobbyHeader = document.getElementById('lobbyBranchHeaderName');
            if (lobbyHeader) lobbyHeader.innerText = branchInfo;
        }
        navigationTo(viewTaskHub, viewLobby);
    });
});

// ด่าน 2 (Select Branch) -> ด่าน 3 (Lobby) [ซ่อมแซมลอจิกสมบูรณ์]
const btnSubmitDest = document.getElementById('btnSubmitDest') || document.getElementById('btnNextDest');
if (btnSubmitDest) {
    btnSubmitDest.addEventListener('click', () => {
        const destDropdown = document.getElementById('selectDestination');
        if (!destDropdown || !destDropdown.value) {
            safeAlert("ข้อมูลไม่ครบถ้วน", "กรุณาเลือกสาขาที่ต้องการสร้างงานก่อนครับ");
            return;
        }
        
        // 🔒 [LOCKED PROTOCOL]: ปลดบล็อก False Positive ปล่อยผ่านเข้าหน้า Lobby ของสาขานั้นโดยตรง
        const selectedBranchText = destDropdown.options[destDropdown.selectedIndex].text;
        const lobbyHeader = document.getElementById('lobbyBranchHeaderName');
        if (lobbyHeader) lobbyHeader.innerText = selectedBranchText;
        
        navigationTo(viewDest, viewLobby);
    });
}


// --- [โฟลว์ถอยหลัง - Backward Flow] ---

// ด่าน 1 (Task Hub) -> กลับหน้าเมนูหลัก (Product Movement)
const btnBackFromTaskHub = document.getElementById('btnBackToMovement') || document.getElementById('btnBackFromTaskHub');
if (btnBackFromTaskHub) {
    btnBackFromTaskHub.addEventListener('click', () => {
        navigationTo(viewTaskHub, viewProductMovement);
    });
}

// ด่าน 2 (Select Branch) -> ถอยกลับด่าน 1 (Task Hub)
const btnBackFromDest = document.getElementById('btnCancelDest') || document.getElementById('btnBackFromDest');
if (btnBackFromDest) {
    btnBackFromDest.addEventListener('click', () => {
        navigationTo(viewDest, viewTaskHub);
    });
}

// 🔒 [LOCKED PROTOCOL] ด่าน 3 (Lobby) -> ถอยกลับด่าน 1 (ซ่อมแซมส่วนที่หายไป)
const btnCancelFromLobby = document.getElementById('btnCancelFromLobby') || document.getElementById('btnBackToDest');
if (btnCancelFromLobby) {
    btnCancelFromLobby.addEventListener('click', () => {
        navigationTo(viewLobby, viewTaskHub);
    });
}

// =========================================================
// MODULE: SHIPMENT LOBBY & SETUP (จัดการปุ่มในด่าน 3)
// =========================================================

// 🌟 ประกาศตัวแปรทั้งหมดแค่ "ครั้งเดียว" (แก้บั๊ก Duplicate Const)
const btnSubmitLobby = document.getElementById('btnSubmitLobby'); 
const btnAddShipmentTruck = document.getElementById('btnAddShipmentTruck');
const shipmentBoxModal = document.getElementById('shipmentBoxModal');
const btnCancelBox = document.getElementById('btnCancelBox');
const btnConfirmBox = document.getElementById('btnConfirmBox');

// --- 1. จัดการปุ่ม "ส่งออก" (เมื่อข้อมูลพร้อม) ---
if (btnSubmitLobby) {
    btnSubmitLobby.addEventListener('click', () => {
        // 1.1 แพ็คข้อมูลจำลอง (Mock Payload)
        const branchLabel = document.getElementById('lobbyBranchHeaderName');
        const mockPayload = {
            docNo: "TO-" + Date.now(),
            branch: branchLabel ? branchLabel.innerText : "Unknown",
            boxCount: 1,
            itemCount: 5,
            isExpress: false // สมมติว่าดึงค่ามาจากปุ่ม Toggle หน้าจอ
        };

        // 1.2 โยนเข้าเต้ารับ (Dispatcher API) อย่างปลอดภัย
        if (typeof dispatchTransferOutData === "function") {
            dispatchTransferOutData(mockPayload);
        } else {
            console.warn("🚨 [System] ยังไม่ได้เชื่อมต่อไฟล์ data-connector.js");
        }

        // 1.3 ปิดจ๊อบ กลับไปหน้าแรก (แก้บั๊กชื่อฟังก์ชันผิดจาก safeNavigate เป็น navigationTo)
        navigationTo(viewLobby, viewTaskHub);
    });
}

// --- 2. จัดการปุ่ม + รถบรรทุก (สร้าง Shipment) ---
// เปิดหน้าต่าง Modal
if (btnAddShipmentTruck) {
    btnAddShipmentTruck.addEventListener('click', () => {
        const reasonSelect = document.getElementById('selectShipmentReason');
        if (reasonSelect) reasonSelect.selectedIndex = 0; // รีเซ็ตค่า
        if (shipmentBoxModal) shipmentBoxModal.classList.remove('hide');
    });
}

// กดยกเลิก Modal -> ปิดหน้าต่าง
if (btnCancelBox) {
    btnCancelBox.addEventListener('click', () => {
        if (shipmentBoxModal) shipmentBoxModal.classList.add('hide');
    });
}

// กดยืนยันสร้าง Shipment จาก Modal
if (btnConfirmBox) {
    btnConfirmBox.addEventListener('click', () => {
        const reasonSelect = document.getElementById('selectShipmentReason');
        
        // เช็คเงื่อนไขก่อนสร้าง
        if (reasonSelect && !reasonSelect.value) {
            safeAlert("ข้อมูลไม่ครบถ้วน", "กรุณาเลือกประเภทการส่งออกก่อนครับ");
            return; 
        }

        // ปิดหน้าต่าง Modal
        if (shipmentBoxModal) shipmentBoxModal.classList.add('hide');

        // ปลดล็อกปุ่มส่งออกด้านล่างให้เป็นสีฟ้า (พร้อมใช้งาน)
        if (btnSubmitLobby) {
            btnSubmitLobby.disabled = false;
            btnSubmitLobby.style.background = "linear-gradient(135deg, #007bff 0%, #0056b3 100%)";
            btnSubmitLobby.style.color = "white";
            btnSubmitLobby.style.cursor = "pointer";
            btnSubmitLobby.style.border = "none";
        }
    });
}



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