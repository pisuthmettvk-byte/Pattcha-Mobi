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





// 📍 [แจ้งเตือนแบบป๊อปอัป 2 ปุ่ม สำหรับยืนยันการลบ]
window.safeConfirm = function (title, message) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "sys-alert-element";
    overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1000006; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(3px);";

    overlay.innerHTML = `
      <div style="background: white; width: 90%; max-width: 350px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); overflow: hidden; display: flex; flex-direction: column; animation: popIn 0.3s ease-out;">
        <div style="background: #dc3545; padding: 20px; text-align: center;">
          <i class="fas fa-exclamation-triangle" style="font-size: 40px; color: white;"></i>
        </div>
        <div style="padding: 25px 20px; text-align: center;">
          <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #333;">${title}</h3>
          <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">${message}</p>
        </div>
        <div style="padding: 15px; background: #f8f9fa; border-top: 1px solid #eee; display: flex; justify-content: space-between; gap: 10px;">
          <button class="btn-cancel" style="background: #6c757d; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; width: 50%;">ยกเลิก</button>
          <button class="btn-confirm" style="background: #dc3545; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; width: 50%;">ใช่, ลบเลย</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector(".btn-cancel").addEventListener("click", () => {
      document.body.removeChild(overlay);
      resolve(false);
    });
    overlay.querySelector(".btn-confirm").addEventListener("click", () => {
      document.body.removeChild(overlay);
      resolve(true);
    });
  });
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
// 📦 ฟังก์ชันสร้างกล่องลูก
// ======================================================

function createShipmentChildBox(baseBoxNo, boxRunningIndex) {
  const childBoxNo = `${baseBoxNo}-${String(boxRunningIndex).padStart(4, '0')}`;
  const childDiv = document.createElement("div");
  childDiv.className = "shipment-child-box";
  childDiv.dataset.boxNo = childBoxNo;
  childDiv.dataset.status = "open"; 

  // 🟢 ปรับดีไซน์เป็น Task Card
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

  // 🚨 [แก้ไขส่วนนี้] การกดเปิดหน้า Box Details แบบใหม่
  childDiv.addEventListener("click", function(e) {
    // ป้องกันไม่ให้เปิดหน้าต่าง ถ้าเปิดโหมดลบอยู่ หรือกดโดนปุ่มลบ/เช็คบ็อกซ์
    if (window.isGlobalDeleteMode || e.target.closest('.child-btn-delete') || e.target.closest('.child-checkbox')) return;
    
    // ดึงรหัสชิปเมนต์ตัวแม่
    const parentCol = childDiv.closest(".shipment-column");
    const shipmentNo = parentCol ? parentCol.getAttribute("data-shipment") : baseBoxNo;
    
    // เช็กสถานะว่ากล่องปิดหรือยัง
    const isClosed = childDiv.dataset.status === "Closed";
    
    // โยนข้อมูลไปที่ฟังก์ชันเปิดหน้า
    if (typeof window.openBoxDetails === "function") {
        window.openBoxDetails(shipmentNo, childBoxNo, childDiv, isClosed);
    }
  });

  // ลอจิกปุ่มลบ (คงเดิม)
  const btnDeleteChild = childDiv.querySelector(".child-btn-delete");
  btnDeleteChild.addEventListener("click", (e) => {
    e.stopPropagation(); 
    if (confirm(`ต้องการลบกล่อง ${childBoxNo} ทิ้งใช่หรือไม่? ข้อมูลสินค้าในกล่องนี้จะหายไปทั้งหมด`)) {
      const parentCol = childDiv.closest(".shipment-column"); 
      childDiv.remove(); 
      
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
// 📦 ฟังก์ชันสร้างคอลัมน์ Shipment แม่ (Master Column) - [Phase 4 Final Update]
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

  col.style.cssText = `width: 100%; margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px;`;

  col.innerHTML = `
    <!-- 🟢 Header แม่ -->
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
        
        <!-- 🟢 ปุ่มลบแม่ของจริง -->
        <div class="parent-btn-delete hide" style="background: #dc3545; color: white; padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 6px; transition: all 0.2s;" title="ลบชิปเมนต์คันนี้ทิ้ง">
          <i class="fas fa-times-circle"></i> ลบทั้งคัน
        </div>
        
        <i class="fas fa-box-open btn-add-child-box" style="color: #2e8b57; font-size: 20px; cursor: pointer; filter: drop-shadow(1px 1px 1px #fff);" title="สร้างกล่องใหม่"></i>
        <i class="fas fa-trash-alt btn-master-delete" style="color: #c9302c; font-size: 20px; cursor: pointer; filter: drop-shadow(1px 1px 1px #fff); transition: all 0.2s;" title="สวิตช์ เปิด/ปิด โหมดลบ"></i>
        <span style="background: #d93844; color: white; padding: 6px 18px; border-radius: 15px; font-size: 13px; font-weight: bold;">Assign</span>
      </div>
    </div>
    
    <!-- 🟢 พื้นที่ใส่กล่องลูก -->
    <div class="shipment-children-container hide" style="width: 100%; display: flex; flex-direction: column; gap: 5px;"></div>
  `;

  const headerDiv = col.querySelector(".shipment-column-header");
  const childrenContainer = col.querySelector(".shipment-children-container");
  const btnMasterDelete = col.querySelector(".btn-master-delete");
  const btnParentDelete = col.querySelector(".parent-btn-delete"); 
  const btnAddChildBox = col.querySelector(".btn-add-child-box");
  const masterTruckCount = col.querySelector(".master-truck-count");

  // 1. สวิตช์สลับโหมดลบ
  btnMasterDelete.addEventListener("click", () => {
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
      btnParentDelete.classList.remove("hide"); 
      childBoxes.forEach(child => child.querySelector(".child-btn-delete").classList.remove("hide")); 
    } else {
      btnMasterDelete.style.color = "#c9302c"; 
      btnMasterDelete.style.transform = "scale(1)";
      headerDiv.style.border = "1px solid #ccc";
      btnParentDelete.classList.add("hide"); 
      childBoxes.forEach(child => child.querySelector(".child-btn-delete").classList.add("hide"));
    }
  });

  // 2. ปุ่มกดลบแม่ของจริง (ใช้ safeConfirm และ POST API)
  btnParentDelete.addEventListener("click", async () => {
    
    // เรียกใช้ UI แจ้งเตือนของเจเลอร์
    const isConfirmed = await safeConfirm('ยืนยันการลบชิปเมนต์?', `คุณต้องการลบชิปเมนต์ ${safeShipmentNo} ทิ้งใช่หรือไม่?`);

    if (isConfirmed) {
      // โชว์ Loading
      const loadingOverlay = document.createElement("div");
      loadingOverlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 9999999; display: flex; justify-content: center; align-items: center; color: white; font-size: 20px; font-weight: bold; backdrop-filter: blur(3px);";
      loadingOverlay.innerHTML = "<i class='fas fa-spinner fa-spin' style='margin-right: 10px;'></i> กำลังลบข้อมูล...";
      document.body.appendChild(loadingOverlay);

      const apiUrl = "https://script.google.com/macros/s/AKfycbxl3g-8afxNG-q4UhOxVsffv-qO7Dum2koHWAKEbr98086bvPq-RwNQrEwGvzMZ5Jm7zQ/exec";
      
      // ยิง API ผ่าน POST (เหมือน save_new_task)
      fetch(`${apiUrl}?action=delete_shipment`, {
        method: 'POST',
        body: JSON.stringify({ shipmentNo: safeShipmentNo })
      })
      .then(response => response.json())
      .then(data => {
        document.body.removeChild(loadingOverlay); // ปิด Loading
        
        if (data.success) {
          col.remove(); // ลบกราฟิกแม่
          const taskCards = document.querySelectorAll("#transferOutTaskHubView .task-card");
          taskCards.forEach(card => {
            if (card.innerHTML.includes(safeShipmentNo)) card.remove(); // ลบ Task Card
          });

          window.isGlobalDeleteMode = false;
          window.activeDeleteShipment = null;

          const container = document.getElementById("lobbyContentContainer");
          const emptyState = document.getElementById("lobbyEmptyState");
          if (container && container.querySelectorAll(".shipment-column").length === 0 && emptyState) {
             emptyState.style.display = "block";
          }
        } else {
          safeAlert("เกิดข้อผิดพลาด", data.message, "error");
        }
      })
      .catch(error => {
        document.body.removeChild(loadingOverlay);
        safeAlert("ข้อผิดพลาด", "ไม่สามารถติดต่อฐานข้อมูลได้", "error");
      });
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
// 📦 ฟังก์ชันสร้างคอลัมน์ Shipment แม่ (Master Column) - [Phase 4 Final Fix]
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




// ==================================================================
// 📦 [Phase 2] ฟังก์ชันศูนย์สั่งการเปลี่ยนสถานะกล่อง (State Controller) START
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
// 📦 [Phase 2] ฟังก์ชันศูนย์สั่งการเปลี่ยนสถานะกล่อง (State Controller) END
// ==================================================================


// ===============================================================
// 📦 Phase 5 & 6: ลอจิกหน้า Box Details และระบบปิดกล่อง (WRAP) START

// ตัวแปรควบคุมสถานะกล่องปัจจุบัน
        window.currentActiveShipment = null;
        window.currentActiveBoxNo = null;
        window.currentBoxElement = null; // เก็บอ้างอิง DOM ของกล่องในหน้า Lobby
        
        // 1. ปุ่ม Back ย้อนกลับไป Lobby (แก้ไขจอขาว)
        document.getElementById("btnBackFromBox").addEventListener("click", () => {
            document.getElementById("boxDetailsView").classList.add("hide");
            
            // กลับไปหน้า Lobby ให้ถูก ID
            const lobbyView = document.getElementById("transferOutLobbyView") || document.getElementById("lobbyView");
            if (lobbyView) {
                lobbyView.classList.remove("hide");
            }

            // 📍 [เพิ่มใหม่]: คืนค่ากล้องกลับไปโหมด Stock ทันทีที่ออกจากหน้ากล่อง
            window.currentScannerContext = 'stock';

            // เคลียร์ค่า
            window.currentActiveShipment = null;
            window.currentActiveBoxNo = null;
            window.currentBoxElement = null;
        });

        // 2. ฟังก์ชันควบคุมสถานะปุ่ม WRAP (ใช้ Style ถอดแบบหน้า Lobby)
        window.updateBoxWrapButtonState = function(totalItemsCount) {
            const btnWrap = document.getElementById("btnBoxWrap");
            if (!btnWrap) return;

            if (totalItemsCount > 0) {
                // มีสินค้า = ปลดล็อก (สีแดงลูกระนาดแบบ EXPORT)
                btnWrap.disabled = false;
                btnWrap.style.background = "linear-gradient(to bottom, #b02a37 0%, #ff6b6b 50%, #b02a37 100%)";
                btnWrap.style.color = "white";
                btnWrap.style.borderLeft = "1px solid rgba(255,255,255,0.3)";
                btnWrap.style.cursor = "pointer";
            } else {
                // ไม่มีสินค้า = ล็อก (สีดำโปร่งแสงตามโค้ดต้นฉบับ)
                btnWrap.disabled = true;
                btnWrap.style.background = "rgba(0, 0, 0, 0.466)";
                btnWrap.style.color = "#aaa";
                btnWrap.style.borderLeft = "1px solid rgba(255,255,255,0.2)";
                btnWrap.style.cursor = "not-allowed";
            }
        };

        // 3. ฟังก์ชันเปิดหน้า Box Details (ปรับรองรับปุ่มเหล็กลูกระนาด)
        window.openBoxDetails = function(shipmentNo, boxNo, boxElement, isClosed) {
            window.currentActiveShipment = shipmentNo;
            window.currentActiveBoxNo = boxNo;
            window.currentBoxElement = boxElement;

            // อัปเดตข้อความบน Header
            document.getElementById("boxDetailsShipmentText").textContent = `(Shipment No: ${shipmentNo})`;
            document.getElementById("boxDetailsBoxText").textContent = boxNo;

            // จัดการ UI ตามสถานะของกล่อง
            const btnScanner = document.getElementById("btnBoxScanner");
            const btnWrap = document.getElementById("btnBoxWrap");
            const searchInput = document.getElementById("boxSearchInput");

         // ----------------------------------------------------
            // 📷 ผูก Event ให้ปุ่มกล้อง (Box Details) - [Safe Layer Override]
            // ----------------------------------------------------
            if (btnScanner) {
                const newBtnScanner = btnScanner.cloneNode(true);
                btnScanner.parentNode.replaceChild(newBtnScanner, btnScanner);
                
                newBtnScanner.addEventListener("click", async () => {
                    if (isClosed) {
                        if (typeof safeAlert === 'function') safeAlert("กล่องปิดแล้ว", "ไม่สามารถแสกนเพิ่มได้ครับ", "warning");
                        return;
                    }

                    // 1. สับสวิตช์บอกว่า "เรียกกล้องจากหน้า Box"
                    window.currentScannerContext = 'box'; 
                    
                    // 2. เรียกเปิดกล้องตามปกติ
                    if (typeof window.toggleScanner === "function") {
                        
                        // 📍 [Safe Approach]: ดันเลเยอร์หน้าต่างกล้องขึ้นมาบนสุดเฉพาะตอนเรียกจากหน้านี้!
                        const scanView = document.getElementById("scannerView");
                        if (scanView) {
                            // ลบคลาส hide ออกก่อน (เผื่อมีค้าง)
                            scanView.classList.remove("hide");
                            
                            // ดัน Z-Index ทะลุทะลวงแบบเฉพาะกิจ
                            scanView.style.position = "fixed";
                            scanView.style.zIndex = "9999999"; 
                            scanView.style.opacity = "1";
                            scanView.style.display = "block"; 
                        }
                        
                        await window.toggleScanner();
                        
                    } else {
                        alert("ไม่พบโมดูลกล้อง (toggleScanner) ในระบบ");
                    }
                });
            }
            // ----------------------------------------------------

            if (isClosed) {
                // 🔴 โหมด Read-Only (ปิดกล่องแล้ว)
                btnWrap.style.display = "none"; // ซ่อนปุ่ม WRAP
                
                // แปลงร่างปุ่มกล้องกลับเป็นสไตล์ Master Blueprint ของ Stock In House 
                const finalBtnScanner = document.getElementById("btnBoxScanner");
                if (finalBtnScanner) {
                    finalBtnScanner.style.background = "linear-gradient(135deg, #db8591 0%, #e7a08c 50%, #fab919 100%)"; 
                    finalBtnScanner.style.border = "none";
                    finalBtnScanner.style.color = "white";
                    finalBtnScanner.style.textShadow = "none";
                    finalBtnScanner.style.boxShadow = "0 6px 15px rgba(219,133,145,0.3)";
                }
                if(searchInput) searchInput.placeholder = "ค้นหาสินค้าในกล่องที่ปิดแล้ว...";
            } else {
                // 🟢 โหมดปกติ (กล่องเปิดอยู่)
                btnWrap.style.display = "flex"; // โชว์ปุ่ม WRAP
                
                // คืนร่างปุ่มกล้องเป็น "เหล็กสีเงินลูกระนาด"
                const finalBtnScanner = document.getElementById("btnBoxScanner");
                if (finalBtnScanner) {
                    finalBtnScanner.style.background = "linear-gradient(to bottom, #9e9e9e 0%, #e0e0e0 30%, #ffffff 50%, #e0e0e0 70%, #9e9e9e 100%)"; 
                    finalBtnScanner.style.border = "1px solid #888";
                    finalBtnScanner.style.color = "#333";
                    finalBtnScanner.style.textShadow = "1px 1px 0px #fff";
                    finalBtnScanner.style.boxShadow = "0 4px 6px rgba(0,0,0,0.2), inset 0 1px 3px rgba(255,255,255,0.8)";
                }
                if(searchInput) searchInput.placeholder = "ค้นหาสินค้าในกล่อง (SKU...)";
                
                // ล็อกปุ่ม WRAP ไว้ก่อนทันทีที่เปิดหน้าต่าง (เพราะสินค้าเป็น 0)
                if (typeof window.updateBoxWrapButtonState === 'function') {
                    window.updateBoxWrapButtonState(window.currentBoxItems.length); 
                }
            }

            // สลับหน้าจอ
            const lobbyView = document.getElementById("transferOutLobbyView") || document.getElementById("lobbyView");
            if(lobbyView) lobbyView.classList.add("hide");
            document.getElementById("boxDetailsView").classList.remove("hide");
        };

        // 5. ระบบช่องค้นหา Magic Search (Box Details)
        const boxSearchInput = document.getElementById("boxSearchInput");
        const boxClearSearchBtn = document.getElementById("boxClearSearchBtn");
        if (boxSearchInput && boxClearSearchBtn) {
            // ตรวจจับตอนพิมพ์
            boxSearchInput.addEventListener("input", function() {
                if (this.value.trim().length > 0) {
                    boxClearSearchBtn.style.display = "flex"; // โชว์ X
                } else {
                    boxClearSearchBtn.style.display = "none"; // ซ่อน X
                }
            });

            // ตรวจจับตอนกดปุ่ม X
            boxClearSearchBtn.addEventListener("click", function() {
                boxSearchInput.value = ""; // ล้างค่า
                this.style.display = "none"; // ซ่อนปุ่ม X
                boxSearchInput.focus(); // เด้งเคอร์เซอร์กลับไปที่ช่องพิมพ์
            });
        }

// 📦 Phase 5 & 6: ลอจิกหน้า Box Details และระบบปิดกล่อง (WRAP) END
// ===============================================================




// ======================================================
// 📦 Phase 7.1: โครงสร้างการ์ดสินค้า (อัปเดตให้กดดูสต็อกได้) START

        // 🟢 โหมด A: ค้นหาเพื่อเพิ่ม (อัปเดต: เช็กสต็อก = 0 ล็อกปุ่ม ADD)
        window.renderBoxModeACard = function(item) {
            const safeSku = escapeHTML(item.sku || "-");
            const safeName = escapeHTML(item.name || "-");
            const priceStr = Number(item.price || 0).toLocaleString();
            const stockAvail = Number(item.availableStock || 0); // แปลงเป็นตัวเลข

            // ลอจิกปุ่ม ADD (ถ้าสต็อกมากกว่า 0 ให้กดได้ ถ้าเป็น 0 หรือติดลบให้ล็อก)
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

            return `
            <div class="product-row" style="display: flex; gap: 15px; padding: 15px; background: #fff; border-bottom: 1px solid #eee;">
              <img class="prod-img" src="${parseDriveImage(item.imageUrl)}" onclick="openProductDetail('${safeSku}')" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px; cursor: pointer;">
              <div class="prod-info-wrapper" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; margin-top: 0 !important;">
                  <div class="prod-text" onclick="openProductDetail('${safeSku}')" style="cursor: pointer; flex: 1;">
                    <div class="prod-name" style="margin-top: 0;">${safeName}</div>
                    <div class="prod-sku">${safeSku}</div>
                  </div>
                  <div class="prod-price" style="margin-top: 0 !important; color: #b02a37;">฿${priceStr}</div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: auto !important; padding-top: 5px;">
                  <span style="${stockAvail > 0 ? 'color: #10b981;' : 'color: #ef4444;'} font-weight: bold; display: flex; align-items: center; gap: 4px; font-size: 13px;">
                    <i class="fas ${stockAvail > 0 ? 'fa-thumbs-up' : 'fa-times-circle'}"></i> ${stockAvail}
                  </span>
                  ${actionButtonHtml}
                </div>
              </div>
            </div>`;
        };


        // 🔴 โหมด B: สินค้าในกล่อง (In-Box Item)
        window.renderBoxModeBCard = function(item, isClosedBox) {
            const safeSku = escapeHTML(item.sku || "-");
            const safeName = escapeHTML(item.name || "-");
            const priceStr = Number(item.price || 0).toLocaleString();
            
            const isManualModified = item.manualQty > 0 || item.isManual === true;
            const iconHtml = isManualModified 
                ? '<i class="fas fa-hand-paper" style="color: #f59e0b;" title="แก้ไขด้วยมือ"></i>' 
                : '<i class="fas fa-barcode" style="color: #3b82f6;" title="สแกนผ่านกล้อง"></i>';
            
            const totalQty = (item.scanQty || 0) + (item.manualQty || 0);

            const controlsHtml = isClosedBox ? '' : `
                <div style="display: flex; align-items: center; gap: 8px;">
                  <!-- 🎯 พื้นที่จัดการ (ปุ่มบวก/ลบ) -->
                  <div style="display: flex; align-items: center; background: #f0f0f0; border-radius: 20px; overflow: hidden; border: 1px solid #ddd;">
                    <button onclick="decreaseBoxItemQty('${safeSku}')" style="background: none; border: none; padding: 4px 10px; cursor: pointer;"><i class="fas fa-minus" style="font-size: 10px;"></i></button>
                    <span style="font-weight: bold; font-size: 14px; min-width: 20px; text-align: center;">${totalQty}</span>
                    <button onclick="increaseBoxItemQty('${safeSku}')" style="background: none; border: none; padding: 4px 10px; cursor: pointer;"><i class="fas fa-plus" style="font-size: 10px;"></i></button>
                  </div>
                  <button onclick="removeBoxItem('${safeSku}')" style="background: #ef4444; color: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center;">
                    <i class="fas fa-trash-alt" style="font-size: 12px;"></i>
                  </button>
                </div>`;

            return `
            <div class="product-row" style="display: flex; gap: 15px; padding: 15px; background: #fff; border-bottom: 1px solid #eee; border-left: 4px solid #b02a37;">
              
              <!-- 👆 พื้นที่กดดูรายละเอียด (รูปภาพ) -->
              <img class="prod-img" src="${parseDriveImage(item.imageUrl)}" onclick="openProductDetail('${safeSku}')" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px; cursor: pointer;">
              
              <div class="prod-info-wrapper" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; margin-top: 0 !important;">
                  
                  <!-- 👆 พื้นที่กดดูรายละเอียด (ชื่อและ SKU) -->
                  <div class="prod-text" onclick="openProductDetail('${safeSku}')" style="cursor: pointer; flex: 1;">
                    <div class="prod-name" style="margin-top: 0;">${safeName}</div>
                    <div class="prod-sku">${safeSku}</div>
                  </div>
                  <div class="prod-price" style="margin-top: 0 !important; color: #b02a37;">฿${priceStr}</div>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: auto !important; padding-top: 5px;">
                  <span style="font-weight: bold; display: flex; align-items: center; gap: 6px; font-size: 14px; color: #333;">
                    ${iconHtml} ยอดรวม: ${totalQty}
                  </span>
                  ${controlsHtml}
                </div>
              </div>
            </div>`;
        };
// 📦 Phase 7.1: โครงสร้างการ์ดสินค้า (Box Details View) END
// ======================================================



// ======================================================
// 🔍 Phase 7.2 & 7.3: ระบบ Magic Search (แก้บั๊ก Scope ข้อมูล) START
window.currentBoxItems = window.currentBoxItems || [];

        // 1. ฟังก์ชันค้นหา
        window.handleBoxSearch = function() {
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

            // 🚨 FIX: เรียกใช้ localProductDatabase ตรงๆ ตามโครงสร้างของ app.js
            if (typeof localProductDatabase !== 'undefined' && localProductDatabase.length > 0) {
                const results = localProductDatabase.filter(item => {
                    return Object.values(item).some(
                        val => val != null && val.toString().toLowerCase().includes(query)
                    );
                });

                if (results.length === 0) {
                    container.innerHTML = '<div style="text-align:center; color:#999; margin-top: 50px;">❌ ไม่พบสินค้าในระบบ</div>';
                    return;
                }

                // เรนเดอร์การ์ดโหมด A (ค้นหาเพื่อเพิ่ม)
                container.innerHTML = results.map(item => window.renderBoxModeACard(item)).join('');
            } else {
                container.innerHTML = '<div style="text-align:center; color:#999; margin-top: 50px;">❌ ไม่มีข้อมูล (กรุณา Login ใหม่อีกครั้ง)</div>';
            }
        };

        // 2. ฟังก์ชันล้างช่องค้นหา (ปุ่ม X)
        window.clearBoxSearch = function() {
            const inputElem = document.getElementById("boxSearchInput");
            const clearBtn = document.getElementById("boxClearSearchBtn");

            if (inputElem) {
                inputElem.value = "";
                inputElem.focus(); 
            }
            if (clearBtn) clearBtn.style.display = "none";

            window.renderBoxContentArea();
        };

        // 3. ฟังก์ชันเรนเดอร์ของในกล่อง
        window.renderBoxContentArea = function() {
            const container = document.getElementById("boxContentArea");
            if (!container) return;

            if (window.currentBoxItems.length === 0) {
                container.innerHTML = `
                    <div id="boxEmptyState" style="text-align: center; color: #999; margin-top: 50px;">
                        <i class="fas fa-box-open" style="font-size: 40px; margin-bottom: 10px; color: #ccc;"></i>
                        <p style="font-weight: bold; margin: 0;">กล่องยังว่างเปล่า</p>
                        <p style="font-size: 12px;">ค้นหาหรือกดปุ่มสแกนด้านล่างเพื่อเพิ่มสินค้า</p>
                    </div>`;
                if(typeof window.updateBoxWrapButtonState === 'function') window.updateBoxWrapButtonState(0);
                return;
            }

            container.innerHTML = window.currentBoxItems.map(item => window.renderBoxModeBCard(item, false)).join('');
            if(typeof window.updateBoxWrapButtonState === 'function') window.updateBoxWrapButtonState(window.currentBoxItems.length);
        };

        // 4. ฟังก์ชันกดปุ่ม ADD เข้ากล่อง
        window.addSearchItemToBox = function(sku) {
            // 🚨 FIX: เรียกใช้ localProductDatabase ตรงๆ
            if (typeof localProductDatabase === 'undefined') return;
            
            const product = localProductDatabase.find(p => p.sku === sku);
            if (!product) return;

            const existingItem = window.currentBoxItems.find(item => item.sku === sku);
            if (existingItem) {
                existingItem.manualQty += 1;
                existingItem.isManual = true;
            } else {
                window.currentBoxItems.push({
                    ...product,
                    scanQty: 0,
                    manualQty: 1,
                    isManual: true
                });
            }

            window.clearBoxSearch(); 
        };

        // 5. ผูก Event Listener (Debounce)
        document.addEventListener("DOMContentLoaded", () => {
            const boxSearchInputElem = document.getElementById("boxSearchInput");
            if (boxSearchInputElem) {
                boxSearchInputElem.addEventListener("input", debounceSearch((e) => {
                    if(typeof window.handleBoxSearch === 'function') {
                        window.handleBoxSearch();
                    }
                }, 250)); 
            }
        });

// 🔍 Phase 7.2 & 7.3: ระบบ Magic Search สำหรับ Box Details END
// ======================================================










// ==========================================================
// 📍 [สร้างหน้าต่างยืนยันแบบป๊อปอัป ให้เข้าธีมเดียวกับ safeAlert] START

      window.safeConfirm = function (title, message, type = "error") {
        return new Promise((resolve) => {
          const overlay = document.createElement("div");
          overlay.className = "sys-alert-element";
          overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1000006; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(3px);";

          let headerBg, iconClass, btnBg, btnText;
          if (type === "warning" || type === "question") {
            headerBg = "#ffc107";
            iconClass = "fas fa-question-circle";
            btnBg = "#ffc107";
            btnText = "#000";
          } else {
            headerBg = "#dc3545"; // สีแดง (เหมาะกับการลบข้อมูล)
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
            </div>
          `;
          document.body.appendChild(overlay);

          overlay.querySelector(".btn-ok").addEventListener("click", () => {
            document.body.removeChild(overlay);
            resolve(true); // ส่งค่า true เมื่อกดตกลง
          });
          
          overlay.querySelector(".btn-cancel").addEventListener("click", () => {
            document.body.removeChild(overlay);
            resolve(false); // ส่งค่า false เมื่อกดยกเลิก
          });
        });
      };

