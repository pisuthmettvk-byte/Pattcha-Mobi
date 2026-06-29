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


/* ประเภท : ฟังก์ชัน Utility  ชื่อ : safeConfirm  ผลลัพธ์ : แสดงหน้าต่างยืนยัน สีเหลืองทองทั้งส่วนหัวและปุ่มตกลง */
function safeConfirm(title, message, onConfirm) {
  const overlay = document.createElement('div');
  // 📍 เพิ่มคลาส sys-alert-element เพื่อให้ระบบรู้ว่านี่คือกล่องแจ้งเตือน ห้ามโดนบล็อก
  overlay.className = "sys-alert-element"; 
  overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1000006; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(3px);";
  overlay.innerHTML = `
      <div style="background: white; width: 90%; max-width: 350px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); overflow: hidden; display: flex; flex-direction: column;">
          <div style="background: #ffc107; padding: 20px; text-align: center;">
              <i class="fas fa-exclamation-triangle" style="font-size: 40px; color: #333;"></i>
          </div>
          <div style="padding: 25px 20px; text-align: center;">
              <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #333;">${title}</h3>
              <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">${message}</p>
          </div>
          <div style="padding: 15px; background: #f8f9fa; border-top: 1px solid #eee; display: flex; justify-content: space-between; gap: 10px;">
              <button class="btn-cancel" style="background: #6c757d; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; flex: 1;">ยกเลิก</button>
              <button class="btn-confirm" style="background: #ffc107; color: #000; border: none; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; flex: 1; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">ตกลง</button>
          </div>
      </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('.btn-cancel').addEventListener('click', () => document.body.removeChild(overlay));
  overlay.querySelector('.btn-confirm').addEventListener('click', () => {
      document.body.removeChild(overlay);
      onConfirm();
  });
}

/* ประเภท : ฟังก์ชัน Event ดักจับการคลิกสูงสุด  ชื่อ : Global Delete Mode Blocker  ผลลัพธ์ : บล็อกการคลิกปุ่มทุกชนิดในหน้าจอถ้ามีถังขยะเปิดอยู่ พร้อมแจ้งเตือน */
document.addEventListener("click", function(e) {
    const activeDeleteCard = document.querySelector('.shipment-card.is-delete-mode');
    
    // ถ้ามีโหมดลบกล่องเปิดอยู่
    if (activeDeleteCard) {
        // ยกเว้น: ไม่บล็อกหน้าต่าง Alert ของระบบ และกล่อง Confirm 
        if (e.target.closest('#customAlertModal') || e.target.closest('.sys-alert-element')) {
            return; 
        }

        // ถ้าคลิก "ภายใน" การ์ดที่เปิดโหมดถังขยะ
        if (activeDeleteCard.contains(e.target)) {
            // อนุญาตแค่ปุ่มถังขยะบนหัว (เพื่อปิดโหมด) และปุ่มลบย่อย เท่านั้น
            if (!e.target.closest('.btn-toggle-delete') && !e.target.closest('.btn-delete-box')) {
                e.preventDefault(); e.stopPropagation();
                safeAlert("ระบบถูกล็อก", "โหมดลบกล่องกำลังทำงานอยู่ กรุณากดปุ่มลบ หรือกดปุ่มถังขยะที่ส่วนหัวเพื่อปิดโหมดก่อนครับ");
            }
        } else {
            // ถ้าไปคลิก "นอกการ์ด" (เช่น ไปกด Export, กด Cancel, หรือกดการ์ดใบอื่น) -> บล็อกทิ้ง!
            e.preventDefault(); e.stopPropagation();
            safeAlert("ระบบถูกล็อก", "ไม่อนุญาตให้ทำรายการอื่นขณะเปิดโหมดลบกล่องค้างไว้ กรุณาปิดโหมดลบของรายการนั้นก่อนครับ");
        }
    }
}, true); // ใช้ Capture Phase ชิงตัดหน้าอีเวนต์อื่นทั้งหมด




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
      const finalShipmentID = `${selectShipmentReason.value}-${getFormattedDate()}-XXXX-XXXX-XXXX`;
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

      /* 📍 ลอจิก: เพิ่มกล่องย่อย */
      let boxCounter = 0;
      card.querySelector(".btn-add-box").addEventListener("click", () => {
        const openBox = card.querySelector('.box-item[data-status="open"]');
        if (openBox) {
          safeAlert(
            "ไม่อนุญาต",
            "มีกล่องค้างเปิดอยู่ กรุณาเพิ่มสินค้าให้เสร็จก่อนครับ",
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
        boxCountDisplay.innerText = `Boxes (${card.querySelectorAll(".box-item").length})`;

        const childCb = boxItem.querySelector(".box-select-cb");

        /* 📍 ลอจิก: ลูกน้องเช็คตัวเอง (ถ้าลูกติ๊กครบ แม่จะติ๊กตามอัตโนมัติ) */
        childCb.addEventListener("change", () => {
          const allUnlocked = card.querySelectorAll(
            ".box-select-cb:not([disabled])",
          );
          const allChecked = card.querySelectorAll(".box-select-cb:checked");
          mainCheckbox.checked =
            allUnlocked.length > 0 && allUnlocked.length === allChecked.length;
          evaluateExportButton();
        });

        /* 📍 ลอจิก: ลบกล่องย่อย */
        boxItem
          .querySelector(".btn-delete-box")
          .addEventListener("click", function () {
            safeConfirm(
              "ลบกล่อง",
              `แน่ใจหรือไม่ว่าต้องการลบ BOX-${boxId} ?`,
              () => {
                boxItem.remove();
                boxCountDisplay.innerText = `Boxes (${card.querySelectorAll(".box-item").length})`;
                if (
                  card.querySelectorAll('.box-item[data-status="closed"]')
                    .length === 0
                ) {
                  mainCheckbox.checked = false;
                  mainCheckbox.disabled = true;
                }
                evaluateExportButton();
              },
            );
          });

        /* 📍 ลอจิก: จำลองแอดสินค้าปิดกล่อง */
        boxItem
          .querySelector(".btn-add-item")
          .addEventListener("click", function () {
            safeConfirm(
              "ยืนยัน",
              "เพิ่มสินค้าเสร็จสิ้น ปิดกล่องนี้เลยหรือไม่?",
              () => {
                boxItem.setAttribute("data-status", "closed");
                boxItem.querySelector(".box-status-icon").className =
                  "fas fa-box box-status-icon";
                boxItem.querySelector(".box-status-icon").style.color =
                  "#28a745";
                childCb.disabled = false;
                mainCheckbox.disabled = false; // ปลดล็อกแม่
                this.style.display = "none";
                evaluateExportButton();
              },
            );
          });
      });
    });
  }
  // 📍 [END: บล็อกสร้างการ์ด Shipment]







/* 📍 [START: สมองกลปุ่มส่งออก และ โค้ดส่วนท้ายของไฟล์] */
  
  /* ประเภท : ฟังก์ชัน Core Logic  ชื่อ : evaluateExportButton  ผลลัพธ์ : เช็คการติ๊กถูก และเช็คให้ชัวร์ว่าทุกกล่องปิดสนิทแล้ว ถึงจะโชว์ปุ่ม EXPORT */
  function evaluateExportButton() {
    const btnSubmitLobby = document.getElementById("btnSubmitLobby");
    if (!btnSubmitLobby) return;

    const checkedShipments = document.querySelectorAll(".shipment-select-cb:checked");
    let isReadyToExport = false;

    if (checkedShipments.length > 0) {
      let allValid = true;
      checkedShipments.forEach((cb) => {
        const card = cb.closest(".shipment-card");
        const boxes = card.querySelectorAll(".box-item");
        const openBoxes = card.querySelectorAll('.box-item[data-status="open"]');
        
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
      btnSubmitLobby.innerHTML = 'EXPORT <i class="fas fa-paper-plane" style="margin-left: 8px;"></i>';
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