const webAppUrl =
  "https://script.google.com/macros/s/AKfycbxl3g-8afxNG-q4UhOxVsffv-qO7Dum2koHWAKEbr98086bvPq-RwNQrEwGvzMZ5Jm7zQ/exec";


// =================================================================
// 🚀 START Drop Down & ปุ่มควบคุม (หน้าเลือกสาขา)
// =================================================================
async function loadBranchesIntoDropdown() {
  const select = document.getElementById("selectDestination");
  // URL เดิมของเจเลอร์ (Deployment เดิมที่อัปเดต Code.gs แล้ว)
const SCRIPT_URL = CONFIG.API_URL;
  if (!select) return;

  try {
    const response = await fetch(`${SCRIPT_URL}?action=get_branches`);
    const branches = await response.json(); // รับค่ามาเป็น Array โดยตรง

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

      // กรองแค่ "ไม่ใช่สาขาตัวเอง" (เพราะหลังบ้านกรอง Active มาให้แล้ว)
      if (branchId !== myBranch && branchId !== "") {
        const option = document.createElement("option");
        option.value = branch.id;
        option.textContent = `${branch.id} - ${branch.name}`; // ใช้ ID และ Name ที่ได้จากชีทใหม่
        select.appendChild(option);
      }
    });
  } catch (error) {
    console.error("Error loading branches:", error);
    select.innerHTML =
      '<option value="" disabled selected>-- โหลดล้มเหลว --</option>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadBranchesIntoDropdown();

  const btnNext = document.getElementById("btnSubmitDest");
  const btnCancel = document.getElementById("btnBackFromDest");

  // ฟังก์ชันปุ่ม NEXT ในหน้าเลือกสาขา (ฉบับแก้ไข: ด่าน 2 ส่งแค่เข้าด่าน 3 ไม่สร้างการ์ด)
  if (btnNext) {
    btnNext.addEventListener("click", () => {
      const select = document.getElementById("selectDestination");
      const branchID = select.value;
      const branchName = select.options[select.selectedIndex].text;

      if (!branchID) {
        alert("กรุณาเลือกสาขาที่ต้องการก่อนครับ!");
        return;
      }

      // 1. ตรวจสอบว่าสาขานี้ถูกเปิดห้องไว้หรือยัง (ใน Lobby)
      // เราเช็กจากรหัสสาขา ถ้ามีแล้วก็แค่พาเข้าห้อง ไม่ต้องสร้างใหม่
      const existingLobby = document.querySelector(
        `.shipment-card[data-branch-id="${branchID}"]`,
      );

      if (existingLobby) {
        alert(
          "ห้อง Lobby ของสาขานี้ถูกเปิดไว้แล้ว ระบบจะพาคุณไปที่หน้าเดิมครับ",
        );
      }

      // หมายเหตุ: เราเอาโค้ดสร้างการ์ด (createUniversalCard) ออกจากตรงนี้
      // เพื่อให้ด่าน 1 (Task List) ว่างเปล่าตามเงื่อนไขที่เจเลอร์ต้องการ
      // การ์ดจะถูกสร้างก็ต่อเมื่อเจเลอร์ไปกดปุ่มรูปรถบรรทุกในด่าน 3 เท่านั้น!

      // 2. บันทึกข้อมูลสาขาที่เลือก
      sessionStorage.setItem("selectedBranchID", branchID);
      sessionStorage.setItem("selectedBranchName", branchName);

      // 3. เปลี่ยนหน้าไปด่าน 3
      showView("transferOutLobbyView");
      loadLobbyHeader();
    });
  }

  // START ฟังก์ชันปุ่ม CANCEL หน้าเลือกสาขา
  if (btnCancel) {
    btnCancel.addEventListener("click", () => {
      const select = document.getElementById("selectDestination");
      if (select) select.selectedIndex = 0;
      // กลับไปด่าน 1 (Task List) หน้าจอจะว่างเปล่าตามเดิมเพราะเราไม่ได้สร้างการ์ดทิ้งไว้
      showView("transferOutTaskHubView");
    });
  }
});

