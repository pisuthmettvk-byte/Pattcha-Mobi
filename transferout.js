const webAppUrl = "https://script.google.com/macros/s/AKfycbxl3g-8afxNG-q4UhOxVsffv-qO7Dum2koHWAKEbr98086bvPq-RwNQrEwGvzMZ5Jm7zQ/exec";

// =================================================================
// 🚀 START Drop Down & ปุ่มควบคุม (หน้าเลือกสาขา)
// =================================================================

async function loadBranchesIntoDropdown() {
  const select = document.getElementById("selectDestination");
  if (!select) return;
  
  select.innerHTML = '<option value="" disabled selected>-- กำลังโหลดสาขา... --</option>';

  try {
    // 🔴 เรียก API ด้วย action=get_branches
    const response = await fetch(CONFIG.API_URL + "?action=get_branches");
    
    // อ่านค่าที่ตอบกลับมาก่อนเพื่อเช็กว่าใช่ JSON จริงไหม
    const rawText = await response.text();
    let branches;
    
    try {
        branches = JSON.parse(rawText); // พยายามแปลงเป็น JSON
    } catch (e) {
        console.error("🚨 API ดรอปดาวน์สาขาพัง! (ไม่ใช่ JSON):", rawText);
        select.innerHTML = '<option value="" disabled selected>-- โหลดล้มเหลว --</option>';
        return; // หยุดทำงานทันที
    }

    // ดึงรหัสสาขาตัวเองเพื่อเอามากรองออก (ไม่ให้โอนหาตัวเอง)
    const myBranch = String(localStorage.getItem("pattcha_branch") || "").trim().toUpperCase();
    
    select.innerHTML = '<option value="" disabled selected>-- SELECT BRANCH --</option>';

    if (Array.isArray(branches)) {
      branches.forEach((branch) => {
        // รองรับ Key จาก API หลายรูปแบบ (เผื่อตัวพิมพ์เล็ก/ใหญ่)
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





// =================================================================
// 🚀 กลุ่มที่ 2: ระบบปุ่มควบคุม (หน้าเลือกสาขา) & ฟังก์ชันสลับหน้าจอ
// =================================================================
// ======================================================
// 📦 ฟังก์ชันสร้างคอลัมน์ Shipment (สไตล์สีเงิน จากหน้า Task Hub)
// ======================================================
function createShipmentColumn(shipmentNo, originType = "Store") {
  // 1. สร้างกรอบใหญ่สีเงิน (Silver Container)
  const col = document.createElement("div");
  col.className = "shipment-column";
  col.setAttribute("data-shipment", shipmentNo);

  col.style.cssText = `
    background: #f4f6f8; /* สีพื้นหลังโทนเงิน/เทาอ่อน แบบ Task Hub */
    border: 1px solid #dcdfe6;
    border-radius: 8px;
    width: 100%;
    max-width: 500px;
    margin-bottom: 20px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `;

  // 2. โครงสร้าง HTML (มี Checkbox, ทรงเหมือนหน้า Task Hub)
  col.innerHTML = `
    <div style="background: #e9ecef; padding: 12px 15px; border-bottom: 1px solid #dcdfe6; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <input type="checkbox" class="shipment-checkbox" style="width: 20px; height: 20px; cursor: pointer; accent-color: #0044ff;">
        <div>
          <div style="font-weight: 900; font-size: 15px; color: #333; font-family: monospace;">${shipmentNo}</div>
          <div style="font-size: 12px; color: #666;"><i class="fas fa-store"></i> Origin: ${originType}</div>
        </div>
      </div>
      <span style="background: #fff; border: 1px solid #ccc; color: #555; font-size: 11px; padding: 4px 10px; border-radius: 12px; font-weight: bold;">Assign</span>
    </div>

    <div style="background: #fff; padding: 10px 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; color: #555;">
      <span><i class="fas fa-box" style="color: #8d6e63;"></i> TOTAL BOX: <span class="box-count">0</span></span>
      <span><i class="fas fa-tshirt" style="color: #0044ff;"></i> TOTAL ITEM: <span class="item-count">0</span></span>
    </div>

    <div class="shipment-body" style="padding: 15px; min-height: 120px; background: #fdfdfd; display: flex; flex-direction: column; gap: 10px;">
      <div class="empty-state" style="text-align: center; color: #bbb; padding: 15px 0; font-size: 13px;">
        <i class="fas fa-box-open" style="font-size: 28px; margin-bottom: 8px;"></i><br>
        ยังไม่มีข้อมูลแพ็คกิ้ง<br>เริ่มสแกนเพื่อบรรจุลงกล่อง
      </div>
    </div>

    <div style="background: #e9ecef; padding: 12px 15px; border-top: 1px solid #dcdfe6; display: flex; gap: 10px;">
      <button class="btn-delete" style="background: #fff; border: 1px solid #ff4d4f; color: #ff4d4f; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s;">
        <i class="fas fa-trash-alt"></i>
      </button>
      <button class="btn-scan" style="flex-grow: 1; background: #0044ff; border: none; color: white; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: bold; display: flex; justify-content: center; align-items: center; gap: 5px; font-size: 14px; box-shadow: 0 4px 6px rgba(0,68,255,0.2);">
        <i class="fas fa-barcode"></i> สแกน / เพิ่มกล่อง
      </button>
    </div>
  `;

  // 3. ผูก Event ให้ปุ่มต่างๆ
  
  // ลอจิกปุ่มลบ (ลบทิ้ง พร้อมเช็กว่าถ้าไม่มีงานเหลือ ให้โชว์รูปรถบรรทุกโล่งๆ)
  const btnDelete = col.querySelector(".btn-delete");
  btnDelete.addEventListener("click", () => {
    if (confirm(`ต้องการลบ Shipment: ${shipmentNo} ใช่หรือไม่?`)) {
      col.remove();
      
      const container = document.getElementById("lobbyContentContainer");
      const emptyState = document.getElementById("lobbyEmptyState");
      // ถ้าคอลัมน์ใน Lobby หายไปหมดแล้ว ให้แสดง Empty State (หน้าโล่งๆ) กลับมา
      if (container && container.querySelectorAll(".shipment-column").length === 0) {
         if (emptyState) emptyState.style.display = "block";
      }
    }
  });

  // ลอจิกปุ่มสแกน
  const btnScan = col.querySelector(".btn-scan");
  btnScan.addEventListener("click", () => {
     if (typeof safeAlert === "function") {
         safeAlert("เตรียมแพ็คของ", `พร้อมสแกนสินค้าลง Shipment: ${shipmentNo}`, "info");
     } else {
         alert(`พร้อมสแกนสินค้าลง Shipment: ${shipmentNo}`);
     }
  });

  return col;
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

      const selectedBranchID =
        sessionStorage.getItem("selectedBranchID") || "KKN02";
      const targetDestination = `02${selectedBranchID.substring(0, 2).toUpperCase()}`;
      const finalShipmentNo = `${selectType.value}-${new Date().toLocaleDateString("en-GB").replace(/\//g, "")}-01CK-${getNextRunningNumber()}-${targetDestination}`;

      const payload = {
        Date: new Date().toLocaleDateString("en-GB"),
        Shipment_No: finalShipmentNo,
        Origin_Branch: "CK",
        Destination: targetDestination,
        Origin_Type: "Store",
        Status: "Assign",
      };

      btnConfirm.disabled = true;
      btnConfirm.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';
      btnConfirm.style.opacity = "0.7";

      fetch(CONFIG.API_URL + "?action=save_new_task", {
        method: "POST",
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.status === "success" && container) {
            if (typeof createShipmentColumn === "function") {
              container.appendChild(
                createShipmentColumn(finalShipmentNo, "Store"),
              );
            }
            if (shipmentBoxModal) shipmentBoxModal.classList.add("hide");
            if (emptyState) emptyState.style.display = "none";
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

