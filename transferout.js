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
// START FRONTEND: ระบบหน้า Lobby และจัดเลเยอร์ Shipment (เวอร์ชันยกเครื่องระดับ 3)
//====================================================== 

// ฟังก์ชันดึงเลขรันนิ่งถาวร (0001 - 9999) ไม่ซ้ำเลขที่ลบ รีเซ็ตเมื่อชน 9999
function getNextRunningNumber() {
    let currentNum = parseInt(localStorage.getItem('shipment_running_counter') || '0');
    currentNum++;
    if (currentNum > 9999) currentNum = 1;
    localStorage.setItem('shipment_running_counter', currentNum.toString());
    return currentNum.toString().padStart(4, '0');
}

// ฟังก์ชันจัดเลเยอร์ตัวอักษรของเลข Shipment ให้สวยงามอ่านง่าย
function formatShipmentNoHTML(shipmentNo) {
    const parts = shipmentNo.split('-');
    if (parts.length < 5) return `<span style="font-weight:bold; color:#0044ff;">${shipmentNo}</span>`;
    
    const type = parts[0];
    const dateStr = parts[1];
    const origin = parts[2];
    const runNum = parts[3];
    const dest = parts[4];
    
    return `
        <strong style="color:#222; font-size:14px;">${type}</strong> 
        <small style="color:#999; font-size:11px; margin:0 2px;">${dateStr}</small> - 
        <span style="color:#666; font-size:13px;">${origin}</span> - 
        <strong style="font-size:16px; color:#0044ff; background:#e6f0ff; padding:2px 6px; border-radius:4px; margin:0 4px; display:inline-block; border:1px solid #b3d4ff;">${runNum}</strong> - 
        <strong style="color:#222; font-size:14px;">${dest}</strong>
    `;
}

// ฟังก์ชันสร้างคอลัมน์ Shipment (คุมเลเยอร์ UI ล่าสุด)
function createShipmentColumn(shipmentNo, originType = "Store") {
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const col = document.createElement('div');
    col.className = 'shipment-column';
    col.dataset.destination = shipmentNo.split('-')[4]; // เก็บค่าสาขาปลายทางไว้เช็กซ้ำ
    col.dataset.originType = originType;
    col.style.cssText = "width: 100%; box-sizing: border-box; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 8px; background: #ffffff; overflow: hidden;";
    
    col.innerHTML = `
        <div style="background: linear-gradient(to bottom, #e0e0e0 0%, #f5f5f5 100%); padding: 12px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #ccc; box-sizing: border-box; flex-wrap: wrap;">
            <input type="checkbox" style="margin: 0; cursor: pointer;">
            <span style="font-weight: bold; color: #555; font-size:13px;">${today}</span>
            
            <!-- รหัส Shipment ที่จัด Layer ความหนาบางแล้ว -->
            <div style="display: inline-flex; align-items: center;">${formatShipmentNoHTML(shipmentNo)}</div>
            
            <!-- ขยับมาด้านขวา: ป้ายระบุที่มางาน -->
            <div style="margin-left: auto; display: flex; align-items: center; gap: 15px;">
                <span style="background: #e9ecef; color: #495057; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; border: 1px solid #ced4da;">${originType}</span>
                
                <!-- กลุ่มไอคอนนับจำนวนชิ้น -->
                <div style="display: flex; gap: 12px; align-items: center; color: #495057; font-size: 13px;">
                    <span><i class="fas fa-truck"></i> (0)</span>
                    <span><i class="fas fa-barcode"></i> (0)</span>
                    <span><i class="fas fa-hand-paper"></i> (0)</span>
                </div>
            </div>
            
            <!-- กลุ่มปุ่มควบคุม และป้ายสถานะออโต้ด้านหลังสุด -->
            <div style="display: flex; gap: 10px; align-items: center; margin-left: 10px;">
                <button class="btn-open-box" style="border:none; background:none; color:#28a745; cursor:pointer; font-size: 18px;" title="เปิดกล่อง"><i class="fas fa-box-open"></i></button>
                <button style="border:none; background:none; color:#dc3545; cursor:pointer; font-size: 16px;" title="ลบ" onclick="this.closest('.shipment-column').remove()"><i class="fas fa-trash-alt"></i></button>
                
                <!-- แถบสถานะระบบจัดการอัตโนมัติ (ไม่ใช่ Dropdown) -->
                <span class="status-label" style="padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; background: #ffc107; color: #000; text-align: center; min-width: 60px; display: inline-block;">Assign</span>
            </div>
        </div>`;
    return col;
}