// END ฟังก์ชันปุ่ม CANCEL หน้าเลือกสาขา

// =================================================================
// 🚀 END Drop Down & ปุ่มควบคุม (หน้าเลือกสาขา)
// =================================================================

// =================================================================
// 🚀START ฟังก์ชันสำหรับสลับหน้าจอ (แก้ปัญหา showView is not defined)
// =================================================================
function showView(viewId) {
  // 1. ซ่อนทุกหน้าที่มี class 'view-screen'
  const allViews = document.querySelectorAll(".view-screen");
  allViews.forEach((view) => {
    view.classList.add("hide"); // สมมติว่าเจเลอร์ใช้ class 'hide' ในการซ่อน
  });

  // 2. โชว์หน้าที่ต้องการ
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.remove("hide");
  } else {
    console.error("ไม่พบหน้าจอ ID:", viewId);
  }
}

// =================================================================
// 🚀 END ฟังก์ชันสำหรับสลับหน้าจอ (แก้ปัญหา showView is not defined)
// =================================================================

// =================================================================
// 🚀START Branch Lobby HEADERล็อบบีสาขา
// =================================================================
function loadLobbyHeader() {
  const branchID = sessionStorage.getItem("selectedBranchID");
  const branchName = sessionStorage.getItem("selectedBranchName");
  const headerElement = document.getElementById("lobbyBranchHeaderName"); // แก้ ID ให้ตรงกับ HTML ของเจเลอร์

  if (headerElement && branchID && branchName) {
    headerElement.textContent = `[${branchID}] - ${branchName}`;
  }
}
// =================================================================
// 🚀 END Branch Lobby HEADERล็อบบีสาขา
// =================================================================

// ======================================================
// ฟังก์ชันกลางสำหรับสร้าง Card Task (Universal Card Factory)
// ใช้ได้ทุกหน้าในระบบ START
// ======================================================
function createUniversalCard(branchName, docNo, branchID, status = "pending") {
  // 1. ตั้งค่าสีตามสถานะ
  const colorMap = {
    pending: "#dc3545", // สีแดง (ตามที่เจเลอร์ชอบ)
    done: "#28a745", // สีเขียว
    issue: "#ffc107", // สีเหลือง/ส้ม
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
    // เจเลอร์สามารถใส่คำสั่งเรียก showView หรือเก็บข้อมูลลง SessionStorage ตรงนี้ได้เลยครับ
    sessionStorage.setItem("selectedBranchID", branchID);
    showView("transferOutLobbyView");
    loadLobbyHeader();
  });
  return card;
}

// ======================================================
// ฟังก์ชันกลางสำหรับสร้าง Card Task (Universal Card Factory)
// ใช้ได้ทุกหน้าในระบบ END
// ======================================================



// ======================================================
// START FRONTEND: ระบบหน้า Lobby (เวอร์ชันคลีน ทำงานตรงตามหน้าที่ 100%)
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

