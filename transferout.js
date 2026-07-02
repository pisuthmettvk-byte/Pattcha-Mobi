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
});





          // START ฟังก์ชันปุ่ม CANCEL หน้าเลือกสาขา
          if (btnCancel) {
              btnCancel.addEventListener("click", () => {
                  const select = document.getElementById("selectDestination");
                  if (select) select.selectedIndex = 0;
                  // กลับไปด่าน 1 (Task List) หน้าจอจะว่างเปล่าตามเดิมเพราะเราไม่ได้สร้างการ์ดทิ้งไว้
                  showView("transferOutTaskHubView");
              });
          }
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
// START ฟังก์ชัน  สร้างSHIPMENTคอลัมน์ (SHIPMENT COLUMN GENERATE )
//====================================================== 

function createShipmentColumn(shipmentNo) {
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const col = document.createElement('div');
    col.style.cssText = "width: 100%; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 8px; background: #ffffff; overflow: hidden;";
    col.innerHTML = `
        <div style="background: linear-gradient(to bottom, #e0e0e0 0%, #f5f5f5 100%); padding: 12px; display: flex; align-items: center; border-bottom: 1px solid #ccc;">
            <input type="checkbox" style="margin-right: 10px;">
            <span style="font-weight: bold; margin-right: 10px;">${today}</span>
            <span style="font-weight: bold; margin-right: 10px;">${shipmentNo}</span>
            <div style="display: flex; gap: 10px; margin-left: auto;">
                <span><i class="fas fa-truck"></i>(0)</span>
                <span><i class="fas fa-barcode"></i>(0)</span>
                <span><i class="fas fa-hand-paper"></i>(0)</span>
            </div>
            <button style="border:none; background:none; margin-left: 10px; color:#007bff;"><i class="fas fa-box"></i>+</button>
            <button style="border:none; background:none; color:red;" onclick="this.closest('.shipment-column').remove()"><i class="fas fa-trash-alt"></i></button>
        </div>`;
    return col;
}

// --- สั่งให้ปุ่มยืนยันสร้างงาน ไปเรียกฟังก์ชันนี้ทันที ---
document.addEventListener('DOMContentLoaded', () => {
    const btnConfirm = document.getElementById("btnConfirmBox");
    if(btnConfirm) {
        btnConfirm.addEventListener("click", () => {
            const shipmentNo = document.getElementById("inputBoxNumber").value;
            const container = document.getElementById("lobbyContentContainer");
            
            // สร้างและแปะลงไป
            const newCol = createShipmentColumn(shipmentNo);
            container.appendChild(newCol);
            
            // ซ่อน Modal
            document.getElementById("shipmentBoxModal").classList.add("hide");
            document.getElementById("lobbyEmptyState").style.display = "none";
    });
    }
});

//======================================================
// END ฟังก์ชัน  สร้างSHIPMENTคอลัมน์ (SHIPMENT COLUMN GENERATE )
//====================================================== 


