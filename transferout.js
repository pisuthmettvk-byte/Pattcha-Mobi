const webAppUrl = "https://script.google.com/macros/s/AKfycbxl3g-8afxNG-q4UhOxVsffv-qO7Dum2koHWAKEbr98086bvPq-RwNQrEwGvzMZ5Jm7zQ/exec";

// 🟢 ปลดล็อกตัวแปร CONFIG เพื่อให้ API ทำงานได้
const CONFIG = { API_URL: webAppUrl };

// ==========================================
// ⚙️ ตัวแปรตั้งค่าสถานะ
// ==========================================
const STATUS_CONFIG = {
  NEW: "Assign",
  PENDING: "Pending",
  COMPLETE: "Complete",
};

// =================================================================
// 🚀 กลุ่มที่ 1: โหลดข้อมูลพื้นฐาน (สาขา & ประเภทโอน)
// =================================================================
async function loadBranchesIntoDropdown() {
  const select = document.getElementById("selectDestination");
  if (!select) return;
  select.innerHTML = '<option value="" disabled selected>-- กำลังโหลดสาขา... --</option>';

  try {
    const response = await fetch(CONFIG.API_URL + "?action=get_branches");
    const rawText = await response.text();
    let branches;
    try {
      branches = JSON.parse(rawText); 
    } catch (e) {
      console.error("🚨 API ดรอปดาวน์สาขาพัง! (ไม่ใช่ JSON):", rawText);
      select.innerHTML = '<option value="" disabled selected>-- โหลดล้มเหลว --</option>';
      return; 
    }

    const myBranch = String(localStorage.getItem("pattcha_branch") || "").trim().toUpperCase();
    select.innerHTML = '<option value="" disabled selected>-- SELECT BRANCH --</option>';

    if (Array.isArray(branches)) {
      branches.forEach((branch) => {
        const branchId = String(branch.id || branch.Branch_ID || branch.BranchID || "").trim().toUpperCase();
        const branchName = branch.name || branch.Branch_Name || branch.BranchName || "";

        if (branchId !== myBranch && branchId !== "") {
          const option = document.createElement("option");
          option.value = branchId;
          option.textContent = `${branchId} - ${branchName}`;
          select.appendChild(option);
        }
      });
    }
  } catch (error) {
    console.error("🚨 Error fetch branches:", error);
    if (select) select.innerHTML = '<option value="" disabled selected>-- โหลดล้มเหลว --</option>';
  }
}

function loadTransferTypesIntoDropdown() {
  const selectType = document.getElementById("selectTransferType");
  if (!selectType) return;
  selectType.innerHTML = '<option value="">กำลังโหลดประเภท...</option>';

  fetch(CONFIG.API_URL + "?action=get_transfer_types")
    .then((res) => res.json())
    .then((data) => {
      selectType.innerHTML = '<option value="">กรุณาเลือกประเภท...</option>';
      if (Array.isArray(data)) {
        data.forEach((item) => {
          const key = item.Type_Key || item.type_key || item.id || item.Key || "";
          const desc = item.Description || item.description || item.name || item.Desc || "";
          const option = document.createElement("option");
          option.value = key;
          option.textContent = `[${key}] ${desc}`;
          selectType.appendChild(option);
        });
      }
    })
    .catch((err) => console.error("Dropdown Load Error:", err));
}

// =================================================================
// 🚀 กลุ่มที่ 2: ระบบจัดการ UI (Lobby & สลับหน้าจอ)
// =================================================================
function showView(viewId) {
  const allViews = document.querySelectorAll(".view-screen");
  allViews.forEach((view) => {
    view.classList.add("hide");
  });
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.remove("hide");
  } else {
    console.error("🚨 ไม่พบหน้าจอ ID:", viewId);
  }
}

function loadLobbyHeader() {
  const branchID = sessionStorage.getItem("selectedBranchID");
  const branchName = sessionStorage.getItem("selectedBranchName");
  const headerElement = document.getElementById("lobbyBranchHeaderName");
  if (headerElement && branchID && branchName) {
    headerElement.textContent = `[${branchID}] - ${branchName}`;
  }
}

function focusShipmentInLobby(shipmentNo) {
  const columns = document.querySelectorAll(".shipment-column");
  columns.forEach((col) => {
    if (col.innerHTML.includes(shipmentNo)) {
      col.style.transition = "background 0.5s";
      col.style.background = "#fff3cd";
      col.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        col.style.background = "#ffffff";
      }, 2000);
    }
  });
}

