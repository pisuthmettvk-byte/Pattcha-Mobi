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

function safeAlert(title, message) {
  const modal = document.getElementById("customAlertModal");
  if (modal) {
    const titleElement = document.getElementById("modalAlertTitle");
    const messageElement = document.getElementById("modalAlertMessage");
    if (titleElement) titleElement.innerText = title;
    if (messageElement) messageElement.innerHTML = message;
    modal.style.zIndex = "1000005";
    modal.classList.remove("hide");
  } else {
    alert(title + "\n\n" + message);
  }
}

// 🌟 ตัวท่อรอรับรหัสสาขาจริง (Real Branch Code Wiring)
function getRealBranchCode(branchId) {
  const branchCodeMap = {
    B001: "CKC01", // เซ็นทรัลเวิลด์
    B002: "KKN02", // สยามพารากอน
    B003: "ICS03", // ไอคอนสยาม
  };
  return branchCodeMap[branchId] || "UNKN";
}

// 🌟 ลอจิกพรางรหัสความปลอดภัย (Security Obfuscation)
function obfuscateBranchCode(code) {
  if (!code || code === "UNKN") return "00XX";
  const clean = code.replace(/[^a-zA-Z0-9]/g, "");
  if (clean.length < 4) return clean;
  const alpha = clean.substring(0, 2).toUpperCase();
  const numeric = clean.substring(clean.length - 2);
  return numeric + alpha;
}

// 🌟 ระบบรันเลข Audit อมตะ (Immutable Sequence)
function generateAuditSequence(type, branch) {
  const storageKey = `ledger_seq_${branch}_${type}`;
  let currentSeq = parseInt(localStorage.getItem(storageKey)) || 0;
  currentSeq += 1;
  localStorage.setItem(storageKey, currentSeq);
  return String(currentSeq).padStart(4, "0");
}

