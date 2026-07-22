// ============================================================================
// 📦 PATTCHA INVENTORY - TRANSFER OUT MODULE (REFACTORED ARCHITECTURE)
// ============================================================================

// ============================================================================
// ⚙️ GROUP 1: CONFIG, STATE & GLOBAL VARIABLES
// ============================================================================
const webAppUrl =
  "https://script.google.com/macros/s/AKfycbxl3g-8afxNG-q4UhOxVsffv-qO7Dum2koHWAKEbr98086bvPq-RwNQrEwGvzMZ5Jm7zQ/exec";

const STATUS_CONFIG = {
  NEW: "Assign",
  PENDING: "Pending",
  COMPLETE: "Complete",
};

window.isGlobalDeleteMode = false;
window.activeDeleteShipment = null;
window.currentActiveShipment = null;
window.currentActiveBoxNo = null;
window.currentBoxElement = null;
window.currentBoxItems = [];
window.currentScannerContext = "stock";

// ============================================================================
// 🛡️ GROUP 2: SECURITY & GLOBAL INTERCEPTORS
// ============================================================================

// 📍 แช่แข็งหน้าจอเวลาเปิดโหมดลบ
document.addEventListener(
  "click",
  (e) => {
    if (window.isGlobalDeleteMode) {
      const isToggleActiveParent = e.target.closest(
        `.shipment-column[data-shipment="${window.activeDeleteShipment}"] .btn-master-delete`,
      );
      const isDeleteActiveParent = e.target.closest(
        `.shipment-column[data-shipment="${window.activeDeleteShipment}"] .parent-btn-delete`,
      );
      const isDeleteActiveChild = e.target.closest(
        `.shipment-column[data-shipment="${window.activeDeleteShipment}"] .child-btn-delete`,
      );

      if (isToggleActiveParent || isDeleteActiveParent || isDeleteActiveChild)
        return;

      if (
        e.target.closest(".swal-overlay") ||
        e.target.closest(".swal-modal") ||
        e.target.closest(".sweet-alert")
      )
        return;

      const isInsideApp =
        e.target.closest("#transferOutLobbyView") ||
        e.target.closest(".app-header") ||
        e.target.closest(".main-content");
      if (isInsideApp) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof safeAlert === "function") {
          safeAlert(
            "ระงับการใช้งานชั่วคราว!",
            "คุณกำลังเปิดโหมดลบข้อมูลของชิปเมนต์อื่นอยู่ กรุณาจัดการให้เสร็จ หรือกดปุ่มรูปถังขยะเพื่อปิดโหมดลบที่คันนั้นก่อนครับ",
            "error",
          );
        } else {
          alert(
            "ระงับการใช้งานชั่วคราว!\nกรุณาปิดโหมดลบของชิปเมนต์ที่กำลังทำงานอยู่ก่อนครับ",
          );
        }
      }
    }
  },
  true,
);

// 📍 ป๊อปอัปยืนยันแบบ Custom
window.safeConfirm = function (title, message, type = "error") {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "sys-alert-element";
    overlay.style.cssText =
      "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1000006; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(3px);";

    let headerBg, iconClass, btnBg, btnText;
    if (type === "warning" || type === "question") {
      headerBg = "#ffc107";
      iconClass = "fas fa-question-circle";
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
                <div style="padding: 15px; background: #f8f9fa; border-top: 1px solid #eee; display: flex; justify-content: space-between; gap: 10px;">
                    <button class="btn-cancel" style="background: #e2e8f0; color: #475569; border: none; padding: 12px 0; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; flex: 1;">ยกเลิก</button>
                    <button class="btn-ok" style="background: ${btnBg}; color: ${btnText}; border: none; padding: 12px 0; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; flex: 1; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">ตกลง</button>
                </div>
            </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector(".btn-ok").addEventListener("click", () => {
      document.body.removeChild(overlay);
      resolve(true);
    });
    overlay.querySelector(".btn-cancel").addEventListener("click", () => {
      document.body.removeChild(overlay);
      resolve(false);
    });
  });
};

// ============================================================================
// 🛠️ GROUP 3: UTILITIES, HELPERS & SYNC ENGINE
// ============================================================================

function getRealBranchCode(destCode) {
  if (!destCode) return "-";
  if (window.appBranches && Array.isArray(window.appBranches)) {
    const matched = window.appBranches.find((b) => {
      const bId = String(b.id || b.Branch_ID || b.BranchID || "")
        .trim()
        .toUpperCase();
      return String(destCode).includes(bId.substring(0, 2));
    });
    if (matched)
      return String(matched.id || matched.Branch_ID || matched.BranchID || "")
        .trim()
        .toUpperCase();
  }
  return destCode;
}

function getNextRunningNumber() {
  let currentNum = parseInt(
    localStorage.getItem("shipment_running_counter") || "0",
  );
  currentNum++;
  if (currentNum > 9999) currentNum = 1;
  localStorage.setItem("shipment_running_counter", currentNum.toString());
  return currentNum.toString().padStart(4, "0");
}

function formatShipmentNoHTML(shipmentNo) {
  return `<span style="font-weight: bold; font-size: 14px; color: #0044ff; font-family: sans-serif; letter-spacing: 0.5px;">${shipmentNo}</span>`;
}

function focusShipmentInLobby(shipmentNo) {
  const columns = document.querySelectorAll(".shipment-column");
  columns.forEach((col) => {
    if (col.innerHTML.includes(shipmentNo)) {
      col.style.transition = "background 0.5s";
      col.style.background = "#fff3cd";
      col.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        col.style.background =
          "linear-gradient(to bottom, #d4d4d4 0%, #ffffff 50%, #a09f9f 100%)";
      }, 2000);
    }
  });
}

window.checkCrossBoxStock = function (sku) {
  let totalUsedInOtherBoxes = 0;
  let usedDetails = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith("draft_box_")) {
      const currentDraftKey = `draft_box_${window.currentActiveShipment}_${window.currentActiveBoxNo}`;
      if (key === currentDraftKey) continue;
      try {
        const boxData = JSON.parse(localStorage.getItem(key)) || [];
        const foundItem = boxData.find((item) => item.sku === sku);
        if (foundItem) {
          const qty = (foundItem.scanQty || 0) + (foundItem.manualQty || 0);
          if (qty > 0) {
            totalUsedInOtherBoxes += qty;
            const parts = key.replace("draft_box_", "").split("_");
            usedDetails.push(
              `- ชิปเมนต์ ${parts[0]} [กล่อง ${parts.slice(1).join("_")}] = ${qty} ชิ้น`,
            );
          }
        }
      } catch (e) {
        console.error("Radar Parse Error:", e);
      }
    }
  }
  return { totalUsedInOtherBoxes, usedDetails };
};

window.getLocalShipmentTotals = function (shipmentNo) {
  let localBoxCount = 0;
  let localItemCount = 0;
  let hasLocalData = false;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.startsWith(`draft_box_${shipmentNo}_`) ||
        key.startsWith(`wrapped_box_${shipmentNo}_`) ||
        key.startsWith(`status_box_${shipmentNo}_`))
    ) {
      if (key.startsWith(`status_box_`)) continue;
      hasLocalData = true;
      localBoxCount++;
      try {
        const items = JSON.parse(localStorage.getItem(key)) || [];
        items.forEach((item) => {
          localItemCount += (item.scanQty || 0) + (item.manualQty || 0);
        });
      } catch (e) {}
    }
  }
  return { hasLocalData, localBoxCount, localItemCount };
};

window.updateMasterShipmentTotals = function (shipmentNo) {
  const masterCol = document.querySelector(
    `.shipment-column[data-shipment="${shipmentNo}"]`,
  );
  if (!masterCol) return;
  const childBoxes = masterCol.querySelectorAll(".shipment-child-box");
  let totalScan = 0;
  let totalManual = 0;

  childBoxes.forEach((box) => {
    totalScan += parseInt(
      box.querySelector(".child-scan-qty")?.textContent || "0",
    );
    totalManual += parseInt(
      box.querySelector(".child-manual-qty")?.textContent || "0",
    );
  });

  const masterScanEl = masterCol.querySelector(".master-scan-count");
  const masterManualEl = masterCol.querySelector(".master-manual-count");
  const masterTruckEl = masterCol.querySelector(".master-truck-count");

  if (masterScanEl) masterScanEl.textContent = totalScan;
  if (masterManualEl) masterManualEl.textContent = totalManual;
  if (masterTruckEl) masterTruckEl.textContent = childBoxes.length;
};

// 📍 Local Storage Memory Management
window.nukeShipmentCache = function (shipmentNo) {
  let keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    let key = localStorage.key(i);
    if (key && key.includes(shipmentNo)) keysToRemove.push(key);
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
  console.log(`💥 [Nuked] ล้างความจำชิปเมนต์ ${shipmentNo} เกลี้ยงแล้ว!`);
};

window.saveCurrentBoxDraft = function () {
  if (!window.currentActiveShipment || !window.currentActiveBoxNo) return;
  const isClosedBox =
    window.currentBoxElement &&
    window.currentBoxElement.getAttribute("data-status") === "Closed";
  if (isClosedBox) return;

  const draftKey = `draft_box_${window.currentActiveShipment}_${window.currentActiveBoxNo}`;
  localStorage.setItem(draftKey, JSON.stringify(window.currentBoxItems || []));
  if (typeof window.fbSyncBoxData === "function") {
    window.fbSyncBoxData(
      window.currentActiveShipment,
      window.currentActiveBoxNo,
      "open",
      window.currentBoxItems,
    );
  }
};

window.loadCurrentBoxDraft = function (shipmentId, boxNo) {
  const savedData = localStorage.getItem(`draft_box_${shipmentId}_${boxNo}`);
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (e) {
      return [];
    }
  }
  return [];
};

window.clearBoxDraft = function (shipmentId, boxNo) {
  localStorage.removeItem(`draft_box_${shipmentId}_${boxNo}`);
};

window.restoreDraftBoxesForShipment = function (shipmentNo, colElement) {
  if (!colElement) return 0;
  const childrenContainer = colElement.querySelector(
    ".shipment-children-container",
  );
  if (!childrenContainer) return 0;
  const baseBoxNo =
    colElement.getAttribute("data-shipment").split("-").length >= 5
      ? colElement.getAttribute("data-shipment").split("-").slice(2).join("-")
      : colElement.getAttribute("data-shipment");

  let maxBoxIndex = 0;
  let hasDrafts = false;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key.startsWith(`draft_box_${shipmentNo}_`) ||
      key.startsWith(`wrapped_box_${shipmentNo}_`)
    ) {
      hasDrafts = true;
      let draftData = [];
      try {
        draftData = JSON.parse(localStorage.getItem(key)) || [];
      } catch (e) {}
      const exactBoxNo = key.startsWith(`wrapped_box_`)
        ? key.replace(`wrapped_box_${shipmentNo}_`, "")
        : key.replace(`draft_box_${shipmentNo}_`, "");
      const parts = exactBoxNo.split("-");
      const indexNum = parseInt(parts[parts.length - 1], 10) || 0;
      if (indexNum > maxBoxIndex) maxBoxIndex = indexNum;

      if (
        !childrenContainer.querySelector(
          `.shipment-child-box[data-box-no="${exactBoxNo}"]`,
        )
      ) {
        if (typeof createShipmentChildBox === "function") {
          const childEl = createShipmentChildBox(baseBoxNo, exactBoxNo, true);
          let totalScan = 0,
            totalManual = 0;
          draftData.forEach((item) => {
            totalScan += item.scanQty || 0;
            totalManual += item.manualQty || 0;
          });

          if (childEl.querySelector(".child-scan-qty"))
            childEl.querySelector(".child-scan-qty").textContent = totalScan;
          if (childEl.querySelector(".child-manual-qty"))
            childEl.querySelector(".child-manual-qty").textContent =
              totalManual;

          const isClosed =
            localStorage.getItem(`status_box_${shipmentNo}_${exactBoxNo}`) ===
            "Closed";
          if (isClosed) {
            childEl.setAttribute("data-status", "Closed");
            childEl.setAttribute("data-saved-items", JSON.stringify(draftData));
            const boxIcon = childEl.querySelector(".box-status-icon");
            if (boxIcon) {
              boxIcon.className = "fas fa-box box-status-icon";
              boxIcon.style.color = "#dc3545";
            }
          }
          childrenContainer.appendChild(childEl);
        }
      }
    }
  }

  if (hasDrafts) {
    childrenContainer.classList.remove("hide");
    colElement.querySelector(".master-truck-count").textContent =
      childrenContainer.querySelectorAll(".shipment-child-box").length;
  }

  if (typeof window.fbListenToShipment === "function")
    window.fbListenToShipment(shipmentNo, colElement);
  if (typeof window.updateMasterShipmentTotals === "function")
    window.updateMasterShipmentTotals(shipmentNo);

  return maxBoxIndex;
};

