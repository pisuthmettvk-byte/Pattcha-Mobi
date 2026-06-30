// ==========================================
// [Core Utilities / Global State Management]
// ==========================================
//[Mock Receive Signal Utility] START
  //========================================



//📍 [Notification Badge UI Update]

function mockReceiveSignal(hasPendingDelivery, qty = 0) {
  const badge = document.getElementById("badgeInbound");
  if (!badge) return;
  const countDisplay = badge.querySelector(".badge-count");
  if (!countDisplay) return;

  // ---🔍 [Check pending delivery and update badge count]
  if (hasPendingDelivery) {
    badge.classList.remove("hide");
    countDisplay.innerText = qty;
  } else {
    badge.classList.add("hide");
  }
}
// [Mock Receive Signal Utility] END






  //========================================
// [Navigation Transition Utility] START
  //========================================
//📍 [View Transition UI Component]
function navigationTo(hideView, showView) {

  // ---🔍 [Apply opacity transitions between DOM elements]
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
}
// [Navigation Transition Utility] END





  //========================================
// [Dynamic Safe Alert Utility] START
  //========================================


//📍 [Custom Alert Modal Window UI]
function safeAlert(title, message, type = "error") {
  const overlay = document.createElement("div");
  overlay.className = "sys-alert-element";
  overlay.style.cssText =
    "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1000006; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(3px);";

  let headerBg, iconClass, btnBg, btnText;

  // ---🔍 [Determine alert theme based on type]
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
}
// [Dynamic Safe Alert Utility] END







 //========================================
// [Dynamic Safe Confirm Utility] START
//========================================


//📍 [Custom Confirm Modal Window UI]
function safeConfirm(title, message, onConfirm, type = "question") {
  const overlay = document.createElement("div");
  overlay.className = "sys-alert-element";
  overlay.style.cssText =
    "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1000006; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(3px);";

  let headerBg, iconClass, btnBg, btnText;

  // ---🔍 [Determine confirm theme based on type]
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
}
// [Dynamic Safe Confirm Utility] END





  //========================================
// [Global Delete Mode Blocker] START
  //========================================


//📍 [Global Window Click Interception]
document.addEventListener("click", function (e) {
  const activeDeleteCard = document.querySelector(".shipment-card.is-delete-mode");

  // ---🔍 [Check if delete mode is active and block outside clicks]
  if (activeDeleteCard) {
    if (e.target.closest("#customAlertModal") || e.target.closest(".sys-alert-element")) {
      return;
    }
    if (activeDeleteCard.contains(e.target)) {
      if (!e.target.closest(".btn-toggle-delete") && !e.target.closest(".btn-delete-box")) {
        e.preventDefault();
        e.stopPropagation();
        safeAlert("ระบบถูกล็อก", "โหมดลบกล่องกำลังทำงานอยู่ กรุณากดปุ่มลบ หรือกดปุ่มถังขยะที่ส่วนหัวเพื่อปิดโหมดก่อนครับ");
      }
    } else {
      e.preventDefault();
      e.stopPropagation();
      safeAlert("ระบบถูกล็อก", "ไม่อนุญาตให้ทำรายการอื่นขณะเปิดโหมดลบกล่องค้างไว้ กรุณาปิดโหมดลบของรายการนั้นก่อนครับ");
    }
  }
}, true);
// [Global Delete Mode Blocker] END





  //========================================
  // [Branch Code Mapping Utility] START
  //========================================


// ---🔍 [Map branch ID to real branch code]
function getRealBranchCode(branchId) {
  const branchCodeMap = {
    B001: "CKC01",
    B002: "KKN02",
    B003: "ICS03",
  };
  return branchCodeMap[branchId] || "UNKN";
}
// [Branch Code Mapping Utility] END



// [Security Obfuscation Utility] START
// ---🔍 [Obfuscate branch code for security]
function obfuscateBranchCode(code) {
  if (!code || code === "UNKN") return "00XX";
  const clean = code.replace(/[^a-zA-Z0-9]/g, "");
  if (clean.length < 4) return clean;
  const alpha = clean.substring(0, 2).toUpperCase();
  const numeric = clean.substring(clean.length - 2);
  return numeric + alpha;
}
// [Security Obfuscation Utility] END



