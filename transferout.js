// =================================================================
// 🚀 START Drop Down & ปุ่มควบคุม (หน้าเลือกสาขา)
// =================================================================
async function loadBranchesIntoDropdown() {
  const select = document.getElementById("selectDestination");
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwQ0BGX1vUVs6iRkRacx60Th-ytxScDOJh00w9yDjT6JNfwC-2n2fTI1_MSvwgLQJYDtA/exec";

  if (!select) return;

  try {
    const response = await fetch(`${SCRIPT_URL}?action=get_branches`);
    const data = await response.json();

    // จัดการข้อมูลให้เป็น Array (ใช้ชื่อตัวแปร branches ให้ตรงกันทั้งฟังก์ชัน)
    let branches = Array.isArray(data) ? data : data.data || [];

    const myBranch = String(localStorage.getItem("pattcha_branch") || "")
      .trim()
      .toUpperCase();

    select.innerHTML =
      '<option value="" disabled selected>-- SELECT BRANCH --</option>';

    // ใช้ตัวแปร branches ที่เราเตรียมไว้
    branches.forEach((branch) => {
      const branchId = String(branch.id || "")
        .trim()
        .toUpperCase();
      const status = String(branch.status || "")
        .trim()
        .toUpperCase();
      const isActive = status.includes("ACTIVE");

      // กรอง: ต้องไม่ใช่สาขาตัวเอง AND ต้องมีคำว่า ACTIVE
      if (branchId !== myBranch && isActive) {
        const option = document.createElement("option");
        option.value = branch.id;
        option.textContent = `${branch.id} - ${branch.name}`;
        select.appendChild(option);
      }
    });
  } catch (error) {
    console.error("🚨 Error loading branches:", error);
    select.innerHTML =
      '<option value="" disabled selected>-- โหลดข้อมูลล้มเหลว --</option>';
  }
}


document.addEventListener("DOMContentLoaded", () => {
  loadBranchesIntoDropdown();

  const btnNext = document.getElementById("btnSubmitDest");
  const btnCancel = document.getElementById("btnBackFromDest");



  
        // ฟังก์ชันปุ่ม NEXT ในหน้าเลือสาขา
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
                `.shipment-card[data-branch-id="${branchID}"]`,
            );

            if (existingLobby) {
                alert("สาขานี้ถูกสร้างล็อบบี้ไว้แล้ว ระบบจะพาคุณไปที่หน้าเดิมครับ");
            } else {
                // --- ส่วนที่เปลี่ยน: เรียกใช้ฟังก์ชันกลางจาก main-menu.js ---
                // เรากำหนด Doc No สดๆ ตรงนี้ได้เลยครับ
                const newDocNo = "#TO-" + new Date().getTime().toString().slice(-7);

                // สร้างการ์ดด้วยฟังก์ชันกลาง
                const newCard = createUniversalCard(branchName, newDocNo, "pending");

                // เอาการ์ดไปแปะใน wrapper ของหน้า Hub
                const lobbyWrapper = document.querySelector(".task-list-wrapper");
                if (lobbyWrapper) {
                lobbyWrapper.appendChild(newCard);
                }
            }

            sessionStorage.setItem("selectedBranchID", branchID);
            sessionStorage.setItem("selectedBranchName", branchName);

            showView("transferOutLobbyView");
            loadLobbyHeader(); // เรียกให้ Header อัปเดตทันที
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