function createShipmentColumn(shipmentNo, originType = "Store") {
  const col = document.createElement("div");
  col.className = "shipment-column";
  col.setAttribute("data-shipment", shipmentNo);

  const dateParts = shipmentNo.split("-")[1];
  const displayDate =
    dateParts && dateParts.length === 8
      ? `${dateParts.substring(0, 2)}/${dateParts.substring(2, 4)}/${dateParts.substring(6, 8)}`
      : new Date().toLocaleDateString("en-GB").substring(0, 8);

  col.style.cssText = `
    background: linear-gradient(to bottom, #d4d4d4 0%, #ffffff 50%, #a09f9f 100%);
    border-top: 1px solid #fff; border-bottom: 1px solid #bbb;
    border-left: 1px solid #ccc; border-right: 1px solid #ccc;
    border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    width: 100%; margin-bottom: 15px; padding: 10px 20px;
    display: flex; flex-direction: row; flex-wrap: wrap; 
    align-items: center; justify-content: space-between; gap: 15px; box-sizing: border-box;
  `;

  col.innerHTML = `
    <div style="display: flex; align-items: center; gap: 15px; flex-shrink: 0;">
      <input type="checkbox" style="width: 18px; height: 18px; border-radius: 4px; cursor: pointer;">
      <span style="font-weight: 900; font-size: 15px; color: #222;">${displayDate}</span>
      <span style="font-weight: bold; font-size: 15px; color: #0033cc; letter-spacing: 0.5px;">${shipmentNo}</span>
    </div>
    <div style="display: flex; align-items: center; gap: 20px; flex-grow: 1; flex-wrap: wrap; min-width: 150px;">
      <span style="background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; padding: 3px 10px; font-size: 12px; font-weight: bold; color: #444; box-shadow: inset 0 1px 2px rgba(255,255,255,1);">
        ${originType}
      </span>
      <div style="display: flex; gap: 15px; font-size: 13px; font-weight: bold; color: #333; text-shadow: 1px 1px 0px #fff;">
        <span><i class="fas fa-truck"></i> (0)</span>
        <span><i class="fas fa-barcode"></i> (0)</span>
        <span><i class="fas fa-hand-paper"></i> (0)</span>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 18px; flex-shrink: 0;">
      <i class="fas fa-box-open btn-scan" style="color: #2e8b57; font-size: 20px; cursor: pointer; filter: drop-shadow(1px 1px 1px #fff);" title="สแกนเพิ่มกล่อง"></i>
      <i class="fas fa-trash-alt btn-delete" style="color: #c9302c; font-size: 20px; cursor: pointer; filter: drop-shadow(1px 1px 1px #fff);" title="ลบงานนี้"></i>
      <span style="background: #d93844; color: white; padding: 6px 18px; border-radius: 15px; font-size: 13px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
        Assign
      </span>
    </div>
  `;

  col.querySelector(".btn-delete").addEventListener("click", () => {
    if (confirm(`ต้องการลบ Shipment: ${shipmentNo} ใช่หรือไม่?`)) {
      col.remove();
      const container = document.getElementById("lobbyContentContainer");
      const emptyState = document.getElementById("lobbyEmptyState");
      if (container && container.querySelectorAll(".shipment-column").length === 0) {
        if (emptyState) emptyState.style.display = "block";
      }
    }
  });

  col.querySelector(".btn-scan").addEventListener("click", () => {
    if (typeof safeAlert === "function") {
      safeAlert("เตรียมแพ็คของ", `พร้อมสแกนสินค้าลง Shipment: ${shipmentNo}`, "info");
    } else {
      alert(`พร้อมสแกนสินค้าลง Shipment: ${shipmentNo}`);
    }
  });

  return col;
}

