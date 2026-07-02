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



  


// ฟังก์ชันปุ่ม NEXT ในหน้าเลือกสาขา (ฉบับสมบูรณ์)
if (btnNext) {
    btnNext.addEventListener("click", () => {
        const select = document.getElementById("selectDestination");
        const branchID = select.value;
        // ใช้ textContent หรือ innerText เพื่อดึงชื่อสาขาที่ถูกต้อง
        const branchName = select.options[select.selectedIndex].text;

        if (!branchID) {
            alert("กรุณาเลือกสาขาที่ต้องการก่อนครับ!");
            return;
        }

        // 1. ตรวจสอบว่าสาขานี้ถูกสร้างไว้หรือยัง
        const existingLobby = document.querySelector(`.shipment-card[data-branch-id="${branchID}"]`);

        if (existingLobby) {
            alert("สาขานี้ถูกสร้างล็อบบี้ไว้แล้ว ระบบจะพาคุณไปที่หน้าเดิมครับ");
        } else {
            // 2. ล้างการ์ดเก่าออกก่อน เพื่อให้หน้าจอสะอาด (ตามลอจิก Zero State ของเจเลอร์)
            const lobbyWrapper = document.querySelector(".task-list-wrapper");
            if (lobbyWrapper) {
                lobbyWrapper.innerHTML = ''; 
            }

            // 3. สร้างรหัส Doc No
            const newDocNo = "#TO-" + new Date().getTime().toString().slice(-7);

            // 4. สร้างการ์ด (ส่ง branchID เข้าไปเป็น parameter ที่ 3 เพื่อฝัง Attribute อัตโนมัติ)
            const newCard = createUniversalCard(branchName, newDocNo, branchID, "pending");

            // 5. แปะการ์ดใหม่
            if (lobbyWrapper) {
                lobbyWrapper.appendChild(newCard);
            }
        }

        // 6. บันทึกข้อมูลลง Session
        sessionStorage.setItem("selectedBranchID", branchID);
        sessionStorage.setItem("selectedBranchName", branchName);

        // 7. เปลี่ยนหน้า
        showView("transferOutLobbyView");
        loadLobbyHeader();
    });
}
        // END ฟังก์ชันปุ่ม NEXT ในหน้าเลือสาขา




        //START ฟังก์ชันปุ่ม CANCEL หน้าเลือกสาขา
        if (btnCancel) {
            btnCancel.addEventListener("click", () => {
            const select = document.getElementById("selectDestination");
            if (select) select.selectedIndex = 0;
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

async function generateSmartShipmentID(typeKey, targetBranchID) {
    // 1. ดึงวันที่ (YYMMDD)
    const dateStamp = new Date().toISOString().slice(2, 10).replace(/-/g, ''); 
    
    // 2. ดึงประเภท (ถ้า typeKey คือ 'TO' จะได้รหัสอย่างเช่น 'TO')
    // เจเลอร์สามารถดึงค่าจาก Object Config ที่โหลดมาได้เลย
    const typeCode = Config.transferTypes[typeKey] || "TO"; 
    
    // 3. กำหนด Source และ Target ตาม Pattern ที่ต้องการ
    const sourcePart = `01${currentBranch}`;
    const targetPart = `02${targetBranchID}`;
    
    // 4. Sequence (แนะนำให้บวกเพิ่มในอนาคต: ดึงเลขจาก Sheets)
    const sequence = "001"; 
    
    // ประกอบร่าง
    return `${dateStamp}-${sourcePart}-${targetPart}-${typeCode}-${sequence}`;
}

//======================================================
// END ฟังก์ชัน  สร้างรหัส  SHIPMENT (SHIPMENT ID GENERATE )
//====================================================== 









