const webAppUrl = "https://script.google.com/macros/s/AKfycbxl3g-8afxNG-q4UhOxVsffv-qO7Dum2koHWAKEbr98086bvPq-RwNQrEwGvzMZ5Jm7zQ/exec";

// =================================================================
// 🚀 START Drop Down & ปุ่มควบคุม (หน้าเลือกสาขา)
// =================================================================
async function loadBranchesIntoDropdown() {
  const select = document.getElementById("selectDestination");
  if (!select) return;

  try {
    // เอา URL ตรงๆ ไปแปะเทสต์เลยครับ
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxl3g-8afxNG-q4UhOxVsffv-qO7Dum2koHWAKEbr98086bvPq-RwNQrEwGvzMZ5Jm7zQ/exec";
    
    const response = await fetch(`${SCRIPT_URL}?action=get_branches`);
    const branches = await response.json();
    
    // ... (โค้ดส่วนที่เหลือ)


    const myBranch = String(localStorage.getItem("pattcha_branch") || "")
      .trim()
      .toUpperCase();

    select.innerHTML =
      '<option value="" disabled selected>-- SELECT BRANCH --</option>';

    // วนลูปแสดงผล
    branches.forEach((branch) => {
      const branchId = String(branch.id || "")
        .trim()
        .toUpperCase();

      // กรองแค่ "ไม่ใช่สาขาตัวเอง"
      if (branchId !== myBranch && branchId !== "") {
        const option = document.createElement("option");
        option.value = branch.id;
        option.textContent = `${branch.id} - ${branch.name}`; 
        select.appendChild(option);
      }
    });
  } catch (error) {
    console.error("Error loading branches:", error);
    select.innerHTML =
      '<option value="" disabled selected>-- โหลดล้มเหลว --</option>';
  }
}
// =================================================================
// 🚀 END กลุ่มที่ 1
// =================================================================





// =================================================================
// 🚀 กลุ่มที่ 2: ระบบปุ่มควบคุม (หน้าเลือกสาขา) & ฟังก์ชันสลับหน้าจอ
// =================================================================

  // ฟังก์ชันปุ่ม NEXT
  if (btnNext) {
    btnNext.addEventListener("click", () => {
      const select = document.getElementById("selectDestination");
      const branchID = select.value;
      const branchName = select.options[select.selectedIndex].text;

      if (!branchID) {
        alert("กรุณาเลือกสาขาที่ต้องการก่อนครับ!");
        return;
      }

      const existingLobby = document.querySelector(
        `.shipment-card[data-branch-id="${branchID}"]`
      );

      if (existingLobby) {
        alert("ห้อง Lobby ของสาขานี้ถูกเปิดไว้แล้ว ระบบจะพาคุณไปที่หน้าเดิมครับ");
      }

      sessionStorage.setItem("selectedBranchID", branchID);
      sessionStorage.setItem("selectedBranchName", branchName);

      showView("transferOutLobbyView");
      loadLobbyHeader();
    });
  }

  // ฟังก์ชันปุ่ม CANCEL
  if (btnCancel) {
    btnCancel.addEventListener("click", () => {
      const select = document.getElementById("selectDestination");
      if (select) select.selectedIndex = 0;
      showView("transferOutTaskHubView");
    });
  }

// ฟังก์ชันสลับหน้าจอ (Switch View)
function showView(viewId) {
  const allViews = document.querySelectorAll(".view-screen");
  allViews.forEach((view) => {
    view.classList.add("hide"); 
  });

  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.remove("hide");
  } else {
    console.error("ไม่พบหน้าจอ ID:", viewId);
  }
}

// ฟังก์ชันโหลดชื่อสาขาบนหัว Lobby
function loadLobbyHeader() {
  const branchID = sessionStorage.getItem("selectedBranchID");
  const branchName = sessionStorage.getItem("selectedBranchName");
  const headerElement = document.getElementById("lobbyBranchHeaderName"); 

  if (headerElement && branchID && branchName) {
    headerElement.textContent = `[${branchID}] - ${branchName}`;
  }
}
// =================================================================
// 🚀 END กลุ่มที่ 2
// =================================================================