// [Audit Sequence Generator] START
// ---🔍 [Generate immutable audit sequence number]
function generateAuditSequence(type, branch) {
  const storageKey = `ledger_seq_${branch}_${type}`;
  let currentSeq = parseInt(localStorage.getItem(storageKey)) || 0;
  currentSeq += 1;
  localStorage.setItem(storageKey, currentSeq);
  return String(currentSeq).padStart(4, "0");
}
// [Audit Sequence Generator] END



// [Date Formatter Utility] START
// ---🔍 [Format current date to YYMMDD]
function getFormattedDate() {
  const d = new Date();
  const yy = String(d.getFullYear()).substring(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return yy + mm + dd;
}

//========================================
// [Date Formatter Utility] END
//========================================





// ==========================================
// [Main Application Initialization & DOM Elements]
// ==========================================


//========================================
// [DOM Content Loaded Initialization] START
//========================================


//📍 [Application Bootstrapping UI]
document.addEventListener("DOMContentLoaded", () => {
  // ---🔍 [Cache DOM elements for navigation and views]
  const mainMenuView = document.getElementById("mainMenuView");
  const productMovementView = document.getElementById("productMovementView");
  const viewTaskHub = document.getElementById("transferOutTaskHubView");
  const viewDest = document.getElementById("transferOutDestView");
  const viewLobby = document.getElementById("transferOutLobbyView");
  const sharedHeader = document.getElementById("sharedHeader");

  const btnMenuStock = document.getElementById("btnMenuStock");
  const btnMenuMovement = document.getElementById("btnMenuMovement");
  const btnBackToMain = document.getElementById("btnBackToMain");
  const btnTransferOut = document.getElementById("btnTransferOut");
  const btnCreateNewTask =
    document.getElementById("btnCreateNewTask") ||
    document.getElementById("btnNewTask");
  const btnSubmitDest =
    document.getElementById("btnSubmitDest") ||
    document.getElementById("btnNextDest");
  const btnBackFromTaskHub =
    document.getElementById("btnBackToMovement") ||
    document.getElementById("btnBackFromTaskHub");
  const btnBackFromDest =
    document.getElementById("btnCancelDest") ||
    document.getElementById("btnBackFromDest");
  const btnCancelFromLobby =
    document.getElementById("btnCancelFromLobby") ||
    document.getElementById("btnBackToDest");
  const btnModalAlertOk = document.getElementById("btnModalAlertOk");

  const btnSubmitLobby = document.getElementById("btnSubmitLobby");
  const btnAddShipmentTruck = document.getElementById("btnAddShipmentTruck");
  const shipmentBoxModal = document.getElementById("shipmentBoxModal");
  const btnCancelBox = document.getElementById("btnCancelBox");
  const btnConfirmBox = document.getElementById("btnConfirmBox");
  const selectShipmentReason = document.getElementById("selectShipmentReason");
  const inputBoxNumber = document.getElementById("inputBoxNumber");
  const lobbyContentContainer =
    document.getElementById("lobbyContentContainer") ||
    document.querySelector("#transferOutLobbyView .master-content");
  const lobbyEmptyState = document.getElementById("lobbyEmptyState");

  let temporaryShipmentID = "";
  let selectedOriginRealCode = "CKC01";
  let boxCounter = 0;

  //========================================
  // [Main Menu Movement Button] START
  //========================================

  //📍 [Product Movement Menu Button Trigger]
  if (btnMenuMovement) {
    btnMenuMovement.addEventListener("click", () => {
      // ---🔍 [Animate and navigate to Product Movement view]
      if (btnMenuStock) btnMenuStock.classList.add("anim-shrink-fade");
      if (sharedHeader) sharedHeader.classList.add("anim-shrink-fade");
      btnMenuMovement.classList.add("anim-move-up");

      setTimeout(() => {
        if (mainMenuView) mainMenuView.classList.add("hide");
        if (productMovementView) productMovementView.classList.remove("hide");
        if (sharedHeader) sharedHeader.classList.add("hide");

        if (productMovementView) {
          const subMenus = productMovementView.querySelectorAll(".menu-card");
          subMenus.forEach((btn) => {
            btn.classList.remove("anim-pop-out");
            void btn.offsetWidth;
            btn.classList.add("anim-pop-out");
          });
        }
      }, 400);
    });
  }
  // [Main Menu Movement Button] END

  //========================================
  // [Back to Main Menu Button] START
  //========================================

  //📍 [Main Menu Back Button Trigger]
  if (btnBackToMain) {
    btnBackToMain.addEventListener("click", () => {
      // ---🔍 [Revert animation and navigate to Main Menu view]
      if (productMovementView) productMovementView.classList.add("hide");
      if (mainMenuView) mainMenuView.classList.remove("hide");
      if (sharedHeader) sharedHeader.classList.remove("hide");
      if (btnMenuStock) btnMenuStock.classList.remove("anim-shrink-fade");
      if (btnMenuMovement) btnMenuMovement.classList.remove("anim-move-up");
    });
  }

  //========================================
  // [Back to Main Menu Button] END
 

  //========================================
  // [Transfer Out Button] START
  //========================================

  //📍 [Transfer Out Menu Item Trigger]
  if (btnTransferOut) {
    btnTransferOut.addEventListener("click", () => {
      navigationTo(productMovementView, viewTaskHub);
    });
  }
  // [Transfer Out Button] END

  // [Create New Task Button] START
  //📍 [New Task Creation Button Trigger]
  if (btnCreateNewTask) {
    btnCreateNewTask.addEventListener("click", () => {
      const selectDest = document.getElementById("selectDestination");
      if (selectDest) selectDest.selectedIndex = 0;
      navigationTo(viewTaskHub, viewDest);
    });
  }
  // [Create New Task Button] END

  //========================================
  // [Task List Item Navigation] START
  //========================================

  //📍 [Task List Items Row Trigger]
  document
    .querySelectorAll(".task-list-item, .pending-task-row")
    .forEach((row) => {
      row.addEventListener("click", function () {
        // ---🔍 [Extract branch info and navigate to Lobby view]
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
  // [Task List Item Navigation] END

  //========================================
  // [Submit Destination Button] START
  //========================================

  //📍 [Destination Selection Confirm Button Trigger]
  if (btnSubmitDest) {
    btnSubmitDest.addEventListener("click", () => {
      const destDropdown = document.getElementById("selectDestination");

      // ---🔍 [Validate destination and navigate to Lobby view]
      if (!destDropdown || !destDropdown.value) {
        safeAlert(
          "ข้อมูลไม่ครบถ้วน",
          "กรุณาเลือกสาขาที่ต้องการสร้างงานก่อนครับ",
        );
        return;
      }
      const selectedText =
        destDropdown.options[destDropdown.selectedIndex].text;
      const lobbyHeader = document.getElementById("lobbyBranchHeaderName");
      if (lobbyHeader) lobbyHeader.innerText = selectedText;
      navigationTo(viewDest, viewLobby);
    });
  }
  // [Submit Destination Button] END

  // [Back From Task Hub Button] START
  //📍 [Task Hub Return Button Trigger]
  if (btnBackFromTaskHub) {
    btnBackFromTaskHub.addEventListener("click", () =>
      navigationTo(viewTaskHub, productMovementView),
    );
  }
  // [Back From Task Hub Button] END

  //========================================
  // [Back From Destination Button] START
  //========================================

  //📍 [Destination View Return Button Trigger]
  if (btnBackFromDest) {
    btnBackFromDest.addEventListener("click", () =>
      navigationTo(viewDest, viewTaskHub),
    );
  }
  // [Back From Destination Button] END

  //========================================
  // [Cancel From Lobby Button] START
  //========================================
  //📍 [Lobby View Cancel Button Trigger]
  if (btnCancelFromLobby) {
    btnCancelFromLobby.addEventListener("click", () =>
      navigationTo(viewLobby, viewTaskHub),
    );
  }
  // [Cancel From Lobby Button] END

  //========================================
  // [Global Alert Modal OK Button] START
  //========================================

  //📍 [Alert Modal Acknowledge Button Trigger]
  if (btnModalAlertOk) {
    btnModalAlertOk.addEventListener("click", () => {
      const alertModal = document.getElementById("customAlertModal");
      if (alertModal) alertModal.classList.add("hide");
    });
  }
  // [Global Alert Modal OK Button] END

  // ==========================================
  // [Shipment Lobby & Generation Phase]
  // ==========================================

  // [Submit Lobby Export Button] START
  //📍 [Lobby Export Action Button Trigger]
  if (btnSubmitLobby) {
    btnSubmitLobby.addEventListener("click", () => {
      safeAlert(
        "เสร็จสิ้น",
        "ระบบทำการบันทึกและส่งออกข้อมูลเรียบร้อยแล้ว",
        "success",
      );
    });
  }
  // [Submit Lobby Export Button] END

  //========================================
  // [Add Shipment Truck Button] START
  //========================================

  //📍 [Shipment Truck Icon Button Trigger]
  if (btnAddShipmentTruck) {
    btnAddShipmentTruck.addEventListener("click", () => {
      // ---🔍 [Reset form values and show shipment creation modal]
      if (selectShipmentReason) selectShipmentReason.selectedIndex = 0;
      if (inputBoxNumber) inputBoxNumber.value = "";
      if (shipmentBoxModal) shipmentBoxModal.classList.remove("hide");
    });
  }
  // [Add Shipment Truck Button] END

  //========================================
  // [Shipment Reason Selection] START
  //========================================
  //📍 [Shipment Type Dropdown Trigger]
  if (selectShipmentReason) {
    selectShipmentReason.addEventListener("change", () => {
      // ---🔍 [Generate temporary shipment ID based on reason and destination]
      const type = selectShipmentReason.value;
      const destDropdown = document.getElementById("selectDestination");
      const destRaw = destDropdown ? destDropdown.value : "";
      const destRealCode = getRealBranchCode(destRaw);
      const p_type = type;
      const p_date = getFormattedDate();
      const p_origin = obfuscateBranchCode(selectedOriginRealCode);
      const p_dest = obfuscateBranchCode(destRealCode);
      const mockSeq = "000X";

      temporaryShipmentID = `${p_type}-${p_date}-${p_origin}-${mockSeq}-${p_dest}`;
      if (inputBoxNumber) inputBoxNumber.value = temporaryShipmentID;
    });
  }
  // [Shipment Reason Selection] END

  //========================================
  // [Cancel Shipment Modal Button] START
  //========================================

  //📍 [Shipment Modal Cancel Button Trigger]
  if (btnCancelBox) {
    btnCancelBox.addEventListener("click", () => {
      if (shipmentBoxModal) shipmentBoxModal.classList.add("hide");
    });
  }
  // [Cancel Shipment Modal Button] END

  //========================================
  // [Confirm Shipment Creation Button] START
  //========================================

  //📍 [Shipment Modal Confirm Button Trigger]
  if (btnConfirmBox) {
    btnConfirmBox.addEventListener("click", () => {
      // ---🔍 [Validate shipment reason and display corresponding shipment card]
      const selectedType = selectShipmentReason
        ? selectShipmentReason.value
        : "";
      if (!selectedType) {
        safeAlert(
          "ข้อมูลไม่ครบถ้วน",
          "กรุณาเลือกประเภทการส่งออกก่อนดำเนินการครับ",
        );
        return;
      }

      const p_date = getFormattedDate();
      const p_origin =
        typeof selectedOriginRealCode !== "undefined"
          ? obfuscateBranchCode(selectedOriginRealCode)
          : "000";
      const selectDest = document.getElementById("selectDestination");
      const p_dest = selectDest
        ? obfuscateBranchCode(getRealBranchCode(selectDest.value))
        : "000";
      const mockSeq = "000X";

      temporaryShipmentID = `${selectedType}-${p_date}-${p_origin}-${mockSeq}-${p_dest}`;
      if (inputBoxNumber) inputBoxNumber.value = temporaryShipmentID;
      if (shipmentBoxModal) shipmentBoxModal.classList.add("hide");

      const allShipmentCards = document.querySelectorAll(".shipment-card");
      allShipmentCards.forEach((card) => {
        card.style.display = "block";
        const idText = card.querySelector(".shipment-id-text");
        if (idText) idText.innerText = temporaryShipmentID;
      });
    });
  }
  // [Confirm Shipment Creation Button] END

  //========================================
  // [Shipment Card Initialization UI] START
  //========================================

  // ---🔍 [Hide default shipment cards if ID is not yet generated]
  const defaultCards = document.querySelectorAll(".shipment-card");
  defaultCards.forEach((card) => {
    if (!temporaryShipmentID) {
      card.style.display = "none";
    }
  });
  // [Shipment Card Initialization UI] END

  // ==========================================
  // [Master Integration: Box Details & Scanning]
  // ==========================================

  // [Box Details Transition Initialization] START
  // ---🔍 [Initialize state variables for active shipment box]
  let currentActiveShipmentCard = null;
  let currentActiveBoxItemNode = null;
  let currentActiveBoxId = "";
  let currentActiveShipmentId = "";

  //📍 [Transition to Full View Box Details]
  function initBoxDetailsTransition(cardNode, boxItemNode, boxId) {
    currentActiveShipmentCard = cardNode;
    currentActiveBoxItemNode = boxItemNode;
    currentActiveBoxId = boxId;
    currentActiveShipmentId = cardNode
      .querySelector(".shipment-barcode-trigger span")
      .innerText.replace("ID: ", "");

    document.getElementById("txtActiveBoxTitle").innerText = `BOX-${boxId}`;
    document.getElementById("txtActiveShipmentID").innerText =
      currentActiveShipmentId;
    document.getElementById("inputBoxMagicSearch").value = "";
    document.getElementById("magicSearchPreviewSlot").classList.add("hide");
    document.getElementById("boxItemsListWrapper").innerHTML = "";

    document.getElementById("boxDetailsView").classList.remove("hide");
  }
  // [Box Details Transition Initialization] END

  //==============================================
  // [Back To Lobby From Box Details Button] START
  //==============================================

  //📍 [Return Button from Box Details View]
  const btnBackToLobby = document.getElementById("btnBackToLobby");
  if (btnBackToLobby) {
    btnBackToLobby.addEventListener("click", () => {
      document.getElementById("boxDetailsView").classList.add("hide");
      evaluateExportButton();
    });
  }
  // [Back To Lobby From Box Details Button] END

  //==================================
  // [Magic Search Engine Input] START
  //==================================

  // ---🔍 [Mock Master Stock Database]
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

  //📍 [Search Input Field Trigger]
  const inputBoxMagicSearch = document.getElementById("inputBoxMagicSearch");
  if (inputBoxMagicSearch) {
    inputBoxMagicSearch.addEventListener("input", function (e) {
      const value = e.target.value.trim().toUpperCase();
      const previewSlot = document.getElementById("magicSearchPreviewSlot");

      // ---🔍 [Process search string when length is at least 3]
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
            ? `<button class="btn-trigger-add-item" data-sku="${matchedProduct.sku}" style="background: #28a745; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; transition: 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">เพิ่ม</button>`
            : `<button disabled style="background: #e9ecef; color: #adb5bd; border: 1px solid #ced4da; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: not-allowed;">หมด</button>`;

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
                safeConfirm(
                  "ยืนยันเพิ่มสินค้า",
                  `คุณต้องการโอนสินค้า ${targetSku} เข้ากล่องนี้ใช่หรือไม่?`,
                  () => {
                    executeAddItemToBoxContainer(targetSku);
                    previewSlot.classList.add("hide");
                    document.getElementById("inputBoxMagicSearch").value = "";
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
  // [Magic Search Engine Input] END

  // [Add Item To Box Execution Engine] START
  //📍 [Item Append to Box UI and Logic]
  function executeAddItemToBoxContainer(skuCode) {
    const wrapper = document.getElementById("boxItemsListWrapper");

    // ---🔍 [Check for existing item to prevent duplicates]
    const existingItem = wrapper.querySelector(
      `.scanned-item-row[data-sku="${skuCode}"]`,
    );
    if (existingItem) {
      safeAlert(
        "ข้อมูลซ้ำซ้อน",
        "สินค้ารหัสนี้ถูกบรรจุอยู่ในกล่องเรียบร้อยแล้ว หากต้องการเพิ่มจำนวน ให้ใช้ฟังก์ชันในอนาคตครับ",
        "error",
      );
      return;
    }

    const itemRow = document.createElement("div");
    itemRow.className = "scanned-item-row";
    itemRow.setAttribute("data-sku", skuCode);
    itemRow.style.cssText =
      "background: white; border-radius: 10px; border: 1px solid #eee; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 5px rgba(0,0,0,0.02);";

    itemRow.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; width: 70%;">
            <i class="fas fa-tag" style="color: #dc3545; font-size: 16px;"></i>
            <div style="text-align: left;">
                <div style="font-size: 13px; font-weight: bold; color: #222;">${skuCode}</div>
                <div style="font-size: 11px; color: #777;">คอลัมน์ระบบ: <span style="color: #e67e22; font-weight:bold;">Moved to Hold Stock</span></div>
            </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; width: 30%; justify-content: flex-end;">
            <button class="btn-remove-item-from-box" style="background: transparent; border: none; color: #dc3545; font-size: 16px; cursor: pointer; padding: 5px;"><i class="fas fa-minus-circle"></i></button>
        </div>
    `;
    wrapper.appendChild(itemRow);

    // ---🔍 [Attach event listener to newly created remove button]
    itemRow
      .querySelector(".btn-remove-item-from-box")
      .addEventListener("click", function () {
        safeConfirm(
          "ลบรายการสินค้า",
          `คุณต้องการยกเลิกการบรรจุสินค้า ${skuCode} และคืนสต็อกกลับระบบใช่หรือไม่?`,
          () => {
            itemRow.remove();
            safeAlert(
              "สำเร็จ",
              "ระบบดึงสินค้าออกจากกล่อง และคืนยอดสต็อกกลับคอลัมน์พร้อมขายเรียบร้อยแล้ว",
              "success",
            );
          },
          "delete",
        );
      });
  }
  // [Add Item To Box Execution Engine] END

  // ==========================================
  // [Export Evaluation & Legacy System]
  // ==========================================

  //📍 [Export Button State Controller START]
  function evaluateExportButton() {
    const btnSubmitLobby = document.getElementById("btnSubmitLobby");
    if (!btnSubmitLobby) return;

    // ---🔍 [Verify if any shipments are checked and boxes are all closed]
    const checkedShipments = document.querySelectorAll(
      ".shipment-select-cb:checked",
    );
    let isReadyToExport = false;

    if (checkedShipments.length > 0) {
      let allValid = true;
      checkedShipments.forEach((cb) => {
        const card = cb.closest(".shipment-card");
        const boxes = card.querySelectorAll(".box-item");
        const openBoxes = card.querySelectorAll(
          '.box-item[data-status="open"]',
        );

        if (boxes.length === 0 || openBoxes.length > 0) {
          allValid = false;
        }
      });

      if (allValid) isReadyToExport = true;
    }

    if (isReadyToExport) {
      btnSubmitLobby.disabled = false;
      btnSubmitLobby.style.background = "transparent";
      btnSubmitLobby.style.color = "#ffffff";
      btnSubmitLobby.style.textShadow = "1px 1px 2px rgba(0,0,0,0.5)";
      btnSubmitLobby.style.cursor = "pointer";
      btnSubmitLobby.innerHTML =
        'EXPORT <i class="fas fa-paper-plane" style="margin-left: 8px;"></i>';
    } else {
      btnSubmitLobby.disabled = true;
      btnSubmitLobby.style.background = "rgba(0,0,0,0.4)";
      btnSubmitLobby.style.color = "#aaa";
      btnSubmitLobby.style.textShadow = "none";
      btnSubmitLobby.style.cursor = "not-allowed";
      btnSubmitLobby.innerText = "EXPORT";
    }
  }
  // [Export Button Evaluation Engine] END

  // [Legacy Checkbox Synchronization Logic] START
  //📍 [Main Checkbox and Child Checkbox Triggers]
  const mainShipmentCheckbox = document.getElementById(
    "selectAllBoxesInShipment",
  );
  const childBoxCheckboxes = document.querySelectorAll(".box-select-checkbox");
  const exportBtn = document.getElementById("btnExportShipment");

  function updateExportButtonState() {
    const checkedCount = document.querySelectorAll(
      ".box-select-checkbox:checked",
    ).length;
    if (!exportBtn) return;

    // ---🔍 [Determine export button state based on selected legacy checkboxes]
    if (checkedCount > 0) {
      exportBtn.disabled = false;
      exportBtn.style.background = "#007bff";
      exportBtn.style.color = "#ffffff";
      exportBtn.style.cursor = "pointer";
    } else {
      exportBtn.disabled = true;
      exportBtn.style.background = "#cccccc";
      exportBtn.style.color = "#666666";
      exportBtn.style.cursor = "not-allowed";
    }
  }

  if (mainShipmentCheckbox) {
    mainShipmentCheckbox.addEventListener("change", function () {
      const isChecked = this.checked;
      childBoxCheckboxes.forEach((cb) => {
        cb.checked = isChecked;
      });
      updateExportButtonState();
    });
  }

  if (childBoxCheckboxes.length > 0) {
    childBoxCheckboxes.forEach((cb) => {
      cb.addEventListener("change", function () {
        const totalCount = childBoxCheckboxes.length;
        const checkedCount = document.querySelectorAll(
          ".box-select-checkbox:checked",
        ).length;
        if (mainShipmentCheckbox) {
          mainShipmentCheckbox.checked = totalCount === checkedCount;
        }
        updateExportButtonState();
      });
    });
  }
  // [Legacy Checkbox Synchronization Logic] END
});
//📍 [END OF DOMContentLoaded]