// ============================================================================
// 📡 GROUP 4: FIREBASE UI RECEIVERS
// ============================================================================
window.uiSyncBoxFromFirebase = function (
  shipmentNo,
  boxNo,
  status,
  items,
  colElement,
) {
  if (!colElement)
    colElement = document.querySelector(
      `.shipment-column[data-shipment="${shipmentNo}"]`,
    );
  if (!colElement) return;

  const childrenContainer = colElement.querySelector(
    ".shipment-children-container",
  );
  if (!childrenContainer) return;

  let childEl = childrenContainer.querySelector(
    `.shipment-child-box[data-box-no="${boxNo}"]`,
  );

  if (!childEl) {
    const baseBoxNo =
      shipmentNo.split("-").length >= 5
        ? shipmentNo.split("-").slice(2).join("-")
        : shipmentNo;
    if (typeof createShipmentChildBox === "function") {
      childEl = createShipmentChildBox(baseBoxNo, boxNo, true);
      childrenContainer.appendChild(childEl);
      childrenContainer.classList.remove("hide");
    }
  }

  if (childEl) {
    let totalScan = 0,
      totalManual = 0;
    if (items && items.length > 0) {
      items.forEach((item) => {
        totalScan += item.scanQty || 0;
        totalManual += item.manualQty || 0;
      });
    }
    if (childEl.querySelector(".child-scan-qty"))
      childEl.querySelector(".child-scan-qty").textContent = totalScan;
    if (childEl.querySelector(".child-manual-qty"))
      childEl.querySelector(".child-manual-qty").textContent = totalManual;

    if (status === "Closed") {
      childEl.setAttribute("data-status", "Closed");
      childEl.setAttribute("data-saved-items", JSON.stringify(items));
      const boxIcon = childEl.querySelector(".box-status-icon");
      const checkboxEl = childEl.querySelector(".child-checkbox");
      if (boxIcon) {
        boxIcon.className = "fas fa-box box-status-icon";
        boxIcon.style.color = "#dc3545";
      }
      if (checkboxEl) {
        checkboxEl.disabled = false;
        checkboxEl.style.cursor = "pointer";
      }
    } else {
      childEl.setAttribute("data-status", "open");
    }
  }
  if (typeof window.updateMasterShipmentTotals === "function")
    window.updateMasterShipmentTotals(shipmentNo);
};

window.uiRemoveBoxFromFirebase = function (boxNo) {
  const childEl = document.querySelector(
    `.shipment-child-box[data-box-no="${boxNo}"]`,
  );
  if (childEl) {
    const parentCol = childEl.closest(".shipment-column");
    childEl.remove();
    if (parentCol && parentCol.querySelector(".master-truck-count")) {
      parentCol.querySelector(".master-truck-count").textContent =
        parentCol.querySelectorAll(".shipment-child-box").length;
    }
  }
};

window.uiRemoveShipmentFromFirebase = function (shipmentNo) {
  const colElement = document.querySelector(
    `.shipment-column[data-shipment="${shipmentNo}"]`,
  );
  if (colElement) {
    colElement.style.transition = "all 0.5s ease";
    colElement.style.opacity = "0";
    colElement.style.transform = "scale(0.95)";
    setTimeout(() => {
      colElement.remove();
      if (typeof window.updateExportButtonState === "function")
        window.updateExportButtonState();
      if (document.querySelectorAll(".shipment-column").length === 0) {
        const btnBack =
          document.getElementById("btnCancelFromLobby") ||
          document.getElementById("btnBackToTaskHub");
        if (btnBack) btnBack.click();
      }
    }, 500);
  }
};

// ============================================================================
// 🎨 GROUP 5: UI FACTORIES (DOM GENERATORS)
// ============================================================================

function createUniversalCard(branchName, docNo, branchID, status = "pending") {
  const colorMap = { pending: "#dc3545", done: "#28a745", issue: "#ffc107" };
  const borderColor = colorMap[status] || "#ccc";

  const card = document.createElement("div");
  card.className = "task-list-item shipment-card";
  card.setAttribute("data-branch-id", branchID);
  card.style.cssText = `width: 100%; border-left: 6px solid ${borderColor}; border-bottom: 1px solid #e0e0e0; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; background: white; cursor: pointer;`;

  card.innerHTML = `
        <div style="text-align: left;">
            <div style="font-weight: bold; font-size: 14px; color: #333;">Doc No: ${docNo}</div>
            <span style="font-size: 12px; color: #777;">คลังสินค้ากลาง -> ${branchName}</span>
        </div>
        <i class="fas fa-chevron-right" style="color: #ccc; font-size: 14px;"></i>`;

  card.addEventListener("click", () => {
    sessionStorage.setItem("selectedBranchID", branchID);
    showView("transferOutLobbyView");
    loadLobbyHeader();
  });
  return card;
}

function createTransferOutTaskCard(
  date,
  shipmentNo,
  originType,
  destBranch,
  apiTotalBox,
  apiTotalItem,
  status,
) {
  const colorMap = {
    assign: "#dc3545",
    pending: "#e0a800",
    complete: "#28a745",
  };
  const statusKey = (status || "").toLowerCase();
  const leftBorderColor = colorMap[statusKey] || "#ccc";

  let displayDestText = destBranch;
  if (window.appBranches && Array.isArray(window.appBranches)) {
    const matched = window.appBranches.find((b) => {
      const bId = String(b.id || b.Branch_ID || b.BranchID || "")
        .trim()
        .toUpperCase();
      return (
        bId === destBranch || String(destBranch).includes(bId.substring(0, 2))
      );
    });
    if (matched)
      displayDestText = `[${matched.id || matched.Branch_ID || destBranch}] ${matched.name || matched.Branch_Name || ""}`;
  }

  if (displayDestText === destBranch && typeof getRealBranchCode === "function")
    displayDestText = getRealBranchCode(destBranch);

  const localTotals = window.getLocalShipmentTotals(shipmentNo);
  const displayTotalBox = localTotals.hasLocalData
    ? localTotals.localBoxCount
    : apiTotalBox || 0;
  const displayTotalItem = localTotals.hasLocalData
    ? localTotals.localItemCount
    : apiTotalItem || 0;

  const card = document.createElement("div");
  card.className = "task-card";
  card.dataset.destination = destBranch;
  card.style.cssText = `width: 100%; background: #ffffff; border: 1px solid #e0e0e0; border-bottom: none; border-left: 6px solid ${leftBorderColor}; padding: 16px 15px; margin-bottom: 0px; box-sizing: border-box; cursor: pointer;`;

  card.innerHTML = `
        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px; min-width: 120px;">
                <span style="background: #e9ecef; color: #495057; padding: 4px 10px; border-radius: 4px; font-size: 13px; font-weight: bold; border: 1px solid #ced4da;">${originType || "Store"}</span>
                <span style="font-size: 14px; color: #333; font-weight: 500;">${date || "-"}</span>
            </div>
            <div style="flex-grow: 1; text-align: center; min-width: 220px;">
                <span style="font-weight: bold; font-size: 16px; color: #0044ff; letter-spacing: 0.5px;">${shipmentNo || "-"}</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 15px; flex-grow: 1; min-width: 250px;">
                <span style="font-size: 14px; color: #333; font-weight: bold;"><i class="fas fa-truck" style="color: #dc3545;"></i> ${displayDestText}</span>
                <span style="font-size: 13px; color: #555; font-weight: bold;">
                    <i class="fas fa-box" style="color: #8d6e63;"></i> 
                    (<span style="color:#d93844;">${displayTotalBox}</span>) TOTAL (<span style="color:#d93844;">${displayTotalItem}</span>)
                </span>
                <span style="background: ${leftBorderColor}; color: #fff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${status || "Assign"}</span>
            </div>
        </div>`;

  card.addEventListener("click", async () => {
    sessionStorage.setItem("jump_to_shipment", shipmentNo);
    sessionStorage.setItem("selectedBranchID", destBranch);
    const taskStatus = (
      typeof statusKey !== "undefined" ? statusKey : status
    ).toUpperCase();
    sessionStorage.setItem("lobbyMode", taskStatus);
    if (!sessionStorage.getItem("selectedBranchName"))
      sessionStorage.setItem("selectedBranchName", "");

    try {
      const viewTaskHub = document.getElementById("transferOutTaskHubView");
      const viewLobby = document.getElementById("transferOutLobbyView");
      window.isReadOnly = taskStatus === "PENDING" || taskStatus === "COMPLETE";

      if (typeof navigationTo === "function" && viewTaskHub && viewLobby)
        navigationTo(viewTaskHub, viewLobby);
      else if (typeof showView === "function") showView("transferOutLobbyView");

      if (typeof window.applyLobbyTheme === "function")
        window.applyLobbyTheme();
      if (typeof loadLobbyHeader === "function") loadLobbyHeader();
      if (typeof renderLobbyTasks === "function")
        await renderLobbyTasks(destBranch);

      setTimeout(() => {
        if (typeof focusShipmentInLobby === "function")
          focusShipmentInLobby(shipmentNo);
      }, 500);
    } catch (error) {
      console.error("🚨 วาร์ปเข้า Lobby ล้มเหลว:", error);
    }
  });
  return card;
}