// 📍 [สร้างหน้าต่างยืนยันแบบป๊อปอัป ให้เข้าธีมเดียวกับ safeAlert] END
// ==========================================================





// =================================================================
// ⚙️ ฟังก์ชันจัดการจำนวนสินค้า (เชื่อมกับ safeAlert และ safeConfirm) START

        window.increaseBoxItemQty = function(sku) {
            const item = window.currentBoxItems.find(p => p.sku === sku);
            if (item) {
                const totalQty = (item.scanQty || 0) + (item.manualQty || 0);
                
                if (totalQty < item.availableStock) {
                    item.manualQty += 1;
                    item.isManual = true; 
                    window.renderBoxContentArea(); 
                } else {
                    // 📍 เปลี่ยนจาก "warning" เป็น "error" เพื่อแสดงผลเป็นสีแดง
                    if (typeof window.safeAlert === 'function') {
                        window.safeAlert("STOCK LIMIT", `ไม่สามารถเพิ่มได้ มีสินค้าในสต็อกเพียง ${item.availableStock} ชิ้น`, "error");
                    } else {
                        alert(`ไม่สามารถเพิ่มได้ มีสินค้าในสต็อกเพียง ${item.availableStock} ชิ้น`);
                    }
                }
            }
        };

        // 2. ลดจำนวน (-) - ห้ามติดลบ
        window.decreaseBoxItemQty = function(sku) {
            const item = window.currentBoxItems.find(p => p.sku === sku);
            if (item) {
                if (item.manualQty > 0) {
                    item.manualQty -= 1;
                    item.isManual = true;
                } else if (item.scanQty > 0) {
                    item.scanQty -= 1;
                }
                
                if ((item.scanQty + item.manualQty) <= 0) {
                    window.currentBoxItems = window.currentBoxItems.filter(p => p.sku !== sku);
                }
                window.renderBoxContentArea();
            }
        };

        // 3. ถังขยะ (ลบออกจากกล่อง) - แจ้งเตือนก่อนลบ
        window.removeBoxItem = async function(sku) {
            let isConfirm = false;
            
            // 📍 ใช้ safeConfirm ตัวใหม่ที่สร้างให้เข้าธีม
            if (typeof window.safeConfirm === 'function') {
                isConfirm = await window.safeConfirm("CONFIRM DELETE", "ต้องการลบสินค้านี้ออกจากกล่องใช่หรือไม่?", "error");
            } else {
                isConfirm = confirm("ต้องการลบสินค้านี้ออกจากกล่องใช่หรือไม่?");
            }

            if (isConfirm) {
                window.currentBoxItems = window.currentBoxItems.filter(p => p.sku !== sku);
                window.renderBoxContentArea(); 
            }
        };