function createShipmentColumn(shipmentNo, originType = "Store") {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "2-digit", year: "2-digit",
  });
  const col = document.createElement("div");
  col.className = "shipment-column";
  col.dataset.destination = shipmentNo.split("-")[4];
  col.dataset.originType = originType;

  col.style.cssText =
    "width: 100%; box-sizing: border-box; margin-bottom: 10px; border-radius: 8px; background: #ffffff; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);";

  col.innerHTML = `
        <div style="background: linear-gradient(to bottom, #d4d4d4 0%, #ffffff 50%, #a09f9f 100%); border-top: 1px solid #fff; border-bottom: 1px solid #bbb; padding: 15px 20px; display: flex; align-items: center; gap: 12px; box-sizing: border-box; flex-wrap: wrap;">
            <input type="checkbox" style="margin: 0; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
            <span style="font-weight: bold; color: #333; font-size:13px; text-shadow: 1px 1px 0 #fff;">${today}</span>
            <div style="display: inline-flex; align-items: center;">${formatShipmentNoHTML(shipmentNo)}</div>
            
            <div style="margin-left: auto; display: flex; align-items: center; gap: 15px;">
                <span style="background: #e9ecef; color: #495057; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; border: 1px solid #ced4da; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">${originType}</span>
                <div style="display: flex; gap: 12px; align-items: center; color: #333; font-size: 13px; text-shadow: 1px 1px 0 #fff;">
                    <span><i class="fas fa-truck"></i> (0)</span>
                    <span><i class="fas fa-barcode"></i> (0)</span>
                    <span><i class="fas fa-hand-paper"></i> (0)</span>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; align-items: center; margin-left: 10px;">
                <button class="btn-open-box" style="border:none; background:none; color:#28a745; cursor:pointer; font-size: 16px; font-weight:bold; filter: drop-shadow(1px 1px 1px rgba(255,255,255,0.8));" title="เปิดกล่อง"><i class="fas fa-box-open"></i>+</button>
                <button style="border:none; background:none; color:#dc3545; cursor:pointer; font-size: 16px; filter: drop-shadow(1px 1px 1px rgba(255,255,255,0.8));" title="ลบ" onclick="this.closest('.shipment-column').remove()"><i class="fas fa-trash-alt"></i></button>
                <span class="status-label" style="padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; background: #dc3545; color: #fff; text-align: center; min-width: 65px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Assign</span>
            </div>
        </div>`;
  return col;
}

function loadTransferTypesIntoDropdown() {
  const selectType = document.getElementById("selectTransferType");
  if (!selectType) return;
  selectType.innerHTML = '<option value="">กรุณาเลือกประเภท...</option>';

  // ใช้ลิงก์จาก CONFIG (ป้องกันลิงก์หาย)
  fetch(CONFIG.API_URL)
    .then((response) => response.json())
    .then((sheetTypes) => {
      if (sheetTypes && sheetTypes.length > 0) {
        sheetTypes.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.Type_Key;
          option.textContent = `[${item.Type_Key}] ${item.Description}`;
          selectType.appendChild(option);
        });
      }
    })
    .catch((err) => console.error("Fetch error:", err));
}

function focusShipmentInLobby(shipmentNo) {
  // ค้นหา Shipment Column ทั้งหมดที่มีอยู่ในหน้าจอ Lobby ปัจจุบัน
  const columns = document.querySelectorAll(".shipment-column");

  columns.forEach((col) => {
    // เช็กว่าข้อความในการ์ดตรงกับเลขที่คลิกมาไหม
    if (col.innerHTML.includes(shipmentNo)) {
      // ใส่ไฮไลท์สีพื้นหลังชั่วคราวเพื่อให้รู้ว่าวาร์ปมาที่การ์ดใบนี้
      col.style.transition = "background 0.5s";
      col.style.background = "#fff3cd";

      // สั่งให้หน้าจอเลื่อน (Scroll) มาที่ตำแหน่งของการ์ดใบนี้แบบสมูท
      col.scrollIntoView({ behavior: "smooth", block: "center" });

      // คืนค่าสีขาวตามเดิมหลังจากกะพริบเตือนเสร็จ 2 วินาที
      setTimeout(() => {
        col.style.background = "#ffffff";
      }, 2000);
    }
  });
}

// ก้อนที่ 3: ตัวคอยเช็กว่ามีคำสั่งวาร์ปค้างอยู่ไหมตอนเปิดหน้าเว็บ
document.addEventListener("DOMContentLoaded", () => {
  const pendingJump = sessionStorage.getItem("jump_to_shipment");
  if (pendingJump) {
    // หน่วงเวลาเล็กน้อย 0.5 วินาที ให้หน้า Lobby โหลดเสร็จก่อนค่อยเลื่อนหา
    setTimeout(() => {
      focusShipmentInLobby(pendingJump);
      sessionStorage.removeItem("jump_to_shipment"); // เคลียร์ทิ้ง
    }, 500);
  }
});