// ======================================================
// กลุ่มที่ 3: ฟังก์ชันกลางสำหรับสร้าง Card Task (Universal Card Factory)
// ======================================================
function createUniversalCard(branchName, docNo, branchID, status = "pending") {
  // 1. ตั้งค่าสีตามสถานะ
  const colorMap = {
    pending: "#dc3545", // สีแดง
    done: "#28a745",    // สีเขียว
    issue: "#ffc107",   // สีเหลือง/ส้ม
  };

  const borderColor = colorMap[status] || "#ccc";

  // 2. สร้างโครงสร้าง Card
  const card = document.createElement("div");
  card.className = "task-list-item shipment-card";
  card.setAttribute("data-branch-id", branchID);

  card.style.cssText = `
        width: 100%; 
        border-left: 6px solid ${borderColor}; 
        border-bottom: 1px solid #e0e0e0; 
        padding: 15px 20px; 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        background: white;
        cursor: pointer;
    `;

  // 3. ใส่เนื้อหาข้างใน
  card.innerHTML = `
        <div style="text-align: left;">
            <div style="font-weight: bold; font-size: 14px; color: #333;">Doc No: ${docNo}</div>
            <span style="font-size: 12px; color: #777;">คลังสินค้ากลาง -> ${branchName}</span>
        </div>
        <i class="fas fa-chevron-right" style="color: #ccc; font-size: 14px;"></i>
    `;

  // 4. เพิ่มลูกเล่นให้คลิกได้
  card.addEventListener("click", () => {
    console.log(`Clicked on: ${docNo}`);
    sessionStorage.setItem("selectedBranchID", branchID);
    showView("transferOutLobbyView");
    loadLobbyHeader();
  });
  
  return card;
}
// ======================================================
// 🚀 END กลุ่มที่ 3
// ======================================================





// ======================================================
// กลุ่มที่ 4: ระบบหน้า Lobby และการบันทึกข้อมูล (API POST)
// ======================================================

function getNextRunningNumber() {
  let currentNum = parseInt(localStorage.getItem("shipment_running_counter") || "0");
  currentNum++;
  if (currentNum > 9999) currentNum = 1;
  localStorage.setItem("shipment_running_counter", currentNum.toString());
  return currentNum.toString().padStart(4, "0");
}

function formatShipmentNoHTML(shipmentNo) {
  return `<span style="font-weight: bold; font-size: 14px; color: #0044ff; font-family: sans-serif; letter-spacing: 0.5px;">${shipmentNo}</span>`;
}

// ======================================================
// 🚀 END กลุ่มที่ 4
// ======================================================



// ======================================================
// กลุ่มที่ 5: ระบบจัดการ Task Hub (สร้างการ์ด และดึงข้อมูล)
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

  card.addEventListener("click", () => {
    sessionStorage.setItem("jump_to_shipment", shipmentNo);
    if (typeof focusShipmentInLobby === "function") focusShipmentInLobby(shipmentNo);
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

    containers.forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ""; });

    let counts = { assign: 0, pending: 0, complete: 0 };
    tasks.forEach(task => {
      const statusKey = (task.Status || "").toLowerCase();
      const card = createTransferOutTaskCard(task.Date, task.Shipment_No, task.Origin_Type, task.Destination, task.Total_Box, task.Total_Item, task.Status);
      const target = document.getElementById(statusKey + "Container");
      if (target) { target.appendChild(card); counts[statusKey]++; }
    });

    Object.keys(counts).forEach(key => {
      const el = document.getElementById(key + "TaskCount");
      if (el) el.innerHTML = "Task (" + counts[key] + ") <i class=\"fas fa-chevron-down\"></i>";
    });
  } catch (error) { console.error("Error loading tasks:", error); }
}

// ======================================================
// 🚀 END กลุ่มที่ 5
// ======================================================



// ======================================================
// กลุ่มที่ 6: Utility & Global Initializers (ส่วนเชื่อมประสาน)
// ======================================================

