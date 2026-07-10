const webAppUrl = "https://script.google.com/macros/s/AKfycbxl3g-8afxNG-q4UhOxVsffv-qO7Dum2koHWAKEbr98086bvPq-RwNQrEwGvzMZ5Jm7zQ/exec";

// ==========================================
// ⚙️ ตัวแปรตั้งค่าสถานะ (เปลี่ยนคำตรงนี้ จุดเดียวจบ!)
// ==========================================
const STATUS_CONFIG = {
    NEW: "Assign",       // งานใหม่ที่เพิ่งสร้าง
    PENDING: "Pending",  // งานที่ส่งออกแล้ว
    COMPLETE: "Complete" // งานที่รับเสร็จสมบูรณ์
};

// =================================================================
// 🚀 START Drop Down & ปุ่มควบคุม (หน้าเลือกสาขา)
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

    // 🟢 เก็บแคชข้อมูลสาขาทั้งหมดไว้ใช้แปลงรหัสใน Task Card
    if (Array.isArray(branches)) {
      window.appBranches = branches;
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
// =================================================================
// 🚀 END กลุ่มที่ 1
// =================================================================






// ======================================================
// 📦 ฟังก์ชันสร้างคอลัมน์ Shipment (Responsive: ปัดบรรทัดเมื่อจอแคบ)
// ======================================================


//===============
// [Create Shipment Column UI - Single Source of Truth] START
function createShipmentColumn(shipmentNo, originType = "Store") {
  const col = document.createElement("div");
  col.className = "shipment-column";
  col.setAttribute("data-shipment", shipmentNo);

  const dateParts = shipmentNo.split("-")[1]; 
  const displayDate = dateParts && dateParts.length === 8 
        ? `${dateParts.substring(0,2)}/${dateParts.substring(2,4)}/${dateParts.substring(6,8)}` 
        : new Date().toLocaleDateString("en-GB").substring(0, 8);

  col.style.cssText = `
    background: linear-gradient(to bottom, #d4d4d4 0%, #ffffff 50%, #a09f9f 100%);
    border-top: 1px solid #fff;
    border-bottom: 1px solid #bbb;
    border-left: 1px solid #ccc;
    border-right: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    width: 100%;
    margin-bottom: 15px;
    padding: 10px 20px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap; 
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    box-sizing: border-box;
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

  const btnDelete = col.querySelector(".btn-delete");
  btnDelete.addEventListener("click", () => {
    if (confirm(`ต้องการลบ Shipment: ${shipmentNo} ใช่หรือไม่?`)) {
      col.remove();
      const container = document.getElementById("lobbyContentContainer");
      const emptyState = document.getElementById("lobbyEmptyState");
      if (container && container.querySelectorAll(".shipment-column").length === 0) {
         if (emptyState) emptyState.style.display = "block";
      }
    }
  });

  const btnScan = col.querySelector(".btn-scan");
  btnScan.addEventListener("click", () => {
    sessionStorage.setItem("activeShipmentNo", shipmentNo);
    if (typeof showView === "function") {
      showView("boxDetailsView");
    }
  });

  return col;
}
// [Create Shipment Column UI] END
//===============








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

//===============
// [Render Lobby Tasks] START
async function renderLobbyTasks(branchID) {
  const container = document.getElementById("lobbyContentContainer");
  const emptyState = document.getElementById("lobbyEmptyState");
  
  if (!container) return;
  container.innerHTML = '<div style="text-align:center; padding: 40px 20px; color:#666;"><h4>กำลังดึงข้อมูลงาน...</h4><i class="fas fa-spinner fa-spin" style="font-size: 24px;"></i></div>';

  try {
    const response = await fetch(CONFIG.API_URL + "?action=get_tasks");
    const tasks = await response.json();
    container.innerHTML = ""; 

    if (!Array.isArray(tasks)) {
       if (emptyState) emptyState.style.display = "block";
       return;
    }

    const myBranch = String(localStorage.getItem("pattcha_branch") || "").trim().toUpperCase();

    const branchTasks = tasks.filter(task => {
      const isMatchBranch = task.Destination === branchID;
      const isAssignStatus = (task.Status || "").toLowerCase() === "assign";
      const isMyOrigin = String(task.Origin_Branch || "").trim().toUpperCase() === myBranch;
      
      return isMatchBranch && isAssignStatus && isMyOrigin;
    });

    if (branchTasks.length > 0) {
      if (emptyState) emptyState.style.display = "none";
      branchTasks.forEach(task => {
        if (typeof createShipmentColumn === "function") {
          // 🟢 โยนข้อมูลให้แม่พิมพ์หลักทำงาน (รับประกันหน้าตาเหมือนกัน 100%)
          const col = createShipmentColumn(task.Shipment_No, task.Origin_Type || "Store");
          container.appendChild(col);
        }
      });
    } else {
      if (emptyState) emptyState.style.display = "block";
    }
  } catch (error) {
    console.error("🚨 Error loading lobby tasks:", error);
    container.innerHTML = '<div style="text-align:center; color:#dc3545; padding: 20px;">เกิดข้อผิดพลาดในการดึงข้อมูล</div>';
  }
}
// [Render Lobby Tasks] END
//===============



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

function getRealBranchCode(destCode) {
  if (!destCode) return "-";
  if (window.appBranches && Array.isArray(window.appBranches)) {
    const matched = window.appBranches.find((b) => {
      const bId = String(b.id || b.Branch_ID || b.BranchID || "").trim().toUpperCase();
      const prefix = bId.substring(0, 2);
      return String(destCode).includes(prefix);
    });
    if (matched) {
      return String(matched.id || matched.Branch_ID || matched.BranchID || "").trim().toUpperCase();
    }
  }
  return destCode;
}

function createTransferOutTaskCard(date, shipmentNo, originType, destBranch, totalBox, totalItem, status) {
  const colorMap = { assign: "#dc3545", pending: "#e0a800", complete: "#28a745" };
  const statusKey = (status || "").toLowerCase();
  const leftBorderColor = colorMap[statusKey] || "#ccc";
  
  // 🟢 แปลงรหัสปลายทางให้แสดงเป็นรหัสสาขาจริง
  const displayDestBranch = typeof getRealBranchCode === "function" ? getRealBranchCode(destBranch) : destBranch;

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
        <span style="font-size: 14px; color: #333; font-weight: bold;"><i class="fas fa-truck" style="color: #dc3545;"></i> ${displayDestBranch}</span>
        <span style="font-size: 13px; color: #555; font-weight: bold;"><i class="fas fa-box" style="color: #8d6e63;"></i> (${totalBox || 0}) TOTAL (${totalItem || 0})</span>
        <span style="background: ${leftBorderColor}; color: #fff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${status || "Assign"}</span>
      </div>
    </div>
  `;

  card.addEventListener("click", async () => {
    console.log(`🎯 กดคลิกการ์ด: ${shipmentNo} (สาขา: ${destBranch})`);
    
    // 1. บันทึกข้อมูลลงหน่วยความจำ
    sessionStorage.setItem("jump_to_shipment", shipmentNo);
    sessionStorage.setItem("selectedBranchID", destBranch);

    if (!sessionStorage.getItem("selectedBranchName")) {
      sessionStorage.setItem("selectedBranchName", "");
    }

    try {
      // 2. 🟢 สลับไปหน้า Lobby อย่างปลอดภัย (เช็กฟังก์ชันก่อนเรียกใช้งาน ป้องกันหน้าจอขาว)
      if (typeof showView === "function") {
        showView("transferOutLobbyView");
      } else {
        document.querySelectorAll('.view-screen').forEach(el => el.classList.add('hide'));
        document.getElementById('transferOutLobbyView').classList.remove('hide');
      }
      
      // 3. โหลด Header หัวมุม Lobby
      if (typeof loadLobbyHeader === "function") {
        loadLobbyHeader();
      }
      
      // 4. วาดแถบ Shipment Columns ของสาขานั้น
      if (typeof renderLobbyTasks === "function") {
        await renderLobbyTasks(destBranch);
      }
      
      // 5. ไฮไลต์งานให้เห็นชัดเจนเมื่อวาดเสร็จ
      setTimeout(() => {
        if (typeof focusShipmentInLobby === "function") {
          focusShipmentInLobby(shipmentNo);
        }
      }, 500);

    } catch (error) {
      console.error("🚨 ระบบขัดข้องระหว่างพาวาร์ปเข้า Lobby:", error);
    }
  });

  return card; 
}



// 🟢 ฟังก์ชันโหลดข้อมูลงานเข้าหน้า Transfer Out Task Hub พร้อมตัวกรองตรรกะ
//===============
// [Load Tasks & Filter by Origin] START
async function loadExistingTasks() {
  const containers = ["assignContainer", "pendingContainer", "completeContainer"];
  const assignContainer = document.getElementById("assignContainer");
  if (!assignContainer) return; 

  try {
    const response = await fetch(CONFIG.API_URL + "?action=get_tasks");
    const tasks = await response.json();
    if (!Array.isArray(tasks)) return;

    containers.forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ""; });

    // 📍 ดึงรหัสสาขาของตัวเองที่ล็อกอินอยู่
    const myBranch = String(localStorage.getItem("pattcha_branch") || "").trim().toUpperCase();
    let counts = { assign: 0, pending: 0, complete: 0 };

    tasks.forEach(task => {
      // 📍 ดึงรหัสสาขาต้นทาง (Origin) จากฐานข้อมูล
      const originBranch = String(task.Origin_Branch || "").trim().toUpperCase();
      
      // 🟢 เงื่อนไขที่ 1: แสดงเฉพาะงานที่ "สาขาต้นทาง (Origin)" ตรงกับสาขาของตัวเองเท่านั้น!
      if (originBranch === myBranch) {
        const statusKey = (task.Status || "").toLowerCase();
        
        if (typeof createTransferOutTaskCard === "function") {
          const card = createTransferOutTaskCard(
            task.Date, 
            task.Shipment_No, 
            task.Origin_Type, 
            task.Destination, 
            task.Total_Box, 
            task.Total_Item, 
            task.Status
          );
          
          const target = document.getElementById(statusKey + "Container");
          if (target) { 
            target.appendChild(card); 
            counts[statusKey]++; 
          }
        }
      }
    });

    // 🟢 อัปเดตตัวเลขจำนวนงานตอนโหลดหน้า
    Object.keys(counts).forEach(key => {
      const el = document.getElementById(key + "TaskCount");
      if (el) el.innerHTML = `Task (${counts[key]}) <i class="fas fa-chevron-down"></i>`;
    });
  } catch (error) { 
    console.error("Error loading tasks:", error); 
  }
}
// [Load Tasks & Filter by Origin] END
//===============

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

  // ✅ เปลี่ยนให้ตรงกับหลังบ้าน 100% แล้วครับ
  fetch(CONFIG.API_URL + "?action=get_transfer_types")
    .then((res) => res.json())
    .then((data) => {
      selectType.innerHTML = '<option value="">กรุณาเลือกประเภท...</option>';
      if (Array.isArray(data)) {
        data.forEach((item) => {
          const option = document.createElement("option");
          
          // ดึงค่าตาม Key ที่ API ส่งมา (เผื่อตัวพิมพ์เล็ก/ใหญ่)
          const key = item.Type_Key || item.type_key || item.id || item.Key || "";
          const desc = item.Description || item.description || item.name || item.Desc || "";
          
          option.value = key;
          option.textContent = `[${key}] ${desc}`;
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
// MASTER INITIALIZER: รวมร่างปุ่ม Navigation และ API ในที่เดียว
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  // 1. ประกาศตัวแปรหน้าจอ (View Containers)
  const productMovementView = document.getElementById("productMovementView");
  const viewTaskHub = document.getElementById("transferOutTaskHubView");
  const viewDest = document.getElementById("transferOutDestView");
  const viewLobby = document.getElementById("transferOutLobbyView");

  // 2. โหลดข้อมูลเริ่มต้น (กลุ่ม 1, 5, 6)
  loadExistingTasks();
  loadBranchesIntoDropdown();
  loadTransferTypesIntoDropdown();

  // ==========================================
  // 3. ผูก Event ปุ่ม นำทาง (Navigation) ของ Transfer Out
  // ==========================================

  // เข้า-ออก ระบบ Transfer Out
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

  // ปุ่ม + สร้างงานใหม่ (ไปหน้าเลือกสาขา)
  const btnCreateNewTask =
    document.getElementById("btnCreateNewTask") ||
    document.getElementById("btnNewTask");
  if (btnCreateNewTask) {
    btnCreateNewTask.addEventListener("click", () => {
      const selectDest = document.getElementById("selectDestination");
      if (selectDest) selectDest.selectedIndex = 0; // เคลียร์ค่าเดิม
      navigationTo(viewTaskHub, viewDest);
    });
  }

  // ปุ่ม Cancel กลับจากหน้าเลือกสาขา และ หน้า Lobby
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

  // ==========================================
  // 4. ลอจิกปุ่ม Next (เลือกสาขา -> ไป Lobby)
  // ==========================================
  const btnSubmitDest =
    document.getElementById("btnSubmitDest") ||
    document.getElementById("btnNextDest");
  if (btnSubmitDest) {
    btnSubmitDest.addEventListener("click", () => {
      const destDropdown = document.getElementById("selectDestination");

      // เช็กการเลือกข้อมูล
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
      const branchName = destDropdown.options[destDropdown.selectedIndex].text;

      // เช็ก Lobby เดิมที่อาจเปิดค้างไว้
      const existingLobby = document.querySelector(
        `.shipment-card[data-branch-id="${branchID}"]`,
      );
      if (existingLobby) {
        if (typeof safeAlert === "function")
          safeAlert(
            "แจ้งเตือน",
            "ห้อง Lobby ของสาขานี้ถูกเปิดไว้แล้ว ระบบจะพาคุณไปที่หน้าเดิมครับ",
            "warning",
          );
        else alert("ห้อง Lobby ของสาขานี้ถูกเปิดไว้แล้ว");
      }

      // บันทึก SessionStorage
      sessionStorage.setItem("selectedBranchID", branchID);
      sessionStorage.setItem("selectedBranchName", branchName);

      // เปลี่ยนชื่อหัว Lobby
      const lobbyHeader = document.getElementById("lobbyBranchHeaderName");
      if (lobbyHeader) lobbyHeader.innerText = branchName;

      // วาร์ปไปหน้า Lobby
      navigationTo(viewDest, viewLobby);
    });
  }

  // ==========================================
  // 🚀5 ร่างทอง: ระบบหน้าต่าง Modal สร้างงาน (รถบรรทุก + ยืนยัน)
  // ==========================================
const btnAddShipmentTruck = document.getElementById("btnAddShipmentTruck");
  const shipmentBoxModal = document.getElementById("shipmentBoxModal");
  const selectType = document.getElementById("selectTransferType");
  const inputBoxNumber = document.getElementById("inputBoxNumber");
  const btnConfirm = document.getElementById("btnConfirmBox");
  const container = document.getElementById("lobbyContentContainer");
  const emptyState = document.getElementById("lobbyEmptyState");

  // 🎯 1. ดักจับการเปิดหน้าต่าง (Fresh Start)
  if (btnAddShipmentTruck && shipmentBoxModal) {
    btnAddShipmentTruck.addEventListener("click", () => {
      if (selectType) selectType.selectedIndex = 0;
      if (inputBoxNumber) inputBoxNumber.value = "กรุณาเลือกประเภท...";
      shipmentBoxModal.classList.remove("hide");
    });
  }

  // 🎯 2. ดักจับตอนเลือก Dropdown (Auto-Preview)
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

  // 🎯 3 & 4. ดักจับตอนกดยืนยัน (Validation & Loading)
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

      // 🟢 ดึงรหัสสาขาปัจจุบันมาเป็นต้นทาง (Origin)
      const myBranch = String(localStorage.getItem("pattcha_branch") || "CK").trim().toUpperCase();
      const selectedBranchID = sessionStorage.getItem("selectedBranchID") || "KKN02";
      const targetDestination = `02${selectedBranchID.substring(0, 2).toUpperCase()}`;
      const dateStr = new Date().toLocaleDateString("en-GB");
      const finalShipmentNo = `${selectType.value}-${dateStr.replace(/\//g, "")}-01CK-${getNextRunningNumber()}-${targetDestination}`;

      const payload = {
        Date: dateStr,
        Shipment_No: finalShipmentNo,
        Origin_Branch: myBranch, // 🟢 ปรับให้บันทึกต้นทางเป็นสาขาตนเอง
        Destination: targetDestination,
        Origin_Type: "Store",
        Status: "Assign", // หรือ STATUS_CONFIG.NEW
      };

      btnConfirm.disabled = true;
      btnConfirm.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';
      btnConfirm.style.opacity = "0.7";


      fetch(CONFIG.API_URL + "?action=save_new_task", { method: "POST", body: JSON.stringify(payload) })
        .then(res => res.json())
        .then(res => {
          if (res.status === "success") {
            // 1. สร้างคอลัมน์ลงในหน้า Lobby
            if (container) container.appendChild(createShipmentColumn(finalShipmentNo, "Store"));
            if (shipmentBoxModal) shipmentBoxModal.classList.add("hide");
            if (emptyState) emptyState.style.display = "none";

            // 2. 🟢 สร้าง Task Card ส่งกลับไปหน้า Task Hub แบบ Real-time
            const taskHubAssignContainer = document.getElementById("assignContainer"); // 🟢 แก้ไข ID ให้ตรงกับหน้า HTML จริง
            if (taskHubAssignContainer && typeof createTransferOutTaskCard === "function") {
               
               // 🟢 ปรับการส่งข้อมูลให้เป็นพารามิเตอร์เรียงตัว ตามที่ฟังก์ชัน createTransferOutTaskCard ต้องการ
               const newCard = createTransferOutTaskCard(
                 dateStr, 
                 finalShipmentNo, 
                 "Store", 
                 selectedBranchID, 
                 0, 
                 0, 
                 "Assign" 
               );
               
               taskHubAssignContainer.appendChild(newCard);
               console.log(`✅ สร้าง Task Card (Assign) สำเร็จ!`);

               // 🟢 3. อัปเดตตัวเลข (Count) ทันทีโดยไม่ต้องรีเฟรชหน้า
               const assignCountEl = document.getElementById("assignTaskCount");
               if (assignCountEl) {
                 const currentCount = taskHubAssignContainer.querySelectorAll('.task-card').length;
                 assignCountEl.innerHTML = `Task (${currentCount}) <i class="fas fa-chevron-down"></i>`;
               }
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

      
      
      
      
      
      

  // ==========================================
  // 6. ระบบวาร์ปหน้าจอ (เมื่อกดมาจากการ์ด Task Hub)
  // ==========================================
  const pendingJump = sessionStorage.getItem("jump_to_shipment");
  if (pendingJump) {
    setTimeout(() => {
      focusShipmentInLobby(pendingJump);
      sessionStorage.removeItem("jump_to_shipment");
    }, 500);
  }
});

// ======================================================
// MASTER INITIALIZER: รวมร่างปุ่ม Navigation และ API ในที่เดียว
// ======================================================
