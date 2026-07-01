// ==========================================
// [MODULE 1: CORE UTILITIES & GLOBAL SETTINGS]
// หน้าที่: ฟังก์ชันพื้นฐานทั้งหมดที่ใช้ร่วมกันทั่วทั้งระบบ (ป๊อปอัปแจ้งเตือน และ คำนวณระบบ)
// ==========================================

//===============
// [Global System Utilities] START

//📍 [แจ้งเตือนแบบป๊อปอัป 3 สี]
window.safeAlert = function (title, message, type = "error") {
  const overlay = document.createElement("div");
  overlay.className = "sys-alert-element";
  overlay.style.cssText =
    "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1000006; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(3px);";

  let headerBg, iconClass, btnBg, btnText;
  if (type === "success") {
    headerBg = "#28a745";
    iconClass = "fas fa-check-circle";
    btnBg = "#28a745";
    btnText = "white";
  } else if (type === "warning" || type === "question") {
    headerBg = "#ffc107";
    iconClass = "fas fa-exclamation-circle";
    btnBg = "#ffc107";
    btnText = "#000";
  } else {
    headerBg = "#dc3545";
    iconClass = "fas fa-exclamation-triangle";
    btnBg = "#dc3545";
    btnText = "white";
  }

  overlay.innerHTML = `
    <div style="background: white; width: 90%; max-width: 350px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); overflow: hidden; display: flex; flex-direction: column; animation: popIn 0.3s ease-out;">
      <div style="background: ${headerBg}; padding: 20px; text-align: center;">
        <i class="${iconClass}" style="font-size: 40px; color: white;"></i>
      </div>
      <div style="padding: 25px 20px; text-align: center;">
        <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #333;">${title}</h3>
        <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">${message}</p>
      </div>
      <div style="padding: 15px; background: #f8f9fa; border-top: 1px solid #eee; display: flex; justify-content: center;">
        <button class="btn-ok" style="background: ${btnBg}; color: ${btnText}; border: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); width: 100%;">รับทราบ</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay
    .querySelector(".btn-ok")
    .addEventListener("click", () => document.body.removeChild(overlay));
};

//📍 [หน้าต่างยืนยันการทำรายการ]
window.safeConfirm = function (title, message, onConfirm, type = "question") {
  const overlay = document.createElement("div");
  overlay.className = "sys-alert-element";
  overlay.style.cssText =
    "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1000006; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(3px);";

  let headerBg, iconClass, btnBg, btnText;
  if (type === "delete" || type === "error") {
    headerBg = "#dc3545";
    iconClass = "fas fa-exclamation-triangle";
    btnBg = "#dc3545";
    btnText = "white";
  } else {
    headerBg = "#ffc107";
    iconClass = "fas fa-question-circle";
    btnBg = "#ffc107";
    btnText = "#000";
  }

  overlay.innerHTML = `
    <div style="background: white; width: 90%; max-width: 350px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); overflow: hidden; display: flex; flex-direction: column;">
      <div style="background: ${headerBg}; padding: 20px; text-align: center;">
        <i class="${iconClass}" style="font-size: 40px; color: white;"></i>
      </div>
      <div style="padding: 25px 20px; text-align: center;">
        <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #333;">${title}</h3>
        <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">${message}</p>
      </div>
      <div style="padding: 15px; background: #f8f9fa; border-top: 1px solid #eee; display: flex; justify-content: space-between; gap: 10px;">
        <button class="btn-cancel" style="background: #6c757d; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; flex: 1;">ยกเลิก</button>
        <button class="btn-confirm" style="background: ${btnBg}; color: ${btnText}; border: none; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; flex: 1; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">ตกลง</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay
    .querySelector(".btn-cancel")
    .addEventListener("click", () => document.body.removeChild(overlay));
  overlay.querySelector(".btn-confirm").addEventListener("click", () => {
    document.body.removeChild(overlay);
    onConfirm();
  });
};