function createShipmentColumn(
  shipmentNo,
  originType = "Store",
  status = "Assign",
) {
  const col = document.createElement("div");
  col.className = "shipment-column";
  col.style.cssText =
    "display: flex; flex-direction: column; gap: 12px; margin-bottom: 25px; width: 100%; position: relative; z-index: 1;";

  const safeShipmentNo = shipmentNo || "UNKNOWN-00000000-00XX-0000-00XX";
  col.setAttribute("data-shipment", safeShipmentNo);

  const parts = safeShipmentNo.split("-");
  const dateParts = parts.length > 1 ? parts[1] : "";
  const displayDate =
    dateParts && dateParts.length === 8
      ? `${dateParts.substring(0, 2)}/${dateParts.substring(2, 4)}/${dateParts.substring(6, 8)}`
      : new Date().toLocaleDateString("en-GB").substring(0, 8);
  const baseBoxNo =
    parts.length >= 5 ? parts.slice(2).join("-") : safeShipmentNo;

  const statusText = (status || "Assign").toUpperCase();
  const isReadOnly = statusText === "PENDING" || statusText === "COMPLETE";
  const headerGradient =
    "linear-gradient(to bottom, #d4d4d4 0%, #ffffff 50%, #a09f9f 100%)";
  const displayStyle = isReadOnly ? "display: none !important;" : "";

  let badgeColor = "#d93844";
  if (statusText === "PENDING") badgeColor = "#e0a800";
  if (statusText === "COMPLETE") badgeColor = "#198754";

  col.innerHTML = `
        <div class="shipment-column-header" style="background: ${headerGradient}; border: 1px solid #ccc; border-top: 1px solid #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 100%; padding: 12px 20px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 15px; box-sizing: border-box; transition: all 0.3s ease;">
            <div style="display: flex; align-items: center; gap: 15px; flex-shrink: 0;">
                <input type="checkbox" class="master-checkbox" style="width: 18px; height: 18px; border-radius: 4px; cursor: pointer; ${displayStyle}">
                <span style="font-weight: 900; font-size: 15px; color: #222;">${displayDate}</span>
                <span style="font-weight: bold; font-size: 15px; color: #0033cc; letter-spacing: 0.5px;">${safeShipmentNo}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 20px; flex-grow: 1; flex-wrap: wrap; min-width: 150px;">
                <span style="background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; padding: 3px 10px; font-size: 12px; font-weight: bold; color: #444;">${originType}</span>
                <div style="display: flex; gap: 15px; font-size: 13px; font-weight: bold; color: #333; text-shadow: 1px 1px 0px #fff;">
                    <span><i class="fas fa-truck" style="color: #dc3545;"></i> (<span class="master-truck-count">0</span>)</span>
                    <span><i class="fas fa-barcode" style="color: #666;"></i> (<span class="master-scan-count">0</span>)</span>
                    <span><i class="fas fa-hand-paper" style="color: #8d6e63;"></i> (<span class="master-manual-count">0</span>)</span>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 18px; flex-shrink: 0;">
                <div class="parent-btn-delete hide" style="background: #dc3545; color: white; padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 6px; transition: all 0.2s;" title="ลบชิปเมนต์คันนี้ทิ้ง"><i class="fas fa-times-circle"></i> ลบทั้งคัน</div>
                <i class="fas fa-box-open btn-add-child-box" style="color: #2e8b57; font-size: 20px; cursor: pointer; filter: drop-shadow(1px 1px 1px #fff); ${displayStyle}" title="สร้างกล่องใหม่"></i>
                <i class="fas fa-trash-alt btn-master-delete" style="color: #c9302c; font-size: 20px; cursor: pointer; filter: drop-shadow(1px 1px 1px #fff); transition: all 0.2s; ${displayStyle}" title="สวิตช์ เปิด/ปิด โหมดลบ"></i>
                <span style="background: ${badgeColor}; color: white; padding: 6px 18px; border-radius: 15px; font-size: 13px; font-weight: bold;">${statusText}</span>
            </div>
        </div>
        <div class="shipment-children-container hide" style="width: 100%; display: flex; flex-direction: column; gap: 5px;"></div>
    `;

  const headerDiv = col.querySelector(".shipment-column-header");
  const childrenContainer = col.querySelector(".shipment-children-container");
  const btnMasterDelete = col.querySelector(".btn-master-delete");
  const btnParentDelete = col.querySelector(".parent-btn-delete");
  const btnAddChildBox = col.querySelector(".btn-add-child-box");
  const masterTruckCount = col.querySelector(".master-truck-count");

  btnMasterDelete.addEventListener("click", () => {
    if (isReadOnly) return;
    if (
      window.isGlobalDeleteMode &&
      window.activeDeleteShipment !== safeShipmentNo
    )
      return;

    const isDeleteMode = btnMasterDelete.classList.toggle("delete-mode-active");
    window.isGlobalDeleteMode = isDeleteMode;
    window.activeDeleteShipment = isDeleteMode ? safeShipmentNo : null;
    const childBoxes = childrenContainer.querySelectorAll(
      ".shipment-child-box",
    );

    if (isDeleteMode) {
      btnMasterDelete.style.color = "#ffc107";
      btnMasterDelete.style.transform = "scale(1.2)";
      headerDiv.style.border = "2px dashed #ffc107";
      btnParentDelete.classList.remove("hide");
      childBoxes.forEach((child) =>
        child.querySelector(".child-btn-delete").classList.remove("hide"),
      );
    } else {
      btnMasterDelete.style.color = "#c9302c";
      btnMasterDelete.style.transform = "scale(1)";
      headerDiv.style.border = "1px solid #ccc";
      btnParentDelete.classList.add("hide");
      childBoxes.forEach((child) =>
        child.querySelector(".child-btn-delete").classList.add("hide"),
      );
    }
  });

  btnParentDelete.addEventListener("click", async () => {
    if (isReadOnly) return;
    const isConfirmed = await safeConfirm(
      "ยืนยันการลบชิปเมนต์?",
      `คุณต้องการลบชิปเมนต์ ${safeShipmentNo} ทิ้งและคืนสต๊อกทั้งหมดใช่หรือไม่?`,
    );
    if (isConfirmed) {
      const loadingOverlay = document.createElement("div");
      loadingOverlay.id = "masterDeleteSpinner";
      loadingOverlay.style.cssText =
        "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 9999999; display: flex; justify-content: center; align-items: center; color: white; font-size: 20px; font-weight: bold; backdrop-filter: blur(3px);";
      loadingOverlay.innerHTML =
        "<i class='fas fa-spinner fa-spin' style='margin-right: 10px;'></i> กำลังลบและคืนสต๊อก...";
      document.body.appendChild(loadingOverlay);

      const currentBranchCode = String(
        localStorage.getItem("pattcha_branch") || "",
      )
        .trim()
        .toUpperCase();
      if (typeof window.fbNukeShipment === "function")
        window.fbNukeShipment(safeShipmentNo);

      const apiUrl = typeof CONFIG !== "undefined" ? CONFIG.API_URL : webAppUrl;

      fetch(`${apiUrl}?action=delete_shipment`, {
        method: "POST",
        body: JSON.stringify({
          shipmentNo: safeShipmentNo,
          branch: currentBranchCode,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          const spinner = document.getElementById("masterDeleteSpinner");
          if (spinner) spinner.remove();

          if (data.success || data.status === "success") {
            if (typeof window.fbStopListening === "function")
              window.fbStopListening();

            let deletedList = JSON.parse(
              localStorage.getItem("ghost_deleted_list") || "[]",
            );
            if (!deletedList.includes(safeShipmentNo))
              deletedList.push(safeShipmentNo);
            localStorage.setItem(
              "ghost_deleted_list",
              JSON.stringify(deletedList),
            );

            if (typeof window.nukeShipmentCache === "function")
              window.nukeShipmentCache(safeShipmentNo);

            const closedBoxes = col.querySelectorAll(
              ".shipment-child-box[data-status='Closed']",
            );
            closedBoxes.forEach((box) => {
              const savedItemsStr = box.getAttribute("data-saved-items");
              if (savedItemsStr) {
                try {
                  const savedItems = JSON.parse(savedItemsStr);
                  savedItems.forEach((item) => {
                    if (typeof window.updateLocalStockMemory === "function")
                      window.updateLocalStockMemory(
                        item.sku,
                        item.totalQty,
                        false,
                      );
                  });
                } catch (e) {}
              }
            });

            col.remove();
            document
              .querySelectorAll("#transferOutTaskHubView .task-card")
              .forEach((card) => {
                if (card.innerHTML.includes(safeShipmentNo)) card.remove();
              });

            if (window.cachedTransferTasks) {
              window.cachedTransferTasks = window.cachedTransferTasks.filter(
                (t) => t.Shipment_No !== safeShipmentNo,
              );
            }

            window.isGlobalDeleteMode = false;
            window.activeDeleteShipment = null;

            const container = document.getElementById("lobbyContentContainer");
            const emptyState = document.getElementById("lobbyEmptyState");
            if (
              container &&
              container.querySelectorAll(".shipment-column").length === 0 &&
              emptyState
            )
              emptyState.style.display = "block";

            if (typeof window.safeAlert === "function")
              window.safeAlert(
                "SUCCESS",
                "ลบชิปเมนต์และเคลียร์ Firebase สำเร็จ!",
                "success",
              );
          } else {
            if (typeof window.safeAlert === "function")
              window.safeAlert("เกิดข้อผิดพลาด", data.message, "error");
          }
        })
        .catch((error) => {
          const spinner = document.getElementById("masterDeleteSpinner");
          if (spinner) spinner.remove();
          if (typeof window.safeAlert === "function")
            window.safeAlert(
              "ข้อผิดพลาด",
              "ไม่สามารถติดต่อฐานข้อมูลได้",
              "error",
            );
        });
    }
  });

  let boxIdCounter = 0;
  btnAddChildBox.addEventListener("click", () => {
    if (isReadOnly) return;
    boxIdCounter++;
    const randomText = Math.random().toString(36).substring(2, 5).toUpperCase();
    const newBoxSuffix = String(boxIdCounter).padStart(4, "0") + randomText;
    const childEl = createShipmentChildBox(baseBoxNo, newBoxSuffix);
    childrenContainer.appendChild(childEl);
    childrenContainer.classList.remove("hide");
    masterTruckCount.textContent = childrenContainer.querySelectorAll(
      ".shipment-child-box",
    ).length;
  });

  setTimeout(() => {
    if (typeof window.restoreDraftBoxesForShipment === "function") {
      const restoredMaxId = window.restoreDraftBoxesForShipment(
        safeShipmentNo,
        col,
      );
      if (restoredMaxId > boxIdCounter) boxIdCounter = restoredMaxId;
    }
  }, 50);

  return col;
}

function createShipmentChildBox(baseBoxNo, suffixOrFullId, isRestore = false) {
  const childBoxNo = isRestore
    ? suffixOrFullId
    : `${baseBoxNo}-${suffixOrFullId}`;
  const childDiv = document.createElement("div");
  childDiv.className = "shipment-child-box";
  childDiv.dataset.boxNo = childBoxNo;
  childDiv.dataset.status = "open";

  const currentMode = (
    sessionStorage.getItem("lobbyMode") || "ASSIGN"
  ).toUpperCase();
  const isReadOnly = currentMode === "PENDING" || currentMode === "COMPLETE";
  const displayStyle = isReadOnly ? "display: none !important;" : "";

  childDiv.style.cssText = `display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; background: #ffffff; border: 1px solid #e0e0e0; border-left: 6px solid #28a745; padding: 16px 15px; width: 100%; box-sizing: border-box; cursor: pointer; transition: all 0.2s;`;

  childDiv.innerHTML = `<div style="display: flex; align-items: center; gap: 15px; flex: 1; min-width: 200px;"><input type="checkbox" class="child-checkbox" disabled style="width: 18px; height: 18px; border-radius: 4px; cursor: not-allowed; ${displayStyle}" onclick="event.stopPropagation();"><i class="fas fa-box-open box-status-icon" style="color: #28a745; font-size: 18px;"></i><span style="font-weight: bold; font-size: 14px; color: #333;">${childBoxNo}</span></div><div style="display: flex; align-items: center; justify-content: flex-end; gap: 18px; font-size: 13px; font-weight: bold; color: #555;"><span><i class="fas fa-barcode" style="color: #666;"></i> (<span class="child-scan-qty">0</span>)</span><span><i class="fas fa-hand-paper" style="color: #8d6e63;"></i> (<span class="child-manual-qty">0</span>)</span><i class="fas fa-trash-alt child-btn-delete hide" style="color: #dc3545; font-size: 18px; cursor: pointer; padding-left: 5px; ${displayStyle}" onclick="event.stopPropagation();"></i></div>`;

  if (!isRestore && !isReadOnly) {
    setTimeout(() => {
      const parentCol = childDiv.closest(".shipment-column");
      const shipmentNo = parentCol
        ? parentCol.getAttribute("data-shipment")
        : baseBoxNo;
      if (typeof window.fbSyncBoxData === "function")
        window.fbSyncBoxData(shipmentNo, childBoxNo, "open", []);
    }, 100);
  }

  childDiv.addEventListener("click", function (e) {
    if (
      window.isGlobalDeleteMode ||
      e.target.closest(".child-btn-delete") ||
      e.target.closest(".child-checkbox")
    )
      return;
    const parentCol = childDiv.closest(".shipment-column");
    const shipmentNo = parentCol
      ? parentCol.getAttribute("data-shipment")
      : baseBoxNo;
    const isClosed = childDiv.dataset.status === "Closed" || isReadOnly;
    if (typeof window.openBoxDetails === "function")
      window.openBoxDetails(shipmentNo, childBoxNo, childDiv, isClosed);
  });

  const btnDeleteChild = childDiv.querySelector(".child-btn-delete");
  btnDeleteChild.addEventListener("click", async (e) => {
    if (isReadOnly) return;
    e.stopPropagation();
    const parentCol = childDiv.closest(".shipment-column");
    const shipmentNo = parentCol
      ? parentCol.getAttribute("data-shipment")
      : baseBoxNo;
    const isClosed = childDiv.dataset.status === "Closed";
    const isConfirm = await window.safeConfirm(
      "ยืนยันลบกล่อง?",
      `ลบกล่อง ${childBoxNo} ทิ้งใช่หรือไม่?`,
      "error",
    );

    if (isConfirm) {
      if (isClosed) {
        const loadingOverlay = document.createElement("div");
        loadingOverlay.style.cssText =
          "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 9999999; display: flex; justify-content: center; align-items: center; color: white;";
        loadingOverlay.innerHTML =
          "<i class='fas fa-spinner fa-spin' style='margin-right: 10px;'></i> กำลังลบ...";
        document.body.appendChild(loadingOverlay);

        fetch(CONFIG.API_URL + "?action=delete_box", {
          method: "POST",
          body: JSON.stringify({
            shipmentId: shipmentNo,
            boxNo: childBoxNo,
            branch: localStorage.getItem("pattcha_branch").toUpperCase(),
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            document.body.removeChild(loadingOverlay);
            if (data.status === "success" || data.success) {
              const savedItemsStr = childDiv.getAttribute("data-saved-items");
              if (savedItemsStr) {
                JSON.parse(savedItemsStr).forEach((item) => {
                  if (window.updateLocalStockMemory)
                    window.updateLocalStockMemory(
                      item.sku,
                      item.totalQty,
                      false,
                    );
                });
              }
              childDiv.remove();
              localStorage.removeItem(
                `wrapped_box_${shipmentNo}_${childBoxNo}`,
              );
              if (typeof window.fbDeleteBox === "function")
                window.fbDeleteBox(shipmentNo, childBoxNo);
              if (parentCol)
                parentCol.querySelector(".master-truck-count").textContent =
                  parentCol.querySelectorAll(".shipment-child-box").length;
              window.safeAlert("SUCCESS", `ลบกล่องสำเร็จ!`, "success");
            } else window.safeAlert("ERROR", "เกิดข้อผิดพลาด", "error");
          });
      } else {
        childDiv.remove();
        localStorage.removeItem(`draft_box_${shipmentNo}_${childBoxNo}`);
        if (typeof window.fbDeleteBox === "function")
          window.fbDeleteBox(shipmentNo, childBoxNo);
        if (parentCol)
          parentCol.querySelector(".master-truck-count").textContent =
            parentCol.querySelectorAll(".shipment-child-box").length;
      }
    }
  });
  return childDiv;
}

window.renderBoxModeACard = function (item) {
  const safeSku = escapeHTML(item.sku || "-");
  const safeName = escapeHTML(item.name || "-");
  const priceStr = Number(item.price || 0).toLocaleString();

  let stockAvail = Number(item.availableStock || 0);
  if (typeof window.getRealTimeLiveStock === "function") {
    const liveStock = window.getRealTimeLiveStock(item.sku);
    stockAvail = liveStock.avail;
  }

  let actionButtonHtml = "";
  if (stockAvail > 0) {
    actionButtonHtml = `
        <button onclick="addSearchItemToBox('${safeSku}')" style="background: linear-gradient(to bottom, #b02a37 0%, #ff6b6b 50%, #b02a37 100%); color: white; border: none; padding: 6px 15px; border-radius: 20px; font-weight: bold; font-size: 12px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            <i class="fas fa-plus"></i> ADD
        </button>`;
  } else {
    actionButtonHtml = `
        <button disabled style="background: #ccc; color: #888; border: none; padding: 6px 15px; border-radius: 20px; font-weight: bold; font-size: 12px; cursor: not-allowed;">
            <i class="fas fa-ban"></i> N/A
        </button>`;
  }

  const finalImageUrl =
    typeof window.parseDriveImage === "function"
      ? window.parseDriveImage(item.imageUrl)
      : item.imageUrl;

  return `
        <div class="product-row" style="display: flex; gap: 15px; padding: 15px; background: #fff; border-bottom: 1px solid #eee;">
        <img class="prod-img" src="${finalImageUrl}" onclick="openProductDetail('${safeSku}')" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px; cursor: pointer;">
        <div class="prod-info-wrapper" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; margin-top: 0 !important;">
            <div class="prod-text" onclick="openProductDetail('${safeSku}')" style="cursor: pointer; flex: 1;">
                <div class="prod-name" style="margin-top: 0;">${safeName}</div>
                <div class="prod-sku">${safeSku}</div>
            </div>
            <div class="prod-price" style="margin-top: 0 !important; color: #b02a37;">฿${priceStr}</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: auto !important; padding-top: 5px;">
            <span style="${stockAvail > 0 ? "color: #10b981;" : "color: #ef4444;"} font-weight: bold; display: flex; align-items: center; gap: 4px; font-size: 13px;">
                <i class="fas ${stockAvail > 0 ? "fa-thumbs-up" : "fa-times-circle"}"></i> ${stockAvail}
            </span>
            ${actionButtonHtml}
            </div>
        </div>
        </div>`;
};

window.renderBoxModeBCard = function (item, isClosedBox) {
  const safeSku = escapeHTML(item.sku || "-");
  const safeName = escapeHTML(item.name || "-");
  const priceStr = Number(item.price || 0).toLocaleString();

  const isManualModified = item.manualQty > 0 || item.isManual === true;
  const iconHtml = isManualModified
    ? '<i class="fas fa-hand-paper" style="color: #f59e0b;" title="แก้ไขด้วยมือ"></i>'
    : '<i class="fas fa-barcode" style="color: #000000;" title="สแกนผ่านกล้อง"></i>';

  const totalQty = (item.scanQty || 0) + (item.manualQty || 0);
  const isLocked = isClosedBox || window.isReadOnly;

  const controlsHtml = isLocked
    ? ""
    : `
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="display: flex; align-items: center; background: #f0f0f0; border-radius: 20px; overflow: hidden; border: 1px solid #ddd;">
                    <button onclick="decreaseBoxItemQty('${safeSku}')" style="background: none; border: none; padding: 4px 10px; cursor: pointer;"><i class="fas fa-minus" style="font-size: 10px;"></i></button>
                    <span style="font-weight: bold; font-size: 14px; min-width: 20px; text-align: center;">${totalQty}</span>
                    <button onclick="increaseBoxItemQty('${safeSku}')" style="background: none; border: none; padding: 4px 10px; cursor: pointer;"><i class="fas fa-plus" style="font-size: 10px;"></i></button>
                </div>
                <button onclick="removeBoxItem('${safeSku}')" style="background: #ef4444; color: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center;">
                    <i class="fas fa-trash-alt" style="font-size: 12px;"></i>
                </button>
            </div>`;

  const finalImageUrl =
    typeof window.parseDriveImage === "function"
      ? window.parseDriveImage(item.imageUrl)
      : item.imageUrl;

  return `
        <div id="box-item-${safeSku}" class="product-row" style="display: flex; gap: 15px; padding: 15px; background: #fff; border-bottom: 1px solid #eee; border-left: 4px solid #b02a37;">
            <img class="prod-img" src="${finalImageUrl}" onclick="openProductDetail('${safeSku}')" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px; cursor: pointer;">
            <div class="prod-info-wrapper" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; margin-top: 0 !important;">
                    <div class="prod-text" onclick="openProductDetail('${safeSku}')" style="cursor: pointer; flex: 1;">
                        <div class="prod-name" style="margin-top: 0;">${safeName}</div>
                        <div class="prod-sku">${safeSku}</div>
                    </div>
                    <div class="prod-price" style="margin-top: 0 !important; color: #b02a37;">฿${priceStr}</div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: auto !important; padding-top: 5px;">
                    <span style="font-weight: bold; display: flex; align-items: center; gap: 6px; font-size: 14px; color: #333;">
                        ${iconHtml} ยอดรวม: <span style="color: #b02a37; font-size: 16px; margin-left: 2px;">${totalQty}</span>
                    </span>
                    ${controlsHtml}
                </div>
            </div>
        </div>`;
};

// ============================================================================
// 🖥️ GROUP 6: VIEW CONTROLLERS (RENDERERS)
// ============================================================================

function showView(viewId) {
  const allViews = document.querySelectorAll(".view-screen, .master-view");
  allViews.forEach((view) => {
    view.classList.add("hide");
    view.style.opacity = "0";
  });

  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.remove("hide");
    setTimeout(() => {
      targetView.style.transition = "opacity 0.15s ease-in-out";
      targetView.style.opacity = "1";
    }, 10);
  } else {
    console.error("ไม่พบหน้าจอ ID:", viewId);
  }
}

function loadLobbyHeader() {
  const branchID = sessionStorage.getItem("selectedBranchID") || "";
  const headerEl = document.getElementById("lobbyBranchHeaderName");
  const btnExport = document.getElementById("btnSubmitLobby");
  const currentMode = sessionStorage.getItem("lobbyMode") || "ASSIGN";

  if (btnExport) {
    if (currentMode === "PENDING") btnExport.style.display = "none";
    else btnExport.style.display = "flex";
  }

  if (!headerEl) return;
  let branchName = "ไม่ระบุชื่อสาขา";
  let displayId =
    typeof getRealBranchCode === "function"
      ? getRealBranchCode(branchID)
      : branchID;

  if (window.appBranches && Array.isArray(window.appBranches)) {
    const matched = window.appBranches.find((b) => {
      const bId = String(b.id || b.Branch_ID || b.BranchID || "")
        .trim()
        .toUpperCase();
      return bId === displayId;
    });
    if (matched)
      branchName =
        matched.name || matched.Branch_Name || matched.BranchName || "";
  }
  headerEl.textContent = `[${displayId}] - ${branchName}`;
}

async function loadExistingTasks() {
  const containers = [
    "assignContainer",
    "pendingContainer",
    "completeContainer",
  ];
  const assignContainer = document.getElementById("assignContainer");
  if (!assignContainer) return;

  try {
    const timestamp = new Date().getTime();
    const response = await fetch(
      CONFIG.API_URL + "?action=get_tasks&t=" + timestamp,
    );
    let tasks = await response.json();
    if (!Array.isArray(tasks)) return;

    const deletedList = JSON.parse(
      localStorage.getItem("ghost_deleted_list") || "[]",
    );
    const exportedList = JSON.parse(
      localStorage.getItem("ghost_exported_list") || "[]",
    );

    if (deletedList.length > 0)
      tasks = tasks.filter((t) => !deletedList.includes(t.Shipment_No));
    if (exportedList.length > 0) {
      tasks.forEach((t) => {
        if (exportedList.includes(t.Shipment_No)) t.Status = "Pending";
      });
    }
    window.cachedTransferTasks = tasks;

    containers.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = "";
    });

    const myBranch = String(localStorage.getItem("pattcha_branch") || "")
      .trim()
      .toUpperCase();
    let counts = { assign: 0, pending: 0, complete: 0 };

    tasks.forEach((task) => {
      const originBranch = String(task.Origin_Branch || "")
        .trim()
        .toUpperCase();
      const rawDest = String(task.Destination || "")
        .trim()
        .toUpperCase();
      let actualDestBranch =
        typeof getRealBranchCode === "function"
          ? getRealBranchCode(rawDest)
          : rawDest.includes(myBranch.substring(0, 2))
            ? myBranch
            : rawDest;

      if (originBranch === myBranch && actualDestBranch !== myBranch) {
        const statusKey = (task.Status || "").toLowerCase();
        if (typeof createTransferOutTaskCard === "function") {
          const card = createTransferOutTaskCard(
            task.Date,
            task.Shipment_No,
            task.Origin_Type,
            task.Destination,
            task.Total_Box || 0,
            task.Total_Item || 0,
            task.Status,
          );
          const target = document.getElementById(statusKey + "Container");
          if (target) {
            target.appendChild(card);
            counts[statusKey]++;
          }
        }
      }
    });

    Object.keys(counts).forEach((key) => {
      const el = document.getElementById(key + "TaskCount");
      if (el)
        el.innerHTML = `Task (${counts[key]}) <i class="fas fa-chevron-down"></i>`;
    });
  } catch (error) {
    console.error("Error loading tasks:", error);
  }
}

async function renderLobbyTasks(branchID) {
  const container = document.getElementById("lobbyContentContainer");
  const emptyState = document.getElementById("lobbyEmptyState");
  if (!container) return;

  const currentMode = (
    sessionStorage.getItem("lobbyMode") || "ASSIGN"
  ).toUpperCase();

  try {
    let tasks = window.cachedTransferTasks;
    if (!tasks) {
      container.innerHTML =
        '<div style="text-align:center; padding: 40px 20px;"><i class="fas fa-spinner fa-spin" style="font-size: 24px;"></i></div>';
      const response = await fetch(
        CONFIG.API_URL + "?action=get_tasks&t=" + new Date().getTime(),
      );
      tasks = await response.json();

      const deletedList = JSON.parse(
        localStorage.getItem("ghost_deleted_list") || "[]",
      );
      const exportedList = JSON.parse(
        localStorage.getItem("ghost_exported_list") || "[]",
      );
      if (deletedList.length > 0)
        tasks = tasks.filter((t) => !deletedList.includes(t.Shipment_No));
      if (exportedList.length > 0)
        tasks.forEach((t) => {
          if (exportedList.includes(t.Shipment_No)) t.Status = "Pending";
        });
      window.cachedTransferTasks = tasks;
    }

    container.innerHTML = "";
    if (!Array.isArray(tasks)) {
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    const myBranch = String(localStorage.getItem("pattcha_branch") || "")
      .trim()
      .toUpperCase();
    const branchTasks = tasks.filter((task) => {
      const isMatchBranch = task.Destination === branchID;
      const isMatchStatus = (task.Status || "").toUpperCase() === currentMode;
      const isMyOrigin =
        String(task.Origin_Branch || "")
          .trim()
          .toUpperCase() === myBranch;
      return isMatchBranch && isMatchStatus && isMyOrigin;
    });

    if (branchTasks.length > 0) {
      if (emptyState) emptyState.style.display = "none";
      const renderedShipments = new Set();

      branchTasks.forEach((task) => {
        if (typeof createShipmentColumn === "function") {
          const safeNo = String(task.Shipment_No || "");
          if (!renderedShipments.has(safeNo)) {
            renderedShipments.add(safeNo);
            container.appendChild(
              createShipmentColumn(
                safeNo,
                task.Origin_Type || "Store",
                task.Status || "Assign",
              ),
            );
          }
        }
      });
    } else {
      if (emptyState) emptyState.style.display = "block";
    }
  } catch (error) {
    container.innerHTML =
      '<div style="text-align:center; color:#dc3545; padding: 20px;"><i class="fas fa-wifi"></i><br>เกิดข้อผิดพลาด กรุณารีเฟรช</div>';
  }
}

window.openBoxDetails = function (shipmentNo, boxNo, boxElement, isClosed) {
  window.currentActiveShipment = shipmentNo;
  window.currentActiveBoxNo = boxNo;
  window.currentBoxElement = boxElement;

  const currentMode = sessionStorage.getItem("lobbyMode") || "ASSIGN";
  const forceClosed = currentMode === "PENDING" || isClosed;

  const savedItems = boxElement
    ? boxElement.getAttribute("data-saved-items")
    : null;
  if (savedItems) window.currentBoxItems = JSON.parse(savedItems);
  else window.currentBoxItems = [];

  if (!forceClosed && typeof window.loadCurrentBoxDraft === "function") {
    const draftItems = window.loadCurrentBoxDraft(shipmentNo, boxNo);
    if (draftItems && draftItems.length > 0)
      window.currentBoxItems = draftItems;
  }

  const shipmentTextEl = document.getElementById("boxDetailsShipmentText");
  const boxTextEl = document.getElementById("boxDetailsBoxText");
  if (shipmentTextEl)
    shipmentTextEl.textContent = `(Shipment No: ${shipmentNo})`;
  if (boxTextEl) boxTextEl.textContent = boxNo;

  const btnScanner = document.getElementById("btnBoxScanner");
  const btnWrap = document.getElementById("btnBoxWrap");
  const searchInput = document.getElementById("boxSearchInput");

  if (typeof window.applyLobbyTheme === "function") window.applyLobbyTheme();

  if (btnScanner) {
    const newBtnScanner = btnScanner.cloneNode(true);
    btnScanner.parentNode.replaceChild(newBtnScanner, btnScanner);
    newBtnScanner.addEventListener("click", async () => {
      window.currentScannerContext = "box";
      if (typeof window.toggleScanner === "function") {
        const scanView = document.getElementById("scannerView");
        const boxDetailsView = document.getElementById("boxDetailsView");
        if (scanView && scanView.parentNode !== document.body)
          document.body.appendChild(scanView);
        if (boxDetailsView) boxDetailsView.classList.add("hide");
        await window.toggleScanner();
      }
    });
  }

  if (forceClosed) {
    if (btnWrap) btnWrap.style.display = "none";
    const finalBtnScanner = document.getElementById("btnBoxScanner");
    if (finalBtnScanner) {
      finalBtnScanner.style.width = "100%";
      finalBtnScanner.style.background =
        "linear-gradient(to bottom, #9e9e9e 0%, #e0e0e0 30%, #ffffff 50%, #e0e0e0 70%, #9e9e9e 100%)";
    }
    if (searchInput)
      searchInput.placeholder = "สแกน/ค้นหาสินค้าในกล่องที่ปิดแล้ว...";
  } else {
    if (btnWrap) btnWrap.style.display = "flex";
    const finalBtnScanner = document.getElementById("btnBoxScanner");
    if (finalBtnScanner) {
      finalBtnScanner.style.width = "48%";
      finalBtnScanner.style.background =
        "linear-gradient(to bottom, #9e9e9e 0%, #e0e0e0 30%, #ffffff 50%, #e0e0e0 70%, #9e9e9e 100%)";
    }
    if (searchInput) searchInput.placeholder = "ค้นหาสินค้าในกล่อง (SKU...)";
    if (typeof window.updateBoxWrapButtonState === "function")
      window.updateBoxWrapButtonState(window.currentBoxItems.length);
  }

  const lobbyView =
    document.getElementById("transferOutLobbyView") ||
    document.getElementById("lobbyView");
  if (lobbyView) lobbyView.classList.add("hide");
  const boxDetailsView = document.getElementById("boxDetailsView");
  if (boxDetailsView) boxDetailsView.classList.remove("hide");

  if (typeof window.renderBoxContentArea === "function")
    window.renderBoxContentArea();
};

window.renderBoxContentArea = function () {
  const container = document.getElementById("boxContentArea");
  if (!container) return;

  let isClosedBox = false;
  if (window.currentBoxElement) {
    isClosedBox =
      window.currentBoxElement.getAttribute("data-status") === "Closed";
  }

  if (window.currentBoxItems.length === 0) {
    container.innerHTML = `
            <div id="boxEmptyState" style="text-align: center; color: #999; margin-top: 50px;">
                <i class="fas fa-box-open" style="font-size: 40px; margin-bottom: 10px; color: #ccc;"></i>
                <p style="font-weight: bold; margin: 0;">กล่องยังว่างเปล่า</p>
                <p style="font-size: 12px;">ค้นหาหรือสแกนด้านล่างเพื่อเพิ่มสินค้า</p>
            </div>`;
    if (typeof window.updateBoxWrapButtonState === "function")
      window.updateBoxWrapButtonState(0);
    return;
  }

  container.innerHTML = window.currentBoxItems
    .map((item) => window.renderBoxModeBCard(item, isClosedBox))
    .join("");

  if (typeof window.updateBoxWrapButtonState === "function") {
    window.updateBoxWrapButtonState(window.currentBoxItems.length);
  }
};

window.renderReadOnlyLobby = function (shipmentNo, status) {
  const container = document.getElementById("readOnlyLobbyContentContainer");
  const header = document.getElementById("readOnlyLobbyHeader");
  const title = document.getElementById("readOnlyLobbyTitle");
  if (!container) return;

  if (status === "COMPLETE") {
    header.style.background =
      "linear-gradient(to bottom, #198754 0%, #20c997 50%, #198754 100%)";
    title.innerText = `[COMPLETE] ${shipmentNo}`;
  } else {
    header.style.background =
      "linear-gradient(to bottom, #4b5563 0%, #6c757d 50%, #4b5563 100%)";
    title.innerText = `[PENDING] ${shipmentNo}`;
  }

  const childrenKey = `children_${shipmentNo}`;
  let children = JSON.parse(localStorage.getItem(childrenKey)) || [];

  if (children.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:#888;">ไม่มีกล่องในชิปเมนต์นี้</div>`;
    return;
  }

  let html = "";
  children.forEach((box) => {
    const boxStatus =
      localStorage.getItem(`status_box_${shipmentNo}_${box.boxNo}`) || "Open";
    const isClosed = boxStatus === "Closed";
    const iconColor = isClosed ? "#10b981" : "#888";
    const iconType = isClosed ? "fa-box" : "fa-box-open";

    html += `
        <div style="background: #fff; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; border-left: 4px solid ${iconColor};" 
                 onclick="openReadOnlyBox('${shipmentNo}', '${box.boxNo}')">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas ${iconType}" style="color: ${iconColor}; font-size: 18px;"></i>
                    <div style="font-weight: bold; font-size: 14px; color: #333;">${box.boxNo}</div>
                </div>
                <i class="fas fa-chevron-right" style="color: #ccc;"></i>
            </div>
        </div>`;
  });
  container.innerHTML = html;
};

window.openReadOnlyBox = function (shipmentNo, boxNo) {
  window.isReadOnly = true;
  window.currentActiveShipment = shipmentNo;
  window.currentActiveBoxNo = boxNo;

  const boxView = document.getElementById("boxDetailsView");
  const readOnlyLobby = document.getElementById("transferOutReadOnlyLobbyView");

  const boxHeader = document.getElementById("boxDetailsHeader");
  const status = sessionStorage.getItem("lobbyMode") || "PENDING";
  if (boxHeader) {
    boxHeader.style.background =
      status === "COMPLETE"
        ? "linear-gradient(to bottom, #198754 0%, #20c997 50%, #198754 100%)"
        : "linear-gradient(to bottom, #4b5563 0%, #6c757d 50%, #4b5563 100%)";
  }

  const btnWrap = document.getElementById("btnBoxWrap");
  if (btnWrap) btnWrap.style.display = "none";

  const boxScannerBtn = document.getElementById("btnBoxScanner");
  if (boxScannerBtn) {
    boxScannerBtn.style.width = "100%";
    boxScannerBtn.style.background = "#ccc";
    boxScannerBtn.style.pointerEvents = "none";
    boxScannerBtn.innerHTML = `<i class="fas fa-lock"></i> ${status} (READ ONLY)`;
  }

  if (typeof navigationTo === "function") navigationTo(readOnlyLobby, boxView);
  if (typeof loadBoxDetailsData === "function") loadBoxDetailsData();
};

window.applyLobbyTheme = function () {
  const mode = (sessionStorage.getItem("lobbyMode") || "ASSIGN").toUpperCase();
  const headers = [
    document.getElementById("lobbyMasterHeader"),
    document.getElementById("boxDetailsHeader"),
  ];
  const footers = [
    document.getElementById("lobbyMasterFooter"),
    document.getElementById("boxDetailsFooter"),
  ];

  const btnAddTruck = document.getElementById("btnAddShipmentTruck");
  const btnExport = document.getElementById("btnSubmitLobby");
  const scanIcon = document.querySelector("#btnBoxScanner i");

  if (mode === "ASSIGN") {
    const redGradient =
      "linear-gradient(to bottom, #b02a37 0%, #ff6b6b 50%, #b02a37 100%)";
    headers.forEach((el) => {
      if (el) el.style.background = redGradient;
    });
    footers.forEach((el) => {
      if (el) el.style.background = redGradient;
    });
    if (btnAddTruck) btnAddTruck.style.display = "flex";
    if (btnExport) btnExport.style.display = "flex";
  } else if (mode === "PENDING") {
    const redGradient =
      "linear-gradient(to bottom, #b02a37 0%, #ff6b6b 50%, #b02a37 100%)";
    headers.forEach((el) => {
      if (el) el.style.background = redGradient;
    });
    footers.forEach((el) => {
      if (el) el.style.background = redGradient;
    });
    if (btnAddTruck) btnAddTruck.style.display = "none";
    if (btnExport) btnExport.style.display = "none";
  } else if (mode === "COMPLETE") {
    const greenGradient =
      "linear-gradient(to bottom, #198754 0%, #20c997 50%, #198754 100%)";
    headers.forEach((el) => {
      if (el) el.style.background = greenGradient;
    });
    footers.forEach((el) => {
      if (el) el.style.background = greenGradient;
    });
    if (btnAddTruck) btnAddTruck.style.display = "none";
    if (btnExport) btnExport.style.display = "none";
    document
      .querySelectorAll(".btn-minus, .btn-plus, .btn-delete-item")
      .forEach((btn) => {
        btn.style.display = "none";
      });
  }
  if (scanIcon) scanIcon.style.color = "#333";
};

// ============================================================================
// 🎯 GROUP 7: ACTIONS & HANDLERS (SCAN, ADD, REMOVE, SEARCH)
// ============================================================================

window.addSearchItemToBox = function (sku) {
  let isClosedBox =
    window.currentBoxElement &&
    window.currentBoxElement.getAttribute("data-status") === "Closed";
  if (isClosedBox) {
    if (typeof window.safeAlert === "function")
      window.safeAlert(
        "LOCKED",
        "กล่องปิดแล้ว ไม่สามารถเพิ่มสินค้าได้",
        "warning",
      );
    return;
  }

  if (typeof localProductDatabase === "undefined") return;
  const product = localProductDatabase.find(
    (p) =>
      (p.sku || p.SKU || "").toString().toUpperCase() === sku.toUpperCase(),
  );
  if (!product) return;

  window.currentBoxItems = window.currentBoxItems || [];
  const existingItem = window.currentBoxItems.find(
    (item) => (item.sku || "").toString().toUpperCase() === sku.toUpperCase(),
  );

  if (existingItem) {
    existingItem.manualQty = (existingItem.manualQty || 0) + 1;
    existingItem.totalQty =
      (existingItem.scanQty || 0) + existingItem.manualQty;
    existingItem.isManual = true;
  } else {
    window.currentBoxItems.unshift({
      ...product,
      scanQty: 0,
      manualQty: 1,
      totalQty: 1,
      isManual: true,
    });
  }

  const searchInput = document.getElementById("boxSearchInput");
  const clearBtn = document.getElementById("boxClearSearchBtn");
  if (searchInput) searchInput.value = "";
  if (clearBtn) clearBtn.style.display = "none";

  if (typeof window.renderBoxContentArea === "function")
    window.renderBoxContentArea();
  if (typeof window.saveCurrentBoxDraft === "function")
    window.saveCurrentBoxDraft();
};

window.increaseBoxItemQty = function (sku) {
  window.currentBoxItems = window.currentBoxItems || [];
  const item = window.currentBoxItems.find((p) => p.sku === sku);
  if (item) {
    const totalQtyInCurrentBox = (item.scanQty || 0) + (item.manualQty || 0);
    let otherBoxesUsed = 0;
    if (typeof window.checkCrossBoxStock === "function") {
      otherBoxesUsed =
        window.checkCrossBoxStock(sku).totalUsedInOtherBoxes || 0;
    }

    if (totalQtyInCurrentBox + otherBoxesUsed < item.availableStock) {
      item.manualQty = (item.manualQty || 0) + 1;
      item.totalQty = (item.scanQty || 0) + item.manualQty;
      item.isManual = true;
      if (typeof window.renderBoxContentArea === "function")
        window.renderBoxContentArea();
    } else {
      if (typeof window.safeAlert === "function")
        window.safeAlert("STOCK LIMIT", "สินค้าในสต็อกไม่เพียงพอ", "error");
    }
  }
  if (typeof window.saveCurrentBoxDraft === "function")
    window.saveCurrentBoxDraft();
};

window.decreaseBoxItemQty = function (sku) {
  window.currentBoxItems = window.currentBoxItems || [];
  const item = window.currentBoxItems.find((p) => p.sku === sku);
  if (item) {
    item.isManual = true;
    if (item.manualQty > 0) item.manualQty -= 1;
    else if (item.scanQty > 0) item.scanQty -= 1;

    item.totalQty = (item.scanQty || 0) + (item.manualQty || 0);

    if (item.totalQty <= 0) {
      window.currentBoxItems = window.currentBoxItems.filter(
        (p) => p.sku !== sku,
      );
    }
    if (typeof window.renderBoxContentArea === "function")
      window.renderBoxContentArea();
  }
  if (typeof window.saveCurrentBoxDraft === "function")
    window.saveCurrentBoxDraft();
};

window.removeBoxItem = async function (sku) {
  let isConfirm = false;
  if (typeof window.safeConfirm === "function") {
    isConfirm = await window.safeConfirm(
      "CONFIRM DELETE",
      "ต้องการลบสินค้านี้ออกจากกล่องใช่หรือไม่?",
      "error",
    );
  } else {
    isConfirm = confirm("ต้องการลบสินค้านี้ออกจากกล่องใช่หรือไม่?");
  }

  if (isConfirm) {
    window.currentBoxItems = window.currentBoxItems.filter(
      (p) => p.sku !== sku,
    );
    window.renderBoxContentArea();
  }
  fbSyncBoxData(
    window.currentActiveShipment,
    window.currentActiveBoxNo,
    window.currentBoxItems,
  );
  if (typeof window.triggerRealTimeUIRefresh === "function")
    window.triggerRealTimeUIRefresh();
};

window.handleBoxSearch = function () {
  const inputElem = document.getElementById("boxSearchInput");
  if (!inputElem) return;
  const query = inputElem.value.trim().toLowerCase();
  const clearBtn = document.getElementById("boxClearSearchBtn");
  if (clearBtn) clearBtn.style.display = query.length > 0 ? "flex" : "none";
  const container = document.getElementById("boxContentArea");

  if (!query) {
    window.renderBoxContentArea();
    return;
  }

  let isClosedBox = false;
  if (window.currentBoxElement) {
    isClosedBox =
      window.currentBoxElement.getAttribute("data-status") === "Closed";
  }

  if (isClosedBox) {
    const results = window.currentBoxItems.filter((item) => {
      return Object.values(item).some(
        (val) => val != null && val.toString().toLowerCase().includes(query),
      );
    });
    if (results.length === 0) {
      container.innerHTML =
        '<div style="text-align:center; color:#999; margin-top: 50px;">❌ ไม่พบสินค้านี้ในกล่อง</div>';
      return;
    }
    container.innerHTML = results
      .map((item) => window.renderBoxModeBCard(item, true))
      .join("");
  } else {
    if (
      typeof localProductDatabase !== "undefined" &&
      localProductDatabase.length > 0
    ) {
      const results = localProductDatabase.filter((item) => {
        return Object.values(item).some(
          (val) => val != null && val.toString().toLowerCase().includes(query),
        );
      });
      if (results.length === 0) {
        container.innerHTML =
          '<div style="text-align:center; color:#999; margin-top: 50px;">❌ ไม่พบสินค้าในระบบ</div>';
        return;
      }
      container.innerHTML = results
        .map((item) => window.renderBoxModeACard(item))
        .join("");
    } else {
      container.innerHTML =
        '<div style="text-align:center; color:#999; margin-top: 50px;">❌ ไม่มีข้อมูล (กรุณา Login ใหม่อีกครั้ง)</div>';
    }
  }
};

window.clearBoxSearch = function () {
  const inputElem = document.getElementById("boxSearchInput");
  const clearBtn = document.getElementById("boxClearSearchBtn");
  if (inputElem) inputElem.value = "";
  if (clearBtn) clearBtn.style.display = "none";
  window.renderBoxContentArea();
};

window.addScannedItemToBox = async function (skuInput) {
  const boxDetailsView = document.getElementById("boxDetailsView");
  if (boxDetailsView) boxDetailsView.classList.remove("hide");

  const sku = skuInput ? skuInput.trim() : "";
  if (!sku) return;

  let isClosedBox =
    window.currentBoxElement &&
    window.currentBoxElement.getAttribute("data-status") === "Closed";
  if (isClosedBox) {
    let existingItem = window.currentBoxItems.find(
      (i) => (i.sku || "").toString().toUpperCase() === sku.toUpperCase(),
    );
    if (existingItem) {
      if (navigator.vibrate) navigator.vibrate(100);
      const targetCard = document.getElementById(
        `box-item-${existingItem.sku}`,
      );
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
        targetCard.style.transition = "background-color 0.3s";
        targetCard.style.backgroundColor = "#d1e7dd";
        setTimeout(() => {
          targetCard.style.backgroundColor = "#fff";
        }, 1500);
      }
    } else {
      if (navigator.vibrate) navigator.vibrate(150);
      if (typeof window.safeAlert === "function")
        window.safeAlert(
          "❌ ไม่พบสินค้า",
          `ไม่มีรหัส ${sku} ในกล่องนี้`,
          "error",
        );
    }
    return;
  }

  let existingItem = window.currentBoxItems.find(
    (i) => (i.sku || "").toString().toUpperCase() === sku.toUpperCase(),
  );
  let oldManualQty = existingItem ? existingItem.manualQty || 0 : 0;

  const boxSearchInput = document.getElementById("boxSearchInput");
  if (boxSearchInput) {
    boxSearchInput.value = sku;
    boxSearchInput.dispatchEvent(new Event("input", { bubbles: true }));

    setTimeout(() => {
      if (typeof localProductDatabase !== "undefined") {
        const productMatch = localProductDatabase.find(
          (p) =>
            (p.sku || p.SKU || "").toString().trim().toUpperCase() ===
            sku.toUpperCase(),
        );
        if (productMatch) {
          const stockAvail = Number(productMatch.availableStock || 0);
          if (stockAvail <= 0) {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            if (typeof window.clearBoxSearch === "function")
              window.clearBoxSearch();
            const stockToast = document.createElement("div");
            stockToast.style.cssText =
              "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#dc3545; color:white; padding:8px 16px; border-radius:20px; font-weight:bold; z-index:99999999; box-shadow:0 4px 6px rgba(0,0,0,0.2); transition:opacity 0.5s;";
            stockToast.innerHTML = `<i class="fas fa-ban"></i> สต็อกหมด: ${sku} (N/A)`;
            document.body.appendChild(stockToast);
            setTimeout(() => {
              stockToast.style.opacity = "0";
              setTimeout(() => stockToast.remove(), 500);
            }, 2500);
            return;
          }

          if (typeof window.addSearchItemToBox === "function") {
            window.addSearchItemToBox(sku);
            setTimeout(() => {
              let updatedItem = window.currentBoxItems.find(
                (i) =>
                  (i.sku || "").toString().toUpperCase() === sku.toUpperCase(),
              );
              if (updatedItem) {
                if ((updatedItem.manualQty || 0) > oldManualQty) {
                  updatedItem.manualQty = oldManualQty;
                }
                updatedItem.scanQty = (updatedItem.scanQty || 0) + 1;
                updatedItem.totalQty =
                  updatedItem.scanQty + updatedItem.manualQty;
                updatedItem.isManual = updatedItem.manualQty > 0;
              }
              if (typeof window.renderBoxContentArea === "function")
                window.renderBoxContentArea();

              if (navigator.vibrate) navigator.vibrate(100);
              const toast = document.createElement("div");
              toast.style.cssText =
                "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#28a745; color:white; padding:10px 20px; border-radius:30px; font-weight:bold; z-index:99999999; box-shadow:0 4px 6px rgba(0,0,0,0.2); transition:opacity 0.5s;";
              toast.innerHTML = `<i class="fas fa-check-circle"></i> สแกนลงกล่องแล้ว`;
              document.body.appendChild(toast);
              setTimeout(() => {
                toast.style.opacity = "0";
                setTimeout(() => toast.remove(), 500);
              }, 1500);
            }, 50);
          }
        } else {
          if (navigator.vibrate) navigator.vibrate(150);
          if (typeof window.clearBoxSearch === "function")
            window.clearBoxSearch();
          const failToast = document.createElement("div");
          failToast.style.cssText =
            "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#ffc107; color:#333; padding:8px 16px; border-radius:20px; font-weight:bold; z-index:99999999; box-shadow:0 4px 6px rgba(0,0,0,0.2); transition:opacity 0.5s;";
          failToast.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ไม่พบสินค้า: ${sku} ในระบบ`;
          document.body.appendChild(failToast);
          setTimeout(() => {
            failToast.style.opacity = "0";
            setTimeout(() => failToast.remove(), 500);
          }, 2500);
        }
      }
    }, 300);
  }
};

window.updateBoxItemQty = function (index, change) {
  let isClosedBox =
    window.currentBoxElement &&
    window.currentBoxElement.getAttribute("data-status") === "Closed";
  if (isClosedBox) {
    if (typeof window.safeAlert === "function")
      window.safeAlert(
        "LOCKED",
        "กล่องถูกปิดไปแล้ว ไม่สามารถแก้ไขจำนวนได้",
        "warning",
      );
    return;
  }
  let item = window.currentBoxItems[index];
  if (!item) return;

  let newManualQty = (item.manualQty || 0) + change;
  if (newManualQty < 0) newManualQty = 0;

  item.manualQty = newManualQty;
  item.totalQty = (item.scanQty || 0) + item.manualQty;

  if (item.totalQty === 0) {
    if (confirm("จำนวนสินค้าเป็น 0 ต้องการลบออกจากกล่องหรือไม่?")) {
      window.currentBoxItems.splice(index, 1);
    } else {
      item.manualQty = 1;
      item.totalQty = (item.scanQty || 0) + 1;
    }
  }
  if (typeof window.renderBoxContentArea === "function")
    window.renderBoxContentArea();
};

window.updateShipmentBoxState = function (
  boxNo,
  status,
  scanQty = 0,
  manualQty = 0,
) {
  const childBox = document.querySelector(
    `.shipment-child-box[data-box-no="${boxNo}"]`,
  );
  if (!childBox) return;

  const scanEl = childBox.querySelector(".child-scan-qty");
  const manualEl = childBox.querySelector(".child-manual-qty");
  if (scanEl) scanEl.textContent = scanQty;
  if (manualEl) manualEl.textContent = manualQty;

  const iconEl = childBox.querySelector(".box-status-icon");
  const checkboxEl = childBox.querySelector(".child-checkbox");

  childBox.dataset.status = status;
  sessionStorage.setItem("activeBoxStatus", status);

  if (status === "closed") {
    if (iconEl) {
      iconEl.className = "fas fa-box box-status-icon";
      iconEl.style.color = "#dc3545";
    }
    if (checkboxEl) {
      checkboxEl.disabled = false;
      checkboxEl.style.cursor = "pointer";
      checkboxEl.title = "เลือกกล่องนี้เพื่อเตรียมส่งออก";
    }
  } else {
    if (iconEl) {
      iconEl.className = "fas fa-box-open box-status-icon";
      iconEl.style.color = "#28a745";
    }
    if (checkboxEl) {
      checkboxEl.disabled = true;
      checkboxEl.style.cursor = "not-allowed";
      checkboxEl.checked = false;
      checkboxEl.title = "ต้องปิดกล่องก่อนถึงจะเลือกได้";
    }
  }
};

window.updateBoxWrapButtonState = function (totalItemsCount) {
  const btnWrap = document.getElementById("btnBoxWrap");
  if (!btnWrap) return;
  if (totalItemsCount > 0) {
    btnWrap.disabled = false;
    btnWrap.style.background =
      "linear-gradient(to bottom, #b02a37 0%, #ff6b6b 50%, #b02a37 100%)";
    btnWrap.style.color = "white";
    btnWrap.style.borderLeft = "1px solid rgba(255,255,255,0.3)";
    btnWrap.style.cursor = "pointer";
  } else {
    btnWrap.disabled = true;
    btnWrap.style.background = "rgba(0, 0, 0, 0.466)";
    btnWrap.style.color = "#aaa";
    btnWrap.style.borderLeft = "1px solid rgba(255,255,255,0.2)";
    btnWrap.style.cursor = "not-allowed";
  }
};

window.updateExportButtonState = function () {
  const btnExport = document.getElementById("btnSubmitLobby");
  if (!btnExport) return;
  let hasReadyShipment = false;
  let readyShipmentCount = 0;
  const allShipments = document.querySelectorAll(".shipment-column");

  allShipments.forEach((col) => {
    const childBoxes = col.querySelectorAll(".shipment-child-box");
    const checkedChildCheckboxes = col.querySelectorAll(
      ".child-checkbox:checked",
    );
    let allBoxesClosed = true;
    childBoxes.forEach((box) => {
      if (box.getAttribute("data-status") !== "Closed") allBoxesClosed = false;
    });

    if (
      childBoxes.length > 0 &&
      allBoxesClosed &&
      childBoxes.length === checkedChildCheckboxes.length
    ) {
      hasReadyShipment = true;
      readyShipmentCount++;
    }
  });

  btnExport.style.pointerEvents = "auto";
  btnExport.style.opacity = "1";

  if (hasReadyShipment) {
    btnExport.disabled = false;
    btnExport.style.background =
      "linear-gradient(to bottom, #b02a37 0%, #ff6b6b 50%, #b02a37 100%)";
    btnExport.style.color = "white";
    btnExport.style.borderLeft = "1px solid rgba(255,255,255,0.3)";
    btnExport.style.cursor = "pointer";
    btnExport.innerHTML = `EXPORT (${readyShipmentCount})`;
  } else {
    btnExport.disabled = true;
    btnExport.style.background = "rgba(0, 0, 0, 0.466)";
    btnExport.style.color = "#aaa";
    btnExport.style.borderLeft = "1px solid rgba(255,255,255,0.2)";
    btnExport.style.cursor = "not-allowed";
    btnExport.innerHTML = `EXPORT`;
  }
};

// ============================================================================
// 🚀 GROUP 8: SUBMISSION & EXPORT LOGIC
// ============================================================================

window.submitWrapBox = async function () {
  if (!window.currentBoxItems || window.currentBoxItems.length === 0) {
    if (typeof window.safeAlert === "function")
      window.safeAlert(
        "BOX EMPTY",
        "ไม่มีสินค้าในกล่อง ไม่สามารถ Wrap ได้ครับ",
        "warning",
      );
    return;
  }

  const shipmentElem = document.getElementById("boxDetailsShipmentText");
  const boxElem = document.getElementById("boxDetailsBoxText");

  let shipmentId = shipmentElem
    ? shipmentElem.innerText
        .replace("(Shipment No: ", "")
        .replace(")", "")
        .trim()
    : "UNKNOWN-SHP";
  const boxNumber = boxElem ? boxElem.innerText.trim() : "UNKNOWN-BOX";

  const isConfirmed = await safeConfirm(
    "ยืนยันการปิดกล่อง (WRAP)?",
    `คุณต้องการปิดกล่อง ${boxNumber} ใช่หรือไม่? เมื่อปิดแล้วจะไม่สามารถแก้ไขสินค้าในกล่องนี้ได้อีก`,
    "question",
  );
  if (!isConfirmed) return;

  const boxContentArea = document.getElementById("boxContentArea");
  if (boxContentArea) {
    boxContentArea.style.pointerEvents = "none";
    boxContentArea.style.opacity = "0.6";
  }

  const wrapBtn = document.getElementById("btnBoxWrap");
  let originalBtnHtml = wrapBtn ? wrapBtn.innerHTML : "";
  if (wrapBtn) {
    wrapBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> กำลังบันทึก...';
    wrapBtn.style.pointerEvents = "none";
    wrapBtn.style.opacity = "0.7";
  }

  let totalScanQty = 0;
  let totalManualQty = 0;
  const payload = {
    shipmentId: shipmentId,
    boxNumber: boxNumber,
    branch: String(localStorage.getItem("pattcha_branch") || "")
      .trim()
      .toUpperCase(),
    items: window.currentBoxItems.map((item) => {
      const scan = item.scanQty || 0;
      const manual = item.manualQty || 0;
      totalScanQty += scan;
      totalManualQty += manual;
      return {
        sku: item.sku,
        name: item.name,
        scanQty: scan,
        manualQty: manual,
        totalQty: scan + manual,
      };
    }),
  };

  fetch(CONFIG.API_URL + "?action=save_box", {
    method: "POST",
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      if (wrapBtn) {
        wrapBtn.innerHTML = originalBtnHtml;
        wrapBtn.style.pointerEvents = "auto";
        wrapBtn.style.opacity = "1";
      }

      if (data.status === "success" || data.success) {
        localStorage.setItem(`status_box_${shipmentId}_${boxNumber}`, "Closed");
        const draftData = localStorage.getItem(
          `draft_box_${shipmentId}_${boxNumber}`,
        );
        if (draftData) {
          localStorage.setItem(
            `wrapped_box_${shipmentId}_${boxNumber}`,
            draftData,
          );
          localStorage.removeItem(`draft_box_${shipmentId}_${boxNumber}`);
        }

        if (window.currentBoxItems && window.currentBoxItems.length > 0) {
          window.currentBoxItems.forEach((item) => {
            if (typeof window.updateLocalStockMemory === "function")
              window.updateLocalStockMemory(item.sku, item.totalQty, true);
          });
        }

        if (typeof window.fbSyncBoxData === "function")
          window.fbSyncBoxData(
            shipmentId,
            boxNumber,
            "Closed",
            window.currentBoxItems,
          );

        if (window.currentBoxElement) {
          window.currentBoxElement.setAttribute("data-status", "Closed");
          const boxIcon = window.currentBoxElement.querySelector(
            ".fa-box-open, .fa-box",
          );
          if (boxIcon) {
            boxIcon.className = "fas fa-box";
            boxIcon.style.color = "#d93844";
          }
          window.currentBoxElement.setAttribute(
            "data-saved-items",
            JSON.stringify(window.currentBoxItems),
          );
        }

        if (typeof window.safeAlert === "function")
          window.safeAlert(
            "SUCCESS",
            `บันทึกกล่อง ${boxNumber} สำเร็จ!`,
            "success",
          );
        if (boxContentArea) {
          boxContentArea.style.pointerEvents = "auto";
          boxContentArea.style.opacity = "1";
        }
        document.getElementById("btnBackFromBox").click();
        setTimeout(() => {
          window.currentBoxItems = [];
          if (typeof window.renderBoxContentArea === "function")
            window.renderBoxContentArea();
        }, 300);
      } else {
        if (boxContentArea) {
          boxContentArea.style.pointerEvents = "auto";
          boxContentArea.style.opacity = "1";
        }
        if (typeof window.safeAlert === "function")
          window.safeAlert(
            "ERROR",
            "เกิดข้อผิดพลาด: " + (data.message || "บันทึกล้มเหลว"),
            "error",
          );
      }
    })
    .catch((error) => {
      if (boxContentArea) {
        boxContentArea.style.pointerEvents = "auto";
        boxContentArea.style.opacity = "1";
      }
      if (wrapBtn) {
        wrapBtn.innerHTML = originalBtnHtml;
        wrapBtn.style.pointerEvents = "auto";
        wrapBtn.style.opacity = "1";
      }
      if (typeof window.safeAlert === "function")
        window.safeAlert("ERROR", "ไม่สามารถติดต่อเซิร์ฟเวอร์ได้", "error");
    });
};

window.processExport = async function () {
  const readyMasterCheckbox = document.querySelector(
    ".master-checkbox:checked",
  );
  if (!readyMasterCheckbox) return;

  const colElement = readyMasterCheckbox.closest(".shipment-column");
  const shipmentNo = colElement.getAttribute("data-shipment");

  const childBoxes = colElement.querySelectorAll(".shipment-child-box");
  let totalBoxCount = childBoxes.length;
  let totalItemCount = 0;

  childBoxes.forEach((box) => {
    const savedData = box.getAttribute("data-saved-items");
    if (savedData) {
      try {
        const items = JSON.parse(savedData);
        items.forEach((item) => {
          totalItemCount += (item.scanQty || 0) + (item.manualQty || 0);
        });
      } catch (e) {}
    }
  });

  let isConfirm = false;
  if (typeof window.safeConfirm === "function") {
    isConfirm = await window.safeConfirm(
      "ยืนยันการ EXPORT?",
      `ส่งข้อมูลชิปเมนต์ ${shipmentNo}\nจำนวนกล่อง: ${totalBoxCount} ใบ\nจำนวนสินค้า: ${totalItemCount} ชิ้น\nยืนยันใช่หรือไม่?`,
      "question",
    );
  } else {
    isConfirm = confirm(`ต้องการส่งข้อมูลชิปเมนต์ ${shipmentNo} ใช่หรือไม่?`);
  }
  if (!isConfirm) return;

  const btnExport = document.getElementById("btnSubmitLobby");
  let originalBtnHtml = btnExport ? btnExport.innerHTML : "EXPORT";
  if (btnExport) {
    btnExport.innerHTML =
      '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> กำลังดำเนินการ...';
    btnExport.style.pointerEvents = "none";
    btnExport.style.opacity = "0.7";
  }

  let exportOverlay = document.getElementById("exportSpinnerOverlay");
  if (!exportOverlay) {
    exportOverlay = document.createElement("div");
    exportOverlay.id = "exportSpinnerOverlay";
    document.body.appendChild(exportOverlay);
  }
  exportOverlay.style.cssText =
    "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.75); z-index: 2147483647 !important; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; font-size: 20px; font-weight: bold; backdrop-filter: blur(5px);";
  exportOverlay.innerHTML =
    "<i class='fas fa-truck-loading fa-3x fa-bounce' style='margin-bottom: 20px; color: #ffc107;'></i><div style='text-align: center; text-shadow: 1px 1px 3px #000;'>กำลังแพ็กข้อมูลและส่งออก...<br><span style='font-size: 14px; color: #ddd; font-weight: normal;'>ห้ามปิดหน้าจอ กรุณารอสักครู่</span></div>";

  const payload = {
    shipmentId: shipmentNo,
    branch: String(localStorage.getItem("pattcha_branch") || "")
      .trim()
      .toUpperCase(),
    totalBox: totalBoxCount,
    totalItem: totalItemCount,
  };

  fetch(CONFIG.API_URL + "?action=dispatch_shipment", {
    method: "POST",
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success" || data.success) {
        if (typeof window.fbStopListening === "function")
          window.fbStopListening();

        let exportedList = JSON.parse(
          localStorage.getItem("ghost_exported_list") || "[]",
        );
        if (!exportedList.includes(shipmentNo)) exportedList.push(shipmentNo);
        localStorage.setItem(
          "ghost_exported_list",
          JSON.stringify(exportedList),
        );

        if (typeof window.nukeShipmentCache === "function")
          window.nukeShipmentCache(shipmentNo);
        if (typeof window.fbNukeShipment === "function")
          window.fbNukeShipment(shipmentNo);

        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.startsWith(`draft_box_${shipmentNo}_`) ||
              key.startsWith(`status_box_${shipmentNo}_`) ||
              key.startsWith(`wrapped_box_${shipmentNo}_`))
          ) {
            localStorage.removeItem(key);
          }
        }

        colElement.style.opacity = "0";

        setTimeout(async () => {
          colElement.remove();
          window.updateExportButtonState();

          const spinner = document.getElementById("exportSpinnerOverlay");
          if (spinner) spinner.remove();

          if (window.cachedTransferTasks) {
            const exportedTask = window.cachedTransferTasks.find(
              (t) => t.Shipment_No === shipmentNo,
            );
            if (exportedTask) exportedTask.Status = "Pending";
          }

          if (typeof loadExistingTasks === "function")
            await loadExistingTasks();

          if (typeof window.safeAlert === "function")
            window.safeAlert(
              "SUCCESS",
              `EXPORT ชิปเมนต์ ${shipmentNo} สำเร็จ!`,
              "success",
            );
          else alert(`EXPORT ชิปเมนต์ ${shipmentNo} สำเร็จ!`);

          if (document.querySelectorAll(".shipment-column").length === 0) {
            const viewTaskHub = document.getElementById(
              "transferOutTaskHubView",
            );
            const viewLobby = document.getElementById("transferOutLobbyView");
            if (
              typeof navigationTo === "function" &&
              viewTaskHub &&
              viewLobby
            ) {
              navigationTo(viewLobby, viewTaskHub);
            } else if (typeof showView === "function") {
              showView("transferOutTaskHubView");
            }
          }
        }, 800);
      } else {
        const spinner = document.getElementById("exportSpinnerOverlay");
        if (spinner) spinner.remove();
        if (btnExport) {
          btnExport.innerHTML = originalBtnHtml;
          btnExport.style.pointerEvents = "auto";
          btnExport.style.opacity = "1";
        }
        if (typeof window.safeAlert === "function")
          window.safeAlert(
            "ERROR",
            "ข้อผิดพลาด: " + (data.message || "ไม่สามารถ Export ได้"),
            "error",
          );
      }
    })
    .catch((error) => {
      const spinner = document.getElementById("exportSpinnerOverlay");
      if (spinner) spinner.remove();
      if (btnExport) {
        btnExport.innerHTML = originalBtnHtml;
        btnExport.style.pointerEvents = "auto";
        btnExport.style.opacity = "1";
      }
      if (typeof window.safeAlert === "function")
        window.safeAlert("ERROR", "ไม่สามารถติดต่อเซิร์ฟเวอร์ได้", "error");
    });
};

window.dispatchShipment = async function (shipmentNo) {
  const colElement = document.querySelector(
    `.shipment-column[data-shipment="${shipmentNo}"]`,
  );
  if (!colElement) return;
  const childBoxes = colElement.querySelectorAll(".shipment-child-box");

  if (childBoxes.length === 0) {
    if (typeof window.safeAlert === "function")
      window.safeAlert(
        "EMPTY SHIPMENT",
        "ยังไม่มีการสร้างกล่องสินค้า ไม่สามารถจัดส่งได้ครับ",
        "warning",
      );
    return;
  }

  let allClosed = true;
  let openBoxes = [];
  childBoxes.forEach((box) => {
    if (box.getAttribute("data-status") !== "Closed") {
      allClosed = false;
      openBoxes.push(box.getAttribute("data-box-no"));
    }
  });

  if (!allClosed) {
    if (typeof window.safeAlert === "function")
      window.safeAlert(
        "UNFINISHED BOXES",
        `มีกล่องที่ยังไม่ได้ WRAP จำนวน ${openBoxes.length} ใบ\n(เลขกล่อง: ${openBoxes.join(", ")})\n\nกรุณาปิดกล่องให้ครบทุกใบก่อนจัดส่งครับ`,
        "error",
      );
    return;
  }

  const isConfirm = await window.safeConfirm(
    "ยืนยันการจัดส่ง (DISPATCH)?",
    `กล่องทั้งหมด ${childBoxes.length} ใบ (ปิดครบแล้ว)\nยืนยันการปล่อยรถชิปเมนต์ ${shipmentNo} ใช่หรือไม่?`,
    "question",
  );
  if (!isConfirm) return;

  if (typeof window.safeAlert === "function")
    window.safeAlert(
      "PROCESSING...",
      "กำลังส่งข้อมูลเข้าสู่ระบบส่วนกลาง...",
      "info",
    );

  const payload = {
    shipmentId: shipmentNo,
    branch: String(localStorage.getItem("pattcha_branch") || "")
      .trim()
      .toUpperCase(),
  };

  fetch(CONFIG.API_URL + "?action=dispatch_shipment", {
    method: "POST",
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success" || data.success) {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.startsWith(`draft_box_${shipmentNo}_`) ||
              key.startsWith(`status_box_${shipmentNo}_`))
          ) {
            localStorage.removeItem(key);
          }
        }
        colElement.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        colElement.style.opacity = "0";
        colElement.style.transform = "scale(0.9)";
        setTimeout(() => {
          colElement.remove();
          if (typeof window.safeAlert === "function")
            window.safeAlert(
              "SUCCESS",
              `ปล่อยรถชิปเมนต์ ${shipmentNo} สำเร็จ!`,
              "success",
            );
          const remainingCols = document.querySelectorAll(".shipment-column");
          if (remainingCols.length === 0) {
            const btnBack = document.getElementById("btnBackToTaskHub");
            if (btnBack) btnBack.click();
          }
        }, 500);
      } else {
        if (typeof window.safeAlert === "function")
          window.safeAlert(
            "ERROR",
            "เกิดข้อผิดพลาด: " + (data.message || "ไม่สามารถจัดส่งได้"),
            "error",
          );
      }
    })
    .catch((error) => {
      if (typeof window.safeAlert === "function")
        window.safeAlert("ERROR", "ไม่สามารถติดต่อเซิร์ฟเวอร์ได้", "error");
    });
};

// ============================================================================
// 🎬 GROUP 9: MASTER INITIALIZER (EVENT LISTENERS)
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  const productMovementView = document.getElementById("productMovementView");
  const viewTaskHub = document.getElementById("transferOutTaskHubView");
  const viewDest = document.getElementById("transferOutDestView");
  const viewLobby = document.getElementById("transferOutLobbyView");

  loadExistingTasks();
  loadBranchesIntoDropdown();
  loadTransferTypesIntoDropdown();

  document
    .getElementById("btnTransferOut")
    ?.addEventListener("click", () =>
      navigationTo(productMovementView, viewTaskHub),
    );
  document
    .getElementById("btnBackToMovement")
    ?.addEventListener("click", () => {
      if (typeof window.fbStopListening === "function")
        window.fbStopListening();
      navigationTo(viewTaskHub, productMovementView);
    });
  document
    .getElementById("btnBackFromTaskHub")
    ?.addEventListener("click", () =>
      navigationTo(viewTaskHub, productMovementView),
    );

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
    .getElementById("btnCancelDest")
    ?.addEventListener("click", () => navigationTo(viewDest, viewTaskHub));
  document
    .getElementById("btnBackFromDest")
    ?.addEventListener("click", () => navigationTo(viewDest, viewTaskHub));
  document
    .getElementById("btnBackToDest")
    ?.addEventListener("click", () => navigationTo(viewLobby, viewTaskHub));

  document
    .getElementById("btnCancelFromLobby")
    ?.addEventListener("click", () => {
      if (typeof window.fbStopListening === "function")
        window.fbStopListening();
      hideLobbyView();
      navigationTo(viewLobby, viewTaskHub);
      if (typeof loadExistingTasks === "function") loadExistingTasks();
    });

  document
    .getElementById("btnBackToTaskHub")
    ?.addEventListener("click", hideLobbyView);

  function hideLobbyView() {
    const btnAddTruck = document.getElementById("btnAddShipmentTruck");
    if (btnAddTruck) btnAddTruck.style.display = "none";
  }

  const btnSubmitDest =
    document.getElementById("btnSubmitDest") ||
    document.getElementById("btnNextDest");
  if (btnSubmitDest) {
    btnSubmitDest.addEventListener("click", async () => {
      const destDropdown = document.getElementById("selectDestination");
      if (!destDropdown || !destDropdown.value) {
        if (typeof safeAlert === "function")
          safeAlert(
            "ข้อมูลไม่ครบถ้วน",
            "กรุณาเลือกสาขาที่ต้องการสร้างงานก่อนครับ",
            "warning",
          );
        else alert("กรุณาเลือกสาขาที่ต้องการสร้างงานก่อนครับ");
        return;
      }
      const branchID = destDropdown.value;
      sessionStorage.setItem("selectedBranchID", branchID);
      sessionStorage.setItem("lobbyMode", "ASSIGN");
      if (typeof window.applyLobbyTheme === "function")
        window.applyLobbyTheme();
      navigationTo(viewDest, viewLobby);
      if (typeof loadLobbyHeader === "function") loadLobbyHeader();
      if (typeof renderLobbyTasks === "function")
        await renderLobbyTasks(branchID);
    });
  }

  const btnAddShipmentTruck = document.getElementById("btnAddShipmentTruck");
  const shipmentBoxModal = document.getElementById("shipmentBoxModal");
  const selectType = document.getElementById("selectTransferType");
  const inputBoxNumber = document.getElementById("inputBoxNumber");
  const btnConfirm = document.getElementById("btnConfirmBox");
  const container = document.getElementById("lobbyContentContainer");
  const emptyState = document.getElementById("lobbyEmptyState");

  if (btnAddShipmentTruck && shipmentBoxModal) {
    btnAddShipmentTruck.addEventListener("click", () => {
      if (selectType) selectType.selectedIndex = 0;
      if (inputBoxNumber) inputBoxNumber.value = "กรุณาเลือกประเภท...";
      shipmentBoxModal.classList.remove("hide");
    });
  }

  if (selectType && inputBoxNumber) {
    selectType.addEventListener("change", () => {
      if (!selectType.value) {
        inputBoxNumber.value = "กรุณาเลือกประเภท...";
        return;
      }
      const selectedBranchID =
        sessionStorage.getItem("selectedBranchID") || "KKN02";
      const targetDestination = `02${selectedBranchID.substring(0, 2).toUpperCase()}`;
      const dateStr = new Date().toLocaleDateString("en-GB").replace(/\//g, "");
      let previewNum =
        parseInt(localStorage.getItem("shipment_running_counter") || "0") + 1;
      if (previewNum > 9999) previewNum = 1;
      const previewRunning = previewNum.toString().padStart(4, "0");
      inputBoxNumber.value = `${selectType.value}-${dateStr}-01CK-${previewRunning}-${targetDestination}`;
    });
  }

  if (btnConfirm) {
    btnConfirm.addEventListener("click", () => {
      if (!selectType || !selectType.value) {
        if (typeof safeAlert === "function")
          safeAlert(
            "ข้อมูลไม่ครบ",
            "กรุณาเลือกประเภทการโอนก่อนครับ",
            "warning",
          );
        else alert("กรุณาเลือกประเภทการโอนก่อนครับ!");
        return;
      }
      const myBranch = String(localStorage.getItem("pattcha_branch") || "CK")
        .trim()
        .toUpperCase();
      const rawSelected = sessionStorage.getItem("selectedBranchID") || "KKN02";
      const actualBranchID =
        typeof getRealBranchCode === "function"
          ? getRealBranchCode(rawSelected)
          : rawSelected;
      const targetDestination = `02${actualBranchID.substring(0, 2).toUpperCase()}`;
      const dateStr = new Date().toLocaleDateString("en-GB");
      const finalShipmentNo = `${selectType.value}-${dateStr.replace(/\//g, "")}-01CK-${getNextRunningNumber()}-${targetDestination}`;

      if (typeof window.nukeShipmentCache === "function")
        window.nukeShipmentCache(finalShipmentNo);
      if (typeof window.fbNukeShipment === "function")
        window.fbNukeShipment(finalShipmentNo);

      const payload = {
        Date: dateStr,
        Shipment_No: finalShipmentNo,
        Origin_Branch: myBranch,
        Destination: targetDestination,
        Branch: actualBranchID,
        Origin_Type: "Store",
        Status: "Assign",
      };
      btnConfirm.disabled = true;
      btnConfirm.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';

      fetch(CONFIG.API_URL + "?action=save_new_task", {
        method: "POST",
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.status === "success") {
            if (container && typeof createShipmentColumn === "function")
              container.appendChild(
                createShipmentColumn(finalShipmentNo, "Store"),
              );
            if (window.cachedTransferTasks)
              window.cachedTransferTasks.push(payload);
            if (shipmentBoxModal) shipmentBoxModal.classList.add("hide");
            if (emptyState) emptyState.style.display = "none";

            const taskHubAssignContainer =
              document.getElementById("assignContainer");
            if (
              taskHubAssignContainer &&
              typeof createTransferOutTaskCard === "function"
            ) {
              const newCard = createTransferOutTaskCard(
                dateStr,
                finalShipmentNo,
                "Store",
                targetDestination,
                0,
                0,
                "Assign",
              );
              taskHubAssignContainer.appendChild(newCard);
              const assignCountEl = document.getElementById("assignTaskCount");
              if (assignCountEl)
                assignCountEl.innerHTML = `Task (${taskHubAssignContainer.querySelectorAll(".task-card").length}) <i class="fas fa-chevron-down"></i>`;
            }
          }
        })
        .finally(() => {
          btnConfirm.disabled = false;
          btnConfirm.innerHTML = "ยืนยันสร้าง";
        });
    });
  }

  const btnBackFromBox = document.getElementById("btnBackFromBox");
  if (btnBackFromBox) {
    const newBtnBack = btnBackFromBox.cloneNode(true);
    btnBackFromBox.parentNode.replaceChild(newBtnBack, btnBackFromBox);
    newBtnBack.addEventListener("click", () => {
      if (window.currentActiveShipment && window.currentActiveBoxNo) {
        const childBoxEl = document.querySelector(
          `.shipment-child-box[data-box-no="${window.currentActiveBoxNo}"]`,
        );
        if (childBoxEl) {
          const isClosed = childBoxEl.getAttribute("data-status") === "Closed";
          const currentItemsLength = (window.currentBoxItems || []).length;

          if (!isClosed && currentItemsLength === 0) {
            localStorage.removeItem(
              `draft_box_${window.currentActiveShipment}_${window.currentActiveBoxNo}`,
            );
            childBoxEl.remove();
          } else if (!isClosed && currentItemsLength > 0) {
            let totalScan = 0,
              totalManual = 0;
            window.currentBoxItems.forEach((item) => {
              totalScan += item.scanQty || 0;
              totalManual += item.manualQty || 0;
            });
            const scanEl = childBoxEl.querySelector(".child-scan-qty");
            const manualEl = childBoxEl.querySelector(".child-manual-qty");
            if (scanEl) scanEl.textContent = totalScan;
            if (manualEl) manualEl.textContent = totalManual;
            localStorage.setItem(
              `draft_box_${window.currentActiveShipment}_${window.currentActiveBoxNo}`,
              JSON.stringify(window.currentBoxItems),
            );
          }
        }
        if (typeof window.updateMasterShipmentTotals === "function")
          window.updateMasterShipmentTotals(window.currentActiveShipment);
      }

      document.getElementById("boxDetailsView").classList.add("hide");
      const lobbyView =
        document.getElementById("transferOutLobbyView") ||
        document.getElementById("lobbyView");
      if (lobbyView) lobbyView.classList.remove("hide");

      window.currentScannerContext = "stock";
      window.currentActiveShipment = null;
      window.currentActiveBoxNo = null;
      window.currentBoxElement = null;
      window.currentBoxItems = [];
    });
  }

  document.addEventListener("change", function (e) {
    const colElement = e.target.closest(".shipment-column");
    if (!colElement) return;

    if (e.target.classList.contains("master-checkbox")) {
      const childBoxes = colElement.querySelectorAll(".shipment-child-box");
      let hasUnfinishedBoxes = false;
      childBoxes.forEach((box) => {
        if (box.getAttribute("data-status") !== "Closed")
          hasUnfinishedBoxes = true;
      });

      if (hasUnfinishedBoxes || childBoxes.length === 0) {
        e.target.checked = false;
        if (typeof window.safeAlert === "function")
          window.safeAlert(
            "UNFINISHED BOXES",
            "มีกล่องที่ยังไม่ได้ปิด หรือยังไม่มีกล่อง กรุณาจัดการให้เรียบร้อยก่อนครับ",
            "error",
          );
        return;
      }
      const isMasterChecked = e.target.checked;
      colElement.querySelectorAll(".child-checkbox").forEach((cb) => {
        if (!cb.disabled) cb.checked = isMasterChecked;
      });
    }

    if (e.target.classList.contains("child-checkbox")) {
      const masterCheckbox = colElement.querySelector(".master-checkbox");
      let allChecked = true;
      colElement.querySelectorAll(".child-checkbox").forEach((cb) => {
        if (!cb.checked) allChecked = false;
      });
      if (masterCheckbox) masterCheckbox.checked = allChecked;
    }
    if (typeof window.updateExportButtonState === "function")
      window.updateExportButtonState();
  });

  document.addEventListener("click", function (e) {
    const targetBtn = e.target.closest("#btnSubmitLobby");
    if (targetBtn) {
      if (targetBtn.disabled) return;
      if (typeof window.processExport === "function") window.processExport();
    }
  });

  const boxSearchInputElem = document.getElementById("boxSearchInput");
  if (boxSearchInputElem) {
    boxSearchInputElem.addEventListener(
      "input",
      debounceSearch((e) => {
        if (typeof window.handleBoxSearch === "function")
          window.handleBoxSearch();
      }, 250),
    );
  }

  const style = document.createElement("style");
  style.innerHTML = `
        #productDetailModal { z-index: 100005 !important; }
        #customAlertOverlay { z-index: 100010 !important; }
    `;
  document.head.appendChild(style);

  const boxView = document.getElementById("boxDetailsView");
  if (boxView) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const isHidden = boxView.classList.contains("hide");
          if (!isHidden && typeof window.renderBoxContentArea === "function") {
            window.renderBoxContentArea();
          }
        }
      });
    });
    observer.observe(boxView, { attributes: true });
  }
});