// ⚙️ ฟังก์ชันจัดการจำนวนสินค้าในกล่อง (อัปเดต: ใช้ UI หน้าต่างแจ้งเตือนของระบบหลัก 100%) END
// ==========================================================================



// ==========================================================
// 🛡️ แก้ไขปัญหา Z-Index แบบฝัง CSS ทับ (Force Override) START

      document.addEventListener("DOMContentLoaded", () => {
          // สร้างแท็ก <style> บังคับให้ Modal และ Alert ลอยอยู่หน้าสุด (ทะลุหน้า Box Details แน่นอน 100%)
          const style = document.createElement('style');
          style.innerHTML = `
              #productDetailModal { z-index: 100005 !important; }
              #customAlertOverlay { z-index: 100010 !important; }
          `;
          document.head.appendChild(style);
      });

// 🛡️ แก้ไขปัญหา Z-Index แบบฝัง CSS ทับ (Force Override) END
// ==========================================================






// ==================================================================
// 🔄 ระบบ Auto-Refresh (แก้ปัญหาปุ่ม WRAP ล็อกตอนเข้า-ออกหน้าจอ)  START

      document.addEventListener("DOMContentLoaded", () => {
          const boxView = document.getElementById("boxDetailsView");
          
          if (boxView) {
              // ใช้ MutationObserver เพื่อดักจับตอนที่หน้าจอ Box Details ถูกเปิดขึ้นมา
              const observer = new MutationObserver((mutations) => {
                  mutations.forEach((mutation) => {
                      if (mutation.attributeName === "class") {
                          const isHidden = boxView.classList.contains("hide");
                          // ถ้าหน้าจอถูก "เปิด" (ไม่มี class hide) ให้ทำการรีเฟรชข้อมูลและปุ่ม WRAP ทันที!
                          if (!isHidden) {
                              if (typeof window.renderBoxContentArea === 'function') {
                                  window.renderBoxContentArea();
                              }
                          }
                      }
                  });
              });

              // สั่งให้กล้องวงจรปิดเริ่มจับตาดูหน้าต่าง boxDetailsView
              observer.observe(boxView, { attributes: true });
          }
      });

