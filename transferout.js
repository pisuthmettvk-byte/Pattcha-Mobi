// =================================================================
// 🚀 START Drop Down & ปุ่มควบคุม (หน้าเลือกสาขา)
// =================================================================
async function loadBranchesIntoDropdown() {
  const select = document.getElementById("selectDestination");
  // URL เดิมของเจเลอร์ (Deployment เดิมที่อัปเดต Code.gs แล้ว)
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwQ0BGX1vUVs6iRkRacx60Th-ytxScDOJh00w9yDjT6JNfwC-2n2fTI1_MSvwgLQJYDtA/exec";

  if (!select) return;

  try {
    const response = await fetch(`${SCRIPT_URL}?action=get_branches`);
    const branches = await response.json(); // รับค่ามาเป็น Array โดยตรง

    const myBranch = String(localStorage.getItem("pattcha_branch") || "").trim().toUpperCase();

    select.innerHTML = '<option value="" disabled selected>-- SELECT BRANCH --</option>';

    // วนลูปแสดงผล
    branches.forEach((branch) => {
      const branchId = String(branch.id || "").trim().toUpperCase();
      
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
    select.innerHTML = '<option value="" disabled selected>-- โหลดล้มเหลว --</option>';
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
        const existingLobby = document.querySelector(`.shipment-card[data-branch-id="${branchID}"]`);

        if (existingLobby) {
            alert("ห้อง Lobby ของสาขานี้ถูกเปิดไว้แล้ว ระบบจะพาคุณไปที่หน้าเดิมครับ");
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
// 🚀 ฟังก์ชันสำหรับสลับหน้าจอ (แก้ปัญหา showView is not defined)
// =================================================================
function showView(viewId) {
    // 1. ซ่อนทุกหน้าที่มี class 'view-screen'
    const allViews = document.querySelectorAll('.view-screen');
    allViews.forEach(view => {
        view.classList.add('hide'); // สมมติว่าเจเลอร์ใช้ class 'hide' ในการซ่อน
    });

    // 2. โชว์หน้าที่ต้องการ
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.remove('hide');
    } else {
        console.error("ไม่พบหน้าจอ ID:", viewId);
    }
}




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



/* ======================================================
   ฟังก์ชันกลางสำหรับสร้าง Card Task (Universal Card Factory)
   ใช้ได้ทุกหน้าในระบบ START
   ====================================================== */
function createUniversalCard(branchName, docNo, branchID, status = 'pending') {
    
    // 1. ตั้งค่าสีตามสถานะ
    const colorMap = {
        'pending': '#dc3545', // สีแดง (ตามที่เจเลอร์ชอบ)
        'done': '#28a745',    // สีเขียว
        'issue': '#ffc107'    // สีเหลือง/ส้ม
    };

    const borderColor = colorMap[status] || '#ccc';




    // 2. สร้างโครงสร้าง Card
    const card = document.createElement('div');
    card.className = 'task-list-item shipment-card';
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
    card.addEventListener('click', () => {
        console.log(`Clicked on: ${docNo}`);
        // เจเลอร์สามารถใส่คำสั่งเรียก showView หรือเก็บข้อมูลลง SessionStorage ตรงนี้ได้เลยครับ
        sessionStorage.setItem("selectedBranchID", branchID);
        showView("transferOutLobbyView");
        loadLobbyHeader();
    });
    return card;
}

/* ======================================================
   ฟังก์ชันกลางสำหรับสร้าง Card Task (Universal Card Factory)
   ใช้ได้ทุกหน้าในระบบ END
   ====================================================== */




//======================================================
// START ฟังก์ชัน  สร้างรหัส  SHIPMENT (SHIPMENT ID GENERATE )
//====================================================== 

function generateSmartShipmentID(transferType, sourceBranchCode, destBranchCode) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, ''); 
    const src = sourceBranchCode.substring(0, 2).toUpperCase();
    const dst = destBranchCode.substring(0, 2).toUpperCase();

    // ส่วนของเลขรันที่เจเลอร์ต้องการให้เป็น 0001 เสมอ
    let runNumber = getNextRunNumber(); 
    
    // 🟢 แก้ไขตรงนี้ครับ: .padStart(4, '0') คือหัวใจสำคัญ
    // มันจะบังคับให้เป็น 4 หลักเสมอ (1 -> 0001, 12 -> 0012, 123 -> 0123)
    const runStr = runNumber.toString().padStart(4, '0');

    // ประกอบร่างตาม Format ที่เจเลอร์กำหนด
    const shipmentID = `${transferType}-${dateStr}-01${src}-${runStr}-02${dst}`;

    return shipmentID;
}

function getNextRunNumber() {
    let lastRun = parseInt(localStorage.getItem('last_shipment_run') || '0');
    let nextRun = lastRun + 1;
    
    if (nextRun > 9999) {
        nextRun = 1; 
    }
    
    localStorage.setItem('last_shipment_run', nextRun);
    return nextRun;
}

//======================================================
// END ฟังก์ชัน  สร้างรหัส  SHIPMENT (SHIPMENT ID GENERATE )
//====================================================== 




//======================================================
// START: ระบบหน้า Lobby (เวอร์ชันรวบยอด - มีดึง Dropdown + สร้างเลข + แสดง Status)
//====================================================== 

// 1. ฟังก์ชันสร้างคอลัมน์ Shipment (มีแถบ Status เปลี่ยนสีได้)
function createShipmentColumn(shipmentNo) {
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const col = document.createElement('div');
    col.className = 'shipment-column';
    col.style.cssText = "width: 100%; box-sizing: border-box; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 8px; background: #ffffff; overflow: hidden;";
    
    col.innerHTML = `
        <div style="background: linear-gradient(to bottom, #e0e0e0 0%, #f5f5f5 100%); padding: 12px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #ccc; box-sizing: border-box; flex-wrap: wrap;">
            <input type="checkbox" style="margin: 0; cursor: pointer;">
            <span style="font-weight: bold; color: #555;">${today}</span>
            <span style="font-weight: bold; color: #0044ff; min-width: 120px;">${shipmentNo}</span>
            
            <div style="display: flex; gap: 15px; margin-left: auto; align-items: center; color: #495057; font-size: 14px;">
                <span><i class="fas fa-truck"></i> (0)</span>
                <span><i class="fas fa-barcode"></i> (0)</span>
                <span><i class="fas fa-hand-paper"></i> (0)</span>
            </div>
            
            <div style="display: flex; gap: 10px; align-items: center;">
                <button style="border:none; background:none; color:#007bff; cursor:pointer; font-size: 16px;" title="เพิ่มกล่อง"><i class="fas fa-box"></i>+</button>
                <button style="border:none; background:none; color:red; cursor:pointer; font-size: 16px;" title="ลบ" onclick="this.closest('.shipment-column').remove()"><i class="fas fa-trash-alt"></i></button>
                
                <select onchange="this.style.background = this.value === 'Assign' ? '#ffc107' : this.value === 'Pending' ? '#17a2b8' : '#28a745'; this.style.color = this.value === 'Assign' ? '#000' : '#fff';" 
                        style="padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; border: none; background: #ffc107; color: #000; cursor: pointer; outline: none; text-align: center; transition: all 0.2s;">
                    <option value="Assign" style="background: white; color: #333;">Assign</option>
                    <option value="Pending" style="background: white; color: #333;">Pending</option>
                    <option value="Complete" style="background: white; color: #333;">Complete</option>
                </select>
            </div>
        </div>`;
    return col;
}

// 2. ฟังก์ชันดึงประเภทการโอนจากชีต (เริ่มแถว 2 รองรับรหัสแปลกปลอม)
function loadTransferTypesIntoDropdown() {
    const selectType = document.getElementById("selectTransferType");
    if (!selectType) return;

    const defaultTypes = [
        { key: "TS", desc: "Transfer Between Store" },
        { key: "DF", desc: "Defective Damage Item" },
        { key: "WH", desc: "Warehouse Transfer" },
        { key: "VM", desc: "VM Prop and Tools" }
    ];

    selectType.innerHTML = '<option value="">กรุณาเลือกประเภท...</option>';

    if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run.withSuccessHandler((sheetTypes) => {
            if (sheetTypes && sheetTypes.length > 0) {
                sheetTypes.forEach((item) => {
                    const option = document.createElement("option");
                    option.value = item.Type_Key.toUpperCase().trim();
                    option.textContent = `[${item.Type_Key}] ${item.Description}`;
                    selectType.appendChild(option);
                });
            } else {
                fallbackDropdown(selectType, defaultTypes);
            }
        }).getTransferTypesFromSheet("1p4D3Fd7iwZnmq2pzJPziMYzNo6wnhNgJxeAS7sTz3c4");
    } else {
        fallbackDropdown(selectType, defaultTypes);
    }
}

function fallbackDropdown(selectElement, types) {
    types.forEach(item => {
        const option = document.createElement("option");
        option.value = item.key;
        option.textContent = `[${item.key}] ${item.desc}`;
        selectElement.appendChild(option);
    });
}

// 3. ผูกเหตุการณ์ควบคุมหน้าจอทั้งหมด
document.addEventListener('DOMContentLoaded', () => {
    loadTransferTypesIntoDropdown();

    const btnTruck = document.getElementById("btnAddShipmentTruck");
    const btnConfirm = document.getElementById("btnConfirmBox");
    const modal = document.getElementById("shipmentBoxModal");
    const selectType = document.getElementById("selectTransferType");
    const inputShipmentNo = document.getElementById("inputBoxNumber");
    const container = document.getElementById("lobbyContentContainer");
    const emptyState = document.getElementById("lobbyEmptyState");

    // เลือกประเภทการโอนแล้วจะ Generate เลข Shipment ทันที (YYMMDD-สุ่มรหัส)
    if (selectType && inputShipmentNo) {
        selectType.addEventListener("change", () => {
            const selectedVal = selectType.value;
            if (selectedVal) {
                const todayStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
                const randomId = Math.floor(100 + Math.random() * 900);
                inputShipmentNo.value = `${selectedVal}-${todayStr}-${randomId}`;
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
            const shipmentNo = inputShipmentNo ? inputShipmentNo.value : "";
            
            if (!selectType || !selectType.value) {
                alert("กรุณาเลือกประเภทการโอนก่อนครับ!");
                return;
            }

            if (container && shipmentNo && shipmentNo !== "กรุณาเลือกประเภท...") {
                container.appendChild(createShipmentColumn(shipmentNo));
                if (modal) modal.classList.add("hide");
                if (emptyState) emptyState.style.display = "none";
            }
        });
    }
});
//======================================================
// END: ระบบหน้า Lobby
//======================================================