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


/* ประเภท : ฟังก์ชัน Utility  ชื่อ : safeConfirm  ผลลัพธ์ : แสดงหน้าต่างยืนยัน (ตกลง/ยกเลิก) ดีไซน์ Custom แทน confirm() ของระบบ */
function safeConfirm(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1000006; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(3px);";
  overlay.innerHTML = `
      <div style="background: white; width: 90%; max-width: 350px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); overflow: hidden; display: flex; flex-direction: column; animation: popIn 0.3s ease-out;">
          <div style="background: #ffc107; padding: 20px; text-align: center;">
              <i class="fas fa-question-circle" style="font-size: 40px; color: white;"></i>
          </div>
          <div style="padding: 25px 20px; text-align: center;">
              <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #333;">${title}</h3>
              <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">${message}</p>
          </div>
          <div style="padding: 15px; background: #f8f9fa; border-top: 1px solid #eee; display: flex; justify-content: space-between; gap: 10px;">
              <button class="btn-cancel" style="background: #6c757d; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; flex: 1;">ยกเลิก</button>
              <button class="btn-confirm" style="background: #dc3545; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; flex: 1;">ตกลง</button>
          </div>
      </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('.btn-cancel').addEventListener('click', () => document.body.removeChild(overlay));
  overlay.querySelector('.btn-confirm').addEventListener('click', () => {
      document.body.removeChild(overlay);
      onConfirm(); // ทำงานต่อเมื่อกดยืนยัน
  });
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

  // 📍 [START: บล็อกเสกการ์ด Shipment และ กล่องย่อย (Phase 3 Prep)]
  if (btnConfirmBox) {
    btnConfirmBox.addEventListener("click", () => {
      if (!selectShipmentReason || !selectShipmentReason.value) {
        safeAlert(
          "ข้อมูลไม่ครบถ้วน",
          "กรุณาเลือกประเภทการส่งออกก่อนดำเนินการครับ",
        );
        return;
      }

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

      const card = document.createElement("div");
      card.className = "shipment-card";
      card.setAttribute("data-shipment-type", selectShipmentReason.value);
      card.setAttribute("data-status", "open");
      card.style.cssText =
        "background: white; border-radius: 12px; border: 1px solid #ddd; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden; margin-bottom: 10px; width: 100%; transition: all 0.3s ease;";

      card.innerHTML = `
          <div class="shipment-header-bg" style="background: linear-gradient(to bottom, #d6d6d6 0%, #ffffff 50%, #d6d6d6 100%); padding: 12px 15px; border-bottom: 1px solid #ccc; display: flex; align-items: center; justify-content: space-between; font-weight: bold; color: #111; transition: all 0.3s ease;">
              <div style="display: flex; align-items: center; flex: 1;">
                  <input type="checkbox" class="shipment-select-cb" disabled style="transform: scale(1.4); margin-right: 15px; cursor: pointer;">
                  <div class="shipment-barcode-trigger" style="cursor: pointer; display: flex; align-items: center; color: #333;" title="คลิกเพื่อแสดง QR/Barcode">
                      <i class="fas fa-qrcode" style="margin-right: 8px; font-size: 16px; color: #555;"></i> 
                      <span>ID: ${finalShipmentID}</span>
                  </div>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                  <span class="shipment-box-count" style="font-size: 12px; color: #555; background: #eee; padding: 3px 8px; border-radius: 12px; border: 1px solid #ddd;">Boxes (0)</span>
                  <button class="btn-add-box" title="เพิ่มกล่อง" style="background: transparent; border: none; color: #28a745; font-size: 18px; cursor: pointer; padding: 0; transition: 0.2s;"><i class="fas fa-box"></i><i class="fas fa-plus" style="font-size: 10px; margin-left: 2px; vertical-align: top;"></i></button>
                  <button class="btn-toggle-delete" title="เปิด/ปิด โหมดลบกล่อง" style="background: transparent; border: none; color: #dc3545; font-size: 16px; cursor: pointer; padding: 0;"><i class="fas fa-trash-alt"></i></button>
              </div>
          </div>
          <div class="box-list-container" style="display: flex; flex-direction: column; background: #fdfdfd; width: 100%;"></div>
      `;
      if (lobbyContentContainer) lobbyContentContainer.appendChild(card);

      const newCheckbox = card.querySelector(".shipment-select-cb");
      newCheckbox.addEventListener("change", evaluateExportButton);
      const boxListContainer = card.querySelector(".box-list-container");
      const boxCountDisplay = card.querySelector(".shipment-box-count");

      /* ประเภท : ฟังก์ชัน  ชื่อ : แสดง Barcode Trigger */
      card
        .querySelector(".shipment-barcode-trigger")
        .addEventListener("click", () => {
          safeAlert(
            "QR / Barcode",
            "หน้าต่างลอยสแกนบาร์โค้ดของ Shipment จะแสดงที่นี่ครับ",
          );
        });

      /* ประเภท : ฟังก์ชัน  ชื่อ : เปิดโหมดลบกล่อง (Dimming Effect & Block Actions) */
      let deleteMode = false;
      card.querySelector(".btn-toggle-delete").addEventListener("click", () => {
        deleteMode = !deleteMode;

        const headerBg = card.querySelector(".shipment-header-bg");
        const addBoxBtn = card.querySelector(".btn-add-box");
        const shipCb = card.querySelector(".shipment-select-cb");
        const deleteBtns = card.querySelectorAll(".btn-delete-box");
        const addItemsBtns = card.querySelectorAll(".btn-add-item");

        if (deleteMode) {
          // 📍 ลอจิกทำแถบเทาและล็อกปุ่ม (Delete Mode Block)
          headerBg.style.filter = "grayscale(100%) opacity(0.7)";
          addBoxBtn.style.pointerEvents = "none";
          addBoxBtn.style.opacity = "0.3";
          shipCb.style.pointerEvents = "none";
          addItemsBtns.forEach((btn) => {
            btn.style.pointerEvents = "none";
            btn.style.opacity = "0.3";
          });
          deleteBtns.forEach((btn) => btn.classList.remove("hide"));
        } else {
          // ปลดล็อกกลับสู่สภาพเดิม
          headerBg.style.filter = "none";
          addBoxBtn.style.pointerEvents = "auto";
          addBoxBtn.style.opacity = "1";
          shipCb.style.pointerEvents = "auto";
          addItemsBtns.forEach((btn) => {
            btn.style.pointerEvents = "auto";
            btn.style.opacity = "1";
          });
          deleteBtns.forEach((btn) => btn.classList.add("hide"));
        }
      });

      /* ประเภท : ฟังก์ชัน  ชื่อ : สร้างกล่องย่อย (Add Box) */
      let boxCounter = 0;
      card.querySelector(".btn-add-box").addEventListener("click", () => {
        const openBox = card.querySelector('.box-item[data-status="open"]');
        if (openBox) {
          safeAlert(
            "ไม่อนุญาตให้สร้างกล่อง",
            "มีกล่องที่กำลังเปิดอยู่ กรุณาเพิ่มสินค้าและปิดกล่องเดิมให้เสร็จก่อนครับ",
          );
          return;
        }

        boxCounter++;
        const boxId = String(boxCounter).padStart(3, "0");
        const boxItem = document.createElement("div");
        boxItem.className = "box-item";
        boxItem.setAttribute("data-status", "open");
        boxItem.style.cssText =
          "padding: 12px 15px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; background: #fff;";

        boxItem.innerHTML = `
              <div style="display: flex; align-items: center; width: 35%;">
                  <input type="checkbox" class="box-select-cb" disabled style="transform: scale(1.2); margin-right: 18px; margin-left: 2px; cursor: pointer;">
                  <i class="fas fa-box-open box-status-icon" style="color: #dc3545; margin-right: 8px; font-size: 16px;"></i>
                  <span style="font-size: 13px; font-weight: bold; color: #333;">BOX-${boxId}</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: center; gap: 15px; width: 35%; font-size: 13px; color: #666;">
                  <span title="สินค้านับมือ"><i class="fas fa-hand-paper" style="color: #f39c12; margin-right: 4px;"></i> 0</span>
                  <span title="สินค้ายิงบาร์โค้ด"><i class="fas fa-barcode" style="color: #17a2b8; margin-right: 4px;"></i> 0</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: flex-end; width: 30%; min-height: 26px;">
                  <button class="btn-add-item" style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; margin-right: 8px; transition: 0.2s;">
                      <i class="fas fa-plus"></i> เพิ่มสินค้า
                  </button>
                  <button class="btn-delete-box ${deleteMode ? "" : "hide"}" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 6px; font-size: 11px; cursor: pointer;">
                      <i class="fas fa-trash-alt"></i>
                  </button>
              </div>
          `;
        boxListContainer.appendChild(boxItem);
        boxCountDisplay.innerText = `Boxes (${card.querySelectorAll(".box-item").length})`;

        /* ประเภท : ฟังก์ชัน  ชื่อ : ลบกล่องย่อย (Custom Confirm) */
        boxItem
          .querySelector(".btn-delete-box")
          .addEventListener("click", function () {
            // 📍 เรียกใช้ Custom Modal สีเหลืองสวยงาม แทน confirm() ระบบ
            safeConfirm(
              "ยืนยันการลบกล่อง",
              `คุณแน่ใจหรือไม่ว่าต้องการลบหมายเลข BOX-${boxId} ?`,
              () => {
                boxItem.remove();
                boxCountDisplay.innerText = `Boxes (${card.querySelectorAll(".box-item").length})`;

                // เช็คว่าถ้าลบกล่องจนไม่เหลือกล่องที่ปิดเลย ต้องบล็อก Checkbox หน้าสุดกลับด้วย
                const closedBoxes = card.querySelectorAll(
                  '.box-item[data-status="closed"]',
                ).length;
                if (closedBoxes === 0) {
                  const mainCb = card.querySelector(".shipment-select-cb");
                  mainCb.checked = false;
                  mainCb.disabled = true;
                }
                evaluateExportButton();
              },
            );
          });

        /* ประเภท : ฟังก์ชัน  ชื่อ : จำลองการเพิ่มสินค้าและปิดกล่อง (Custom Confirm + ปลดล็อก Checkbox) */
        boxItem
          .querySelector(".btn-add-item")
          .addEventListener("click", function () {
            safeConfirm(
              "ยืนยันปิดกล่อง",
              "คุณได้แอดสินค้าเสร็จสิ้นแล้ว: ต้องการปิดกล่องนี้เลยหรือไม่?",
              () => {
                boxItem.setAttribute("data-status", "closed");
                boxItem.querySelector(".box-status-icon").className =
                  "fas fa-box box-status-icon";
                boxItem.querySelector(".box-status-icon").style.color =
                  "#28a745";
                boxItem.querySelector(".box-select-cb").disabled = false;
                this.style.display = "none";

                // 📍 กุญแจสำคัญที่หายไป: ปลดล็อก Checkbox ของ Shipment ให้ใช้งานได้!
                card.querySelector(".shipment-select-cb").disabled = false;

                evaluateExportButton();
              },
            );
          });
      });
    });
  }
  // 📍 [END: บล็อกเสกการ์ด Shipment และ กล่องย่อย (Phase 3 Prep)]

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