// 🔄 ระบบ Auto-Refresh (แก้ปัญหาปุ่ม WRAP ล็อกตอนเข้า-ออกหน้าจอ)  END
// ==================================================================




// ======================================================
// 🚀 Phase 8: ระบบบันทึกข้อมูลกล่อง (UI สีเหลืองคำถาม + Backend 100%)
// ======================================================
window.submitWrapBox = async function() {
    if (!window.currentBoxItems || window.currentBoxItems.length === 0) {
        if (typeof window.safeAlert === 'function') window.safeAlert("BOX EMPTY", "ไม่มีสินค้าในกล่อง ไม่สามารถ Wrap ได้ครับ", "warning");
        return;
    }

    const shipmentElem = document.getElementById("boxDetailsShipmentText"); 
    const boxElem = document.getElementById("boxDetailsBoxText");       
    
    let shipmentId = shipmentElem ? shipmentElem.innerText.replace("(Shipment No: ", "").replace(")", "").trim() : "UNKNOWN-SHP";
    const boxNumber = boxElem ? boxElem.innerText.trim() : "UNKNOWN-BOX";

    // 📍 จุดที่ปรับปรุง: เพิ่ม "question" ต่อท้าย เพื่อเรียกใช้ Theme สีเหลืองและไอคอน ?
    const isConfirmed = await safeConfirm(
        'ยืนยันการปิดกล่อง (WRAP)?', 
        `คุณต้องการปิดกล่อง ${boxNumber} ใช่หรือไม่? เมื่อปิดแล้วจะไม่สามารถแก้ไขสินค้าในกล่องนี้ได้อีก`, 
        "question"
    );
    if (!isConfirmed) return;

    // ล็อกปุ่ม
    const wrapBtn = document.getElementById("btnBoxWrap"); 
    let originalBtnHtml = wrapBtn ? wrapBtn.innerHTML : "";
    if (wrapBtn) {
        wrapBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> กำลังบันทึก...';
        wrapBtn.style.pointerEvents = "none";
        wrapBtn.style.opacity = "0.7";
    }

    // เตรียม Payload
    let totalScanQty = 0;
    let totalManualQty = 0;
    const payload = {
        shipmentId: shipmentId,
        boxNumber: boxNumber,
        items: window.currentBoxItems.map(item => {
            const scan = item.scanQty || 0;
            const manual = item.manualQty || 0;
            totalScanQty += scan;
            totalManualQty += manual;
            return {
                sku: item.sku,
                name: item.name,
                scanQty: scan,
                manualQty: manual,
                totalQty: scan + manual
            };
        })
    };

    // ยิง API 
    fetch(CONFIG.API_URL + "?action=save_box", { 
        method: "POST", 
        body: JSON.stringify(payload) 
    })
    .then(res => res.json())
    .then(data => {
        if (wrapBtn) {
            wrapBtn.innerHTML = originalBtnHtml;
            wrapBtn.style.pointerEvents = "auto";
            wrapBtn.style.opacity = "1";
        }
        
        if (data.status === 'success' || data.success) { 
            
            // อัปเดต UI หน้า Lobby ให้กล่องเป็นสีแดง และโชว์ยอด
            if (window.currentBoxElement) {
                window.currentBoxElement.setAttribute("data-status", "Closed"); 
                const boxIcon = window.currentBoxElement.querySelector(".fa-box-open, .fa-box");
                if (boxIcon) {
                    boxIcon.className = "fas fa-box"; 
                    boxIcon.style.color = "#d93844"; 
                }
                const scanEl = window.currentBoxElement.querySelector(".child-scan-qty");
                const manualEl = window.currentBoxElement.querySelector(".child-manual-qty");
                if (scanEl) scanEl.textContent = totalScanQty;
                if (manualEl) manualEl.textContent = totalManualQty;
            }

            // แจ้งเตือนสำเร็จ แล้วกลับไป Lobby
            if (typeof window.safeAlert === 'function') {
                window.safeAlert("SUCCESS", `บันทึกกล่อง ${boxNumber} สำเร็จ!`, "success");
            }
            window.currentBoxItems = [];
            window.renderBoxContentArea();
            document.getElementById("btnBackFromBox").click(); 
            
        } else {
            if (typeof window.safeAlert === 'function') window.safeAlert("ERROR", "เกิดข้อผิดพลาด: " + (data.message || "บันทึกล้มเหลว"), "error");
        }
    })
    .catch(error => {
        if (wrapBtn) {
            wrapBtn.innerHTML = originalBtnHtml;
            wrapBtn.style.pointerEvents = "auto";
            wrapBtn.style.opacity = "1";
        }
        if (typeof window.safeAlert === 'function') window.safeAlert("ERROR", "ไม่สามารถติดต่อเซิร์ฟเวอร์ได้", "error");
    });
};

