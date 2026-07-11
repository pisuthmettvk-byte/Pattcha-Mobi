const webAppUrl = "https://script.google.com/macros/s/AKfycbxl3g-8afxNG-q4UhOxVsffv-qO7Dum2koHWAKEbr98086bvPq-RwNQrEwGvzMZ5Jm7zQ/exec";

// ==========================================
// ⚙️ ตัวแปรตั้งค่าสถานะ (เปลี่ยนคำตรงนี้ จุดเดียวจบ!)
// ==========================================
const STATUS_CONFIG = {
    NEW: "Assign",       // งานใหม่ที่เพิ่งสร้าง
    PENDING: "Pending",  // งานที่ส่งออกแล้ว
    COMPLETE: "Complete" // งานที่รับเสร็จสมบูรณ์
};


// ======================================================
// 🛡️ [Phase 3] ระบบแช่แข็งล็อกเป้าหมาย (Isolated Freeze Interceptor)
// ======================================================
window.isGlobalDeleteMode = false; 
window.activeDeleteShipment = null; 

document.addEventListener("click", (e) => {
  if (window.isGlobalDeleteMode) {
    // 1. อนุญาตให้กดปุ่มถังขยะใน "ชิปเมนต์ที่กำลังเปิดโหมดลบอยู่" เท่านั้น
    const isToggleActiveParent = e.target.closest(`.shipment-column[data-shipment="${window.activeDeleteShipment}"] .btn-master-delete`);
    const isDeleteActiveParent = e.target.closest(`.shipment-column[data-shipment="${window.activeDeleteShipment}"] .parent-btn-delete`);
    const isDeleteActiveChild  = e.target.closest(`.shipment-column[data-shipment="${window.activeDeleteShipment}"] .child-btn-delete`);
    
    if (isToggleActiveParent || isDeleteActiveParent || isDeleteActiveChild) {
      return; 
    }

    // 2. อนุญาตให้กดปุ่มบนหน้าต่าง Popup
    if (e.target.closest('.swal-overlay') || e.target.closest('.swal-modal') || e.target.closest('.sweet-alert')) {
      return;
    }

    // 3. บล็อกทุกอย่างที่เหลือในแอป 
    const isInsideApp = e.target.closest('#transferOutLobbyView') || e.target.closest('.app-header') || e.target.closest('.main-content');
    if (isInsideApp) {
      e.preventDefault();
      e.stopPropagation();
      
      if (typeof safeAlert === "function") {
        safeAlert("ระงับการใช้งานชั่วคราว!", "คุณกำลังเปิดโหมดลบข้อมูลของชิปเมนต์อื่นอยู่ กรุณาจัดการให้เสร็จ หรือกดปุ่มรูปถังขยะเพื่อปิดโหมดลบที่คันนั้นก่อนครับ", "error");
      } else {
        alert("ระงับการใช้งานชั่วคราว!\nกรุณาปิดโหมดลบของชิปเมนต์ที่กำลังทำงานอยู่ก่อนครับ");
      }
    }
  }
}, true);
// ======================================================
// 🛡️ [Phase 3] ระบบแช่แข็งการสัมผัสทั้งหน้าจอ (Super Freeze Interceptor)
// ======================================================






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
// 📦 ฟังก์ชันสร้างกล่องลูก (Shipment List Child) - [Phase 3 Final]
// ======================================================
function createShipmentChildBox(baseBoxNo, boxRunningIndex) {
  const childBoxNo = `${baseBoxNo}-${String(boxRunningIndex).padStart(4, '0')}`;
  const childDiv = document.createElement("div");
  childDiv.className = "shipment-child-box";
  childDiv.dataset.boxNo = childBoxNo;
  childDiv.dataset.status = "open"; 

  // 🟢 ปรับดีไซน์เป็น Task Card (พื้นขาว, ไม่มีขอบมน, มีแถบสีซ้ายมือ)
  childDiv.style.cssText = `
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
    background: #ffffff; border: 1px solid #e0e0e0; border-left: 6px solid #28a745;
    padding: 16px 15px; width: 100%; box-sizing: border-box; cursor: pointer; transition: all 0.2s;
  `;

  childDiv.innerHTML = `
    <div style="display: flex; align-items: center; gap: 15px; flex: 1; min-width: 200px;">
      <input type="checkbox" class="child-checkbox" disabled title="ต้องปิดกล่องก่อนถึงจะเลือกได้" 
             style="width: 18px; height: 18px; border-radius: 4px; cursor: not-allowed;" onclick="event.stopPropagation();">
      <i class="fas fa-box-open box-status-icon" style="color: #28a745; font-size: 18px;"></i>
      <span style="font-weight: bold; font-size: 14px; color: #333; letter-spacing: 0.5px;">${childBoxNo}</span>
    </div>
    
    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 18px; font-size: 13px; font-weight: bold; color: #555;">
      <span title="จำนวนที่สแกนบาร์โค้ด"><i class="fas fa-barcode" style="color: #666;"></i> (<span class="child-scan-qty">0</span>)</span>
      <span title="จำนวนที่นับด้วยมือ"><i class="fas fa-hand-paper" style="color: #8d6e63;"></i> (<span class="child-manual-qty">0</span>)</span>
      <i class="fas fa-trash-alt child-btn-delete hide" style="color: #dc3545; font-size: 18px; cursor: pointer; padding-left: 5px;" onclick="event.stopPropagation();"></i>
    </div>
  `;

  childDiv.addEventListener("click", () => {
    sessionStorage.setItem("activeBoxNo", childBoxNo);
    sessionStorage.setItem("activeBoxStatus", childDiv.dataset.status);
    if (typeof showView === "function") showView("boxDetailsView");
  });

  const btnDeleteChild = childDiv.querySelector(".child-btn-delete");
  btnDeleteChild.addEventListener("click", (e) => {
    e.stopPropagation(); 
    if (confirm(`ต้องการลบกล่อง ${childBoxNo} ทิ้งใช่หรือไม่? ข้อมูลสินค้าในกล่องนี้จะหายไปทั้งหมด`)) {
      const parentCol = childDiv.closest(".shipment-column"); 
      childDiv.remove(); 
      
      // 🟢 อัปเดตยอด 🚚 ด้วยการนับของจริงบนหน้าจอ
      if (parentCol) {
        const truckCountEl = parentCol.querySelector(".master-truck-count");
        const remainingBoxes = parentCol.querySelectorAll(".shipment-child-box").length;
        if (truckCountEl) truckCountEl.textContent = remainingBoxes;
      }
    }
  });

  return childDiv;
}
// ======================================================
// 📦 ฟังก์ชันสร้างกล่องลูก (Shipment List Child) - [Phase 3 Final]
// ======================================================





