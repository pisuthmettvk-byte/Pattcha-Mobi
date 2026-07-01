// =================================================================
// 🚀 Drop Down ของหน้าต่างเลือกสาขา (Dynamic Branch Loader)
// =================================================================
async function loadBranchesIntoDropdown() {
  const select = document.getElementById("selectDestination");
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbx0yi_782xbohnzTxXrUoWztD-LUfZygzH_l8yLHS0dZeeGzVkWZ7Km9vP6BVhJrU3SNg/exec";

  if (!select) return; // ถ้าไม่เจอ Dropdown ให้ข้ามไป

  try {
    // ยิงคำสั่งไปดึงข้อมูลจาก GAS
    const response = await fetch(`${SCRIPT_URL}?action=get_branches`);
    const branches = await response.json();

    // เคลียร์รายการเก่า (เก็บอันแรกไว้เป็น Placeholder)
    select.innerHTML =
      '<option value="" disabled selected>-- SELECT BRANCH --</option>';

    // วนลูปสร้างรายการใหม่จากฐานข้อมูล
    branches.forEach((branch) => {
      const option = document.createElement("option");
      option.value = branch.id;
      option.textContent = `${branch.id} - ${branch.name}`;
      select.appendChild(option);
    });

    console.log("Branch dropdown loaded successfully.");
  } catch (error) {
    console.error("Error loading branches:", error);
  }
}

// เรียกใช้ฟังก์ชันทันทีที่หน้าเว็บโหลดเสร็จ
document.addEventListener("DOMContentLoaded", loadBranchesIntoDropdown);
// =================================================================