// 🚀 Phase 8: ระบบบันทึกข้อมูลกล่อง (เชื่อม API หลังบ้านจริง)
// ===========================================================











// ======================================================
// 📷 Phase 10: ระบบรับข้อมูลจากกล้อง (Scanner Receiver)
// ======================================================

// ======================================================
// 📷 Phase 10: ระบบรับข้อมูลจากกล้อง (Scanner Receiver)
// ======================================================

// ตัวแปรบอกสถานะกล้อง (ค่าปริยายคือ 'stock')
window.currentScannerContext = 'stock';

window.addScannedItemToBox = function(sku) {
    if (typeof localProductDatabase === 'undefined' || !localProductDatabase) return;
    
    const product = localProductDatabase.find(p => p.sku === sku);
    
    if (!product) {
        // แสกนไม่เจอของ
        console.warn(`[SCAN FAILED] ไม่พบสินค้า SKU: ${sku}`);
        return; // ข้ามไปเลยเงียบๆ เพื่อให้กล้องแสกนต่อได้
    }

    const existingItem = window.currentBoxItems.find(item => item.sku === sku);
    const currentTotal = existingItem ? ((existingItem.scanQty || 0) + (existingItem.manualQty || 0)) : 0;
    
    // แปลง availableStock เป็นตัวเลข
    const stockLimit = Number(product.availableStock || 0);
    
    if (currentTotal < stockLimit) {
        // 🟢 ของลงกล่องสำเร็จ
        if (existingItem) {
            existingItem.scanQty = (existingItem.scanQty || 0) + 1;
        } else {
            window.currentBoxItems.push({
                ...product,
                scanQty: 1,
                manualQty: 0,
                isManual: false
            });
        }
        
        // 🔔 10.3 ส่งเสียง Beep 
        const beep = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"); // เสียงดัมมี่ (ถ้าเจเลอร์มีไฟล์เสียง สามารถเอาลิงก์มาใส่ได้)
        beep.play().catch(e => console.log("Beep play prevented", e));

        // 📳 สั่น 1 ที (ถ้ามือถือรองรับ)
        if (navigator.vibrate) navigator.vibrate(100);
        
        // อัปเดต UI หน้ากล่อง
        if (typeof window.renderBoxContentArea === 'function') window.renderBoxContentArea();
        
        // โชว์แจ้งเตือนสีเขียวแวบๆ เล็กๆ (Toast) โดยไม่หยุดกล้อง
        const toast = document.createElement("div");
        toast.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#28a745; color:white; padding:10px 20px; border-radius:30px; font-weight:bold; z-index:999999; box-shadow:0 4px 6px rgba(0,0,0,0.2); transition:opacity 0.5s;";
        toast.innerHTML = `<i class="fas fa-check-circle"></i> เพิ่ม ${sku}`;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 500); }, 1500);
        
    } else {
        // 🔴 สต็อกหมด
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]); // สั่นเตือนยาวๆ
        
        const errToast = document.createElement("div");
        errToast.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#dc3545; color:white; padding:10px 20px; border-radius:30px; font-weight:bold; z-index:999999; box-shadow:0 4px 6px rgba(0,0,0,0.2); transition:opacity 0.5s;";
        errToast.innerHTML = `<i class="fas fa-times-circle"></i> สต็อกไม่พอ (${sku})`;
        document.body.appendChild(errToast);
        setTimeout(() => { errToast.style.opacity = "0"; setTimeout(() => errToast.remove(), 500); }, 2000);
    }
};


// ======================================================
// 📷 Phase 10: ระบบรับข้อมูลจากกล้อง (Scanner Receiver)
// ======================================================
