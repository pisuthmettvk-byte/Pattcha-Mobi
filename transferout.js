// =================================================================
//  สร้างการ์ด CREATE CARD IN TRANSFER OUT TASK 
// =================================================================

function createNewLobbyCard(branchID, branchName) {
  const pendingWrapper = document.querySelector(
    ".task-column-group:nth-child(2) .task-list-wrapper",
  );

  // สร้างโครงสร้างการ์ด (อ้างอิงจากโครงสร้างที่เจเลอร์ส่งมา)
  const card = document.createElement("div");
  card.className = "task-list-item shipment-card";
  card.setAttribute("data-branch-id", branchID); // ใส่ ID ไว้เช็กซ้ำ
  card.setAttribute("data-status", "pending"); // ใส่สถานะ

  card.style.cssText =
    "width: 100%; border-left: 6px solid #d39e00; border-bottom: 1px solid #e0e0e0; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; background: white;";

  card.innerHTML = `
        <div style="text-align: left;">
            <div style="font-weight: bold; font-size: 14px; color: #333;">Branch: ${branchID}</div>
            <span style="font-size: 12px; color: #777;">${branchName}</span>
        </div>
        <i class="fas fa-chevron-right" style="color: #ccc; font-size: 14px;"></i>
    `;

  // ผูก Event ให้กดแล้วเด้งเข้า Lobby สาขานั้นๆ
  card.addEventListener("click", () => {
    sessionStorage.setItem("selectedBranchID", branchID);
    sessionStorage.setItem("selectedBranchName", branchName);
    showView("transferOutLobbyView");
    loadLobbyHeader();
  });

  pendingWrapper.appendChild(card);
}







// =================================================================
// 🚀 Drop Down & ปุ่มควบคุม (หน้าเลือกสาขา)
// =================================================================

async function loadBranchesIntoDropdown() {
  const select = document.getElementById("selectDestination");
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbx0yi_782xbohnzTxXrUoWztD-LUfZygzH_l8yLHS0dZeeGzVkWZ7Km9vP6BVhJrU3SNg/exec";

  if (!select) return;

  try {
    const response = await fetch(`${SCRIPT_URL}?action=get_branches`);
    const branches = await response.json();
    select.innerHTML =
      '<option value="" disabled selected>-- SELECT BRANCH --</option>';
    branches.forEach((branch) => {
      const option = document.createElement("option");
      option.value = branch.id;
      option.textContent = `${branch.id} - ${branch.name}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading branches:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadBranchesIntoDropdown();

  const btnNext = document.getElementById("btnSubmitDest");
  const btnCancel = document.getElementById("btnBackFromDest");

  // ฟังก์ชันปุ่ม NEXT
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
        createNewLobbyCard(branchID, branchName);
      }

      sessionStorage.setItem("selectedBranchID", branchID);
      sessionStorage.setItem("selectedBranchName", branchName);

      showView("transferOutLobbyView");
      loadLobbyHeader(); // เรียกให้ Header อัปเดตทันที
    });
  }

  // ฟังก์ชันปุ่ม CANCEL
  if (btnCancel) {
    btnCancel.addEventListener("click", () => {
      const select = document.getElementById("selectDestination");
      if (select) select.selectedIndex = 0;
      showView("transferOutTaskHubView");
    });
  }
});













// =================================================================
// 🚀 Branch Lobby ล็อบบีสาขา
// =================================================================
function loadLobbyHeader() {
  const branchID = sessionStorage.getItem("selectedBranchID");
  const branchName = sessionStorage.getItem("selectedBranchName");
  const headerElement = document.getElementById("lobbyBranchHeaderName"); // แก้ ID ให้ตรงกับ HTML ของเจเลอร์

  if (headerElement && branchID && branchName) {
    headerElement.textContent = `[${branchID}] - ${branchName}`;
  }
}