// ======================================================
// 🚀 กลุ่มที่ 3: ฟังก์ชันอรรถประโยชน์จากต้นฉบับ (Utility)
// ======================================================
function createUniversalCard(branchName, docNo, branchID, status = "pending") {
  const colorMap = { pending: "#dc3545", done: "#28a745", issue: "#ffc107" };
  const borderColor = colorMap[status] || "#ccc";
  const card = document.createElement("div");
  card.className = "task-list-item shipment-card";
  card.setAttribute("data-branch-id", branchID);

  card.style.cssText = `
        width: 100%; border-left: 6px solid ${borderColor}; border-bottom: 1px solid #e0e0e0; 
        padding: 15px 20px; display: flex; justify-content: space-between; 
        align-items: center; background: white; cursor: pointer;
    `;
  card.innerHTML = `
        <div style="text-align: left;">
            <div style="font-weight: bold; font-size: 14px; color: #333;">Doc No: ${docNo}</div>
            <span style="font-size: 12px; color: #777;">คลังสินค้ากลาง -> ${branchName}</span>
        </div>
        <i class="fas fa-chevron-right" style="color: #ccc; font-size: 14px;"></i>
    `;
  card.addEventListener("click", () => {
    sessionStorage.setItem("selectedBranchID", branchID);
    showView("transferOutLobbyView");
    loadLobbyHeader();
  });
  return card;
}

function formatShipmentNoHTML(shipmentNo) {
  return `<span style="font-weight: bold; font-size: 14px; color: #0044ff; font-family: sans-serif; letter-spacing: 0.5px;">${shipmentNo}</span>`;
}

// ======================================================
// 🚀 กลุ่มที่ 4: ระบบสร้างการ์ดงาน & โหลดงานเข้า Lobby
// ======================================================
function getNextRunningNumber() {
  let currentNum = parseInt(localStorage.getItem("shipment_running_counter") || "0");
  currentNum++;
  if (currentNum > 9999) currentNum = 1;
  localStorage.setItem("shipment_running_counter", currentNum.toString());
  return currentNum.toString().padStart(4, "0");
}

async function renderLobbyTasks(branchID) {
  const container = document.getElementById("lobbyContentContainer");
  const emptyState = document.getElementById("lobbyEmptyState");
  
  if (!container) return;
  container.innerHTML = '<div style="text-align:center; padding: 20px; font-weight:bold; color:#666;">กำลังดึงข้อมูลงาน... <i class="fas fa-spinner fa-spin"></i></div>';

  try {
    const response = await fetch(CONFIG.API_URL + "?action=get_tasks");
    const tasks = await response.json();
    container.innerHTML = ""; 

    if (!Array.isArray(tasks)) return;

    const branchTasks = tasks.filter(task => task.Destination === branchID && (task.Status || "").toLowerCase() === "assign");

    if (branchTasks.length > 0) {
      if (emptyState) emptyState.style.display = "none";
      branchTasks.forEach(task => {
        const col = createShipmentColumn(task.Shipment_No, task.Origin_Type || "Store");
        container.appendChild(col);
      });
    } else {
      if (emptyState) emptyState.style.display = "block";
    }
  } catch (error) {
    console.error("🚨 Error loading lobby tasks:", error);
    container.innerHTML = '<div style="text-align:center; color:#dc3545;">เกิดข้อผิดพลาดในการดึงข้อมูล</div>';
  }
}

