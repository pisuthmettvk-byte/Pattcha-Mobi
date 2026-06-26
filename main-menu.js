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
   [ ระบบนำทาง TRANSFER OUT : FINAL MOBILE UI ]
   ========================================================= */

// 1. ประกาศตัวแปรหน้าจอ
const viewProductMovement = document.getElementById('productMovementView');
const viewTaskHub = document.getElementById('transferOutTaskHubView');
const viewStaff = document.getElementById('transferOutStaffView');
const viewDest = document.getElementById('transferOutDestView');
const viewType = document.getElementById('transferOutTypeView');
const viewLobby = document.getElementById('transferOutLobbyView');

// 2. ฟังก์ชันโชว์แจ้งเตือนของเราเอง (Custom Modal)
function showCustomAlert(title, message, isSuccess = false) {
    const modal = document.getElementById('customAlertModal');
    const header = document.getElementById('modalAlertHeader');
    const icon = document.getElementById('modalAlertIcon');
    
    document.getElementById('modalAlertTitle').innerText = title;
    document.getElementById('modalAlertMessage').innerHTML = message; // ใช้ innerHTML เพื่อรองรับการขึ้นบรรทัดใหม่
    
    if (isSuccess) {
        header.style.background = '#28a745'; // สีเขียว
        icon.className = 'fas fa-check-circle';
    } else {
        header.style.background = '#dc3545'; // สีแดง
        icon.className = 'fas fa-exclamation-circle';
    }
    
    modal.classList.remove('hide');
}

// ผูกปุ่มปิด Modal
document.getElementById('btnModalAlertOk').addEventListener('click', () => {
    document.getElementById('customAlertModal').classList.add('hide');
});

// 3. ฟังก์ชันสลับหน้าจอ
function navigationTo(hideView, showView) {
    if (hideView) hideView.classList.add('hide');
    if (showView) showView.classList.remove('hide');
}

// --- ⏩ โฟลว์ขาเดินหน้า ---
document.getElementById('btnTransferOut').addEventListener('click', () => {
    navigationTo(viewProductMovement, viewTaskHub);
});

document.getElementById('btnCreateNewTask').addEventListener('click', () => {
    navigationTo(viewTaskHub, viewStaff);
});

document.getElementById('btnSubmitStaff').addEventListener('click', () => {
    if (document.getElementById('inputStaffId').value.trim() === "") {
        showCustomAlert("ข้อมูลไม่ครบถ้วน", "กรุณากรอกรหัสประจำตัวพนักงานก่อนไปขั้นตอนถัดไปครับ");
        return;
    }
    navigationTo(viewStaff, viewDest);
});

document.getElementById('btnSubmitDest').addEventListener('click', () => {
    if (!document.getElementById('selectDestination').value) {
        showCustomAlert("ข้อมูลไม่ครบถ้วน", "กรุณาเลือกสาขาหรือสถานที่ปลายทางก่อนครับ");
        return;
    }
    navigationTo(viewDest, viewType);
});

document.getElementById("btnSubmitType").addEventListener("click", () => {
  const selectedType = document.getElementById("selectTransferType").value;
  const selectedBranch = document.getElementById("selectDestination").value;

  if (!selectedType) {
    showCustomAlert(
      "ข้อมูลไม่ครบถ้วน",
      "กรุณาระบุวัตถุประสงค์ในการจัดส่งก่อนครับ",
    );
    return;
  }

  const generatedShipmentId = `SM-${selectedType}-${selectedBranch.split(" - ")[0]}-260626-01`;

  showCustomAlert(
    "สร้างรายการสำเร็จ",
    `ระบบได้เริ่มดำเนินการแล้ว<br><br><strong style="font-size: 18px; color: #333;">${generatedShipmentId}</strong><br><br>กรุณากดตกลงเพื่อเข้าสู่หน้าจัดการกล่อง`,
    true,
  );

  document.getElementById("displayShipmentId").innerText = generatedShipmentId;

  // 🌟 ข้อ 5: เคลียร์ค่าข้อมูลอินพุตของทั้ง 3 ด่านออกให้เกลี้ยงหลังการใช้งาน
  document.getElementById("inputStaffId").value = "";
  document.getElementById("selectDestination").selectedIndex = 0;
  document.getElementById("selectTransferType").selectedIndex = 0;

  navigationTo(viewType, viewLobby);
});

// การกดปุ่ม + (FAB) เพื่อสร้างกล่อง
document.getElementById('btnCreateBoxFab').addEventListener('click', () => {
    // โค้ดสำหรับวิ่งเข้าหน้าสแกนเนอร์ (Screen 5) จะอยู่ตรงนี้
    console.log("พุ่งเข้าหน้าสแกนของลงกล่อง!");
});


// --- ⏪ โฟลว์ขากดย้อนกลับ ---
document.getElementById('btnBackFromTaskHub').addEventListener('click', () => {
    navigationTo(viewTaskHub, viewProductMovement);
});
document.getElementById('btnBackFromStaff').addEventListener('click', () => {
    navigationTo(viewStaff, viewTaskHub);
});
document.getElementById('btnBackFromDest').addEventListener('click', () => {
    navigationTo(viewDest, viewStaff);
});
document.getElementById('btnBackFromType').addEventListener('click', () => {
    navigationTo(viewType, viewDest);
});
document.getElementById('btnBackFromLobbyActive').addEventListener('click', () => {
    navigationTo(viewLobby, viewTaskHub); // กลับไปหน้าศูนย์รวมงาน
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