// ฟังก์ชันดึงประเภทการโอนเข้าสู่ Dropdown หน้างาน
function loadTransferTypesIntoDropdown() {
    const selectType = document.getElementById("selectTransferType");
    if (!selectType) return;

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
                fallbackDropdown(selectType);
            }
        }).getTransferTypesFromSheet("1p4D3Fd7iwZnmq2pzJPziMYzNo6wnhNgJxeAS7sTz3c4");
    } else {
        fallbackDropdown(selectType);
    }
}

function fallbackDropdown(selectElement) {
    const defaults = [
        { key: "TS", desc: "Transfer Between Store" }, { key: "DF", desc: "Defective Damage Item" },
        { key: "WH", desc: "Warehouse Transfer" }, { key: "VM", desc: "VM Prop and Tools" }
    ];
    defaults.forEach(item => {
        const option = document.createElement("option");
        option.value = item.key;
        option.textContent = `[${item.key}] ${item.desc}`;
        selectElement.appendChild(option);
    });
}

// ผูกการทำงานปุ่มและ Logic ในหน้าจอ
document.addEventListener('DOMContentLoaded', () => {
    loadTransferTypesIntoDropdown();

    const btnTruck = document.getElementById("btnAddShipmentTruck");
    const btnConfirm = document.getElementById("btnConfirmBox");
    const modal = document.getElementById("shipmentBoxModal");
    const selectType = document.getElementById("selectTransferType");
    const inputShipmentNo = document.getElementById("inputBoxNumber");
    const container = document.getElementById("lobbyContentContainer");
    const emptyState = document.getElementById("lobbyEmptyState");

    // ดึงรหัสต้นทางและปลายทางปัจจุบันจากหน้าเว็บหน้างานของเจเลอร์ (สมมุติตัวแปรกลางของระบบ)
    const currentOriginCode = (window.currentOriginBranch || "CKC01").substring(0, 2).toUpperCase();
    const currentDestCode = (window.currentDestBranch || "CTW03").substring(0, 2).toUpperCase();

    // เมื่อเลือกประเภท -> ทำการทดลองเจนเลขฟอร์แมตล่าสุดแสดงในกล่องทันที
    if (selectType && inputShipmentNo) {
        selectType.addEventListener("change", () => {
            const selectedVal = selectType.value;
            if (selectedVal) {
                const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "").split('').reverse().join(''); // ฟอร์แมต DDMMYYYY ล่าสุด
                const formattedDate = new Date().toLocaleDateString('en-GB').replace(/\//g, ""); // ดึง DDMMYYYY ตรงๆ
                
                // แอบดึงคิวจำลองโชว์ให้เจเลอร์เห็นความสวยงามก่อนกดตกลงสร้างจริง
                const tempCounter = (parseInt(localStorage.getItem('shipment_running_counter') || '0') + 1).toString().padStart(4, '0');
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

            // เช็กระบบป้องกันสาขาปลายทางซ้ำสำหรับเคสที่เปิดเอง (Store)
            if (container) {
                const existingColumns = container.querySelectorAll('.shipment-column');
                let isDuplicate = false;
                existingColumns.forEach(col => {
                    if (col.dataset.destination === currentDestCode && col.dataset.originType === "Store") {
                        isDuplicate = true;
                    }
                });

                if (isDuplicate) {
                    alert(`ปฏิเสธการสร้าง! มีใบงานส่งไปสาขาปลายทาง [02${currentDestCode}] ค้างอยู่ในระบบล็อบบี้แล้วครับโว้ย`);
                    return;
                }
            }

            // เจนเลขวิ่งจริงขั้นสุดท้ายแบบไม่ย้อนเลขซ้ำ
            const finalType = selectType.value;
            const finalDate = new Date().toLocaleDateString('en-GB').replace(/\//g, "");
            const finalRunningNum = getNextRunningNumber();
            const finalShipmentNo = `${finalType}-${finalDate}-01${currentOriginCode}-${finalRunningNum}-02${currentDestCode}`;

            if (container) {
                container.appendChild(createShipmentColumn(finalShipmentNo, "Store"));
                if (modal) modal.classList.add("hide");
                if (emptyState) emptyState.style.display = "none";
                
                // สั่ง Sync สเตตัสและส่งข้อมูลกลับไปตั้ง Card หน้าแรก (Transfer Out Task Hub)
                if (typeof window.syncToTransferOutTaskHub === "function") {
                    window.syncToTransferOutTaskHub(finalShipmentNo, "Assign");
                }
            }
        });
    }
});

//======================================================
// END ofFRONTEND: ระบบหน้า Lobby และจัดเลเยอร์ Shipment (เวอร์ชันยกเครื่องระดับ 3)
//====================================================== 