// ---🔍 [ลอจิกรันเลข Audit วันที่]
window.getFormattedDate = function () {
  const d = new Date();
  const yy = String(d.getFullYear()).substring(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return yy + mm + dd;
};

// ---🔍 [ลอจิกรับรหัสสาขาจริงและพรางตัวรหัส]
window.getRealBranchCode = function (branchId) {
  const branchCodeMap = { B001: "CKC01", B002: "KKN02", B003: "ICS03" };
  return branchCodeMap[branchId] || "UNKN";
};

// ---🔍 [ลอจิกพรางตัวรหัสสาขา]
window.obfuscateBranchCode = function (code) {
  if (!code || code === "UNKN") return "00XX";
  const clean = code.replace(/[^a-zA-Z0-9]/g, "");
  if (clean.length < 4) return clean;
  return (
    clean.substring(clean.length - 2) + clean.substring(0, 2).toUpperCase()
  );
};

// [Global System Utilities] END
//===============

// ==========================================
// [MODULE 2: NAVIGATION & MENU ROUTING]
// หน้าที่: ควบคุมการเปลี่ยนหน้าจอและการนำทางทั้งหมดในแอปพลิเคชัน
// ==========================================

//===============
// [System Navigation Controller] START

//📍 [ลอจิกซ่อน-แสดงหน้าจอพร้อม Animation]
window.navigationTo = function (hideView, showView) {
  if (hideView) {
    hideView.style.opacity = "0";
    setTimeout(() => {
      hideView.classList.add("hide");
      if (showView) {
        showView.classList.remove("hide");
        showView.style.opacity = "0";
        setTimeout(() => {
          showView.style.transition = "opacity 0.15s ease-in-out";
          showView.style.opacity = "1";
        }, 10);
      }
    }, 150);
  }
};

// ---🔍 [ผูก Event การกดปุ่มเมนูเข้าออกหน้าต่างๆ ทั้งระบบ]
document.addEventListener("DOMContentLoaded", () => {
  const mainMenuView = document.getElementById("mainMenuView");
  const productMovementView = document.getElementById("productMovementView");
  const viewTaskHub = document.getElementById("transferOutTaskHubView");
  const viewDest = document.getElementById("transferOutDestView");
  const viewLobby = document.getElementById("transferOutLobbyView");
  const sharedHeader = document.getElementById("sharedHeader");

  const btnMenuMovement = document.getElementById("btnMenuMovement");
  const btnBackToMain = document.getElementById("btnBackToMain");

  if (btnMenuMovement) {
    btnMenuMovement.addEventListener("click", () => {
      document
        .getElementById("btnMenuStock")
        ?.classList.add("anim-shrink-fade");
      sharedHeader?.classList.add("anim-shrink-fade");
      btnMenuMovement.classList.add("anim-move-up");
      setTimeout(() => {
        mainMenuView?.classList.add("hide");
        sharedHeader?.classList.add("hide");
        productMovementView?.classList.remove("hide");
      }, 400);
    });
  }

  if (btnBackToMain) {
    btnBackToMain.addEventListener("click", () => {
      productMovementView?.classList.add("hide");
      mainMenuView?.classList.remove("hide");
      sharedHeader?.classList.remove("hide");
      document
        .getElementById("btnMenuStock")
        ?.classList.remove("anim-shrink-fade");
      btnMenuMovement?.classList.remove("anim-move-up");
    });
  }

  document
    .getElementById("btnTransferOut")
    ?.addEventListener("click", () =>
      navigationTo(productMovementView, viewTaskHub),
    );
  document
    .getElementById("btnBackToMovement")
    ?.addEventListener("click", () =>
      navigationTo(viewTaskHub, productMovementView),
    );
  document
    .getElementById("btnBackFromTaskHub")
    ?.addEventListener("click", () =>
      navigationTo(viewTaskHub, productMovementView),
    );
  document
    .getElementById("btnCancelDest")
    ?.addEventListener("click", () => navigationTo(viewDest, viewTaskHub));
  document
    .getElementById("btnBackFromDest")
    ?.addEventListener("click", () => navigationTo(viewDest, viewTaskHub));
  document
    .getElementById("btnCancelFromLobby")
    ?.addEventListener("click", () => navigationTo(viewLobby, viewTaskHub));
  document
    .getElementById("btnBackToDest")
    ?.addEventListener("click", () => navigationTo(viewLobby, viewTaskHub));

  const btnCreateNewTask =
    document.getElementById("btnCreateNewTask") ||
    document.getElementById("btnNewTask");
  if (btnCreateNewTask) {
    btnCreateNewTask.addEventListener("click", () => {
      const selectDest = document.getElementById("selectDestination");
      if (selectDest) selectDest.selectedIndex = 0;
      navigationTo(viewTaskHub, viewDest);
    });
  }

  document
    .querySelectorAll(".task-list-item, .pending-task-row")
    .forEach((row) => {
      row.addEventListener("click", function () {
        const textContainer = this.querySelector("div");
        if (textContainer) {
          const branchInfo =
            textContainer.innerText.split("\n")[1] || "สาขาปลายทาง";
          const lobbyHeader = document.getElementById("lobbyBranchHeaderName");
          if (lobbyHeader) lobbyHeader.innerText = branchInfo;
        }
        navigationTo(viewTaskHub, viewLobby);
      });
    });

  const btnSubmitDest =
    document.getElementById("btnSubmitDest") ||
    document.getElementById("btnNextDest");
  if (btnSubmitDest) {
    btnSubmitDest.addEventListener("click", () => {
      const destDropdown = document.getElementById("selectDestination");
      if (!destDropdown || !destDropdown.value) {
        safeAlert(
          "ข้อมูลไม่ครบถ้วน",
          "กรุณาเลือกสาขาที่ต้องการสร้างงานก่อนครับ",
        );
        return;
      }
      const lobbyHeader = document.getElementById("lobbyBranchHeaderName");
      if (lobbyHeader)
        lobbyHeader.innerText =
          destDropdown.options[destDropdown.selectedIndex].text;
      navigationTo(viewDest, viewLobby);
    });
  }
});

// [System Navigation Controller] END
//===============

// ==========================================
// [MODULE 3 & 4: SHIPMENT LOBBY & BOX MANAGEMENT]
// หน้าที่: ควบคุมหน้าล็อบบี้สาขา การสร้างรอบส่ง และการเพิ่ม/ลบกล่องย่อย
// ==========================================

//===============
// [Shipment Card Initialization UI] START

document.addEventListener("DOMContentLoaded", () => {
  //📍 [ซ่อนการ์ดชิปเมนต์เริ่มต้น ป้องกันการโชว์ก่อนกดสร้าง]
  const defaultCards = document.querySelectorAll(".shipment-card");

  defaultCards.forEach((card) => {
    if (!window.temporaryShipmentID) {
      card.style.display = "none";
    }
  });
});

// [Shipment Card Initialization UI] END
//===============

//===============
// [Add Shipment Truck Button] START

document.addEventListener("click", function (e) {
  //📍 [ปุ่มรูปรถบรรทุก - เปิดหน้าต่างเลือกรอบส่ง]
  const btnAddShipmentTruck = e.target.closest("#btnAddShipmentTruck");

  if (btnAddShipmentTruck) {
    e.preventDefault();
    const selectShipmentReason = document.getElementById(
      "selectShipmentReason",
    );
    const inputBoxNumber = document.getElementById("inputBoxNumber");
    const shipmentBoxModal = document.getElementById("shipmentBoxModal");

    // ---🔍 [ล้างค่าฟอร์มเดิมและเคลียร์รหัสชิปเมนต์ชั่วคราว]
    if (selectShipmentReason) selectShipmentReason.selectedIndex = 0;
    if (inputBoxNumber)
      inputBoxNumber.value = "กรุณาเลือกประเภทระบบเพื่อคำนวณรหัส...";
    window.temporaryShipmentID = "";

    if (shipmentBoxModal) shipmentBoxModal.classList.remove("hide");
  }
});

// [Add Shipment Truck Button] END
//===============

//===============
// [Shipment Reason Selection] START

document.addEventListener("change", function (e) {
  //📍 [ช่องเลือกประเภทการจัดส่ง - คำนวณรหัส ID อัตโนมัติเมื่อเปลี่ยนค่า]
  if (e.target.id === "selectShipmentReason") {
    const destDropdown = document.getElementById("selectDestination");

    // ---🔍 [ประมวลผลรหัสสาขาต้นทาง ปลายทาง และวันที่เพื่อสร้าง Shipment ID]
    const destRealCode =
      typeof window.getRealBranchCode === "function"
        ? window.getRealBranchCode(destDropdown ? destDropdown.value : "")
        : "000";
    window.temporaryShipmentID = `${e.target.value}-${window.getFormattedDate()}-${window.obfuscateBranchCode(window.selectedOriginRealCode)}-000X-${window.obfuscateBranchCode(destRealCode)}`;

    const inputBoxNumber = document.getElementById("inputBoxNumber");
    if (inputBoxNumber) inputBoxNumber.value = window.temporaryShipmentID;
  }
});

// [Shipment Reason Selection] END
//===============

//===============
// [Cancel Shipment Modal Button] START

document.addEventListener("click", function (e) {
  //📍 [ปุ่มยกเลิกในหน้าต่างเลือกรอบส่ง - ปิดหน้าต่างโดยไม่บันทึกค่า]
  const btnCancelBox = e.target.closest("#btnCancelBox");

  if (btnCancelBox) {
    e.preventDefault();
    const shipmentBoxModal = document.getElementById("shipmentBoxModal");
    if (shipmentBoxModal) shipmentBoxModal.classList.add("hide");
  }
});

// [Cancel Shipment Modal Button] END
//===============

//===============
// [Confirm Shipment Creation Button] START

document.addEventListener("click", function (e) {
  //📍 [ปุ่มตกลงในหน้าต่างเลือกรอบส่ง - ยืนยันการสร้างรอบส่ง]
  const btnConfirmBox = e.target.closest("#btnConfirmBox");

  if (btnConfirmBox) {
    e.preventDefault();
    const selectShipmentReason = document.getElementById(
      "selectShipmentReason",
    );

    if (!selectShipmentReason || !selectShipmentReason.value) {
      window.safeAlert(
        "ข้อมูลไม่ครบถ้วน",
        "กรุณาเลือกประเภทการส่งออกก่อนดำเนินการครับ",
      );
      return;
    }

    const existingCardType = document.querySelector(
      `.shipment-card[data-shipment-type="${selectShipmentReason.value}"]`,
    );
    if (existingCardType && existingCardType.style.display !== "none") {
      window.safeAlert(
        "ไม่อนุญาตให้สร้างซ้ำ",
        "มีรอบจัดส่งประเภทนี้ค้างอยู่ กรุณาดำเนินการใบเดิมให้เสร็จสิ้นก่อนครับ",
      );
      return;
    }

    // ---🔍 [ซ่อนสถานะว่างเปล่า และเปิดแสดงการ์ด Shipment พร้อมยัดรหัส ID ลงไป]
    const lobbyEmptyState = document.getElementById("lobbyEmptyState");
    const shipmentBoxModal = document.getElementById("shipmentBoxModal");
    if (lobbyEmptyState) lobbyEmptyState.classList.add("hide");
    if (shipmentBoxModal) shipmentBoxModal.classList.add("hide");

    const allShipmentCards = document.querySelectorAll(".shipment-card");
    allShipmentCards.forEach((card) => {
      card.style.display = "block";
      const idText =
        card.querySelector(".shipment-barcode-trigger span") ||
        card.querySelector(".shipment-id-text");
      if (idText) idText.innerText = `ID: ${window.temporaryShipmentID}`;
    });
  }
});

// [Confirm Shipment Creation Button] END
//===============

//===============
// [Global Box Controller] START

document.addEventListener("click", function (e) {
  //📍 [1. ปุ่มเพิ่มกล่องย่อยบนการ์ดชิปเมนต์]
  const btnAddBox = e.target.closest(".btn-add-box");
  if (btnAddBox) {
    e.preventDefault();
    const card = btnAddBox.closest(".shipment-card");
    const openBox = card.querySelector('.box-item[data-status="open"]');

    if (openBox) {
      window.safeAlert(
        "ไม่อนุญาต",
        "มีกล่องค้างเปิดอยู่ กรุณาเพิ่มสินค้าให้เสร็จก่อนครับ",
      );
      return;
    }

    if (typeof window.boxCounter === "undefined") window.boxCounter = 0;
    window.boxCounter++;
    const boxId = String(window.boxCounter).padStart(3, "0");
    const boxItem = document.createElement("div");
    boxItem.className = "box-item";
    boxItem.setAttribute("data-status", "open");

    boxItem.innerHTML = `
      <div style="padding: 12px 15px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; background: #fff;">
        <div style="display: flex; align-items: center; width: 35%;">
          <input type="checkbox" class="box-select-cb" disabled style="transform: scale(1.2); margin-right: 18px; margin-left: 2px; cursor: pointer;">
          <i class="fas fa-box-open box-status-icon" style="color: #dc3545; margin-right: 8px;"></i>
          <span style="font-size: 13px; font-weight: bold;">BOX-${boxId}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <button class="btn-add-item" style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 6px; font-size: 11px;">เพิ่มสินค้า</button>
          <button class="btn-delete-box hide" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 6px; font-size: 11px;">ลบกล่อง</button>
        </div>
      </div>
    `;

    const boxListContainer = card.querySelector(".box-list-container");
    if (boxListContainer) boxListContainer.appendChild(boxItem);

    const boxCountDisplay = card.querySelector(".shipment-box-count");
    if (boxCountDisplay)
      boxCountDisplay.innerText = `กล่อง (Boxes): ${card.querySelectorAll(".box-item").length}`;

    if (typeof window.evaluateExportButton === "function")
      window.evaluateExportButton();
  }

  //📍 [2. ปุ่มลบกล่องย่อยบนการ์ดชิปเมนต์]
  const btnDeleteBox = e.target.closest(".btn-delete-box");
  if (btnDeleteBox) {
    e.preventDefault();
    const boxItem = btnDeleteBox.closest(".box-item");
    const card = btnDeleteBox.closest(".shipment-card");
    const boxIdText = boxItem.querySelector("span").innerText;

    window.safeConfirm(
      "ลบกล่อง",
      `แน่ใจหรือไม่ว่าต้องการลบ ${boxIdText} ?`,
      () => {
        boxItem.remove();
        const boxCountDisplay = card.querySelector(".shipment-box-count");
        if (boxCountDisplay)
          boxCountDisplay.innerText = `กล่อง (Boxes): ${card.querySelectorAll(".box-item").length}`;

        const mainCheckbox = card.querySelector(".shipment-select-cb");
        if (
          card.querySelectorAll('.box-item[data-status="closed"]').length ===
            0 &&
          mainCheckbox
        ) {
          mainCheckbox.checked = false;
          mainCheckbox.disabled = true;
        }
        if (typeof window.evaluateExportButton === "function")
          window.evaluateExportButton();
      },
      "delete",
    );
  }

  //📍 [3. ปุ่มเพิ่มสินค้า - สับรางเข้าสู่หน้าบรรจุสินค้า]
  const btnAddItem = e.target.closest(".btn-add-item");
  if (btnAddItem) {
    e.preventDefault();
    const boxItem = btnAddItem.closest(".box-item");
    const card = btnAddItem.closest(".shipment-card");
    const boxId = boxItem.querySelector("span").innerText.replace("BOX-", "");
    if (typeof window.initBoxDetailsTransition === "function") {
      window.initBoxDetailsTransition(card, boxItem, boxId);
    }
  }
});

/* [Global Box Controller] END */

// ==========================================
// [MODULE 5: PACKING PAGE & MAGIC SEARCH ENGINE]
// หน้าที่: ระบบค้นหาสินค้า คุมสต็อก และ "หน้าบรรจุสินค้า" แบบลิสต์รายการ (Scrollable)
// ต้นแบบ Layout อ้างอิง: stockInHouseView (Golden Standard)
// ==========================================

//===============
// [Box Details UI Transition] START

document.addEventListener("DOMContentLoaded", () => {
  window.currentActiveShipmentCard = null;
  window.currentActiveBoxItemNode = null;
  window.currentActiveBoxId = "";
  window.currentActiveShipmentId = "";

  // ---🔍 [Mock ฐานข้อมูลระบุตัวตนสินค้าตามขนาดเพื่อเลือกสัญลักษณ์และปุ่มควบคุม]
  window.mockMasterStockDatabase = [
    {
      sku: "FER-SHOE-091",
      barcode: "805123456091",
      name: "Ferragamo Loafer Black",
      lastThree: "091",
      available: 5,
      image: "https://via.placeholder.com/40",
      isManualCount: true,
    },
    {
      sku: "FER-BAG-112",
      barcode: "805123456112",
      name: "Studio Box Bag Gold",
      lastThree: "112",
      available: 0,
      image: "https://via.placeholder.com/40",
      isManualCount: false,
    },
    {
      sku: "FER-BELT-888",
      barcode: "805123456888",
      name: "Gancini Reversible Belt",
      lastThree: "888",
      available: 2,
      image: "https://via.placeholder.com/40",
      isManualCount: true,
    },
    {
      sku: "FER-LUGGAGE-999",
      barcode: "805123456999",
      name: "Large Travel Trunk",
      lastThree: "999",
      available: 10,
      image: "https://via.placeholder.com/40",
      isManualCount: false,
    },
  ];

  //📍 [ฟังก์ชันเปลี่ยนหน้าจอเข้าสู่หน้าบรรจุสินค้าสีแดงเต็มหน้าจอ]
  window.initBoxDetailsTransition = function (cardNode, boxItemNode, boxId) {
    const appContainer = document.getElementById("appContainer");
    if (!appContainer) return;
    const previousHTML = appContainer.innerHTML;

    window.currentActiveShipmentCard = cardNode;
    window.currentActiveBoxItemNode = boxItemNode;
    window.currentActiveBoxId = boxId;
    window.currentActiveShipmentId = cardNode
      .querySelector(".shipment-barcode-trigger span")
      .innerText.replace("ID: ", "");

    // บังคับ Render Layout โครงสร้างหน้าบรรจุสินค้า
    appContainer.innerHTML = `
      <div class="box-details-fullscreen" style="background-color: #f8f9fa; height: 100vh; display: flex; flex-direction: column; position: fixed; top: 0; left: 0; width: 100%; z-index: 1000000;">
          
          <div style="background-color: #dc3545; padding: 15px; flex-shrink: 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <div style="color: white;">
                      <h3 style="margin: 0; font-size: 16px;">หน้าบรรจุสินค้า: BOX-${boxId}</h3>
                      <p style="margin: 2px 0 0; font-size: 12px; opacity: 0.9;">${window.currentActiveShipmentId}</p>
                  </div>
                  <button id="btnCloseBoxAction" style="background: white; color: #dc3545; border: none; padding: 8px 15px; border-radius: 8px; font-weight: bold; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                      <i class="fas fa-box"></i> ปิดกล่อง
                  </button>
              </div>
              
              <div style="position: relative;">
                  <input type="text" id="inputBoxMagicSearch" placeholder="ค้นหาหรือสแกนสินค้า..." style="width: 100%; padding: 12px 15px; border-radius: 8px; border: none; outline: none; font-size: 14px; color: #333;">
                  <i class="fas fa-search" style="position: absolute; right: 15px; top: 14px; color: #aaa;"></i>
              </div>
              <div id="magicSearchPreviewSlot" class="hide" style="background: white; margin-top: 5px; border-radius: 8px; padding: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"></div>
          </div>

          <div id="boxItemsListWrapper" style="flex: 1; overflow-y: auto; padding: 15px;">
              <div id="emptyBoxState" style="text-align: center; color: #999; margin-top: 50px;">
                  <i class="fas fa-box-open" style="font-size: 40px; margin-bottom: 10px; opacity: 0.5;"></i>
                  <p>ยังไม่มีสินค้าในกล่องนี้<br>ค้นหาหรือสแกนเพื่อเริ่มบรรจุ</p>
              </div>
          </div>

          <div style="display: flex; height: 60px; flex-shrink: 0; background: white; border-top: 1px solid #ddd;">
              <button id="btnExitPacking" style="flex: 1; background: #343a40; color: white; border: none; font-weight: bold; font-size: 15px; border-right: 1px solid #555;">
                  <i class="fas fa-arrow-left"></i> ย้อนกลับ
              </button>
              <button id="btnCameraScan" style="flex: 1; background: #007bff; color: white; border: none; font-weight: bold; font-size: 15px;">
                  <i class="fas fa-camera"></i> สแกน
              </button>
          </div>
      </div>
    `;

    window.bindPackingPageEvents(previousHTML);
  };
});

// [Box Details UI Transition] END
//===============

//===============
// [Magic Search Engine Input] START

window.bindPackingPageEvents = function (previousHTML) {
  const appContainer = document.getElementById("appContainer");
  const inputBox = document.getElementById("inputBoxMagicSearch");
  const previewSlot = document.getElementById("magicSearchPreviewSlot");

  // ---🔍 [ลอจิกปุ่มย้อนกลับ: ออกโดยกล่องเปิดอยู่]
  document.getElementById("btnExitPacking").addEventListener("click", () => {
    window.safeConfirm(
      "ยืนยันการออก",
      "ต้องการออกจากหน้าบรรจุสินค้าใช่หรือไม่?\n(กล่องนี้จะยังคงสถานะ 'เปิดอยู่' ในหน้าล็อบบี้สาขา)",
      () => {
        appContainer.innerHTML = previousHTML;
        if (typeof window.evaluateExportButton === "function")
          window.evaluateExportButton();
      },
      "question",
    );
  });

  // ---🔍 [ลอจิกปุ่มปิดกล่องเฉพาะกิจ]
  document.getElementById("btnCloseBoxAction").addEventListener("click", () => {
    window.safeConfirm(
      "ยืนยันปิดกล่อง",
      "คุณต้องการ 'ปิดกล่อง' นี้ใช่หรือไม่?\n(ระบบจะพากลับไปหน้าล็อบบี้สาขาและเปลี่ยนสถานะเป็นปิด)",
      () => {
        if (window.currentActiveBoxItemNode) {
          window.currentActiveBoxItemNode.setAttribute("data-status", "closed");
          const statusIcon =
            window.currentActiveBoxItemNode.querySelector(".box-status-icon");
          if (statusIcon) {
            statusIcon.classList.remove("fa-box-open");
            statusIcon.classList.add("fa-box");
            statusIcon.style.color = "#28a745";
          }
        }
        appContainer.innerHTML = previousHTML;
        if (typeof window.evaluateExportButton === "function")
          window.evaluateExportButton();
      },
      "question",
    );
  });

  // ---🔍 [ลอจิกกลไก Magic Search]
  if (inputBox) {
    inputBox.addEventListener("input", function (e) {
      const value = e.target.value.trim().toUpperCase();
      if (value.length >= 3) {
        const product = window.mockMasterStockDatabase.find(
          (item) =>
            item.sku.toUpperCase().includes(value) ||
            item.barcode.includes(value) ||
            item.lastThree === value,
        );

        if (product) {
          const isAvailable = product.available > 0;
          const btnHtml = isAvailable
            ? `<button class="btn-add-to-box" data-sku="${product.sku}" style="background:#28a745; color:white; border:none; padding:8px 15px; border-radius:6px; font-weight:bold; cursor:pointer;">เพิ่มลงกล่อง</button>`
            : `<button disabled style="background:#e9ecef; color:#adb5bd; border:1px solid #ced4da; padding:8px 15px; border-radius:6px; font-weight:bold;">หมด</button>`;

          previewSlot.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <div style="display:flex; gap:10px; align-items:center;">
                <img src="${product.image}" style="width:40px; height:40px; border-radius:6px; border:1px solid #eee;">
                <div style="line-height:1.2;">
                  <div style="font-size:13px; font-weight:bold;">${product.sku}</div>
                  <div style="font-size:11px; color:#666;">คงเหลือ: ${product.available} ชิ้น</div>
                </div>
              </div>
              ${btnHtml}
            </div>
          `;
          previewSlot.classList.remove("hide");

          const btnAdd = previewSlot.querySelector(".btn-add-to-box");
          if (btnAdd) {
            btnAdd.addEventListener("click", () => {
              window.executeAddItemToBoxContainer(product);
              previewSlot.classList.add("hide");
              inputBox.value = "";
              inputBox.focus();
            });
          }
        } else {
          previewSlot.innerHTML = `<div style="text-align:center; color:#dc3545; font-size:13px; font-weight:bold;">ไม่พบข้อมูลสินค้า</div>`;
          previewSlot.classList.remove("hide");
        }
      } else {
        previewSlot.classList.add("hide");
      }
    });
  }

  // ---🔍 [ลอจิกปุ่มกล้อง (จำลอง)]
  document.getElementById("btnCameraScan").addEventListener("click", () => {
    const mockScanProduct = window.mockMasterStockDatabase[3];
    window.executeAddItemToBoxContainer(mockScanProduct);
    window.safeAlert(
      "สแกนสำเร็จ (Success)",
      `นำสินค้า ${mockScanProduct.sku} เข้าสู่ลิสต์รายการทันที`,
      "success",
    );
  });
};

// [Magic Search Engine Input] END
//===============

//===============
// [Add Item To Box Execution Engine] START

window.executeAddItemToBoxContainer = function (product) {
  const wrapper = document.getElementById("boxItemsListWrapper");
  const emptyState = document.getElementById("emptyBoxState");
  if (emptyState) emptyState.remove();

  const existingItem = wrapper.querySelector(
    `.scanned-item-row[data-sku="${product.sku}"]`,
  );

  if (existingItem) {
    if (product.isManualCount) {
      window.safeAlert(
        "สินค้าซ้ำ",
        "สินค้านี้อยู่ในกล่องแล้ว สามารถกดปุ่ม [+] ในลิสต์เพื่อเพิ่มจำนวนแบบแมนนวลได้เลยครับ",
        "info",
      );
    } else {
      const qtySpan = existingItem.querySelector(".item-qty");
      qtySpan.innerText = parseInt(qtySpan.innerText) + 1;
    }
    return;
  }

  // ---🔍 [คัดกรองการแสดงสัญลักษณ์สิทธิ์นับสินค้า: รูปมือ ✋ หรือ บาร์โค้ด 🏷️]
  const modeIcon = product.isManualCount
    ? `<i class="fas fa-hand-paper" style="color:#17a2b8;" title="นับจำนวนด้วยมือ (Manual Count)"></i>`
    : `<i class="fas fa-barcode" style="color:#6c757d;" title="ต้องสแกนเท่านั้น (Scan Required)"></i>`;

  // ---🔍 [แยกโครงสร้างปุ่มควบคุม]
  const controlButtons = product.isManualCount
    ? `
      <button class="btn-decrease-qty" style="background:#f8f9fa; border:1px solid #ddd; padding:5px 10px; border-radius:4px; color:#dc3545;"><i class="fas fa-minus"></i></button>
      <span class="item-qty" style="font-weight:bold; font-size:14px; width:24px; text-align:center; display:inline-block;">1</span>
      <button class="btn-increase-qty" style="background:#f8f9fa; border:1px solid #ddd; padding:5px 10px; border-radius:4px; color:#28a745;"><i class="fas fa-plus"></i></button>
    `
    : `
      <button class="btn-decrease-qty" style="background:#f8f9fa; border:1px solid #ddd; padding:5px 10px; border-radius:4px; color:#dc3545;"><i class="fas fa-minus"></i></button>
      <span class="item-qty" style="font-weight:bold; font-size:14px; width:24px; text-align:center; display:inline-block; margin-right: 36px;">1</span>
    `;

  const itemRow = document.createElement("div");
  itemRow.className = "scanned-item-row";
  itemRow.setAttribute("data-sku", product.sku);
  itemRow.style.cssText =
    "background:white; border-radius:10px; border:1px solid #eee; padding:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 4px rgba(0,0,0,0.02);";

  itemRow.innerHTML = `
    <div style="display:flex; align-items:center; gap:12px; width:65%;">
      <div style="font-size:18px; width:20px; text-align:center;">${modeIcon}</div>
      <div>
        <div style="font-size:13px; font-weight:bold; color:#222;">${product.sku}</div>
        <div style="font-size:11px; color:#777;">${product.name}</div>
      </div>
    </div>
    <div style="display:flex; align-items:center; gap:5px; justify-content:flex-end;">
      ${controlButtons}
    </div>
  `;
  wrapper.appendChild(itemRow);

  if (product.isManualCount) {
    itemRow.querySelector(".btn-increase-qty").addEventListener("click", () => {
      const qtySpan = itemRow.querySelector(".item-qty");
      qtySpan.innerText = parseInt(qtySpan.innerText) + 1;
    });
  }

  // ---🔍 [ลอจิกปุ่มลบรายการสินค้า]
  itemRow.querySelector(".btn-decrease-qty").addEventListener("click", () => {
    window.safeConfirm(
      "ยืนยันการลบ",
      `ต้องการลบรายการ ${product.sku} จำนวน 1 ชิ้น ใช่หรือไม่?`,
      () => {
        const qtySpan = itemRow.querySelector(".item-qty");
        let currentQty = parseInt(qtySpan.innerText);

        if (currentQty > 1) {
          qtySpan.innerText = currentQty - 1;
        } else {
          itemRow.remove();
          if (wrapper.querySelectorAll(".scanned-item-row").length === 0) {
            wrapper.innerHTML = `
            <div id="emptyBoxState" style="text-align: center; color: #999; margin-top: 50px;">
                <i class="fas fa-box-open" style="font-size: 40px; margin-bottom: 10px; opacity: 0.5;"></i>
                <p>ยังไม่มีสินค้าในกล่องนี้<br>ค้นหาหรือสแกนเพื่อเริ่มบรรจุ</p>
            </div>
          `;
          }
        }
      },
      "delete",
    );
  });
};

// [Add Item To Box Execution Engine] END
//===============

// ==========================================
// [MODULE 6: EXPORT & CHECKBOX LOGIC]
// หน้าที่: ประเมินความพร้อมในการส่งออกและ Checkbox ผูกติดกัน
// ==========================================

//===============
// [Export Evaluation Logic] START

// ---🔍 [ลอจิกคุมการปลดล็อกปุ่ม EXPORT และประเมินกล่อง]
window.evaluateExportButton = function () {
  const btnSubmitLobby = document.getElementById("btnSubmitLobby");
  if (!btnSubmitLobby) return;

  const checkedShipments = document.querySelectorAll(
    ".shipment-select-cb:checked",
  );
  let isReadyToExport = false;

  if (checkedShipments.length > 0) {
    let allValid = true;
    checkedShipments.forEach((cb) => {
      const card = cb.closest(".shipment-card");
      const boxes = card.querySelectorAll(".box-item");
      const openBoxes = card.querySelectorAll('.box-item[data-status="open"]');
      if (boxes.length === 0 || openBoxes.length > 0) {
        allValid = false;
      }
    });
    if (allValid) isReadyToExport = true;
  }

  if (isReadyToExport) {
    btnSubmitLobby.disabled = false;
    btnSubmitLobby.style.background = "#007bff";
    btnSubmitLobby.style.color = "#ffffff";
    btnSubmitLobby.style.cursor = "pointer";
  } else {
    btnSubmitLobby.disabled = true;
    btnSubmitLobby.style.background = "rgba(0,0,0,0.4)";
    btnSubmitLobby.style.color = "#aaa";
    btnSubmitLobby.style.cursor = "not-allowed";
  }
};

// ---🔍 [ลอจิก Checkbox กล่องแม่สะท้อนกล่องลูก]
document.addEventListener("change", function (e) {
  if (e.target.classList.contains("shipment-select-cb")) {
    const card = e.target.closest(".shipment-card");
    const isChecked = e.target.checked;
    const childCbs = card.querySelectorAll(".box-select-cb:not([disabled])");
    childCbs.forEach((cb) => (cb.checked = isChecked));
    window.evaluateExportButton();
  }

  if (e.target.classList.contains("box-select-cb")) {
    const card = e.target.closest(".shipment-card");
    const mainCheckbox = card.querySelector(".shipment-select-cb");
    const allClosed = card.querySelectorAll(
      '.box-item[data-status="closed"] .box-select-cb',
    );
    const allChecked = card.querySelectorAll(
      '.box-item[data-status="closed"] .box-select-cb:checked',
    );
    if (mainCheckbox) {
      mainCheckbox.checked =
        allClosed.length > 0 && allClosed.length === allChecked.length;
    }
    window.evaluateExportButton();
  }
});

// [Export Evaluation Logic] END
//===============