document.addEventListener("DOMContentLoaded", () => {
  loadTransferTypesIntoDropdown();

  const btnTruck = document.getElementById("btnAddShipmentTruck");
  const btnConfirm = document.getElementById("btnConfirmBox");
  const modal = document.getElementById("shipmentBoxModal");
  const selectType = document.getElementById("selectTransferType");
  const inputShipmentNo = document.getElementById("inputBoxNumber");
  const container = document.getElementById("lobbyContentContainer");
  const emptyState = document.getElementById("lobbyEmptyState");
  const currentOriginCode = "CK";

  if (selectType && inputShipmentNo) {
    selectType.addEventListener("change", () => {
      const selectedVal = selectType.value;
      const selectedBranchID = sessionStorage.getItem("selectedBranchID") || "KKN02";
      const currentDestCode = selectedBranchID.substring(0, 2).toUpperCase();

      if (selectedVal) {
        const formattedDate = new Date().toLocaleDateString("en-GB").replace(/\//g, "");
        const tempCounter = (parseInt(localStorage.getItem("shipment_running_counter") || "0") + 1).toString().padStart(4, "0");
        inputShipmentNo.value = `${selectedVal}-${formattedDate}-01${currentOriginCode}-${tempCounter}-02${currentDestCode}`;
      } else {
        inputShipmentNo.value = "กรุณาเลือกประเภท...";
      }
    });
  }

  if (btnTruck && modal) {
    btnTruck.addEventListener("click", () => {
      if (selectType) selectType.selectedIndex = 0;
      if (inputShipmentNo) inputShipmentNo.value = "กรุณาเลือกประเภท...";
      modal.classList.remove("hide");
    });
  }

  if (btnConfirm) {
    btnConfirm.addEventListener("click", () => {
      if (!selectType || !selectType.value) {
        alert("กรุณาเลือกประเภทการโอนก่อนครับ!");
        return;
      }

      const selectedBranchID = sessionStorage.getItem("selectedBranchID") || "KKN02";
      const currentDestCode = selectedBranchID.substring(0, 2).toUpperCase();
      const targetDestination = `02${currentDestCode}`;

      // 1. ตรวจสอบงานซ้ำ
      if (container) {
        const existingColumns = container.querySelectorAll(".shipment-column");
        let isDuplicate = false;
        existingColumns.forEach((col) => {
          if (col.dataset.destination === targetDestination && col.dataset.originType === "Store") {
            isDuplicate = true;
          }
        });
        if (isDuplicate) {
          alert(`ปฏิเสธการสร้าง! มีใบงานส่งไปสาขาปลายทาง [${targetDestination}] ค้างอยู่ในระบบล็อบบี้แล้วครับ`);
          return;
        }
      }

      // 2. เตรียมข้อมูล
      const finalType = selectType.value;
      const finalDate = new Date().toLocaleDateString("en-GB").replace(/\//g, "");
      const displayDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });
      const finalRunningNum = getNextRunningNumber();
      const finalShipmentNo = `${finalType}-${finalDate}-01${currentOriginCode}-${finalRunningNum}-${targetDestination}`;

      const payload = {
        Date: displayDate,
        Shipment_No: finalShipmentNo,
        Origin_Branch: currentOriginCode,
        Destination: targetDestination,
        Origin_Type: "Store",
        Total_Box: 0,
        Total_Item: 0,
        Status: "Assign",
      };

      // 3. เริ่มยิง API ไปยัง Google Sheets
      btnConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';
      btnConfirm.disabled = true;

      // ใช้ CONFIG.API_URL ตรงนี้ถึงจะถูกต้องครับ!
      const saveUrl = CONFIG.API_URL + "?action=save_new_task";

      fetch(saveUrl, {
        method: "POST",
        body: JSON.stringify(payload),
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.status === "success") {
            // บันทึกสำเร็จ: สร้างเฉพาะการ์ด Lobby เท่านั้น 
            if (container) {
              container.appendChild(createShipmentColumn(finalShipmentNo, "Store"));
              if (modal) modal.classList.add("hide");
              if (emptyState) emptyState.style.display = "none";
            }
          } else {
            alert("เกิดข้อผิดพลาด: " + result.message);
          }
        })
        .catch((error) => {
          console.error("Save Error:", error);
          alert("ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบอินเทอร์เน็ตครับ");
        })
        .finally(() => {
          btnConfirm.innerHTML = "ยืนยันสร้าง";
          btnConfirm.disabled = false;
        });
    });
  }
});

