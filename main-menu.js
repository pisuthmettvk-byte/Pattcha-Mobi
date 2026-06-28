// ==========================================
// MODULE 1: CORE FUNCTIONS & UTILITIES
// ==========================================

function mockReceiveSignal(hasPendingDelivery, qty = 0) {
  const badge = document.getElementById("badgeInbound");
  if (!badge) return;
  const countDisplay = badge.querySelector(".badge-count");
  if (!countDisplay) return;

  if (hasPendingDelivery) {
    badge.classList.remove("hide");
    countDisplay.innerText = qty;
  } else {
    badge.classList.add("hide");
  }
}

function navigationTo(hideView, showView) {
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

// 🌟 ฟังก์ชันแจ้งเตือนส่วนกลาง (บังคับ Z-index ทะลุทุกเลเยอร์เพื่อแก้บั๊ก Test 1)
function safeAlert(title, message) {
  const modal = document.getElementById("customAlertModal");
  if (modal) {
    const header = document.getElementById("modalAlertHeader");
    const icon = document.getElementById("modalAlertIcon");
    const titleElement = document.getElementById("modalAlertTitle");
    const messageElement = document.getElementById("modalAlertMessage");

    if (titleElement) titleElement.innerText = title;
    if (messageElement) messageElement.innerHTML = message;
    if (header) header.style.background = "#dc3545";
    if (icon) icon.className = "fas fa-exclamation-circle";

    modal.style.zIndex = "1000005"; // เสริมเกราะป้องกันจม
    modal.classList.remove("hide");
  } else {
    alert(title + "\n\n" + message.replace(/<br>/g, "\n"));
  }
}

// ==========================================
// MODULE 2: INITIALIZATION & EVENT LISTENERS (ล็อกให้อยู่ในกรอบปลอดภัย 100%)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // --- Views ---
  const mainMenuView = document.getElementById("mainMenuView");
  const productMovementView = document.getElementById("productMovementView");
  const viewTaskHub = document.getElementById("transferOutTaskHubView");
  const viewDest = document.getElementById("transferOutDestView");
  const viewLobby = document.getElementById("transferOutLobbyView");
  const sharedHeader = document.getElementById("sharedHeader");

  // --- Buttons Menu ---
  const btnMenuStock = document.getElementById("btnMenuStock");
  const btnMenuMovement = document.getElementById("btnMenuMovement");
  const btnBackToMain = document.getElementById("btnBackToMain");

  if (btnMenuMovement) {
    btnMenuMovement.addEventListener("click", () => {
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

  if (btnBackToMain) {
    btnBackToMain.addEventListener("click", () => {
      if (productMovementView) productMovementView.classList.add("hide");
      if (mainMenuView) mainMenuView.classList.remove("hide");
      if (sharedHeader) sharedHeader.classList.remove("hide");
      if (btnMenuStock) btnMenuStock.classList.remove("anim-shrink-fade");
      if (btnMenuMovement) btnMenuMovement.classList.remove("anim-move-up");
      if (sharedHeader) sharedHeader.classList.remove("anim-shrink-fade");
    });
  }

  // --- Forward Flow ---
  const btnTransferOut = document.getElementById("btnTransferOut");
  if (btnTransferOut) {
    btnTransferOut.addEventListener("click", () => {
      navigationTo(productMovementView, viewTaskHub);
    });
  }

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
      const selectedBranchText =
        destDropdown.options[destDropdown.selectedIndex].text;
      const lobbyHeader = document.getElementById("lobbyBranchHeaderName");
      if (lobbyHeader) lobbyHeader.innerText = selectedBranchText;

      navigationTo(viewDest, viewLobby);
    });
  }

  // --- Backward Flow ---
  const btnBackFromTaskHub =
    document.getElementById("btnBackToMovement") ||
    document.getElementById("btnBackFromTaskHub");
  if (btnBackFromTaskHub) {
    btnBackFromTaskHub.addEventListener("click", () => {
      navigationTo(viewTaskHub, productMovementView);
    });
  }

  const btnBackFromDest =
    document.getElementById("btnCancelDest") ||
    document.getElementById("btnBackFromDest");
  if (btnBackFromDest) {
    btnBackFromDest.addEventListener("click", () => {
      navigationTo(viewDest, viewTaskHub);
    });
  }

  const btnCancelFromLobby =
    document.getElementById("btnCancelFromLobby") ||
    document.getElementById("btnBackToDest");
  if (btnCancelFromLobby) {
    btnCancelFromLobby.addEventListener("click", () => {
      navigationTo(viewLobby, viewTaskHub);
    });
  }

  // --- Global Alert Modal (จัดการปุ่มปิดแจ้งเตือน) ---
  const btnModalAlertOk = document.getElementById("btnModalAlertOk");
  if (btnModalAlertOk) {
    btnModalAlertOk.addEventListener("click", () => {
      const alertModal = document.getElementById("customAlertModal");
      if (alertModal) alertModal.classList.add("hide");
    });
  }

  // --- Shipment Lobby & Setup ---
  const btnSubmitLobby = document.getElementById("btnSubmitLobby");
  const btnAddShipmentTruck = document.getElementById("btnAddShipmentTruck");
  const shipmentBoxModal = document.getElementById("shipmentBoxModal");
  const btnCancelBox = document.getElementById("btnCancelBox");
  const btnConfirmBox = document.getElementById("btnConfirmBox");

  if (btnSubmitLobby) {
    btnSubmitLobby.addEventListener("click", () => {
      const branchLabel = document.getElementById("lobbyBranchHeaderName");
      const mockPayload = {
        docNo: "TO-" + Date.now(),
        branch: branchLabel ? branchLabel.innerText : "Unknown",
        boxCount: 1,
        itemCount: 5,
        isExpress: false,
      };

      if (typeof dispatchTransferOutData === "function") {
        dispatchTransferOutData(mockPayload);
      } else {
        console.warn("🚨 [System] ยังไม่ได้เชื่อมต่อไฟล์ data-connector.js");
      }

      safeAlert("เสร็จสิ้น", "ระบบทำการบันทึกและส่งออกข้อมูลเรียบร้อยแล้ว");
    });
  }

  if (btnAddShipmentTruck) {
    btnAddShipmentTruck.addEventListener("click", () => {
      const reasonSelect = document.getElementById("selectShipmentReason");
      if (reasonSelect) reasonSelect.selectedIndex = 0;
      if (shipmentBoxModal) shipmentBoxModal.classList.remove("hide");
    });
  }

  if (btnCancelBox) {
    btnCancelBox.addEventListener("click", () => {
      if (shipmentBoxModal) shipmentBoxModal.classList.add("hide");
    });
  }

  if (btnConfirmBox) {
    btnConfirmBox.addEventListener("click", () => {
      const reasonSelect = document.getElementById("selectShipmentReason");

      if (reasonSelect && !reasonSelect.value) {
        safeAlert(
          "ข้อมูลไม่ครบถ้วน",
          "กรุณาเลือกประเภทการส่งออกก่อนดำเนินการครับ",
        );
        return;
      }

      if (shipmentBoxModal) shipmentBoxModal.classList.add("hide");

      if (btnSubmitLobby) {
        btnSubmitLobby.disabled = false;
        btnSubmitLobby.style.background =
          "linear-gradient(135deg, #007bff 0%, #0056b3 100%)";
        btnSubmitLobby.style.color = "white";
        btnSubmitLobby.style.cursor = "pointer";
        btnSubmitLobby.style.border = "none";
      }
    });
  }

  // --- Checkbox Logic ---
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
});