// ======================================================
// 📦 ฟังก์ชันสร้างคอลัมน์ Shipment แม่ (Master Column) - [Phase 3 Final]
// ======================================================
function createShipmentColumn(shipmentNo, originType = "Store") {
  const col = document.createElement("div");
  col.className = "shipment-column";
  
  const safeShipmentNo = shipmentNo || "UNKNOWN-00000000-00XX-0000-00XX";
  col.setAttribute("data-shipment", safeShipmentNo);

  const parts = safeShipmentNo.split("-");
  const dateParts = parts.length > 1 ? parts[1] : ""; 
  const displayDate = dateParts && dateParts.length === 8 
        ? `${dateParts.substring(0,2)}/${dateParts.substring(2,4)}/${dateParts.substring(6,8)}` 
        : new Date().toLocaleDateString("en-GB").substring(0, 8);

  const baseBoxNo = parts.length >= 5 ? parts.slice(2).join("-") : safeShipmentNo;

  // เปลือกนอกไม่มีลูกระนาด จัดระยะห่างแม่-ลูก
  col.style.cssText = `width: 100%; margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px;`;

  col.innerHTML = `
    <!-- 🟢 Header แม่ (พื้นหลังลูกระนาด) -->
    <div class="shipment-column-header" style="
      background: linear-gradient(to bottom, #d4d4d4 0%, #ffffff 50%, #a09f9f 100%);
      border: 1px solid #ccc; border-top: 1px solid #fff; border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05); width: 100%; padding: 12px 20px; 
      display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 15px; box-sizing: border-box; transition: all 0.3s ease;
    ">
      <div style="display: flex; align-items: center; gap: 15px; flex-shrink: 0;">
        <input type="checkbox" class="master-checkbox" style="width: 18px; height: 18px; border-radius: 4px; cursor: pointer;">
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
        <!-- 🟢 ปุ่มถังขยะของจริง สำหรับลบแม่ (ซ่อนไว้ก่อน) -->
        <i class="fas fa-trash-alt parent-btn-delete hide" style="color: #dc3545; font-size: 20px; cursor: pointer; filter: drop-shadow(1px 1px 1px #fff);" title="ลบชิปเมนต์นี้"></i>
        
        <i class="fas fa-box-open btn-add-child-box" style="color: #2e8b57; font-size: 20px; cursor: pointer; filter: drop-shadow(1px 1px 1px #fff);" title="สร้างกล่องใหม่"></i>
        <i class="fas fa-trash-alt btn-master-delete" style="color: #c9302c; font-size: 20px; cursor: pointer; filter: drop-shadow(1px 1px 1px #fff); transition: all 0.2s;" title="สวิตช์ เปิด/ปิด โหมดลบ"></i>
        <span style="background: #d93844; color: white; padding: 6px 18px; border-radius: 15px; font-size: 13px; font-weight: bold;">Assign</span>
      </div>
    </div>
    
    <!-- 🟢 พื้นที่ใส่กล่องลูก แยกจาก Header -->
    <div class="shipment-children-container hide" style="width: 100%; display: flex; flex-direction: column; gap: 5px;"></div>
  `;

  const headerDiv = col.querySelector(".shipment-column-header");
  const childrenContainer = col.querySelector(".shipment-children-container");
  const btnMasterDelete = col.querySelector(".btn-master-delete");
  const btnParentDelete = col.querySelector(".parent-btn-delete"); 
  const btnAddChildBox = col.querySelector(".btn-add-child-box");
  const masterTruckCount = col.querySelector(".master-truck-count");

  // 1. สวิตช์สลับโหมดลบ (Toggle Mode)
  btnMasterDelete.addEventListener("click", () => {
    // บล็อกถ้าคันอื่นเปิดโหมดลบอยู่
    if (window.isGlobalDeleteMode && window.activeDeleteShipment !== safeShipmentNo) {
      return; 
    }

    const isDeleteMode = btnMasterDelete.classList.toggle("delete-mode-active");
    window.isGlobalDeleteMode = isDeleteMode; 
    window.activeDeleteShipment = isDeleteMode ? safeShipmentNo : null; 

    const childBoxes = childrenContainer.querySelectorAll(".shipment-child-box");

    if (isDeleteMode) {
      btnMasterDelete.style.color = "#ffc107"; 
      btnMasterDelete.style.transform = "scale(1.2)";
      headerDiv.style.border = "2px dashed #ffc107"; 
      btnParentDelete.classList.remove("hide"); // โชว์ถังขยะแม่ของจริง
      childBoxes.forEach(child => child.querySelector(".child-btn-delete").classList.remove("hide")); 
    } else {
      btnMasterDelete.style.color = "#c9302c"; 
      btnMasterDelete.style.transform = "scale(1)";
      headerDiv.style.border = "1px solid #ccc";
      btnParentDelete.classList.add("hide"); // ซ่อนถังขยะแม่
      childBoxes.forEach(child => child.querySelector(".child-btn-delete").classList.add("hide"));
    }
  });

  // 🟢 2. ปุ่มกดลบแม่ของจริง (เชื่อมต่อหลังบ้าน Phase 4)
  btnParentDelete.addEventListener("click", () => {
    if (confirm(`คุณต้องการลบชิปเมนต์ ${safeShipmentNo} และข้อมูลกล่องทั้งหมด ทิ้งใช่หรือไม่?`)) {
      
      // 1. โชว์หน้าต่าง Loading ระหว่างรอ @Google Workspace
      if (typeof Swal !== "undefined") {
        Swal.fire({
          title: 'กำลังลบข้อมูล...',
          text: 'กรุณารอสักครู่ ระบบกำลังลบข้อมูลจากฐานข้อมูล',
          allowOutsideClick: false,
          didOpen: () => { Swal.showLoading(); }
        });
      }

      // 2. ยิง API สั่งให้หลังบ้านลบข้อมูล
      google.script.run
        .withSuccessHandler(function(response) {
          if (response.success) {
            if (typeof Swal !== "undefined") Swal.close();
            
            // 3. เมื่อหลังบ้านลบเสร็จ ค่อยลบกราฟิกบนหน้าจอ
            col.remove(); 
            
            const taskCards = document.querySelectorAll("#transferOutTaskHubView .task-card");
            taskCards.forEach(card => {
              if (card.innerHTML.includes(safeShipmentNo)) card.remove(); 
            });

            // ปลดล็อกระบบแช่แข็งทั้งหมด
            window.isGlobalDeleteMode = false;
            window.activeDeleteShipment = null;

            const container = document.getElementById("lobbyContentContainer");
            const emptyState = document.getElementById("lobbyEmptyState");
            if (container && container.querySelectorAll(".shipment-column").length === 0 && emptyState) {
               emptyState.style.display = "block";
            }
          } else {
            // แจ้งเตือนถ้าลบไม่สำเร็จ
            if (typeof safeAlert === "function") safeAlert("เกิดข้อผิดพลาด", response.message, "error");
          }
        })
        .withFailureHandler(function(error) {
          if (typeof safeAlert === "function") safeAlert("ข้อผิดพลาดเครือข่าย", "ไม่สามารถติดต่อ @Google Workspace ได้", "error");
        })
        .deleteShipmentData(safeShipmentNo); // ส่งรหัสแม่ไปให้ฟังก์ชันหลังบ้าน
    }
  });




  // 3. สร้างกล่องลูก
  let boxIdCounter = 0; 
  btnAddChildBox.addEventListener("click", () => {
    boxIdCounter++; 
    const childEl = createShipmentChildBox(baseBoxNo, boxIdCounter);
    childrenContainer.appendChild(childEl);
    childrenContainer.classList.remove("hide");
    
    masterTruckCount.textContent = childrenContainer.querySelectorAll('.shipment-child-box').length; 
  });

  return col;
}
// ======================================================
// 📦 ฟังก์ชันสร้างคอลัมน์ Shipment แม่ (Master Column) - [Phase 3 Final]
// ======================================================