/*END FRONTEND: ระบบหน้า Lobby (คลีน 100%)*/

//======================================================
// START BACKEND: โซนที่ 3 ระบบหน้า TRANSFER OUT TASKS (เวอร์ชันสมบูรณ์)
//======================================================
function createTransferOutTaskCard (
  date,
  shipmentNo,
  originType,
  destBranch,
  totalBox,
  totalItem,
  status
) {
  const colorMap = {
    assign: "#dc3545",
    pending: "#e0a800",
    complete: "#28a745",
  };
  const statusKey = (status || "").toLowerCase();
  const leftBorderColor = colorMap[statusKey] || "#ccc";

  const card = document.createElement("div");
  card.className = "task-card";
  card.dataset.destination = destBranch;

  card.style.cssText = `
    width: 100%; 
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-bottom: none;
    border-left: 6px solid ${leftBorderColor}; 
    padding: 16px 15px; 
    margin-bottom: 0px;
    box-sizing: border-box;
    cursor: pointer; 
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
    if (typeof focusShipmentInLobby === "function") {
      focusShipmentInLobby(shipmentNo);
    }
  });

  return card;
}


async function loadExistingTasks() {
  const assignContainer = document.getElementById("assignContainer");
  const pendingContainer = document.getElementById("pendingContainer");
  const completeContainer = document.getElementById("completeContainer");

  if (!assignContainer) return; 

  const fetchUrl = CONFIG.API_URL + "?action=get_tasks";

  try {
    const response = await fetch(fetchUrl);
    const tasks = await response.json();

    if (!Array.isArray(tasks)) {
      console.error("Error from API:", tasks);
      return;
    }

    assignContainer.innerHTML = "";
    if (pendingContainer) pendingContainer.innerHTML = "";
    if (completeContainer) completeContainer.innerHTML = "";

    let assignCount = 0;
    let pendingCount = 0;
    let completeCount = 0;

    tasks.forEach(task => {
      const statusKey = (task.Status || "").toLowerCase();
      
      const card = createTransferOutTaskCard(
        task.Date, task.Shipment_No, task.Origin_Type, task.Destination, 
        task.Total_Box, task.Total_Item, task.Status
      );

      if (statusKey === 'assign') {
        assignContainer.appendChild(card);
        assignCount++;
      } else if (statusKey === 'pending' && pendingContainer) {
        pendingContainer.appendChild(card);
        pendingCount++;
      } else if (statusKey === 'complete' && completeContainer) {
        completeContainer.appendChild(card);
        completeCount++;
      }
    });

    const assignText = document.getElementById("assignTaskCount");
    if (assignText) assignText.innerHTML = "Task (" + assignCount + ") <i class=\"fas fa-chevron-down\"></i>";

    const pendingText = document.getElementById("pendingTaskCount");
    if (pendingText) pendingText.innerHTML = "Task (" + pendingCount + ") <i class=\"fas fa-chevron-down\"></i>";

    const completeText = document.getElementById("completeTaskCount");
    if (completeText) completeText.innerHTML = "Task (" + completeCount + ") <i class=\"fas fa-chevron-down\"></i>";

  } catch (error) {
    console.error("Error loading tasks:", error);
  }
}

// ==========================================
// ส่วนเสริม: ระบบค้นหาและโฟกัสการ์ดในหน้า Lobby
// ==========================================
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

// ตัวกระตุ้นหลักตอนเปิดเว็บ (รวมฟังก์ชันไว้ที่เดียว)
document.addEventListener("DOMContentLoaded", () => {
  loadExistingTasks();

  const pendingJump = sessionStorage.getItem("jump_to_shipment");
  if (pendingJump) {
    setTimeout(() => {
      focusShipmentInLobby(pendingJump);
      sessionStorage.removeItem("jump_to_shipment");
    }, 500);
  }
});

//======================================================
// END BACKEND: โซนที่ 3 ระบบหน้า TRANSFER OUT TASKS
//======================================================
