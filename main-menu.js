// ==========================================
// [MODULE 1: CORE UTILITIES & GLOBAL SETTINGS]
// หน้าที่: ฟังก์ชันพื้นฐานทั้งหมดที่ใช้ร่วมกันทั่วทั้งระบบ
// ==========================================

/* [Global UI Alerts] START */

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

/* [Global UI Alerts] END */

/* [System Calculations] START */

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

window.obfuscateBranchCode = function (code) {
  if (!code || code === "UNKN") return "00XX";
  const clean = code.replace(/[^a-zA-Z0-9]/g, "");
  if (clean.length < 4) return clean;
  return (
    clean.substring(clean.length - 2) + clean.substring(0, 2).toUpperCase()
  );
};

/* [System Calculations] END */

// ==========================================
// [MODULE 2: NAVIGATION & MENU ROUTING]
// หน้าที่: ควบคุมการเปลี่ยนหน้าจอและการนำทางทั้งหมด
// ==========================================

/* [Navigation Controller] START */

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

// ---🔍 [ผูก Event การกดปุ่มเมนูเข้าออกหน้าต่างๆ]
document.addEventListener("DOMContentLoaded", () => {
  const mainMenuView = document.getElementById("mainMenuView");
  const productMovementView = document.getElementById("productMovementView");
  const viewTaskHub = document.getElementById("transferOutTaskHubView");
  const viewDest = document.getElementById("transferOutDestView");
  const viewLobby = document.getElementById("transferOutLobbyView");
  const sharedHeader = document.getElementById("sharedHeader");

  // ปุ่มเมนูหลัก
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

  // ลอจิกปุ่ม Transfer Out และถอยหลัง
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

  // ลอจิกปุ่มสร้างงานและเลือกล็อบบี้
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

  // กดที่ Row งานเพื่อเข้า Lobby
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

/* [Navigation Controller] END */

// ==========================================
// [MODULE 3: SHIPMENT LOBBY GENERATION]
// หน้าที่: จัดการการสร้างและลบ Shipment Card และปุ่มรถบรรทุก
// ==========================================

/* [Lobby Card Initialization] START */

// ---🔍 [ลอจิกเคลียร์หน้าจอและซ่อนการ์ดเมื่อเริ่มระบบ]
document.addEventListener("DOMContentLoaded", () => {
  window.temporaryShipmentID = "";
  window.selectedOriginRealCode = "CKC01";
  window.boxCounter = 0;

  // บังคับซ่อนการ์ดชิปเมนต์ทั้งหมดตั้งแต่ต้น ป้องกันการโชว์ก่อนกดสร้าง
  const shipmentCards = document.querySelectorAll(".shipment-card");
  shipmentCards.forEach((card) => (card.style.display = "none"));
});

/* [Lobby Card Initialization] END */

/* [Truck & Confirm Buttons] START */

document.addEventListener("DOMContentLoaded", () => {
  const btnAddShipmentTruck = document.getElementById("btnAddShipmentTruck");
  const shipmentBoxModal = document.getElementById("shipmentBoxModal");
  const btnConfirmBox = document.getElementById("btnConfirmBox");
  const btnCancelBox = document.getElementById("btnCancelBox");
  const selectShipmentReason = document.getElementById("selectShipmentReason");
  const inputBoxNumber = document.getElementById("inputBoxNumber");

  //📍 [ปุ่มรูปรถบรรทุก: เปิดหน้าต่างเลือกรอบส่ง]
  if (btnAddShipmentTruck) {
    btnAddShipmentTruck.addEventListener("click", () => {
      if (selectShipmentReason) selectShipmentReason.selectedIndex = 0;
      if (inputBoxNumber)
        inputBoxNumber.value = "กรุณาเลือกประเภทระบบเพื่อคำนวณรหัส...";
      window.temporaryShipmentID = "";
      if (shipmentBoxModal) shipmentBoxModal.classList.remove("hide");
    });
  }

  // ---🔍 [ลอจิกการคำนวณรหัส ID อัตโนมัติเมื่อเปลี่ยน Dropdown]
  if (selectShipmentReason) {
    selectShipmentReason.addEventListener("change", () => {
      const destDropdown = document.getElementById("selectDestination");
      const destRealCode = window.getRealBranchCode(
        destDropdown ? destDropdown.value : "",
      );
      window.temporaryShipmentID = `${selectShipmentReason.value}-${window.getFormattedDate()}-${window.obfuscateBranchCode(window.selectedOriginRealCode)}-000X-${window.obfuscateBranchCode(destRealCode)}`;
      if (inputBoxNumber) inputBoxNumber.value = window.temporaryShipmentID;
    });
  }

  //📍 [ปุ่มยกเลิกและปิดหน้าต่าง]
  if (btnCancelBox) {
    btnCancelBox.addEventListener("click", () => {
      if (shipmentBoxModal) shipmentBoxModal.classList.add("hide");
    });
  }

  // ---🔍 [ปุ่มตกลง: สร้างรหัสและแสดง Shipment Card]
  if (btnConfirmBox) {
    btnConfirmBox.addEventListener("click", () => {
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

      // แสดงการ์ดที่ถูกซ่อนไว้ (หรือสร้างใหม่หากใช้โค้ดสร้าง Dynamic)
      const lobbyEmptyState = document.getElementById("lobbyEmptyState");
      if (lobbyEmptyState) lobbyEmptyState.classList.add("hide");
      if (shipmentBoxModal) shipmentBoxModal.classList.add("hide");

      const allShipmentCards = document.querySelectorAll(".shipment-card");
      allShipmentCards.forEach((card) => {
        card.style.display = "block";
        const idText = card.querySelector(".shipment-barcode-trigger span");
        if (idText) idText.innerText = `ID: ${window.temporaryShipmentID}`;
      });
    });
  }
});

/* [Truck & Confirm Buttons] END */

// ==========================================
// [MODULE 4: BOX MANAGEMENT (ADD/DELETE)]
// หน้าที่: ควบคุมปุ่มเพิ่มกล่องและลบกล่องแบบครอบจักรวาล (Global Delegation)
// ==========================================

/* [Global Box Controller] START */

// ---🔍 [ลอจิกดักจับการกดปุ่มต่างๆ ภายในการ์ด (เพิ่มกล่อง, ลบกล่อง, ติ๊กถูก)]
document.addEventListener("click", function (e) {
  // 1. ปุ่มเพิ่มกล่อง (Add Box)
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

    window.boxCounter++;
    const boxId = String(window.boxCounter).padStart(3, "0");
    const boxItem = document.createElement("div");
    boxItem.className = "box-item";
    boxItem.setAttribute("data-status", "open");

    //📍 [UI สำหรับกล่องย่อยที่ถูกสร้าง]
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
      boxCountDisplay.innerText = `Boxes (${card.querySelectorAll(".box-item").length})`;

    if (typeof window.evaluateExportButton === "function")
      window.evaluateExportButton();
  }

  // 2. ปุ่มลบกล่อง (Delete Box)
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
          boxCountDisplay.innerText = `Boxes (${card.querySelectorAll(".box-item").length})`;

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

  // 3. ปุ่มเพิ่มสินค้าเข้าไปในกล่อง (เข้าสู่หน้าจอ 18-72-10)
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
// [MODULE 5: BOX DETAILS & MAGIC SEARCH ENGINE]
// หน้าที่: ระบบค้นหาสินค้า คุมสต็อก และหน้าต่าง Full View
// ==========================================

/* [Box Details Full View] START */

document.addEventListener("DOMContentLoaded", () => {
  window.currentActiveShipmentCard = null;
  window.currentActiveBoxItemNode = null;
  window.currentActiveBoxId = "";
  window.currentActiveShipmentId = "";

  //📍 [ฟังก์ชันสับรางเข้าสู่หน้าจอรายละเอียดกล่อง (สีแดง)]
  window.initBoxDetailsTransition = function (cardNode, boxItemNode, boxId) {
    window.currentActiveShipmentCard = cardNode;
    window.currentActiveBoxItemNode = boxItemNode;
    window.currentActiveBoxId = boxId;
    window.currentActiveShipmentId = cardNode
      .querySelector(".shipment-barcode-trigger span")
      .innerText.replace("ID: ", "");

    document.getElementById("txtActiveBoxTitle").innerText = `BOX-${boxId}`;
    document.getElementById("txtActiveShipmentID").innerText =
      window.currentActiveShipmentId;
    document.getElementById("inputBoxMagicSearch").value = "";
    document.getElementById("magicSearchPreviewSlot").classList.add("hide");
    document.getElementById("boxItemsListWrapper").innerHTML = "";
    document.getElementById("boxDetailsView").classList.remove("hide");
  };

  // ---🔍 [ลอจิกปุ่มย้อนกลับและปิดกล่อง]
  document.getElementById("btnBackToLobby")?.addEventListener("click", () => {
    document.getElementById("boxDetailsView").classList.add("hide");
    if (typeof window.evaluateExportButton === "function")
      window.evaluateExportButton();
  });

  const btnCloseBox = document.getElementById("btnCloseBox");
  if (btnCloseBox) {
    btnCloseBox.addEventListener("click", () => {
      window.safeConfirm("ปิดกล่อง", "ยืนยันการปิดกล่องนี้ใช่หรือไม่?", () => {
        if (window.currentActiveBoxItemNode) {
          window.currentActiveBoxItemNode.setAttribute("data-status", "closed");
          const statusIcon =
            window.currentActiveBoxItemNode.querySelector(".box-status-icon");
          if (statusIcon) {
            statusIcon.classList.remove("fa-box-open");
            statusIcon.classList.add("fa-box");
            statusIcon.style.color = "#28a745";
          }
          const cb =
            window.currentActiveBoxItemNode.querySelector(".box-select-cb");
          if (cb) cb.disabled = false;
        }
        document.getElementById("boxDetailsView").classList.add("hide");
        if (typeof window.evaluateExportButton === "function")
          window.evaluateExportButton();
      });
    });
  }
});

/* [Box Details Full View] END */

/* [Magic Search Engine] START */

document.addEventListener("DOMContentLoaded", () => {
  // ---🔍 [ฐานข้อมูลจำลองสำหรับการค้นหาสินค้า]
  const mockMasterStockDatabase = [
    {
      sku: "FER-SHOE-091",
      barcode: "805123456091",
      name: "Ferragamo Loafer Black",
      lastThree: "091",
      available: 5,
      image: "https://via.placeholder.com/40",
    },
    {
      sku: "FER-BAG-112",
      barcode: "805123456112",
      name: "Studio Box Bag Gold",
      lastThree: "112",
      available: 0,
      image: "https://via.placeholder.com/40",
    },
    {
      sku: "FER-BELT-888",
      barcode: "805123456888",
      name: "Gancini Reversible Belt",
      lastThree: "888",
      available: 2,
      image: "https://via.placeholder.com/40",
    },
  ];

  //📍 [ลอจิกการทำงานของช่องค้นหา Magic Search]
  const inputBoxMagicSearch = document.getElementById("inputBoxMagicSearch");
  if (inputBoxMagicSearch) {
    inputBoxMagicSearch.addEventListener("input", function (e) {
      const value = e.target.value.trim().toUpperCase();
      const previewSlot = document.getElementById("magicSearchPreviewSlot");

      if (value.length >= 3) {
        const matchedProduct = mockMasterStockDatabase.find(
          (item) =>
            item.sku.toUpperCase().includes(value) ||
            item.barcode.includes(value) ||
            item.name.toUpperCase().includes(value) ||
            item.lastThree === value,
        );

        if (matchedProduct) {
          const isAvailable = matchedProduct.available > 0;
          const stockStatusHtml = isAvailable
            ? `<span style="color: #28a745; font-weight:bold;"><i class="fas fa-check-circle"></i> พร้อมโอน: ${matchedProduct.available} ชิ้น</span>`
            : `<span style="color: #dc3545; font-weight:bold;"><i class="fas fa-times-circle"></i> สต็อกเป็น 0 (โอนไม่ได้)</span>`;

          const btnHtml = isAvailable
            ? `<button class="btn-trigger-add-item" data-sku="${matchedProduct.sku}" style="background: #28a745; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">เพิ่ม</button>`
            : `<button disabled style="background: #e9ecef; color: #adb5bd; border: 1px solid #ced4da; padding: 6px 12px; border-radius: 6px; font-size: 11px; cursor: not-allowed;">หมด</button>`;

          previewSlot.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
              <img src="${matchedProduct.image}" style="width: 45px; height: 45px; border-radius: 6px; object-fit: cover; border: 1px solid #eee;">
              <div style="text-align: left; line-height: 1.3;">
                <div style="font-size: 13px; font-weight: bold; color: #222;">${matchedProduct.sku}</div>
                <div style="font-size: 11px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">${matchedProduct.name}</div>
                <div style="font-size: 11px; margin-top: 4px;">${stockStatusHtml}</div>
              </div>
            </div>
            <div>${btnHtml}</div>
          `;
          previewSlot.classList.remove("hide");

          if (isAvailable) {
            previewSlot
              .querySelector(".btn-trigger-add-item")
              .addEventListener("click", function () {
                const targetSku = this.getAttribute("data-sku");
                window.safeConfirm(
                  "ยืนยันเพิ่มสินค้า",
                  `คุณต้องการโอนสินค้า ${targetSku} เข้ากล่องนี้ใช่หรือไม่?`,
                  () => {
                    executeAddItemToBoxContainer(targetSku);
                    previewSlot.classList.add("hide");
                    inputBoxMagicSearch.value = "";
                  },
                  "question",
                );
              });
          }
        } else {
          previewSlot.innerHTML = `<div style="text-align:center; width:100%; font-size: 13px; color: #dc3545; padding: 8px; font-weight: bold;"><i class="fas fa-search-minus"></i> ไม่พบข้อมูลสินค้าในระบบ</div>`;
          previewSlot.classList.remove("hide");
        }
      } else {
        previewSlot.classList.add("hide");
      }
    });
  }

  // ---🔍 [ลอจิกบรรจุสินค้าลงกล่องและ Rollback]
  function executeAddItemToBoxContainer(skuCode) {
    const wrapper = document.getElementById("boxItemsListWrapper");
    const existingItem = wrapper.querySelector(
      `.scanned-item-row[data-sku="${skuCode}"]`,
    );

    if (existingItem) {
      window.safeAlert(
        "ข้อมูลซ้ำซ้อน",
        "สินค้ารหัสนี้ถูกบรรจุอยู่ในกล่องเรียบร้อยแล้ว",
        "error",
      );
      return;
    }

    const itemRow = document.createElement("div");
    itemRow.className = "scanned-item-row";
    itemRow.setAttribute("data-sku", skuCode);
    itemRow.style.cssText =
      "background: white; border-radius: 10px; border: 1px solid #eee; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;";
    itemRow.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; width: 70%;">
        <i class="fas fa-tag" style="color: #dc3545; font-size: 16px;"></i>
        <div style="text-align: left;">
          <div style="font-size: 13px; font-weight: bold; color: #222;">${skuCode}</div>
          <div style="font-size: 11px; color: #777;">สถานะ: <span style="color: #e67e22; font-weight:bold;">Hold Stock</span></div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 10px; width: 30%; justify-content: flex-end;">
        <button class="btn-remove-item-from-box" style="background: transparent; border: none; color: #dc3545; font-size: 16px; cursor: pointer; padding: 5px;"><i class="fas fa-minus-circle"></i></button>
      </div>
    `;
    wrapper.appendChild(itemRow);

    itemRow
      .querySelector(".btn-remove-item-from-box")
      .addEventListener("click", function () {
        window.safeConfirm(
          "ลบรายการสินค้า",
          `คุณต้องการยกเลิกบรรจุสินค้า ${skuCode} และคืนสต็อกใช่หรือไม่?`,
          () => {
            itemRow.remove();
            window.safeAlert(
              "สำเร็จ",
              "ระบบดึงสินค้าออกจากกล่องเรียบร้อยแล้ว",
              "success",
            );
          },
          "delete",
        );
      });
  }
});

/* [Magic Search Engine] END */





// ==========================================
// [MODULE 6: EXPORT & CHECKBOX LOGIC]
// หน้าที่: ประเมินความพร้อมในการส่งออกและ Checkbox ผูกติดกัน
// ==========================================

/* [Export Evaluation Logic] START */

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
  // เมื่อกด Checkbox หัวหน้า
  if (e.target.classList.contains("shipment-select-cb")) {
    const card = e.target.closest(".shipment-card");
    const isChecked = e.target.checked;
    const childCbs = card.querySelectorAll(".box-select-cb:not([disabled])");
    childCbs.forEach((cb) => (cb.checked = isChecked));
    window.evaluateExportButton();
  }

  // เมื่อกด Checkbox ลูก
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

/* [Export Evaluation Logic] END */