// ฟังก์ชันสลับหน้าจอ (Switch View)
function showView(viewId) {
  // 🟢 ดึงหน้าจอทั้งหมดรวมถึง master-view (เช่น boxDetailsView)
  const allViews = document.querySelectorAll(".view-screen, .master-view");
  allViews.forEach((view) => {
    view.classList.add("hide"); 
    view.style.opacity = "0"; // รีเซ็ตความโปร่งใสให้ทุกหน้า
  });

  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.remove("hide");
    // 🟢 บังคับให้หน้าจอทึบแสง (แสดงผล 100%) ป้องกันปัญหาจอล่องหน/จอขาว
    setTimeout(() => {
        targetView.style.transition = "opacity 0.15s ease-in-out";
        targetView.style.opacity = "1";
    }, 10);
  } else {
    console.error("ไม่พบหน้าจอ ID:", viewId);
  }
}

//===============
// [Load Lobby Header] START
function loadLobbyHeader() {
  const branchID = sessionStorage.getItem("selectedBranchID") || ""; // ค่าที่ได้จะเป็น 02KK
  const headerEl = document.getElementById("lobbyBranchHeaderName");
  if (!headerEl) return;

  let branchName = "ไม่ระบุชื่อสาขา";
  let displayId = branchID; // ตั้งต้นเป็น 02KK

  // 🟢 แปลงรหัส 02KK กลับให้เป็นรหัสสาขาจริง (เช่น KKN02)
  if (typeof getRealBranchCode === "function") {
      displayId = getRealBranchCode(branchID); 
  }

  // 🟢 นำรหัสสาขาจริง ไปค้นหา "ชื่อสาขา" ในแคชให้ตรงเป๊ะ
  if (window.appBranches && Array.isArray(window.appBranches)) {
    const matched = window.appBranches.find(b => {
        const bId = String(b.id || b.Branch_ID || b.BranchID || "").trim().toUpperCase();
        return bId === displayId;
    });
    
    if (matched) {
      branchName = matched.name || matched.Branch_Name || matched.BranchName || "";
    }
  }
  
  // 🟢 จุดแก้ไขข้อ 3: แสดงผลเป็น [KKN02] - ชื่อสาขา
  headerEl.textContent = `[${displayId}] - ${branchName}`;
}
// [Load Lobby Header] END
//===============


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
        // 🟢 เพิ่ม try...catch ป้องกันชิปเมนต์ที่รหัสพัง (เช่น 0202) ไม่ให้ทำให้จอขาวทั้งหน้า
        try {
            if (typeof createShipmentColumn === "function") {
                const safeNo = String(task.Shipment_No || "");
                const col = createShipmentColumn(safeNo, task.Origin_Type || "Store");
                container.appendChild(col);
            }
        } catch (err) {
            console.error("🚨 พบงานที่ข้อมูลพัง (ข้ามการแสดงผล):", task, err);
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
  
  // 🟢 ค้นหาชื่อสาขาเต็ม จากแคช (เช่น [CTW03] Central World)
  let displayDestText = destBranch;
  if (window.appBranches && Array.isArray(window.appBranches)) {
    const matched = window.appBranches.find(b => {
      const bId = String(b.id || b.Branch_ID || b.BranchID || "").trim().toUpperCase();
      return bId === destBranch || String(destBranch).includes(bId.substring(0,2));
    });
    if (matched) {
      const branchName = matched.name || matched.Branch_Name || matched.BranchName || "";
      const branchId = matched.id || matched.Branch_ID || matched.BranchID || destBranch;
      displayDestText = `[${branchId}] ${branchName}`; 
    }
  }

  // Fallback ถ้าหาไม่เจอจริงๆ ให้ใช้ getRealBranchCode
  if (displayDestText === destBranch && typeof getRealBranchCode === "function") {
      displayDestText = getRealBranchCode(destBranch);
  }

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
        <!-- 🟢 เปลี่ยนตัวแปรให้แสดงชื่อสาขาเต็มตรงนี้ -->
        <span style="font-size: 14px; color: #333; font-weight: bold;"><i class="fas fa-truck" style="color: #dc3545;"></i> ${displayDestText}</span>
        <span style="font-size: 13px; color: #555; font-weight: bold;"><i class="fas fa-box" style="color: #8d6e63;"></i> (${totalBox || 0}) TOTAL (${totalItem || 0})</span>
        <span style="background: ${leftBorderColor}; color: #fff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${status || "Assign"}</span>
      </div>
    </div>
  `;

  card.addEventListener("click", async () => {
    sessionStorage.setItem("jump_to_shipment", shipmentNo);
    sessionStorage.setItem("selectedBranchID", destBranch); 
    if (!sessionStorage.getItem("selectedBranchName")) sessionStorage.setItem("selectedBranchName", "");

    try {
      const viewTaskHub = document.getElementById("transferOutTaskHubView");
      const viewLobby = document.getElementById("transferOutLobbyView");
      
      if (typeof navigationTo === "function" && viewTaskHub && viewLobby) navigationTo(viewTaskHub, viewLobby);
      else if (typeof showView === "function") showView("transferOutLobbyView");
      
      if (typeof loadLobbyHeader === "function") loadLobbyHeader();
      if (typeof renderLobbyTasks === "function") await renderLobbyTasks(destBranch);
      
      setTimeout(() => {
        if (typeof focusShipmentInLobby === "function") focusShipmentInLobby(shipmentNo);
      }, 500);

    } catch (error) { console.error("🚨 วาร์ปเข้า Lobby ล้มเหลว:", error); }
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

// 1. ฟังก์ชันค้นหาและวาร์ป (แก้ไขคืนค่าสีลูกระนาดให้ถูกต้อง)
function focusShipmentInLobby(shipmentNo) {
  const columns = document.querySelectorAll(".shipment-column");
  columns.forEach(col => {
    if (col.innerHTML.includes(shipmentNo)) {
      col.style.transition = "background 0.5s";
      col.style.background = "#fff3cd"; // ไฮไลต์สีเหลือง
      col.scrollIntoView({ behavior: "smooth", block: "center" });
      
      setTimeout(() => { 
        // 🟢 คืนค่ากลับเป็นเกรเดียนต์ลูกระนาดสีเงิน (ไม่ใช้สีขาว #ffffff)
        col.style.background = "linear-gradient(to bottom, #d4d4d4 0%, #ffffff 50%, #a09f9f 100%)"; 
      }, 2000);
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

  // เข้า-ออก ระบบ Transfer Out (Main Menu <-> Task Hub)
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
  const btnCreateNewTask = document.getElementById("btnCreateNewTask") || document.getElementById("btnNewTask");
  if (btnCreateNewTask) {
    btnCreateNewTask.addEventListener("click", () => {
      const selectDest = document.getElementById("selectDestination");
      if (selectDest) selectDest.selectedIndex = 0; // เคลียร์ค่าเดิม
      navigationTo(viewTaskHub, viewDest);
    });
  }

  // ปุ่ม Cancel กลับจากหน้าเลือกสาขา 
  document
    .getElementById("btnCancelDest")
    ?.addEventListener("click", () => navigationTo(viewDest, viewTaskHub));
  document
    .getElementById("btnBackFromDest")
    ?.addEventListener("click", () => navigationTo(viewDest, viewTaskHub));
  document
    .getElementById("btnBackToDest")
    ?.addEventListener("click", () => navigationTo(viewLobby, viewTaskHub));

  // 🟢 พระเอกของงาน 1: กด Cancel จากหน้า Lobby ต้องกลับไป Task Hub และ "รีเฟรชข้อมูล"
  document
    .getElementById("btnCancelFromLobby")
    ?.addEventListener("click", () => {
        navigationTo(viewLobby, viewTaskHub);
        // รีเฟรชกระดานงานเพื่อให้เห็น Card ใหม่ที่เพิ่งสร้าง
        if (typeof loadExistingTasks === "function") {
            loadExistingTasks();
        }
    });

  // ==========================================
  // 4. ลอจิกปุ่ม Next (เลือกสาขา -> ไป Lobby)
  // ==========================================
  const btnSubmitDest = document.getElementById("btnSubmitDest") || document.getElementById("btnNextDest");
  if (btnSubmitDest) {
    btnSubmitDest.addEventListener("click", async () => {
      const destDropdown = document.getElementById("selectDestination");

      // เช็กการเลือกข้อมูล
      if (!destDropdown || !destDropdown.value) {
        if (typeof safeAlert === "function")
          safeAlert("ข้อมูลไม่ครบถ้วน", "กรุณาเลือกสาขาที่ต้องการสร้างงานก่อนครับ", "warning");
        else alert("กรุณาเลือกสาขาที่ต้องการสร้างงานก่อนครับ");
        return;
      }

      const branchID = destDropdown.value;

      // บันทึก SessionStorage
      sessionStorage.setItem("selectedBranchID", branchID);

      // วาร์ปไปหน้า Lobby แบบ Smooth Animation
      navigationTo(viewDest, viewLobby);
      
      // 🟢 พระเอกของงาน 2: โหลด Header และ "ดึงข้อมูล Lobby" ของสาขานั้นมาแสดง
      if (typeof loadLobbyHeader === "function") loadLobbyHeader();
      if (typeof renderLobbyTasks === "function") {
          await renderLobbyTasks(branchID);
      }
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
        if (typeof safeAlert === "function") safeAlert("ข้อมูลไม่ครบ", "กรุณาเลือกประเภทการโอนก่อนครับ", "warning");
        else alert("กรุณาเลือกประเภทการโอนก่อนครับ!");
        return;
      }

      const myBranch = String(localStorage.getItem("pattcha_branch") || "CK").trim().toUpperCase();
      
      // 🟢 1. ดึงรหัสจากหน่วยความจำ (อาจเป็น CTW03 หรือ 02CT)
      const rawSelected = sessionStorage.getItem("selectedBranchID") || "KKN02";
      
      // 🟢 2. บังคับแปลงให้เป็นรหัสจริงเสมอ (ถ้าเป็น 02CT จะถูกแปลงกลับเป็น CTW03)
      const actualBranchID = (typeof getRealBranchCode === "function") ? getRealBranchCode(rawSelected) : rawSelected;
      
      // 🟢 3. ตัด 2 ตัวหน้า จะได้ "CT" แล้วประกอบร่างเป็น "02CT" ถูกต้องเป๊ะ 100%
      const targetDestination = `02${actualBranchID.substring(0, 2).toUpperCase()}`; 
      
      const dateStr = new Date().toLocaleDateString("en-GB");
      const finalShipmentNo = `${selectType.value}-${dateStr.replace(/\//g, "")}-01CK-${getNextRunningNumber()}-${targetDestination}`;

      // 🟢 ส่ง Branch (รหัสสาขาจริง) เข้าฐานข้อมูลตามคำสั่งข้อ 4-5
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
      btnConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';

      fetch(CONFIG.API_URL + "?action=save_new_task", { method: "POST", body: JSON.stringify(payload) })
        .then(res => res.json())
        .then(res => {
          if (res.status === "success") {
            if (container && typeof createShipmentColumn === "function") {
                container.appendChild(createShipmentColumn(finalShipmentNo, "Store"));
            }
            if (shipmentBoxModal) shipmentBoxModal.classList.add("hide");
            if (emptyState) emptyState.style.display = "none";

            const taskHubAssignContainer = document.getElementById("assignContainer"); 
            if (taskHubAssignContainer && typeof createTransferOutTaskCard === "function") {
               const newCard = createTransferOutTaskCard(
                 dateStr, finalShipmentNo, "Store", targetDestination, 0, 0, "Assign" 
               );
               taskHubAssignContainer.appendChild(newCard);
               
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




// ======================================================
// 📦 [Phase 2] ฟังก์ชันศูนย์สั่งการเปลี่ยนสถานะกล่อง (State Controller)
// ======================================================
window.updateShipmentBoxState = function(boxNo, status, scanQty = 0, manualQty = 0) {
  // 1. ค้นหากล่องลูกในหน้าจอ จากรหัสกล่อง
  const childBox = document.querySelector(`.shipment-child-box[data-box-no="${boxNo}"]`);
  if (!childBox) return;

  // 2. อัปเดตตัวเลขสินค้า (ได้ข้อมูลมาจากหน้า Box Details)
  const scanEl = childBox.querySelector(".child-scan-qty");
  const manualEl = childBox.querySelector(".child-manual-qty");
  if (scanEl) scanEl.textContent = scanQty;
  if (manualEl) manualEl.textContent = manualQty;

  // 3. ควบคุมการเปลี่ยนแปลง UI และสถานะ
  const iconEl = childBox.querySelector(".box-status-icon");
  const checkboxEl = childBox.querySelector(".child-checkbox");

  childBox.dataset.status = status; 
  sessionStorage.setItem("activeBoxStatus", status); 

  if (status === "closed") {
    // 🔴 [กล่องถูกปิด] -> เปลี่ยนเป็นกล่องปิดสีแดง
    if (iconEl) {
      iconEl.className = "fas fa-box box-status-icon";
      iconEl.style.color = "#dc3545"; // สีแดง
    }
    // 🔓 ปลดล็อก Checkbox ให้สามารถติ๊กเลือกได้
    if (checkboxEl) {
      checkboxEl.disabled = false;
      checkboxEl.style.cursor = "pointer";
      checkboxEl.title = "เลือกกล่องนี้เพื่อเตรียมส่งออก";
    }
  } else {
    // 🟢 [กล่องยังเปิด] -> เปลี่ยนเป็นกล่องเปิดสีเขียว
    if (iconEl) {
      iconEl.className = "fas fa-box-open box-status-icon";
      iconEl.style.color = "#28a745"; // สีเขียว
    }
    // 🔒 ล็อก Checkbox ห้ามกด และล้างค่าการติ๊กออก
    if (checkboxEl) {
      checkboxEl.disabled = true;
      checkboxEl.style.cursor = "not-allowed";
      checkboxEl.checked = false; // บังคับเอาเครื่องหมายถูกออก
      checkboxEl.title = "ต้องปิดกล่องก่อนถึงจะเลือกได้";
    }
  }
};

// ======================================================
// 📦 [Phase 2] ฟังก์ชันศูนย์สั่งการเปลี่ยนสถานะกล่อง (State Controller)
// ======================================================