// 🌟 ฟังก์ชันดึงฟอร์แมตวันที่ YYMMDD
function getFormattedDate() {
  const d = new Date();
  const yy = String(d.getFullYear()).substring(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return yy + mm + dd;
}

// ==========================================
// MODULE 2: INITIALIZATION & EVENT LISTENERS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Main Menu Navigation (ระบบเก่าด่านหน้า) ---
  const mainMenuView = document.getElementById("mainMenuView");
  const productMovementView = document.getElementById("productMovementView");
  const viewTaskHub = document.getElementById("transferOutTaskHubView");
  const viewDest = document.getElementById("transferOutDestView");
  const viewLobby = document.getElementById("transferOutLobbyView");
  const sharedHeader = document.getElementById("sharedHeader");

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
    });
  }

  // --- 2. Transfer Out Forward Flow (เดินหน้า) ---
  const btnTransferOut = document.getElementById("btnTransferOut");
  if (btnTransferOut) {
    btnTransferOut.addEventListener("click", () =>
      navigationTo(productMovementView, viewTaskHub),
    );
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
      const selectedText =
        destDropdown.options[destDropdown.selectedIndex].text;
      const lobbyHeader = document.getElementById("lobbyBranchHeaderName");
      if (lobbyHeader) lobbyHeader.innerText = selectedText;
      navigationTo(viewDest, viewLobby);
    });
  }

  // --- 3. Transfer Out Backward Flow (ถอยหลัง) ---
  const btnBackFromTaskHub =
    document.getElementById("btnBackToMovement") ||
    document.getElementById("btnBackFromTaskHub");
  if (btnBackFromTaskHub) {
    btnBackFromTaskHub.addEventListener("click", () =>
      navigationTo(viewTaskHub, productMovementView),
    );
  }

  const btnBackFromDest =
    document.getElementById("btnCancelDest") ||
    document.getElementById("btnBackFromDest");
  if (btnBackFromDest) {
    btnBackFromDest.addEventListener("click", () =>
      navigationTo(viewDest, viewTaskHub),
    );
  }

  const btnCancelFromLobby =
    document.getElementById("btnCancelFromLobby") ||
    document.getElementById("btnBackToDest");
  if (btnCancelFromLobby) {
    btnCancelFromLobby.addEventListener("click", () =>
      navigationTo(viewLobby, viewTaskHub),
    );
  }

  // --- 4. Global Alert ---
  const btnModalAlertOk = document.getElementById("btnModalAlertOk");
  if (btnModalAlertOk) {
    btnModalAlertOk.addEventListener("click", () => {
      const alertModal = document.getElementById("customAlertModal");
      if (alertModal) alertModal.classList.add("hide");
    });
  }

  // --- 5. PHASE 2 ENGINE: Shipment Lobby & Generation ---
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
  let selectedOriginRealCode = "CKC01"; // ต้นทางสมมติ

  if (btnSubmitLobby) {
    btnSubmitLobby.addEventListener("click", () => {
      safeAlert("เสร็จสิ้น", "ระบบทำการบันทึกและส่งออกข้อมูลเรียบร้อยแล้ว");
    });
  }

  if (btnAddShipmentTruck) {
    btnAddShipmentTruck.addEventListener("click", () => {
      if (selectShipmentReason) selectShipmentReason.selectedIndex = 0;
      if (inputBoxNumber)
        inputBoxNumber.value = "กรุณาเลือกประเภทระบบเพื่อคำนวณรหัส...";
      temporaryShipmentID = "";
      if (shipmentBoxModal) shipmentBoxModal.classList.remove("hide");
    });
  }

  if (selectShipmentReason) {
    selectShipmentReason.addEventListener("change", () => {
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

  if (btnCancelBox) {
    btnCancelBox.addEventListener("click", () => {
      if (shipmentBoxModal) shipmentBoxModal.classList.add("hide");
    });
  }

  if (btnConfirmBox) {
    btnConfirmBox.addEventListener("click", () => {
      if (!selectShipmentReason || !selectShipmentReason.value) {
        safeAlert(
          "ข้อมูลไม่ครบถ้วน",
          "กรุณาเลือกประเภทการส่งออกก่อนดำเนินการครับ",
        );
        return;
      }

      // 🛡️ ผู้คุมกฎห้ามสร้างงานซ้ำ (Anti-Duplicate Logic)
      const existingCardType = document.querySelector(
        `.shipment-card[data-shipment-type="${selectShipmentReason.value}"]`,
      );
      if (existingCardType) {
        safeAlert(
          "ไม่อนุญาตให้สร้างซ้ำ",
          `มีรอบการจัดส่งประเภทนี้ค้างอยู่ในล็อบบี้แล้ว กรุณาดำเนินการของเดิมให้เสร็จสิ้นก่อนครับ`,
        );
        return;
      }

      // ดึงเลขรัน Audit จริง
      const realSeq = generateAuditSequence(
        selectShipmentReason.value,
        selectedOriginRealCode,
      );
      const destRealCode = getRealBranchCode(
        document.getElementById("selectDestination").value,
      );

      const finalShipmentID = `${selectShipmentReason.value}-${getFormattedDate()}-${obfuscateBranchCode(selectedOriginRealCode)}-${realSeq}-${obfuscateBranchCode(destRealCode)}`;

      if (lobbyEmptyState) lobbyEmptyState.classList.add("hide");
      if (shipmentBoxModal) shipmentBoxModal.classList.add("hide");

      // 🛡️ เสกการ์ดพร้อมกล่อง Checkbox และผูกสถานะกล่องที่กำลังทำงาน (Data Logic)
      const card = document.createElement("div");
      card.className = "shipment-card";
      card.setAttribute("data-shipment-type", selectShipmentReason.value);
      card.setAttribute("data-status", "open"); // 📍 ตั้งค่าเริ่มต้นเป็น "open" ยังไม่ปิดกล่อง
      card.style.cssText =
        "background: white; border-radius: 12px; border: 1px solid #ddd; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden; margin-bottom: 10px; width: 100%;";

      card.innerHTML = `
                <div style="background: linear-gradient(to bottom, #d6d6d6 0%, #ffffff 50%, #d6d6d6 100%); padding: 12px 15px; border-bottom: 1px solid #ccc; display: flex; align-items: center; justify-content: space-between; font-weight: bold; color: #111;">
                    <div style="display: flex; align-items: center;">
                        <input type="checkbox" class="shipment-select-cb" disabled style="transform: scale(1.4); margin-right: 15px; cursor: pointer;">
                        <div><i class="fas fa-barcode" style="margin-right: 6px;"></i> ID: ${finalShipmentID}</div>
                    </div>
                    <span style="background: #222; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${selectShipmentReason.value}</span>
                </div>
                <div style="padding: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 13px; color: #666;" class="box-status-text"><i class="fas fa-box-open" style="color:#dc3545;"></i> 0 กล่อง (ยังไม่ปิดกล่อง)</div>
                    <button class="btn-mock-close-box" style="background: #28a745; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer;"><i class="fas fa-lock"></i> ปิดกล่อง</button>
                </div>
            `;
      if (lobbyContentContainer) lobbyContentContainer.appendChild(card);

      // ผูกสายไฟกล่อง Checkbox กับปุ่มส่งออก
      const newCheckbox = card.querySelector(".shipment-select-cb");
      newCheckbox.addEventListener("change", evaluateExportButton);

      // 📍 ฟังก์ชันจำลองการปิดกล่องใน Card
      const btnMockClose = card.querySelector(".btn-mock-close-box");
      btnMockClose.addEventListener("click", function () {
        card.setAttribute("data-status", "closed");
        card.querySelector(".box-status-text").innerHTML =
          `<i class="fas fa-box" style="color:#28a745;"></i> 1 กล่อง (ปิดแล้ว)`;
        newCheckbox.disabled = false; // ปลดล็อก Checkbox ให้กดติ๊กได้
        this.style.display = "none"; // ซ่อนปุ่มปิดกล่อง
        evaluateExportButton();
      });
    });
  }

  // 🛡️ ระบบคุมปุ่ม EXPORT ขั้นเด็ดขาด (Strict Logic)
  function evaluateExportButton() {
    const btnSubmitLobby = document.getElementById("btnSubmitLobby");
    if (!btnSubmitLobby) return;

    const checkedBoxes = document.querySelectorAll(
      ".shipment-select-cb:checked",
    );
    let isReadyToExport = false;

    // ต้องมีการติ๊กเลือกอย่างน้อย 1 รายการ
    if (checkedBoxes.length > 0) {
      let allCheckedAreClosed = true;

      // ทุกรายการที่ถูกติ๊ก "ต้องปิดกล่องแล้ว" (data-status="closed")
      checkedBoxes.forEach((cb) => {
        const card = cb.closest(".shipment-card");
        if (!card || card.getAttribute("data-status") !== "closed") {
          allCheckedAreClosed = false;
        }
      });

      if (allCheckedAreClosed) {
        isReadyToExport = true;
      }
    }

    // อัปเดตลอจิกปุ่ม (เคารพสีโปร่งแสงและแสงเงาออริจินัลของเจเลอร์)
    if (isReadyToExport) {
      btnSubmitLobby.disabled = false;
      btnSubmitLobby.style.background = "transparent";
      btnSubmitLobby.style.color = "#ffffff";
      btnSubmitLobby.style.textShadow = "1px 1px 2px rgba(0,0,0,0.5)"; // ดึงความสวยงามของข้อความคืนมา
      btnSubmitLobby.style.cursor = "pointer";
      btnSubmitLobby.innerHTML =
        'EXPORT <i class="fas fa-paper-plane" style="margin-left: 8px;"></i>'; // คำมาตรฐาน + ไอคอนจรวดกระดาษ
    } else {
      btnSubmitLobby.disabled = true;
      btnSubmitLobby.style.background = "rgba(0,0,0,0.4)";
      btnSubmitLobby.style.color = "#aaa";
      btnSubmitLobby.style.textShadow = "none";
      btnSubmitLobby.style.cursor = "not-allowed";
      btnSubmitLobby.innerText = "EXPORT";
    }
  }

  // --- 6. Checkbox Logic (ระบบกล่องติ๊กของเดิม คงไว้ไม่ให้กระทบ) ---
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