// ======================================================
// 🚀 กลุ่มที่ 5: ระบบจัดการ Task Hub 
// ======================================================
function createTransferOutTaskCard(date, shipmentNo, originType, destBranch, totalBox, totalItem, status) {
  const colorMap = { assign: "#dc3545", pending: "#e0a800", complete: "#28a745" };
  const statusKey = (status || "").toLowerCase();
  const leftBorderColor = colorMap[statusKey] || "#ccc";

  const card = document.createElement("div"); 
  card.className = "task-card";
  card.dataset.destination = destBranch;

  card.style.cssText = `
    width: 100%; background: #ffffff; border: 1px solid #e0e0e0; border-bottom: none;
    border-left: 6px solid ${leftBorderColor}; padding: 16px 15px; margin-bottom: 0px;
    box-sizing: border-box; cursor: pointer; 
  `;

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
        <span style="font-size: 14px; color: #333; font-weight: bold;"><i class="fas fa-truck" style="color: #dc3545;"></i> ${destBranch || "-"}</span>
        <span style="font-size: 13px; color: #555; font-weight: bold;"><i class="fas fa-box" style="color: #8d6e63;"></i> (${totalBox || 0}) TOTAL (${totalItem || 0})</span>
        <span style="background: ${leftBorderColor}; color: #fff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${status || "Assign"}</span>
      </div>
    </div>
  `;

  card.addEventListener("click", async () => {
    console.log(`🎯 กดคลิกการ์ด: ${shipmentNo} (สาขา: ${destBranch})`);
    sessionStorage.setItem("jump_to_shipment", shipmentNo);
    sessionStorage.setItem("selectedBranchID", destBranch);

    if (!sessionStorage.getItem("selectedBranchName")) {
      sessionStorage.setItem("selectedBranchName", "");
    }

    try {
      showView("transferOutLobbyView");
      loadLobbyHeader();
      await renderLobbyTasks(destBranch);
      
      setTimeout(() => {
        focusShipmentInLobby(shipmentNo);
      }, 500);
    } catch (error) {
      console.error("🚨 ระบบขัดข้องระหว่างพาวาร์ปเข้า Lobby:", error);
    }
  });

  return card; 
}

async function loadExistingTasks() {
  const containers = ["assignContainer", "pendingContainer", "completeContainer"];
  const assignContainer = document.getElementById("assignContainer");
  if (!assignContainer) return;

  try {
    const response = await fetch(CONFIG.API_URL + "?action=get_tasks");
    const tasks = await response.json();
    if (!Array.isArray(tasks)) return;

    containers.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = "";
    });

    let counts = { assign: 0, pending: 0, complete: 0 };
    tasks.forEach((task) => {
      const statusKey = (task.Status || "").toLowerCase();
      const card = createTransferOutTaskCard(
        task.Date, task.Shipment_No, task.Origin_Type, task.Destination,
        task.Total_Box, task.Total_Item, task.Status
      );
      const target = document.getElementById(statusKey + "Container");
      if (target) {
        target.appendChild(card);
        counts[statusKey]++;
      }
    });

    Object.keys(counts).forEach((key) => {
      const el = document.getElementById(key + "TaskCount");
      if (el) el.innerHTML = "Task (" + counts[key] + ') <i class="fas fa-chevron-down"></i>';
    });
  } catch (error) {
    console.error("Error loading tasks:", error);
  }
}

// ======================================================
// 🚀 กลุ่มที่ 6: MASTER INITIALIZER (คุมระบบทั้งหมด)
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
  const productMovementView = document.getElementById("productMovementView");
  const viewTaskHub = document.getElementById("transferOutTaskHubView");
  const viewDest = document.getElementById("transferOutDestView");
  const viewLobby = document.getElementById("transferOutLobbyView");

  loadExistingTasks();
  loadBranchesIntoDropdown();
  loadTransferTypesIntoDropdown();

  const navigationTo = (hideView, showView) => {
    if (hideView) hideView.classList.add("hide");
    if (showView) showView.classList.remove("hide");
  };

  // 🟢 1. ระบบ Event Delegation แก้ปัญหาคลิกปุ่มไม่ติด (รองรับ Puppeteer & อุปกรณ์จริง)
  document.body.addEventListener("click", (e) => {
    // ดักปุ่ม Transfer Out หน้าหลัก
    const btnTransferOut = e.target.closest("#btnTransferOut");
    if (btnTransferOut) {
      if (productMovementView && viewTaskHub) {
        navigationTo(productMovementView, viewTaskHub);
      }
    }

    // ดักปุ่มย้อนกลับจาก Task Hub
    const btnBackToMovement = e.target.closest("#btnBackToMovement");
    const btnBackFromTaskHub = e.target.closest("#btnBackFromTaskHub");
    if (btnBackToMovement || btnBackFromTaskHub) {
      if (productMovementView && viewTaskHub) {
        navigationTo(viewTaskHub, productMovementView);
      }
    }
  });

  // 🟢 2. ปุ่มนำทางอื่นๆ (สร้างงาน, ยกเลิก)
  const btnCreateNewTask = document.getElementById("btnCreateNewTask") || document.getElementById("btnNewTask");
  if (btnCreateNewTask) {
    btnCreateNewTask.addEventListener("click", () => {
      const selectDest = document.getElementById("selectDestination");
      if (selectDest) selectDest.selectedIndex = 0;
      navigationTo(viewTaskHub, viewDest);
    });
  }

  document.getElementById("btnCancelDest")?.addEventListener("click", () => navigationTo(viewDest, viewTaskHub));
  document.getElementById("btnBackFromDest")?.addEventListener("click", () => navigationTo(viewDest, viewTaskHub));
  document.getElementById("btnCancelFromLobby")?.addEventListener("click", () => navigationTo(viewLobby, viewTaskHub));
  document.getElementById("btnBackToDest")?.addEventListener("click", () => navigationTo(viewLobby, viewTaskHub));

  const btnSubmitDest = document.getElementById("btnSubmitDest") || document.getElementById("btnNextDest");
  if (btnSubmitDest) {
    btnSubmitDest.addEventListener("click", () => {
      const destDropdown = document.getElementById("selectDestination");
      if (!destDropdown || !destDropdown.value) {
        if (typeof safeAlert === "function") safeAlert("ข้อมูลไม่ครบถ้วน", "กรุณาเลือกสาขาที่ต้องการสร้างงานก่อนครับ", "warning");
        else alert("กรุณาเลือกสาขาที่ต้องการสร้างงานก่อนครับ");
        return;
      }
      const branchID = destDropdown.value;
      const branchName = destDropdown.options[destDropdown.selectedIndex].text;

      sessionStorage.setItem("selectedBranchID", branchID);
      sessionStorage.setItem("selectedBranchName", branchName);

      const lobbyHeader = document.getElementById("lobbyBranchHeaderName");
      if (lobbyHeader) lobbyHeader.innerText = branchName;
      navigationTo(viewDest, viewLobby);
    });
  }

  // 🟢 3. ระบบ Modal สร้างงาน (รถบรรทุก + ยืนยัน)
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
      const selectedBranchID = sessionStorage.getItem("selectedBranchID") || "KKN02";
      const targetDestination = `02${selectedBranchID.substring(0, 2).toUpperCase()}`;
      const dateStr = new Date().toLocaleDateString("en-GB").replace(/\//g, "");
      let previewNum = parseInt(localStorage.getItem("shipment_running_counter") || "0") + 1;
      if (previewNum > 9999) previewNum = 1;
      const previewRunning = previewNum.toString().padStart(4, "0");
      inputBoxNumber.value = `${selectType.value}-${dateStr}-01CK-${previewRunning}-${targetDestination}`;
    });
  }

  if (btnConfirm) {
    btnConfirm.addEventListener("click", () => {
      if (!selectType || !selectType.value) {
        if (typeof safeAlert === "function") safeAlert("ข้อมูลไม่ครบ", "กรุณาเลือกประเภทการโอนก่อนครับ", "warning");
        else alert("กรุณาเลือกประเภทการโอนก่อนครับ!");
        return;
      }

      const selectedBranchID = sessionStorage.getItem("selectedBranchID") || "KKN02";
      const targetDestination = `02${selectedBranchID.substring(0, 2).toUpperCase()}`;
      const finalShipmentNo = `${selectType.value}-${new Date().toLocaleDateString("en-GB").replace(/\//g, "")}-01CK-${getNextRunningNumber()}-${targetDestination}`;
      const dateStr = new Date().toLocaleDateString("en-GB");

      const payload = {
        Date: dateStr,
        Shipment_No: finalShipmentNo,
        Origin_Branch: "CK",
        Destination: targetDestination,
        Origin_Type: "Store",
        Status: STATUS_CONFIG.NEW,
      };

      btnConfirm.disabled = true;
      btnConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';
      btnConfirm.style.opacity = "0.7";

      fetch(CONFIG.API_URL + "?action=save_new_task", {
        method: "POST",
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.status === "success") {
            if (container) container.appendChild(createShipmentColumn(finalShipmentNo, "Store"));
            if (shipmentBoxModal) shipmentBoxModal.classList.add("hide");
            if (emptyState) emptyState.style.display = "none";

            const assignContainer = document.getElementById("assignContainer");
            if (assignContainer && typeof createTransferOutTaskCard === "function") {
              const newCard = createTransferOutTaskCard(
                dateStr, finalShipmentNo, "Store", targetDestination, 0, 0, STATUS_CONFIG.NEW
              );
              assignContainer.appendChild(newCard);
            }
          }
        })
        .finally(() => {
          btnConfirm.disabled = false;
          btnConfirm.innerHTML = "ยืนยันสร้าง";
          btnConfirm.style.opacity = "1";
        });
    });
  }

  // 🟢 4. ระบบเช็กการวาร์ปเมื่อโหลดหน้าจอ
  const pendingJump = sessionStorage.getItem("jump_to_shipment");
  if (pendingJump) {
    setTimeout(() => {
      focusShipmentInLobby(pendingJump);
      sessionStorage.removeItem("jump_to_shipment");
    }, 500);
  }
});