// 1. ฟังก์ชันค้นหาและวาร์ป (ใช้ร่วมกันทั้งหน้า Lobby และ Task Hub)
function focusShipmentInLobby(shipmentNo) {
  const columns = document.querySelectorAll(".shipment-column");
  columns.forEach(col => {
    if (col.innerHTML.includes(shipmentNo)) {
      col.style.transition = "background 0.5s";
      col.style.background = "#fff3cd"; 
      col.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => { col.style.background = "#ffffff"; }, 2000);
    }
  });
}

// 2. ฟังก์ชันโหลด Dropdown ประเภทการโอน (ใช้ใน Modal)
function loadTransferTypesIntoDropdown() {
  const selectType = document.getElementById("selectTransferType");
  if (!selectType) return;
  selectType.innerHTML = '<option value="">กำลังโหลดประเภท...</option>';

  fetch(CONFIG.API_URL + "?action=get_types")
    .then((res) => res.json())
    .then((data) => {
      selectType.innerHTML = '<option value="">กรุณาเลือกประเภท...</option>';
      if (Array.isArray(data)) {
        data.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.Type_Key;
          option.textContent = `[${item.Type_Key}] ${item.Description}`;
          selectType.appendChild(option);
        });
      }
    })
    .catch((err) => console.error("Dropdown Load Error:", err));
}

  // เช็กว่ามีคำสั่งวาร์ปค้างอยู่ไหม
  const pendingJump = sessionStorage.getItem("jump_to_shipment");
  if (pendingJump) {
    setTimeout(() => {
      focusShipmentInLobby(pendingJump);
      sessionStorage.removeItem("jump_to_shipment");
    }, 500);
  }
// ======================================================
// 🚀 END กลุ่มที่ 6: ระบบพร้อมใช้งาน 100%
// ======================================================



// ======================================================
// MASTER INITIALIZER: ก้อนเดียวจบ รวมร่างครบ 1-6
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
  // 0. ประกาศตัวแปรทั้งหมดไว้ตรงนี้ (เจ้านายรู้จักลูกน้องก่อนสั่งงาน)
  const btnNext = document.getElementById("btnSubmitDest");
  const btnCancel = document.getElementById("btnBackFromDest");
  const btnConfirm = document.getElementById("btnConfirmBox");
  const btnTruck = document.getElementById("btnAddShipmentTruck");

  // 1. เรียกฟังก์ชันเริ่มต้น
  loadExistingTasks();
  loadBranchesIntoDropdown();
  loadTransferTypesIntoDropdown();

  // 2. ผูก Event ปุ่มหน้าเลือกสาขา
  if (btnNext) {
    btnNext.addEventListener("click", () => {
      const select = document.getElementById("selectDestination");
      const branchID = select.value;
      const branchName = select.options[select.selectedIndex].text;
      if (!branchID) return alert("กรุณาเลือกสาขาที่ต้องการก่อนครับ!");
      sessionStorage.setItem("selectedBranchID", branchID);
      sessionStorage.setItem("selectedBranchName", branchName);
      showView("transferOutLobbyView");
      loadLobbyHeader();
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener("click", () => {
      const select = document.getElementById("selectDestination");
      if (select) select.selectedIndex = 0;
      showView("transferOutTaskHubView");
    });
  }

  // 3. ผูก Event ปุ่มหน้า Lobby
  if (btnConfirm) {
    btnConfirm.addEventListener("click", () => {
      // โค้ดบันทึกงานเดิมของเจเลอร์ (เอามาใส่ตรงนี้ได้เลยครับ)
      alert("กำลังบันทึก...");
    });
  }

  // 4. เช็กคำสั่งวาร์ปค้าง
  const pendingJump = sessionStorage.getItem("jump_to_shipment");
  if (pendingJump) {
    setTimeout(() => {
      focusShipmentInLobby(pendingJump);
      sessionStorage.removeItem("jump_to_shipment");
    }, 500);
  }
});

// ======================================================
// MASTER INITIALIZER: ก้อนเดียวจบ รวมร่างครบ 1-6
// ======================================================