// ============================================================================
// 🧪 GROUP 10: DEVELOPER TOOLS
// ============================================================================
window.mockComplete = function (shipmentNo) {
  if (!window.cachedTransferTasks)
    return console.error("❌ ไม่พบข้อมูลใน Cache");
  let task = window.cachedTransferTasks.find(
    (t) => t.Shipment_No === shipmentNo,
  );
  if (task) {
    task.Status = "Complete";
    const cards = document.querySelectorAll(".task-card");
    cards.forEach((c) => {
      if (c.innerHTML.includes(shipmentNo)) {
        document.getElementById("completeContainer").appendChild(c);
        c.style.borderLeft = "6px solid #28a745";
        const statusSpan = c.querySelector("span[style*='uppercase']");
        if (statusSpan) {
          statusSpan.textContent = "COMPLETE";
          statusSpan.style.background = "#28a745";
        }
      }
    });
    ["assign", "pending", "complete"].forEach((key) => {
      const el = document.getElementById(key + "TaskCount");
      const count = document
        .getElementById(key + "Container")
        .querySelectorAll(".task-card").length;
      if (el)
        el.innerHTML = `Task (${count}) <i class="fas fa-chevron-down"></i>`;
    });
    console.log(
      `✅ [Simulator] เสกชิปเมนต์ ${shipmentNo} เป็น COMPLETE เรียบร้อย!`,
    );
  } else {
    console.error(`❌ ไม่พบชิปเมนต์หมายเลข ${shipmentNo}`);
  }
};
