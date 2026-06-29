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

/* ประเภท : ฟังก์ชัน Utility  ชื่อ : safeAlert (Dynamic)  ผลลัพธ์ : แจ้งเตือน 3 สี (แดง=ค่าเริ่มต้น, เขียว=สำเร็จ, เหลือง=เตือน) */
function safeAlert(title, message, type = "error") {
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
    // ค่าเริ่มต้น (Error / ล็อก / ผิดเงื่อนไข) -> สีแดง
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

/* ประเภท : ฟังก์ชัน Utility  ชื่อ : safeConfirm (Dynamic)  ผลลัพธ์ : หน้าต่างยืนยันแยกสี (แดง=ลบ/ตกใจ, เหลือง=คำถามทั่วไป) */
function safeConfirm(title, message, onConfirm, type = "question") {
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
    // ค่าเริ่มต้น (Question) -> สีเหลือง เครื่องหมายคำถาม
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

/* ประเภท : ฟังก์ชัน Event ดักจับการคลิกสูงสุด  ชื่อ : Global Delete Mode Blocker  ผลลัพธ์ : บล็อกการคลิกปุ่มทุกชนิดในหน้าจอถ้ามีถังขยะเปิดอยู่ พร้อมแจ้งเตือน */
document.addEventListener(
  "click",
  function (e) {
    const activeDeleteCard = document.querySelector(
      ".shipment-card.is-delete-mode",
    );

    // ถ้ามีโหมดลบกล่องเปิดอยู่
    if (activeDeleteCard) {
      // ยกเว้น: ไม่บล็อกหน้าต่าง Alert ของระบบ และกล่อง Confirm
      if (
        e.target.closest("#customAlertModal") ||
        e.target.closest(".sys-alert-element")
      ) {
        return;
      }

      // ถ้าคลิก "ภายใน" การ์ดที่เปิดโหมดถังขยะ
      if (activeDeleteCard.contains(e.target)) {
        // อนุญาตแค่ปุ่มถังขยะบนหัว (เพื่อปิดโหมด) และปุ่มลบย่อย เท่านั้น
        if (
          !e.target.closest(".btn-toggle-delete") &&
          !e.target.closest(".btn-delete-box")
        ) {
          e.preventDefault();
          e.stopPropagation();
          safeAlert(
            "ระบบถูกล็อก",
            "โหมดลบกล่องกำลังทำงานอยู่ กรุณากดปุ่มลบ หรือกดปุ่มถังขยะที่ส่วนหัวเพื่อปิดโหมดก่อนครับ",
          );
        }
      } else {
        // ถ้าไปคลิก "นอกการ์ด" (เช่น ไปกด Export, กด Cancel, หรือกดการ์ดใบอื่น) -> บล็อกทิ้ง!
        e.preventDefault();
        e.stopPropagation();
        safeAlert(
          "ระบบถูกล็อก",
          "ไม่อนุญาตให้ทำรายการอื่นขณะเปิดโหมดลบกล่องค้างไว้ กรุณาปิดโหมดลบของรายการนั้นก่อนครับ",
        );
      }
    }
  },
  true,
); // ใช้ Capture Phase ชิงตัดหน้าอีเวนต์อื่นทั้งหมด

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
      safeAlert(
        "เสร็จสิ้น",
        "ระบบทำการบันทึกและส่งออกข้อมูลเรียบร้อยแล้ว",
        "success",
      );
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

  // 📍 [START: บล็อกสร้างการ์ด Shipment (อัปเดตลอจิก Select All + พรางตัว)]
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
          `มีรอบจัดส่งประเภทนี้ค้างอยู่ กรุณาดำเนินการใบเดิมให้เสร็จสิ้นก่อนครับ`,
        );
        return;
      }

      // ID พรางตัวจนกว่าจะ Export
      const finalShipmentID = `${
        selectShipmentReason.value
      }-${getFormattedDate()}-XXXX-XXXX-XXXX`;
      if (lobbyEmptyState) lobbyEmptyState.classList.add("hide");
      if (shipmentBoxModal) shipmentBoxModal.classList.add("hide");

      const card = document.createElement("div");
      card.className = "shipment-card";
      card.setAttribute("data-shipment-type", selectShipmentReason.value);
      card.style.cssText =
        "background: white; border-radius: 12px; border: 1px solid #ddd; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden; margin-bottom: 10px; width: 100%; transition: all 0.3s ease;";

      card.innerHTML = `
          <div class="shipment-header-bg" style="background: linear-gradient(to bottom, #d6d6d6 0%, #ffffff 50%, #d6d6d6 100%); padding: 12px 15px; border-bottom: 1px solid #ccc; display: flex; align-items: center; justify-content: space-between; font-weight: bold; color: #111;">
              <div style="display: flex; align-items: center; flex: 1;">
                  <input type="checkbox" class="shipment-select-cb" disabled style="transform: scale(1.4); margin-right: 15px; cursor: pointer;">
                  <div class="shipment-barcode-trigger" style="cursor: pointer; display: flex; align-items: center; color: #333;">
                      <i class="fas fa-qrcode" style="margin-right: 8px; font-size: 16px; color: #555;"></i> 
                      <span>ID: ${finalShipmentID}</span>
                  </div>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                  <span class="shipment-box-count" style="font-size: 12px; color: #555; background: #eee; padding: 3px 8px; border-radius: 12px; border: 1px solid #ddd;">Boxes (0)</span>
                  <button class="btn-add-box" title="เพิ่มกล่อง" style="background: transparent; border: none; color: #28a745; font-size: 18px; cursor: pointer; padding: 0;"><i class="fas fa-box"></i><i class="fas fa-plus" style="font-size: 10px; margin-left: 2px; vertical-align: top;"></i></button>
                  <button class="btn-toggle-delete" title="เปิด/ปิด โหมดลบกล่อง" style="background: transparent; border: none; color: #dc3545; font-size: 16px; cursor: pointer; padding: 0;"><i class="fas fa-trash-alt"></i></button>
              </div>
          </div>
          <div class="box-list-container" style="display: flex; flex-direction: column; background: #fdfdfd; width: 100%;"></div>
      `;
      if (lobbyContentContainer) lobbyContentContainer.appendChild(card);

      const mainCheckbox = card.querySelector(".shipment-select-cb");
      const boxListContainer = card.querySelector(".box-list-container");
      const boxCountDisplay = card.querySelector(".shipment-box-count");

      /* 📍 ลอจิก: Barcode Trigger */
      card
        .querySelector(".shipment-barcode-trigger")
        .addEventListener("click", () => {
          safeAlert(
            "QR / Barcode",
            "Barcode จะถูกคำนวณและแสดงผลก็ต่อเมื่อกดส่งออกสำเร็จแล้วครับ",
          );
        });

      /* 📍 ลอจิก: Select All (หัวหน้าติ๊ก ลูกน้องติ๊กตาม) */
      mainCheckbox.addEventListener("change", (e) => {
        const isChecked = e.target.checked;
        const childCbs = card.querySelectorAll(
          ".box-select-cb:not([disabled])",
        );
        childCbs.forEach((cb) => (cb.checked = isChecked));
        evaluateExportButton();
      });

      /* 📍 ลอจิก: เปิด/ปิด โหมดลบกล่อง (ทำแถบเทา) */
      card.querySelector(".btn-toggle-delete").addEventListener("click", () => {
        const isDeleting = card.classList.toggle("is-delete-mode");
        const allCards = document.querySelectorAll(".shipment-card");
        const deleteBtns = card.querySelectorAll(".btn-delete-box");

        if (isDeleting) {
          allCards.forEach((c) => {
            if (c !== card) c.style.filter = "grayscale(100%) opacity(0.4)"; // พรางการ์ดอื่น
          });
          card.querySelector(".shipment-header-bg").style.filter =
            "grayscale(100%) opacity(0.8)";
          deleteBtns.forEach((btn) => btn.classList.remove("hide"));
        } else {
          allCards.forEach((c) => (c.style.filter = "none"));
          card.querySelector(".shipment-header-bg").style.filter = "none";
          deleteBtns.forEach((btn) => btn.classList.add("hide"));
        }
      });

      /* 📍 ลอจิก: สร้างกล่องย่อย */
      let boxCounter = 0;
      card.querySelector(".btn-add-box").addEventListener("click", () => {
        const openBox = card.querySelector('.box-item[data-status="open"]');
        if (openBox) {
          safeAlert(
            "ไม่อนุญาต",
            "มีกล่องค้างเปิดอยู่ กรุณาเพิ่มสินค้าให้เสร็จก่อนครับ",
            "error",
          );
          return;
        }

        boxCounter++;
        const boxId = String(boxCounter).padStart(3, "0");
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
        boxListContainer.appendChild(boxItem);
        boxCountDisplay.innerText = `Boxes (${
          card.querySelectorAll(".box-item").length
        })`;

        const childCb = boxItem.querySelector(".box-select-cb");

        /* ประเภท : ฟังก์ชัน | ชื่อ : ลูกสะท้อนแม่ | ผลลัพธ์ : เช็ค Checkbox อัตโนมัติ */
        childCb.addEventListener("change", () => {
          const allClosed = card.querySelectorAll(
            '.box-item[data-status="closed"] .box-select-cb',
          );
          const allChecked = card.querySelectorAll(
            '.box-item[data-status="closed"] .box-select-cb:checked',
          );
          mainCheckbox.checked =
            allClosed.length > 0 && allClosed.length === allChecked.length;
          evaluateExportButton();
        });

        /* ประเภท : ฟังก์ชัน | ชื่อ : ลบกล่องย่อย | ผลลัพธ์ : ลบกล่องด้วย Custom Confirm (ธีมสีแดง delete) */
        boxItem
          .querySelector(".btn-delete-box")
          .addEventListener("click", function () {
            safeConfirm(
              "ลบกล่อง",
              `แน่ใจหรือไม่ว่าต้องการลบ BOX-${boxId} ?`,
              () => {
                boxItem.remove();
                boxCountDisplay.innerText = `Boxes (${
                  card.querySelectorAll(".box-item").length
                })`;
                if (
                  card.querySelectorAll('.box-item[data-status="closed"]')
                    .length === 0
                ) {
                  mainCheckbox.checked = false;
                  mainCheckbox.disabled = true;
                }
                evaluateExportButton();
              },
              "delete",
            );
          });

        /* 📍 [จุดที่แก้ไข!] ประเภท: ฟังก์ชัน | ชื่อ: เปิดหน้าต่างเพิ่มสินค้า | ผลลัพธ์: สับรางเปิดหน้า Full View 18-72-10 ทันที */
        boxItem
          .querySelector(".btn-add-item")
          .addEventListener("click", function () {
            initBoxDetailsTransition(card, boxItem, boxId);
          });
      });
    });
  }
  // 📍 [END: บล็อกสร้างการ์ด Shipment]

  /* 📍 [START: MASTER INTEGRATION - BOX DETAILS & SCANNING] */

  // ตัวแปรควบคุมสถานะปัจจุบัน
  let currentActiveShipmentCard = null;
  let currentActiveBoxItemNode = null;
  let currentActiveBoxId = "";
  let currentActiveShipmentId = "";

  /* ประเภท: Function | ชื่อ: initBoxDetailsTransition | ผลลัพธ์: สับรางเข้าหน้าจอ Full View พร้อมโอน Context */
  function initBoxDetailsTransition(cardNode, boxItemNode, boxId) {
    currentActiveShipmentCard = cardNode;
    currentActiveBoxItemNode = boxItemNode;
    currentActiveBoxId = boxId;
    currentActiveShipmentId = cardNode
      .querySelector(".shipment-barcode-trigger span")
      .innerText.replace("ID: ", "");

    // อัปเดต UI หน้า Full View
    document.getElementById("txtActiveBoxTitle").innerText = `BOX-${boxId}`;
    document.getElementById("txtActiveShipmentID").innerText =
      currentActiveShipmentId;

    document.getElementById("inputBoxMagicSearch").value = "";
    document.getElementById("magicSearchPreviewSlot").classList.add("hide");
    document.getElementById("boxItemsListWrapper").innerHTML = "";

    // เปิดหน้าจอ
    document.getElementById("boxDetailsView").classList.remove("hide");
  }

  // ผูกปุ่มย้อนกลับจากหน้าจอดีเทล (Footer ฝั่งซ้าย)
  document.getElementById("btnBackToLobby").addEventListener("click", () => {
    document.getElementById("boxDetailsView").classList.add("hide");
    evaluateExportButton();
  });

  /* 📍 [END: MASTER INTEGRATION] */

  /* 📍 [START: อัปเกรดสมองกล Magic Search & คุมกำเนิดสต็อก (Box Details)] */

  // 🗄️ จำลองฐานข้อมูล Master File (อ้างอิงโครงสร้างที่สมบูรณ์แบบของ Stock In House)
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
    }, // ❌ สต็อกหมด (เทสต์บล็อก)
    {
      sku: "FER-BELT-888",
      barcode: "805123456888",
      name: "Gancini Reversible Belt",
      lastThree: "888",
      available: 2,
      image: "https://via.placeholder.com/40",
    },
  ];

  /* ประเภท: Event Listener | ชื่อ: Magic Search Engine (Full Spec) | ผลลัพธ์: ค้นหาครอบจักรวาล + เช็คสต็อก Available */
  document
    .getElementById("inputBoxMagicSearch")
    .addEventListener("input", function (e) {
      const value = e.target.value.trim().toUpperCase();
      const previewSlot = document.getElementById("magicSearchPreviewSlot");

      // เริ่มทำงานเมื่อพิมพ์ครบ 3 ตัวอักษรขึ้นไป
      if (value.length >= 3) {
        // 🧠 ลอจิก Magic Search: กวาดหาข้อมูลจาก SKU, บาร์โค้ดเต็ม, ชื่อรุ่น, หรือรหัส 3 ตัวท้าย
        const matchedProduct = mockMasterStockDatabase.find(
          (item) =>
            item.sku.toUpperCase().includes(value) ||
            item.barcode.includes(value) ||
            item.name.toUpperCase().includes(value) ||
            item.lastThree === value,
        );

        if (matchedProduct) {
          // 🛡️ ลอจิกผู้คุมกฎ: เช็คยอด Available Stock ว่ามีของให้โอนหรือไม่
          const isAvailable = matchedProduct.available > 0;

          // แสดงสถานะสีตามสต็อก (เขียว = พร้อมโอน, แดง = หมด)
          const stockStatusHtml = isAvailable
            ? `<span style="color: #28a745; font-weight:bold;"><i class="fas fa-check-circle"></i> พร้อมโอน: ${matchedProduct.available} ชิ้น</span>`
            : `<span style="color: #dc3545; font-weight:bold;"><i class="fas fa-times-circle"></i> สต็อกเป็น 0 (โอนไม่ได้)</span>`;

          // เปลี่ยนปุ่ม: ถ้าสต็อกหมด ให้ล็อกปุ่มเป็นสีเทา กดไม่ได้
          const btnHtml = isAvailable
            ? `<button class="btn-trigger-add-item" data-sku="${matchedProduct.sku}" style="background: #28a745; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; transition: 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">เพิ่ม</button>`
            : `<button disabled style="background: #e9ecef; color: #adb5bd; border: 1px solid #ced4da; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: not-allowed;">หมด</button>`;

          // ประกอบร่าง UI หน้าต่างพรีวิว
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

          // ผูกสายไฟปุ่มเพิ่ม (เฉพาะกรณีที่สต็อก > 0 เท่านั้น)
          if (isAvailable) {
            previewSlot
              .querySelector(".btn-trigger-add-item")
              .addEventListener("click", function () {
                const targetSku = this.getAttribute("data-sku");

                // ถามยืนยันด้วย Modal ธีมสีเหลือง (Question)
                safeConfirm(
                  "ยืนยันเพิ่มสินค้า",
                  `คุณต้องการโอนสินค้า ${targetSku} เข้ากล่องนี้ใช่หรือไม่?`,
                  () => {
                    executeAddItemToBoxContainer(targetSku);
                    previewSlot.classList.add("hide"); // ปิดหน้าต่างพรีวิว
                    document.getElementById("inputBoxMagicSearch").value = ""; // ล้างช่องค้นหา
                  },
                  "question",
                );
              });
          }
        } else {
          // แจ้งเตือนเมื่อหาสินค้าไม่เจอเลย
          previewSlot.innerHTML = `<div style="text-align:center; width:100%; font-size: 13px; color: #dc3545; padding: 8px; font-weight: bold;"><i class="fas fa-search-minus"></i> ไม่พบข้อมูลสินค้าในระบบ</div>`;
          previewSlot.classList.remove("hide");
        }
      } else {
        // ซ่อนหน้าต่างพรีวิวถ้าพิมพ์ไม่ถึง 3 ตัว
        previewSlot.classList.add("hide");
      }
    });
  /* 📍 [END: อัปเกรดสมองกล Magic Search & คุมกำเนิดสต็อก] */

  /* ประเภท: ฟังก์ชันหลัก | ชื่อ: บรรจุสินค้าและย้ายสต็อกไปที่ Hold | ผลลัพธ์: สร้างแถวสินค้าสไตล์ Stock In House และสับเปลี่ยนสต็อก */
  function executeAddItemToBoxContainer(skuCode) {
    const wrapper = document.getElementById("boxItemsListWrapper");

    // ตรวจสอบข้อมูลสินค้าซ้ำในการ์ด
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

    // 📡 [BACKEND CONNECT合约 LOGIC]: ย้ายยอดสต็อกของสาขาปัจจุบันจาก Available -> ไปพักไว้ที่คอลัมน์ Hold ในตาราง Master File

    // ผูกคำสั่งปุ่มลบสินค้าออกจากการ์ดดีเทล
    itemRow
      .querySelector(".btn-remove-item-from-box")
      .addEventListener("click", function () {
        safeConfirm(
          "ลบรายการสินค้า",
          `คุณต้องการยกเลิกการบรรจุสินค้า ${skuCode} และคืนสต็อกกลับระบบใช่หรือไม่?`,
          () => {
            itemRow.remove();
            // 📡 [BACKEND ROLLBACK LOGIC]: ดึงยอดสินค้าออกจาก Hold -> โอนกลับคืนเข้าไปใน Available Stock ของ Master File
            safeAlert(
              "สำเร็จ",
              "ระบบดึงสินค้าออกจากกล่อง และคืนยอดสต็อกกลับคอลัมน์พร้อมขายเรียบร้อยแล้ว",
              "success",
            );
          },
          "delete",
        ); // ธีมลบสีแดงเครื่องหมายตกใจ
      });
  }

  /* 📍 [END: ระบบควบคุมหน้าจอรายละเอียดกล่อง] */

  /* 📍 [START: สมองกลปุ่มส่งออก และ โค้ดส่วนท้ายของไฟล์] */

  /* ประเภท : ฟังก์ชัน Core Logic  ชื่อ : evaluateExportButton  ผลลัพธ์ : เช็คการติ๊กถูก และเช็คให้ชัวร์ว่าทุกกล่องปิดสนิทแล้ว ถึงจะโชว์ปุ่ม EXPORT */
  function evaluateExportButton() {
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
        const openBoxes = card.querySelectorAll(
          '.box-item[data-status="open"]',
        );

        // กฎ: Shipment ต้องมีกล่องอย่างน้อย 1 ใบ และต้อง "ไม่มีกล่องใดเปิดอยู่เลย"
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

  // ==========================================
  // --- 6. Checkbox Logic (ระบบกล่องติ๊กของหน้าจอเก่า คงไว้เพื่อป้องกันหน้าอื่นพัง) ---
  // ==========================================
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
}); // 📍 [END: ปิดหน้าต่าง DOMContentLoaded (บรรทัดสุดท้ายของไฟล์)]
