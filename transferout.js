const webAppUrl =
  "https://script.google.com/macros/s/AKfycbxl3g-8afxNG-q4UhOxVsffv-qO7Dum2koHWAKEbr98086bvPq-RwNQrEwGvzMZ5Jm7zQ/exec";

// ==========================================
// ⚙️ ตัวแปรตั้งค่าสถานะ (เปลี่ยนคำตรงนี้ จุดเดียวจบ!)
// ==========================================
const STATUS_CONFIG = {
  NEW: "Assign", // งานใหม่ที่เพิ่งสร้าง
  PENDING: "Pending", // งานที่ส่งออกแล้ว
  COMPLETE: "Complete", // งานที่รับเสร็จสมบูรณ์
};

// ======================================================
// 🛡️ [Phase 3] ระบบแช่แข็งล็อกเป้าหมาย (Isolated Freeze Interceptor)
// ======================================================
window.isGlobalDeleteMode = false;
window.activeDeleteShipment = null;

document.addEventListener(
  "click",
  (e) => {
    if (window.isGlobalDeleteMode) {
      // 1. อนุญาตให้กดปุ่มถังขยะใน "ชิปเมนต์ที่กำลังเปิดโหมดลบอยู่" เท่านั้น
      const isToggleActiveParent = e.target.closest(
        `.shipment-column[data-shipment="${window.activeDeleteShipment}"] .btn-master-delete`,
      );
      const isDeleteActiveParent = e.target.closest(
        `.shipment-column[data-shipment="${window.activeDeleteShipment}"] .parent-btn-delete`,
      );
      const isDeleteActiveChild = e.target.closest(
        `.shipment-column[data-shipment="${window.activeDeleteShipment}"] .child-btn-delete`,
      );

      if (isToggleActiveParent || isDeleteActiveParent || isDeleteActiveChild) {
        return;
      }

      // 2. อนุญาตให้กดปุ่มบนหน้าต่าง Popup
      if (
        e.target.closest(".swal-overlay") ||
        e.target.closest(".swal-modal") ||
        e.target.closest(".sweet-alert")
      ) {
        return;
      }

      // 3. บล็อกทุกอย่างที่เหลือในแอป
      const isInsideApp =
        e.target.closest("#transferOutLobbyView") ||
        e.target.closest(".app-header") ||
        e.target.closest(".main-content");
      if (isInsideApp) {
        e.preventDefault();
        e.stopPropagation();

        if (typeof safeAlert === "function") {
          safeAlert(
            "ระงับการใช้งานชั่วคราว!",
            "คุณกำลังเปิดโหมดลบข้อมูลของชิปเมนต์อื่นอยู่ กรุณาจัดการให้เสร็จ หรือกดปุ่มรูปถังขยะเพื่อปิดโหมดลบที่คันนั้นก่อนครับ",
            "error",
          );
        } else {
          alert(
            "ระงับการใช้งานชั่วคราว!\nกรุณาปิดโหมดลบของชิปเมนต์ที่กำลังทำงานอยู่ก่อนครับ",
          );
        }
      }
    }
  },
  true,
);
// ======================================================
// 🛡️ [Phase 3] ระบบแช่แข็งการสัมผัสทั้งหน้าจอ (Super Freeze Interceptor)
// ======================================================

// 📍 [แจ้งเตือนแบบป๊อปอัป 2 ปุ่ม สำหรับยืนยันการลบ]
window.safeConfirm = function (title, message) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "sys-alert-element";
    overlay.style.cssText =
      "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1000006; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(3px);";

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
  select.innerHTML =
    '<option value="" disabled selected>-- กำลังโหลดสาขา... --</option>';

  try {
    const response = await fetch(CONFIG.API_URL + "?action=get_branches");
    const rawText = await response.text();
    let branches;
    try {
      branches = JSON.parse(rawText);
    } catch (e) {
      console.error("🚨 API ดรอปดาวน์สาขาพัง! (ไม่ใช่ JSON):", rawText);
      select.innerHTML =
        '<option value="" disabled selected>-- โหลดล้มเหลว --</option>';
      return;
    }

    // 🟢 เก็บแคชข้อมูลสาขาทั้งหมดไว้ใช้แปลงรหัสใน Task Card
    if (Array.isArray(branches)) {
      window.appBranches = branches;
    }

    const myBranch = String(localStorage.getItem("pattcha_branch") || "")
      .trim()
      .toUpperCase();
    select.innerHTML =
      '<option value="" disabled selected>-- SELECT BRANCH --</option>';

    if (Array.isArray(branches)) {
      branches.forEach((branch) => {
        const branchId = String(
          branch.id || branch.Branch_ID || branch.BranchID || "",
        )
          .trim()
          .toUpperCase();
        const branchName =
          branch.name || branch.Branch_Name || branch.BranchName || "";

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
    if (select)
      select.innerHTML =
        '<option value="" disabled selected>-- โหลดล้มเหลว --</option>';
  }
}
// =================================================================
// 🚀 END กลุ่มที่ 1
// =================================================================



// ======================================================
// 📦 ฟังก์ชันสร้างกล่องลูก
// ======================================================

function createShipmentChildBox(baseBoxNo, boxRunningIndex) {
  const childBoxNo = `${baseBoxNo}-${String(boxRunningIndex).padStart(4, "0")}`;
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
  childDiv.addEventListener("click", function (e) {
    // ป้องกันไม่ให้เปิดหน้าต่าง ถ้าเปิดโหมดลบอยู่ หรือกดโดนปุ่มลบ/เช็คบ็อกซ์
    if (
      window.isGlobalDeleteMode ||
      e.target.closest(".child-btn-delete") ||
      e.target.closest(".child-checkbox")
    )
      return;

    // ดึงรหัสชิปเมนต์ตัวแม่
    const parentCol = childDiv.closest(".shipment-column");
    const shipmentNo = parentCol
      ? parentCol.getAttribute("data-shipment")
      : baseBoxNo;

    // เช็กสถานะว่ากล่องปิดหรือยัง
    const isClosed = childDiv.dataset.status === "Closed";

    // โยนข้อมูลไปที่ฟังก์ชันเปิดหน้า
    if (typeof window.openBoxDetails === "function") {
      window.openBoxDetails(shipmentNo, childBoxNo, childDiv, isClosed);
    }
  });

  // ♻️ ลอจิกปุ่มลบ (ลบกล่อง + คืนสต๊อก)
  const btnDeleteChild = childDiv.querySelector(".child-btn-delete");
  btnDeleteChild.addEventListener("click", async (e) => {
    e.stopPropagation();
    const parentCol = childDiv.closest(".shipment-column");
    const shipmentNo = parentCol
      ? parentCol.getAttribute("data-shipment")
      : baseBoxNo;
    const isClosed = childDiv.dataset.status === "Closed";

    const isConfirm = await window.safeConfirm(
      "ยืนยันลบกล่อง?",
      `ต้องการลบกล่อง ${childBoxNo} ทิ้งใช่หรือไม่?\n\n*หากปิดกล่องไปแล้ว สินค้าจะถูกส่งคืนกลับเข้าสต็อก (Available) อัตโนมัติ`,
      "error",
    );

    if (isConfirm) {
      if (isClosed) {
        // 🚨 กล่องปิดแล้ว: ยิง API ไปลบข้อมูลหลังบ้านและคืนสต๊อก
        const loadingOverlay = document.createElement("div");
        loadingOverlay.style.cssText =
          "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 9999999; display: flex; justify-content: center; align-items: center; color: white; font-size: 20px; font-weight: bold; backdrop-filter: blur(3px);";
        loadingOverlay.innerHTML =
          "<i class='fas fa-spinner fa-spin' style='margin-right: 10px;'></i> กำลังคืนสต๊อกและลบกล่อง...";
        document.body.appendChild(loadingOverlay);

        const branchCode = String(localStorage.getItem("pattcha_branch") || "")
          .trim()
          .toUpperCase();

        fetch(CONFIG.API_URL + "?action=delete_box", {
          method: "POST",
          body: JSON.stringify({
            shipmentId: shipmentNo,
            boxNo: childBoxNo,
            branch: branchCode,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            document.body.removeChild(loadingOverlay);
            if (data.status === "success" || data.success) {
              childDiv.remove();
              localStorage.removeItem(`draft_box_${shipmentNo}_${childBoxNo}`);
              localStorage.removeItem(`status_box_${shipmentNo}_${childBoxNo}`);

              if (parentCol) {
                const truckCountEl = parentCol.querySelector(
                  ".master-truck-count",
                );
                const remainingBoxes = parentCol.querySelectorAll(
                  ".shipment-child-box",
                ).length;
                if (truckCountEl) truckCountEl.textContent = remainingBoxes;
                if (typeof window.updateMasterShipmentTotals === "function")
                  window.updateMasterShipmentTotals(shipmentNo);
              }
              if (typeof window.updateExportButtonState === "function")
                window.updateExportButtonState();
              window.safeAlert(
                "SUCCESS",
                `ลบกล่องและคืนสต๊อกเรียบร้อย!`,
                "success",
              );
            } else {
              window.safeAlert(
                "ERROR",
                "เกิดข้อผิดพลาด: " + data.message,
                "error",
              );
            }
          })
          .catch((err) => {
            document.body.removeChild(loadingOverlay);
            window.safeAlert("ERROR", "ไม่สามารถติดต่อฐานข้อมูลได้", "error");
          });
      } else {
        // กล่องยังเปิดอยู่ (ยังไม่ได้หักสต๊อก): ลบกราฟิกบนหน้าจอทิ้งได้เลย
        childDiv.remove();
        localStorage.removeItem(`draft_box_${shipmentNo}_${childBoxNo}`);
        if (parentCol) {
          const truckCountEl = parentCol.querySelector(".master-truck-count");
          const remainingBoxes = parentCol.querySelectorAll(
            ".shipment-child-box",
          ).length;
          if (truckCountEl) truckCountEl.textContent = remainingBoxes;
        }
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
  const displayDate =
    dateParts && dateParts.length === 8
      ? `${dateParts.substring(0, 2)}/${dateParts.substring(2, 4)}/${dateParts.substring(6, 8)}`
      : new Date().toLocaleDateString("en-GB").substring(0, 8);

  const baseBoxNo =
    parts.length >= 5 ? parts.slice(2).join("-") : safeShipmentNo;

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
    if (
      window.isGlobalDeleteMode &&
      window.activeDeleteShipment !== safeShipmentNo
    ) {
      return;
    }
    const isDeleteMode = btnMasterDelete.classList.toggle("delete-mode-active");
    window.isGlobalDeleteMode = isDeleteMode;
    window.activeDeleteShipment = isDeleteMode ? safeShipmentNo : null;
    const childBoxes = childrenContainer.querySelectorAll(
      ".shipment-child-box",
    );

    if (isDeleteMode) {
      btnMasterDelete.style.color = "#ffc107";
      btnMasterDelete.style.transform = "scale(1.2)";
      headerDiv.style.border = "2px dashed #ffc107";
      btnParentDelete.classList.remove("hide");
      childBoxes.forEach((child) =>
        child.querySelector(".child-btn-delete").classList.remove("hide"),
      );
    } else {
      btnMasterDelete.style.color = "#c9302c";
      btnMasterDelete.style.transform = "scale(1)";
      headerDiv.style.border = "1px solid #ccc";
      btnParentDelete.classList.add("hide");
      childBoxes.forEach((child) =>
        child.querySelector(".child-btn-delete").classList.add("hide"),
      );
    }
  });

  // 2. ปุ่มกดลบแม่ของจริง (ใช้ safeConfirm และ POST API)
  btnParentDelete.addEventListener("click", async () => {
    // เรียกใช้ UI แจ้งเตือนของเจเลอร์
    const isConfirmed = await safeConfirm(
      "ยืนยันการลบชิปเมนต์?",
      `คุณต้องการลบชิปเมนต์ ${safeShipmentNo} ทิ้งใช่หรือไม่?`,
    );

    if (isConfirmed) {
      // โชว์ Loading
      const loadingOverlay = document.createElement("div");
      loadingOverlay.style.cssText =
        "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 9999999; display: flex; justify-content: center; align-items: center; color: white; font-size: 20px; font-weight: bold; backdrop-filter: blur(3px);";
      loadingOverlay.innerHTML =
        "<i class='fas fa-spinner fa-spin' style='margin-right: 10px;'></i> กำลังลบข้อมูล...";
      document.body.appendChild(loadingOverlay);

      const apiUrl =
        "https://script.google.com/macros/s/AKfycbxl3g-8afxNG-q4UhOxVsffv-qO7Dum2koHWAKEbr98086bvPq-RwNQrEwGvzMZ5Jm7zQ/exec";

      // ยิง API ผ่าน POST (เหมือน save_new_task)
      fetch(`${apiUrl}?action=delete_shipment`, {
        method: "POST",
        body: JSON.stringify({ shipmentNo: safeShipmentNo }),
      })
        .then((response) => response.json())
        .then((data) => {
          document.body.removeChild(loadingOverlay); // ปิด Loading

          if (data.success) {
            col.remove(); // ลบกราฟิกแม่
            const taskCards = document.querySelectorAll(
              "#transferOutTaskHubView .task-card",
            );
            taskCards.forEach((card) => {
              if (card.innerHTML.includes(safeShipmentNo)) card.remove(); // ลบ Task Card
            });

            window.isGlobalDeleteMode = false;
            window.activeDeleteShipment = null;

            const container = document.getElementById("lobbyContentContainer");
            const emptyState = document.getElementById("lobbyEmptyState");
            if (
              container &&
              container.querySelectorAll(".shipment-column").length === 0 &&
              emptyState
            ) {
              emptyState.style.display = "block";
            }
          } else {
            safeAlert("เกิดข้อผิดพลาด", data.message, "error");
          }
        })
        .catch((error) => {
          document.body.removeChild(loadingOverlay);
          safeAlert("ข้อผิดพลาด", "ไม่สามารถติดต่อฐานข้อมูลได้", "error");
        });
    }
  });

  // 3. สร้างกล่องลูก
  // ... (โค้ดเดิม) ...
  let boxIdCounter = 0;
  btnAddChildBox.addEventListener("click", () => {
    boxIdCounter++;
    const childEl = createShipmentChildBox(baseBoxNo, boxIdCounter);
    childrenContainer.appendChild(childEl);
    childrenContainer.classList.remove("hide");
    masterTruckCount.textContent = childrenContainer.querySelectorAll(
      ".shipment-child-box",
    ).length;
  });

  // 📍 [NEW] กู้คืนกล่อง (ทั้งแบบเปิดค้างและปิดแล้ว) กลับมาแสดงที่หน้าจออัตโนมัติ
  setTimeout(() => {
    if (typeof window.restoreDraftBoxesForShipment === "function") {
      const restoredMaxId = window.restoreDraftBoxesForShipment(
        safeShipmentNo,
        col,
      );
      // อัปเดตเลข running ของกล่องให้ต่อจากกล่องล่าสุด
      if (restoredMaxId > boxIdCounter) boxIdCounter = restoredMaxId;
    }
  }, 50);

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
              const matched = window.appBranches.find((b) => {
                const bId = String(b.id || b.Branch_ID || b.BranchID || "")
                  .trim()
                  .toUpperCase();
                return bId === displayId;
              });

              if (matched) {
                branchName =
                  matched.name || matched.Branch_Name || matched.BranchName || "";
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

            container.innerHTML =
              '<div style="text-align:center; padding: 40px 20px; color:#666;"><h4>กำลังดึงข้อมูลงาน...</h4><i class="fas fa-spinner fa-spin" style="font-size: 24px;"></i></div>';

            try {
              let tasks = null;

              // 📍 [The Resilience Fix: ระบบ Retry ป้องกัน Fetch ล้มเหลวชั่วขณะจากเซิร์ฟเวอร์ Google]
              try {
                const response = await fetch(CONFIG.API_URL + "?action=get_tasks");
                if (!response.ok) throw new Error("Network Fetch Failed");
                tasks = await response.json();
              } catch (firstTryError) {
                console.warn("🚨 [API RETRY] ดึงข้อมูลครั้งแรกขัดข้อง กำลังพยายามดึงข้อมูลอีกครั้ง...", firstTryError);
                // ลองดึงใหม่อีก 1 ครั้ง
                const retryResponse = await fetch(CONFIG.API_URL + "?action=get_tasks");
                tasks = await retryResponse.json();
              }

              container.innerHTML = "";

              if (!Array.isArray(tasks)) {
                if (emptyState) emptyState.style.display = "block";
                return;
              }

              const myBranch = String(localStorage.getItem("pattcha_branch") || "")
                .trim()
                .toUpperCase();

              // ลอจิกการฟิลเตอร์ยังคงความสมบูรณ์เดิม 100%
              const branchTasks = tasks.filter((task) => {
                const isMatchBranch = task.Destination === branchID;
                const isAssignStatus = (task.Status || "").toLowerCase() === "assign";
                const isMyOrigin =
                  String(task.Origin_Branch || "")
                    .trim()
                    .toUpperCase() === myBranch;
                return isMatchBranch && isAssignStatus && isMyOrigin;
              });

              if (branchTasks.length > 0) {
                if (emptyState) emptyState.style.display = "none";
                branchTasks.forEach((task) => {
                  // 🟢 เพิ่ม try...catch ป้องกันชิปเมนต์ที่รหัสพัง (เช่น 0202) ไม่ให้ทำให้จอขาวทั้งหน้า (สมบูรณ์แล้ว)
                  try {
                    if (typeof createShipmentColumn === "function") {
                      const safeNo = String(task.Shipment_No || "");
                      const col = createShipmentColumn(
                        safeNo,
                        task.Origin_Type || "Store",
                      );
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
              // แจ้งเตือนแบบเห็นชัดเจนขึ้นกรณีเน็ตพังจริงๆ
              container.innerHTML =
                '<div style="text-align:center; color:#dc3545; padding: 20px;"><i class="fas fa-wifi" style="font-size:24px; margin-bottom:10px;"></i><br>เกิดข้อผิดพลาดในการดึงข้อมูล อาจเกิดจากสัญญาณอินเทอร์เน็ต กรุณารีเฟรชครับ</div>';
            }
          }

          // [Render Lobby Tasks] END
          //===============

          function getNextRunningNumber() {
            let currentNum = parseInt(
              localStorage.getItem("shipment_running_counter") || "0",
            );
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
              const bId = String(b.id || b.Branch_ID || b.BranchID || "")
                .trim()
                .toUpperCase();
              const prefix = bId.substring(0, 2);
              return String(destCode).includes(prefix);
            });
            if (matched) {
              return String(matched.id || matched.Branch_ID || matched.BranchID || "")
                .trim()
                .toUpperCase();
            }
          }
          return destCode;
        }

        function createTransferOutTaskCard(
          date,
          shipmentNo,
          originType,
          destBranch,
          totalBox,
          totalItem,
          status,
        ) {
          const colorMap = {
            assign: "#dc3545",
            pending: "#e0a800",
            complete: "#28a745",
          };
          const statusKey = (status || "").toLowerCase();
          const leftBorderColor = colorMap[statusKey] || "#ccc";

          // 🟢 ค้นหาชื่อสาขาเต็ม จากแคช (เช่น [CTW03] Central World)
          let displayDestText = destBranch;
          if (window.appBranches && Array.isArray(window.appBranches)) {
            const matched = window.appBranches.find((b) => {
              const bId = String(b.id || b.Branch_ID || b.BranchID || "")
                .trim()
                .toUpperCase();
              return (
                bId === destBranch || String(destBranch).includes(bId.substring(0, 2))
              );
            });
            if (matched) {
              const branchName =
                matched.name || matched.Branch_Name || matched.BranchName || "";
              const branchId =
                matched.id || matched.Branch_ID || matched.BranchID || destBranch;
              displayDestText = `[${branchId}] ${branchName}`;
            }
          }

          // Fallback ถ้าหาไม่เจอจริงๆ ให้ใช้ getRealBranchCode
          if (
            displayDestText === destBranch &&
            typeof getRealBranchCode === "function"
          ) {
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
            if (!sessionStorage.getItem("selectedBranchName"))
              sessionStorage.setItem("selectedBranchName", "");

            try {
              const viewTaskHub = document.getElementById("transferOutTaskHubView");
              const viewLobby = document.getElementById("transferOutLobbyView");

              if (typeof navigationTo === "function" && viewTaskHub && viewLobby)
                navigationTo(viewTaskHub, viewLobby);
              else if (typeof showView === "function") showView("transferOutLobbyView");

              if (typeof loadLobbyHeader === "function") loadLobbyHeader();
              if (typeof renderLobbyTasks === "function")
                await renderLobbyTasks(destBranch);

              setTimeout(() => {
                if (typeof focusShipmentInLobby === "function")
                  focusShipmentInLobby(shipmentNo);
              }, 500);
            } catch (error) {
              console.error("🚨 วาร์ปเข้า Lobby ล้มเหลว:", error);
            }
          });

          return card;
        }

        // 🟢 ฟังก์ชันโหลดข้อมูลงานเข้าหน้า Transfer Out Task Hub พร้อมตัวกรองตรรกะ
        //===============
        // [Load Tasks & Filter by Origin] START
        async function loadExistingTasks() {
          const containers = [
            "assignContainer",
            "pendingContainer",
            "completeContainer",
          ];
          const assignContainer = document.getElementById("assignContainer");
          if (!assignContainer) return;

          try {
            const response = await fetch(CONFIG.API_URL + "?action=get_tasks");
            const tasks = await response.json();
            if (!Array.isArray(tasks)) return;

            containers.forEach((id) => {
              const el = document.getElementById(id);
              if (el) el.innerHTML = "";
            });

            // 📍 ดึงรหัสสาขาของตัวเองที่ล็อกอินอยู่
            const myBranch = String(localStorage.getItem("pattcha_branch") || "")
              .trim()
              .toUpperCase();
            let counts = { assign: 0, pending: 0, complete: 0 };

            tasks.forEach((task) => {
              // 📍 ดึงรหัสสาขาต้นทาง (Origin) จากฐานข้อมูล
              const originBranch = String(task.Origin_Branch || "")
                .trim()
                .toUpperCase();

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
                    task.Status,
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
            Object.keys(counts).forEach((key) => {
              const el = document.getElementById(key + "TaskCount");
              if (el)
                el.innerHTML = `Task (${counts[key]}) <i class="fas fa-chevron-down"></i>`;
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
          columns.forEach((col) => {
            if (col.innerHTML.includes(shipmentNo)) {
              col.style.transition = "background 0.5s";
              col.style.background = "#fff3cd"; // ไฮไลต์สีเหลือง
              col.scrollIntoView({ behavior: "smooth", block: "center" });

              setTimeout(() => {
                // 🟢 คืนค่ากลับเป็นเกรเดียนต์ลูกระนาดสีเงิน (ไม่ใช้สีขาว #ffffff)
                col.style.background =
                  "linear-gradient(to bottom, #d4d4d4 0%, #ffffff 50%, #a09f9f 100%)";
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
                  const key =
                    item.Type_Key || item.type_key || item.id || item.Key || "";
                  const desc =
                    item.Description ||
                    item.description ||
                    item.name ||
                    item.Desc ||
                    "";

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
// ♻️ [Phase 1.5] ระบบซิงก์ตัวเลขและกู้คืนกล่องที่หายไป (Lobby Sync & Restore)
// ======================================================

// 1. ฟังก์ชันกู้คืนกล่อง (ทั้งที่เปิดอยู่และปิดแล้ว) มาเรียงบนหน้าจออัตโนมัติ
window.restoreDraftBoxesForShipment = function(shipmentNo, colElement) {
    if (!colElement) return 0;
    const childrenContainer = colElement.querySelector(".shipment-children-container");
    if (!childrenContainer) return 0;

    const baseBoxNo = colElement.getAttribute("data-shipment").split("-").length >= 5 
        ? colElement.getAttribute("data-shipment").split("-").slice(2).join("-") 
        : colElement.getAttribute("data-shipment");

    let maxBoxIndex = 0;
    let hasDrafts = false;

    // ค้นหากล่องทั้งหมดของชิปเมนต์นี้ในเครื่อง
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(`draft_box_${shipmentNo}_`)) {
            hasDrafts = true;
            let draftData = [];
            try { draftData = JSON.parse(localStorage.getItem(key)) || []; } catch(e){}
            
            const boxNo = key.replace(`draft_box_${shipmentNo}_`, "");
            const parts = boxNo.split("-");
            const indexNum = parseInt(parts[parts.length - 1], 10) || 0;
            if (indexNum > maxBoxIndex) maxBoxIndex = indexNum;

            // ถ้ากล่องนี้ยังไม่ถูกวาดบนหน้าจอ ให้วาดขึ้นมา
            if (!childrenContainer.querySelector(`.shipment-child-box[data-box-no="${boxNo}"]`)) {
                if (typeof createShipmentChildBox === "function") {
                    const childEl = createShipmentChildBox(baseBoxNo, indexNum);
                    
                    // คำนวณยอดรวมของกล่องนั้น
                    let totalScan = 0, totalManual = 0;
                    draftData.forEach(item => {
                        totalScan += (item.scanQty || 0);
                        totalManual += (item.manualQty || 0);
                    });
                    
                    const scanEl = childEl.querySelector('.child-scan-qty');
                    const manualEl = childEl.querySelector('.child-manual-qty');
                    if (scanEl) scanEl.textContent = totalScan;
                    if (manualEl) manualEl.textContent = totalManual;

                    // 🌟 ตรวจสอบว่ากล่องนี้เคยกด WRAP ไปหรือยัง? ถ้าใช่ ให้เปลี่ยนเป็นกล่องแดง
                    const isClosed = localStorage.getItem(`status_box_${shipmentNo}_${boxNo}`) === "Closed";
                    if (isClosed) {
                        childEl.setAttribute("data-status", "Closed");
                        childEl.setAttribute("data-saved-items", JSON.stringify(draftData));
                        const boxIcon = childEl.querySelector(".box-status-icon");
                        const checkboxEl = childEl.querySelector(".child-checkbox");
                        if (boxIcon) {
                            boxIcon.className = "fas fa-box box-status-icon";
                            boxIcon.style.color = "#dc3545"; // สีแดง
                        }
                        if (checkboxEl) {
                            checkboxEl.disabled = false;
                            checkboxEl.style.cursor = "pointer";
                            checkboxEl.title = "เลือกกล่องนี้เพื่อเตรียมส่งออก";
                        }
                    }

                    childrenContainer.appendChild(childEl);
                }
            }
        }
    }

    // ถ้ามีกล่อง ให้โชว์คอนเทนเนอร์และอัปเดตยอดรวม Master
    if (hasDrafts) {
        childrenContainer.classList.remove("hide");
        const masterTruckEl = colElement.querySelector('.master-truck-count');
        if (masterTruckEl) masterTruckEl.textContent = childrenContainer.querySelectorAll(".shipment-child-box").length;
        if (typeof window.updateMasterShipmentTotals === "function") window.updateMasterShipmentTotals(shipmentNo);
    }

    return maxBoxIndex;
};

// 2. อัปเดตปุ่ม Back (ย้อนกลับ) ให้อัปเดตตัวเลขหน้า Lobby ก่อนออก
document.addEventListener("DOMContentLoaded", () => {
    const btnBackFromBox = document.getElementById("btnBackFromBox");
    if (btnBackFromBox) {
        const newBtnBack = btnBackFromBox.cloneNode(true); 
        btnBackFromBox.parentNode.replaceChild(newBtnBack, btnBackFromBox);
        
        newBtnBack.addEventListener("click", () => {
            if (window.currentActiveShipment && window.currentActiveBoxNo) {
                const childBoxEl = document.querySelector(`.shipment-child-box[data-box-no="${window.currentActiveBoxNo}"]`);
                
                if (childBoxEl) {
                    const isClosed = childBoxEl.getAttribute("data-status") === "Closed";
                    const currentItemsLength = (window.currentBoxItems || []).length;
                    
                    // 🚨 [FIX BUG 1]: ถ้ากล่องยังไม่ปิด และ "ไม่มีของเลย" -> ทำลายกล่องทิ้งอัตโนมัติ!
                    if (!isClosed && currentItemsLength === 0) {
                        localStorage.removeItem(`draft_box_${window.currentActiveShipment}_${window.currentActiveBoxNo}`);
                        childBoxEl.remove(); // ลบกราฟิกออกจากหน้า Lobby ทันที
                    } 
                    // ถ้ามีของ และยังไม่ปิด -> อัปเดตตัวเลข
                    else if (!isClosed && currentItemsLength > 0) {
                        let totalScan = 0, totalManual = 0;
                        window.currentBoxItems.forEach(item => {
                            totalScan += (item.scanQty || 0);
                            totalManual += (item.manualQty || 0);
                        });
                        const scanEl = childBoxEl.querySelector('.child-scan-qty');
                        const manualEl = childBoxEl.querySelector('.child-manual-qty');
                        if (scanEl) scanEl.textContent = totalScan;
                        if (manualEl) manualEl.textContent = totalManual;

                        // จำลงเครื่อง
                        localStorage.setItem(`draft_box_${window.currentActiveShipment}_${window.currentActiveBoxNo}`, JSON.stringify(window.currentBoxItems));
                    }
                }
                
                // สั่งอัปเดตยอดรถบรรทุก
                if (typeof window.updateMasterShipmentTotals === "function") {
                    window.updateMasterShipmentTotals(window.currentActiveShipment);
                }
            }

            // สลับหน้าจอ
            document.getElementById("boxDetailsView").classList.add("hide");
            const lobbyView = document.getElementById("transferOutLobbyView") || document.getElementById("lobbyView");
            if (lobbyView) lobbyView.classList.remove("hide");
            
            window.currentScannerContext = "stock"; 
            window.currentActiveShipment = null;
            window.currentActiveBoxNo = null;
            window.currentBoxElement = null;
        });
    }
});



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
        const btnCreateNewTask =
          document.getElementById("btnCreateNewTask") ||
          document.getElementById("btnNewTask");
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
        const btnSubmitDest =
          document.getElementById("btnSubmitDest") ||
          document.getElementById("btnNextDest");
        if (btnSubmitDest) {
          btnSubmitDest.addEventListener("click", async () => {
            const destDropdown = document.getElementById("selectDestination");

            // เช็กการเลือกข้อมูล
            if (!destDropdown || !destDropdown.value) {
              if (typeof safeAlert === "function")
                safeAlert(
                  "ข้อมูลไม่ครบถ้วน",
                  "กรุณาเลือกสาขาที่ต้องการสร้างงานก่อนครับ",
                  "warning",
                );
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
              if (typeof safeAlert === "function")
                safeAlert(
                  "ข้อมูลไม่ครบ",
                  "กรุณาเลือกประเภทการโอนก่อนครับ",
                  "warning",
                );
              else alert("กรุณาเลือกประเภทการโอนก่อนครับ!");
              return;
            }

            const myBranch = String(localStorage.getItem("pattcha_branch") || "CK")
              .trim()
              .toUpperCase();

            // 🟢 1. ดึงรหัสจากหน่วยความจำ (อาจเป็น CTW03 หรือ 02CT)
            const rawSelected = sessionStorage.getItem("selectedBranchID") || "KKN02";

            // 🟢 2. บังคับแปลงให้เป็นรหัสจริงเสมอ (ถ้าเป็น 02CT จะถูกแปลงกลับเป็น CTW03)
            const actualBranchID =
              typeof getRealBranchCode === "function"
                ? getRealBranchCode(rawSelected)
                : rawSelected;

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
            btnConfirm.innerHTML =
              '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';

            fetch(CONFIG.API_URL + "?action=save_new_task", {
              method: "POST",
              body: JSON.stringify(payload),
            })
              .then((res) => res.json())
              .then((res) => {
                if (res.status === "success") {
                  if (container && typeof createShipmentColumn === "function") {
                    container.appendChild(
                      createShipmentColumn(finalShipmentNo, "Store"),
                    );
                  }
                  if (shipmentBoxModal) shipmentBoxModal.classList.add("hide");
                  if (emptyState) emptyState.style.display = "none";

                  const taskHubAssignContainer =
                    document.getElementById("assignContainer");
                  if (
                    taskHubAssignContainer &&
                    typeof createTransferOutTaskCard === "function"
                  ) {
                    const newCard = createTransferOutTaskCard(
                      dateStr,
                      finalShipmentNo,
                      "Store",
                      targetDestination,
                      0,
                      0,
                      "Assign",
                    );
                    taskHubAssignContainer.appendChild(newCard);

                    const assignCountEl = document.getElementById("assignTaskCount");
                    if (assignCountEl) {
                      const currentCount =
                        taskHubAssignContainer.querySelectorAll(".task-card").length;
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
      window.updateShipmentBoxState = function (
        boxNo,
        status,
        scanQty = 0,
        manualQty = 0,
      ) {
        // 1. ค้นหากล่องลูกในหน้าจอ จากรหัสกล่อง
        const childBox = document.querySelector(
          `.shipment-child-box[data-box-no="${boxNo}"]`,
        );
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



// =================================================================
// 🔍 [Phase 3: Cross-Box Stock Radar] START

window.checkCrossBoxStock = function(sku) {
    let totalUsedInOtherBoxes = 0;
    let usedDetails = []; // เก็บประวัติว่าอยู่กล่องไหนบ้าง

    // วนลูปหาข้อมูลกล่องทั้งหมดที่เซฟไว้ในเครื่อง (localStorage)
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("draft_box_")) {
            
            // ข้ามกล่องปัจจุบันที่กำลังเปิดอยู่ (ป้องกันการบวกเบิ้ล)
            const currentDraftKey = `draft_box_${window.currentActiveShipment}_${window.currentActiveBoxNo}`;
            if (key === currentDraftKey) continue; 

            try {
                const boxData = JSON.parse(localStorage.getItem(key)) || [];
                const foundItem = boxData.find(item => item.sku === sku);
                
                if (foundItem) {
                    const qty = (foundItem.scanQty || 0) + (foundItem.manualQty || 0);
                    if (qty > 0) {
                        totalUsedInOtherBoxes += qty;
                        
                        // สกัดชื่อ Shipment และเลขกล่อง ออกมาโชว์
                        const parts = key.replace("draft_box_", "").split("_");
                        const shipmentName = parts[0];
                        const boxName = parts.slice(1).join("_"); // เผื่อเลขกล่องมีขีด
                        
                        usedDetails.push(`- ชิปเมนต์ ${shipmentName} [กล่อง ${boxName}] = ${qty} ชิ้น`);
                    }
                }
            } catch(e) {
                console.error("Radar Parse Error:", e);
            }
        }
    }
    
    return { totalUsedInOtherBoxes, usedDetails };
};

// 🔍 [Phase 3: Cross-Box Stock Radar] END
// =================================================================





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
              const lobbyView =
                document.getElementById("transferOutLobbyView") ||
                document.getElementById("lobbyView");
              if (lobbyView) {
                lobbyView.classList.remove("hide");
              }

              // 📍 [เพิ่มใหม่]: คืนค่ากล้องกลับไปโหมด Stock ทันทีที่ออกจากหน้ากล่อง
              window.currentScannerContext = "stock";

              // เคลียร์ค่า
              window.currentActiveShipment = null;
              window.currentActiveBoxNo = null;
              window.currentBoxElement = null;
            });

            // 2. ฟังก์ชันควบคุมสถานะปุ่ม WRAP (ใช้ Style ถอดแบบหน้า Lobby)
            window.updateBoxWrapButtonState = function (totalItemsCount) {
              const btnWrap = document.getElementById("btnBoxWrap");
              if (!btnWrap) return;

              if (totalItemsCount > 0) {
                // มีสินค้า = ปลดล็อก (สีแดงลูกระนาดแบบ EXPORT)
                btnWrap.disabled = false;
                btnWrap.style.background =
                  "linear-gradient(to bottom, #b02a37 0%, #ff6b6b 50%, #b02a37 100%)";
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

            // ==========================================
            // [Box Details View / Window & Scanner Logic]
            // ==========================================

//===============
// [openBoxDetails] START

// 3. ฟังก์ชันเปิดหน้า Box Details (ปรับรองรับปุ่มเหล็กลูกระนาด 100% และโหลดข้อมูลกล่องแดง)
window.openBoxDetails = function (shipmentNo, boxNo, boxElement, isClosed) {
  window.currentActiveShipment = shipmentNo;
  window.currentActiveBoxNo = boxNo;
  window.currentBoxElement = boxElement;

  // 🌟 [NEW] โหลดข้อมูลสินค้าจากที่ฝังไว้ (แก้ปัญหากล่องแดงว่างเปล่า)
  const savedItems = boxElement ? boxElement.getAttribute("data-saved-items") : null;
  if (savedItems) {
      window.currentBoxItems = JSON.parse(savedItems); // คืนชีพข้อมูลของในกล่อง
  } else {
      window.currentBoxItems = []; // ถ้าเป็นกล่องใหม่ที่ยังไม่ WRAP ให้ล้างเป็นกล่องเปล่า
  }

  // 📍 [Auto-Save Inject]: ดึงข้อมูล Draft จากหน่วยความจำมาสวมทับ (ถ้ามีของค้างอยู่ และกล่องยังไม่ปิด)
  if (!isClosed && typeof window.loadCurrentBoxDraft === "function") {
      const draftItems = window.loadCurrentBoxDraft(shipmentNo, boxNo);
      if (draftItems && draftItems.length > 0) {
          window.currentBoxItems = draftItems; // เอาของที่จำไว้กลับมาใส่ในกล่อง!
          console.log(`[Auto-Save] ♻️ กู้คืนสินค้า ${draftItems.length} รายการที่สแกนค้างไว้สำเร็จ!`);
      }
  }

  //📍 [Update UI Header Data]
  const shipmentTextEl = document.getElementById("boxDetailsShipmentText");
  const boxTextEl = document.getElementById("boxDetailsBoxText");
  if (shipmentTextEl) shipmentTextEl.textContent = `(Shipment No: ${shipmentNo})`;
  if (boxTextEl) boxTextEl.textContent = boxNo;

  const btnScanner = document.getElementById("btnBoxScanner");
  const btnWrap = document.getElementById("btnBoxWrap");
  const searchInput = document.getElementById("boxSearchInput");

  //📍 [Scanner Button Logic for Box Details]
  if (btnScanner) {
    const newBtnScanner = btnScanner.cloneNode(true);
    btnScanner.parentNode.replaceChild(newBtnScanner, btnScanner);

    newBtnScanner.addEventListener("click", async () => {
      // ---🔍 [Set context for scanner receiver]
      window.currentScannerContext = "box";

      if (typeof window.toggleScanner === "function") {
        const scanView = document.getElementById("scannerView");
        const boxDetailsView = document.getElementById("boxDetailsView");

        // ---🔍 [DOM Relocation]
        if (scanView && scanView.parentNode !== document.body) {
          document.body.appendChild(scanView);
        }

        // ---🔍 [Visibility Override]
        if (boxDetailsView) {
          boxDetailsView.classList.add("hide");
        }

        // ---🔍 [Trigger Golden Standard Scanner]
        await window.toggleScanner();
      } else {
        alert("ไม่พบโมดูลกล้อง (toggleScanner) ในระบบ");
      }
    });
  }

  //📍 [UI Render based on Box Status]
  if (isClosed) {
    // 🔴 โหมด Read-Only (ปิดกล่องแล้ว)
    if(btnWrap) btnWrap.style.display = "none"; // ซ่อนปุ่ม WRAP

    // 🌟 [UPDATE] คงดีไซน์เหล็กลูกระนาดไว้ แต่ปรับความกว้าง 100%
    const finalBtnScanner = document.getElementById("btnBoxScanner");
    if (finalBtnScanner) {
      finalBtnScanner.style.width = "100%"; // ขยายเต็มจอ
      finalBtnScanner.style.background = "linear-gradient(to bottom, #9e9e9e 0%, #e0e0e0 30%, #ffffff 50%, #e0e0e0 70%, #9e9e9e 100%)";
      finalBtnScanner.style.border = "1px solid #888";
      finalBtnScanner.style.color = "#333";
      finalBtnScanner.style.textShadow = "1px 1px 0px #fff";
      finalBtnScanner.style.boxShadow = "0 4px 6px rgba(0,0,0,0.2), inset 0 1px 3px rgba(255,255,255,0.8)";
    }
    if (searchInput) searchInput.placeholder = "สแกน/ค้นหาสินค้าในกล่องที่ปิดแล้ว...";
  } else {
    // 🟢 โหมดปกติ (กล่องเปิดอยู่)
    if(btnWrap) btnWrap.style.display = "flex"; // โชว์ปุ่ม WRAP

    // 🌟 [UPDATE] คืนร่างปุ่มกล้องเป็น "เหล็กสีเงินลูกระนาด" ขนาดปกติ
    const finalBtnScanner = document.getElementById("btnBoxScanner");
    if (finalBtnScanner) {
      finalBtnScanner.style.width = "48%"; // คืนขนาด 48% (ครึ่งจอ)
      finalBtnScanner.style.background = "linear-gradient(to bottom, #9e9e9e 0%, #e0e0e0 30%, #ffffff 50%, #e0e0e0 70%, #9e9e9e 100%)";
      finalBtnScanner.style.border = "1px solid #888";
      finalBtnScanner.style.color = "#333";
      finalBtnScanner.style.textShadow = "1px 1px 0px #fff";
      finalBtnScanner.style.boxShadow = "0 4px 6px rgba(0,0,0,0.2), inset 0 1px 3px rgba(255,255,255,0.8)";
    }
    if (searchInput) searchInput.placeholder = "ค้นหาสินค้าในกล่อง (SKU...)";

    // ---🔍 [Check and lock WRAP button if empty]
    if (typeof window.updateBoxWrapButtonState === "function") {
      window.updateBoxWrapButtonState(window.currentBoxItems.length);
    }
  }

  //📍 [View Transition]
  const lobbyView =
    document.getElementById("transferOutLobbyView") ||
    document.getElementById("lobbyView");
  if (lobbyView) lobbyView.classList.add("hide");
  
  const boxDetailsView = document.getElementById("boxDetailsView");
  if (boxDetailsView) boxDetailsView.classList.remove("hide");
  
  // 🌟 [NEW] วาดหน้าจอทันทีที่มีการโหลดข้อมูล (ดึงการ์ดสินค้าออกมาโชว์)
  if (typeof window.renderBoxContentArea === "function") {
      window.renderBoxContentArea();
  }
};

// [openBoxDetails] END
//===============


            // 5. ระบบช่องค้นหา Magic Search (Box Details)
            const boxSearchInput = document.getElementById("boxSearchInput");
            const boxClearSearchBtn = document.getElementById("boxClearSearchBtn");
            if (boxSearchInput && boxClearSearchBtn) {
              //📍 [Input Event Trigger]
              boxSearchInput.addEventListener("input", function () {
                if (this.value.trim().length > 0) {
                  boxClearSearchBtn.style.display = "flex"; // โชว์ X
                } else {
                  boxClearSearchBtn.style.display = "none"; // ซ่อน X
                }
              });

              //📍 [Clear Button Event Trigger]
              boxClearSearchBtn.addEventListener("click", function () {
                boxSearchInput.value = ""; // ล้างค่า
                this.style.display = "none"; // ซ่อนปุ่ม X
                boxSearchInput.focus(); // เด้งเคอร์เซอร์กลับไปที่ช่องพิมพ์
              });
            }

            //[Magic Search] END
            //===============


// 📦 Phase 5 & 6: ลอจิกหน้า Box Details และระบบปิดกล่อง (WRAP) END
// ===============================================================






// ======================================================
// 📦 Phase 7.1: โครงสร้างการ์ดสินค้า (อัปเดตให้กดดูสต็อกได้) START

              // 🟢 โหมด A: ค้นหาเพื่อเพิ่ม (อัปเดต: เช็กสต็อก = 0 ล็อกปุ่ม ADD)
              window.renderBoxModeACard = function (item) {
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
                                <span style="${stockAvail > 0 ? "color: #10b981;" : "color: #ef4444;"} font-weight: bold; display: flex; align-items: center; gap: 4px; font-size: 13px;">
                                  <i class="fas ${stockAvail > 0 ? "fa-thumbs-up" : "fa-times-circle"}"></i> ${stockAvail}
                                </span>
                                ${actionButtonHtml}
                              </div>
                            </div>
                          </div>`;
              };

// 🔴 โหมด B: สินค้าในกล่อง (In-Box Item)
window.renderBoxModeBCard = function (item, isClosedBox) {
  const safeSku = escapeHTML(item.sku || "-");
  const safeName = escapeHTML(item.name || "-");
  const priceStr = Number(item.price || 0).toLocaleString();

  // 🌟 [UPDATE ISSUE 1] เปลี่ยนไอคอนบาร์โค้ดเป็นสีดำ และสลับไอคอนตามการกดปุ่ม +/- 
  const isManualModified = item.manualQty > 0 || item.isManual === true;
  const iconHtml = isManualModified
      ? '<i class="fas fa-hand-paper" style="color: #f59e0b;" title="แก้ไขด้วยมือ"></i>'
      : '<i class="fas fa-barcode" style="color: #000000;" title="สแกนผ่านกล้อง"></i>'; // เปลี่ยนเป็นสีดำ

  const totalQty = (item.scanQty || 0) + (item.manualQty || 0);

  // 🌟 ซ่อนปุ่มต่างๆ ทันทีถ้ากล่องถูกปิดแล้ว
  const controlsHtml = isClosedBox
      ? "" 
      : `
          <div style="display: flex; align-items: center; gap: 8px;">
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
      <!-- 🌟 [UPDATE ISSUE 3] เพิ่ม ID: box-item-xxx เพื่อให้กล้องสามารถเลื่อนจอมาหาได้ -->
      <div id="box-item-${safeSku}" class="product-row" style="display: flex; gap: 15px; padding: 15px; background: #fff; border-bottom: 1px solid #eee; border-left: 4px solid #b02a37;">
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
        window.handleBoxSearch = function () {
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

          // 📍 [NEW FIX]: ตรวจสอบสถานะกล่องก่อนว่า "ปิดแล้ว (Closed)" หรือไม่?
          let isClosedBox = false;
          if (window.currentBoxElement) {
            isClosedBox = window.currentBoxElement.getAttribute("data-status") === "Closed";
          }

          if (isClosedBox) {
            // 🔴 โหมด Audit (กล่องปิด): เปลี่ยนช่องค้นหาให้ทำหน้าที่ "ฟิลเตอร์ของในกล่อง" แทน ห้ามดึงของจากคลังกลาง
            const results = window.currentBoxItems.filter((item) => {
              return Object.values(item).some(
                (val) => val != null && val.toString().toLowerCase().includes(query)
              );
            });

            if (results.length === 0) {
              container.innerHTML = '<div style="text-align:center; color:#999; margin-top: 50px;">❌ ไม่พบสินค้านี้ในกล่อง</div>';
              return;
            }
            // วาดการ์ดแบบโหมด B (ไม่มีปุ่ม ADD, ไม่มีปุ่มขยะ เพราะส่ง isClosedBox = true เข้าไป)
            container.innerHTML = results.map((item) => window.renderBoxModeBCard(item, true)).join("");

          } else {
            // 🟢 โหมดปกติ (กล่องเปิด): ค้นหาจากฐานข้อมูลรวม เพื่อกดปุ่ม ADD ได้ตามปกติ
            if (
              typeof localProductDatabase !== "undefined" &&
              localProductDatabase.length > 0
            ) {
              const results = localProductDatabase.filter((item) => {
                return Object.values(item).some(
                  (val) => val != null && val.toString().toLowerCase().includes(query),
                );
              });

              if (results.length === 0) {
                container.innerHTML =
                  '<div style="text-align:center; color:#999; margin-top: 50px;">❌ ไม่พบสินค้าในระบบ</div>';
                return;
              }

              // เรนเดอร์การ์ดโหมด A (ค้นหาเพื่อเพิ่ม)
              container.innerHTML = results
                .map((item) => window.renderBoxModeACard(item))
                .join("");
            } else {
              container.innerHTML =
                '<div style="text-align:center; color:#999; margin-top: 50px;">❌ ไม่มีข้อมูล (กรุณา Login ใหม่อีกครั้ง)</div>';
            }
          }
        };

        // 2. ฟังก์ชันล้างช่องค้นหา (ปุ่ม X)
        window.clearBoxSearch = function () {
          const inputElem = document.getElementById("boxSearchInput");
          const clearBtn = document.getElementById("boxClearSearchBtn");

          if (inputElem) {
            inputElem.value = "";
            inputElem.focus();
          }
          if (clearBtn) clearBtn.style.display = "none";

          window.renderBoxContentArea();
        };

          //===============
          // [Render Box Content Area] START

          // 3. ฟังก์ชันเรนเดอร์ของในกล่อง
          window.renderBoxContentArea = function () {
            const container = document.getElementById("boxContentArea");
            if (!container) return;

            // 🌟 [UPDATE ISSUE 2] เช็กสถานะกล่องว่าปิดหรือยัง เพื่อส่งไปบังคับซ่อนปุ่ม
            let isClosedBox = false;
            if (window.currentBoxElement) {
              isClosedBox = window.currentBoxElement.getAttribute("data-status") === "Closed";
            }

            if (window.currentBoxItems.length === 0) {
              container.innerHTML = `
                  <div id="boxEmptyState" style="text-align: center; color: #999; margin-top: 50px;">
                      <i class="fas fa-box-open" style="font-size: 40px; margin-bottom: 10px; color: #ccc;"></i>
                      <p style="font-weight: bold; margin: 0;">กล่องยังว่างเปล่า</p>
                      <p style="font-size: 12px;">ค้นหาหรือกดปุ่มสแกนด้านล่างเพื่อเพิ่มสินค้า</p>
                  </div>`;
              if (typeof window.updateBoxWrapButtonState === "function") {
                window.updateBoxWrapButtonState(0);
              }
                
              // 📍 [Auto-Save Inject] สั่งเซฟความจำ (สถานะกล่องว่าง) เพื่อเคลียร์ Draft ออกจากระบบ
              if (typeof window.saveCurrentBoxDraft === "function") {
                window.saveCurrentBoxDraft();
              }
              return;
            }

            // 🌟 [UPDATE ISSUE 2] ส่งค่า isClosedBox เข้าไปในการ์ดด้วย เพื่อปิดตายปุ่มทั้งหมด
            container.innerHTML = window.currentBoxItems
              .map((item) => window.renderBoxModeBCard(item, isClosedBox))
              .join("");
              
            if (typeof window.updateBoxWrapButtonState === "function") {
              window.updateBoxWrapButtonState(window.currentBoxItems.length);
            }

            // 📍 [Auto-Save Inject] สั่งเซฟความจำสินค้าลงเครื่อง (LocalStorage) ทุกครั้งที่ขยับหรือวาดหน้าจอใหม่
            if (typeof window.saveCurrentBoxDraft === "function") {
              window.saveCurrentBoxDraft();
            }
          };


        // 4. ฟังก์ชันกดปุ่ม ADD เข้ากล่อง
        window.addSearchItemToBox = function (sku) {
          // 📍 [เกราะป้องกันชั้นที่ 2]: ถ้ามีคนแอบกดปุ่ม ADD ผ่านโค้ดตอนกล่องปิด ให้บล็อกทันที!
          let isClosedBox = false;
          if (window.currentBoxElement) {
            isClosedBox = window.currentBoxElement.getAttribute("data-status") === "Closed";
          }
          if (isClosedBox) {
              if (typeof window.safeAlert === "function") window.safeAlert("LOCKED", "กล่องถูกปิดไปแล้ว ไม่สามารถเพิ่มสินค้าได้ครับ", "warning");
              return;
          }

          // 🚨 FIX: เรียกใช้ localProductDatabase ตรงๆ
          if (typeof localProductDatabase === "undefined") return;

          const product = localProductDatabase.find((p) => p.sku === sku);
          if (!product) return;

          const existingItem = window.currentBoxItems.find((item) => item.sku === sku);
          if (existingItem) {
            existingItem.manualQty += 1;
            existingItem.isManual = true;
          } else {
            window.currentBoxItems.push({
              ...product,
              scanQty: 0,
              manualQty: 1,
              isManual: true,
            });
          }

          window.clearBoxSearch();
        };

        // 5. ผูก Event Listener (Debounce)
        document.addEventListener("DOMContentLoaded", () => {
          const boxSearchInputElem = document.getElementById("boxSearchInput");
          if (boxSearchInputElem) {
            boxSearchInputElem.addEventListener(
              "input",
              debounceSearch((e) => {
                if (typeof window.handleBoxSearch === "function") {
                  window.handleBoxSearch();
                }
              }, 250),
            );
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
            overlay.style.cssText =
              "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1000006; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(3px);";

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
// ⚙️ ฟังก์ชันจัดการจำนวนสินค้า (อิงตามลอจิกดั้งเดิมที่เสถียรที่สุด) START

        window.increaseBoxItemQty = function (sku) {
          const item = window.currentBoxItems.find((p) => p.sku === sku);
          if (item) {
            // 1. นับยอดในกล่องปัจจุบัน
            const totalQtyInCurrentBox = (item.scanQty || 0) + (item.manualQty || 0);

            // 2. เรียกใช้เรดาร์เช็กยอดจาก "กล่องอื่นๆ"
            let otherBoxesUsed = 0;
            let otherBoxesText = "";
            if (typeof window.checkCrossBoxStock === "function") {
                const crossCheck = window.checkCrossBoxStock(sku);
                otherBoxesUsed = crossCheck.totalUsedInOtherBoxes;
                if (crossCheck.usedDetails.length > 0) {
                    otherBoxesText = crossCheck.usedDetails.join("\n");
                }
            }

            // 3. รวมยอดทั้งหมด (กล่องนี้ + กล่องอื่น)
            const grandTotalUsed = totalQtyInCurrentBox + otherBoxesUsed;

            // 4. เปรียบเทียบกับสต็อกจริงที่มี (Available)
            if (grandTotalUsed < item.availableStock) {
              item.manualQty += 1;
              item.isManual = true;
              window.renderBoxContentArea();
            } else {
              // 🚨 สร้างข้อความแจ้งเตือนแบบละเอียด
              let alertMsg = `มีสินค้าในสต็อกเพียง ${item.availableStock} ชิ้น\n(ไม่สามารถเพิ่มได้อีก)`;
              
              // ถ้ามีการบรรจุไปในกล่องอื่นแล้ว ให้ระบุให้พนักงานรู้เลยว่าของไปอยู่ที่ไหน!
              if (otherBoxesUsed > 0) {
                  alertMsg += `\n\n📦 สถานะการบรรจุตอนนี้:\n- อยู่ในกล่องนี้: ${totalQtyInCurrentBox} ชิ้น\n${otherBoxesText}`;
              }

              if (typeof window.safeAlert === "function") {
                window.safeAlert("STOCK LIMIT", alertMsg, "error");
              } else {
                alert(alertMsg);
              }
            }
          }
        };

        window.decreaseBoxItemQty = function (sku) {
          const item = window.currentBoxItems.find((p) => p.sku === sku);
          if (item) {
            item.isManual = true; 

            if (item.manualQty > 0) {
              item.manualQty -= 1;
            } else if (item.scanQty > 0) {
              item.scanQty -= 1;
            }

            if (item.scanQty + item.manualQty <= 0) {
              window.currentBoxItems = window.currentBoxItems.filter((p) => p.sku !== sku);
            }
            window.renderBoxContentArea();
          }
        };

        window.removeBoxItem = async function (sku) {
          let isConfirm = false;
          if (typeof window.safeConfirm === "function") {
            isConfirm = await window.safeConfirm(
              "CONFIRM DELETE",
              "ต้องการลบสินค้านี้ออกจากกล่องใช่หรือไม่?",
              "error"
            );
          } else {
            isConfirm = confirm("ต้องการลบสินค้านี้ออกจากกล่องใช่หรือไม่?");
          }

          if (isConfirm) {
            window.currentBoxItems = window.currentBoxItems.filter(
              (p) => p.sku !== sku
            );
            window.renderBoxContentArea();
          }
        };

// ⚙️ ฟังก์ชันจัดการจำนวนสินค้า (อิงตามลอจิกดั้งเดิมที่เสถียรที่สุด) END
// =================================================================




// ==========================================================
// 🛡️ แก้ไขปัญหา Z-Index แบบฝัง CSS ทับ (Force Override) START

document.addEventListener("DOMContentLoaded", () => {
  // สร้างแท็ก <style> บังคับให้ Modal และ Alert ลอยอยู่หน้าสุด (ทะลุหน้า Box Details แน่นอน 100%)
  const style = document.createElement("style");
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
            if (typeof window.renderBoxContentArea === "function") {
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




// ======================================================================
// 🚀 Phase 8: ระบบบันทึกข้อมูลกล่อง (UI สีเหลืองคำถาม + Backend 100%) START
// ======================================================================

window.updateMasterShipmentTotals = function(shipmentNo) {
    const masterCol = document.querySelector(`.shipment-column[data-shipment="${shipmentNo}"]`);
    if (!masterCol) return;

    const childBoxes = masterCol.querySelectorAll('.shipment-child-box');
    let totalScan = 0;
    let totalManual = 0;

    childBoxes.forEach(box => {
        const scanVal = parseInt(box.querySelector('.child-scan-qty')?.textContent || "0");
        const manualVal = parseInt(box.querySelector('.child-manual-qty')?.textContent || "0");
        totalScan += scanVal;
        totalManual += manualVal;
    });

    const masterScanEl = masterCol.querySelector('.master-scan-count');
    const masterManualEl = masterCol.querySelector('.master-manual-count');
    const masterTruckEl = masterCol.querySelector('.master-truck-count');

    if (masterScanEl) masterScanEl.textContent = totalScan;
    if (masterManualEl) masterManualEl.textContent = totalManual;
    if (masterTruckEl) masterTruckEl.textContent = childBoxes.length;
};

//===============
// [Submit Wrap Box] START
window.submitWrapBox = async function () {
  if (!window.currentBoxItems || window.currentBoxItems.length === 0) {
    if (typeof window.safeAlert === "function")
      window.safeAlert(
        "BOX EMPTY",
        "ไม่มีสินค้าในกล่อง ไม่สามารถ Wrap ได้ครับ",
        "warning",
      );
    return;
  }

  const shipmentElem = document.getElementById("boxDetailsShipmentText");
  const boxElem = document.getElementById("boxDetailsBoxText");

  let shipmentId = shipmentElem
    ? shipmentElem.innerText
        .replace("(Shipment No: ", "")
        .replace(")", "")
        .trim()
    : "UNKNOWN-SHP";
  const boxNumber = boxElem ? boxElem.innerText.trim() : "UNKNOWN-BOX";

  const isConfirmed = await safeConfirm(
    "ยืนยันการปิดกล่อง (WRAP)?",
    `คุณต้องการปิดกล่อง ${boxNumber} ใช่หรือไม่? เมื่อปิดแล้วจะไม่สามารถแก้ไขสินค้าในกล่องนี้ได้อีก`,
    "question",
  );
  if (!isConfirmed) return;

  const wrapBtn = document.getElementById("btnBoxWrap");
  let originalBtnHtml = wrapBtn ? wrapBtn.innerHTML : "";
  if (wrapBtn) {
    wrapBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> กำลังบันทึก...';
    wrapBtn.style.pointerEvents = "none";
    wrapBtn.style.opacity = "0.7";
  }

  let totalScanQty = 0;
  let totalManualQty = 0;

  const payload = {
    shipmentId: shipmentId,
    boxNumber: boxNumber,
    branch: String(localStorage.getItem("pattcha_branch") || "")
      .trim()
      .toUpperCase(),
    items: window.currentBoxItems.map((item) => {
      const scan = item.scanQty || 0;
      const manual = item.manualQty || 0;

      totalScanQty += scan;
      totalManualQty += manual;

      return {
        sku: item.sku,
        name: item.name,
        scanQty: scan,
        manualQty: manual,
        totalQty: scan + manual,
      };
    }),
  };

  fetch(CONFIG.API_URL + "?action=save_box", {
    method: "POST",
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      if (wrapBtn) {
        wrapBtn.innerHTML = originalBtnHtml;
        wrapBtn.style.pointerEvents = "auto";
        wrapBtn.style.opacity = "1";
      }

      if (data.status === "success" || data.success) {
        // 🌟 [NEW] บันทึกสถานะ "ปิดกล่องแล้ว" ลงเครื่อง
        localStorage.setItem(`status_box_${shipmentId}_${boxNumber}`, "Closed");

        if (window.currentBoxElement) {
          window.currentBoxElement.setAttribute("data-status", "Closed");
          const boxIcon = window.currentBoxElement.querySelector(
            ".fa-box-open, .fa-box",
          );
          if (boxIcon) {
            boxIcon.className = "fas fa-box";
            boxIcon.style.color = "#d93844";
          }

          const scanEl =
            window.currentBoxElement.querySelector(".child-scan-qty");
          const manualEl =
            window.currentBoxElement.querySelector(".child-manual-qty");
          if (scanEl) scanEl.textContent = totalScanQty;
          if (manualEl) manualEl.textContent = totalManualQty;

          // 🚨 [BUG FIX]: ปลดล็อก Checkbox ให้ติ๊กได้ทันทีโดยไม่ต้องรีเฟรชหน้า Lobby
          const checkboxEl = window.currentBoxElement.querySelector(".child-checkbox");
          if (checkboxEl) {
            checkboxEl.disabled = false;
            checkboxEl.style.cursor = "pointer";
            checkboxEl.title = "เลือกกล่องนี้เพื่อเตรียมส่งออก";
          }

          // ฝังข้อมูลสินค้าติดไว้กับตัวกล่อง
          window.currentBoxElement.setAttribute(
            "data-saved-items",
            JSON.stringify(window.currentBoxItems),
          );
        }

        if (typeof window.updateMasterShipmentTotals === "function") {
            window.updateMasterShipmentTotals(shipmentId);
        }
        
        if (typeof window.safeAlert === "function") {
          window.safeAlert(
            "SUCCESS",
            `บันทึกกล่อง ${boxNumber} สำเร็จ!`,
            "success",
          );
        }

        // สั่งให้ปุ่ม Back ทำงานเพื่อกลับหน้า Lobby
        document.getElementById("btnBackFromBox").click();

        setTimeout(() => {
            window.currentBoxItems = [];
            if (typeof window.renderBoxContentArea === "function") {
                window.renderBoxContentArea();
            }
        }, 300);

      } else {
        if (typeof window.safeAlert === "function")
          window.safeAlert(
            "ERROR",
            "เกิดข้อผิดพลาด: " + (data.message || "บันทึกล้มเหลว"),
            "error",
          );
      }
    })
    .catch((error) => {
      if (wrapBtn) {
        wrapBtn.innerHTML = originalBtnHtml;
        wrapBtn.style.pointerEvents = "auto";
        wrapBtn.style.opacity = "1";
      }
      if (typeof window.safeAlert === "function")
        window.safeAlert("ERROR", "ไม่สามารถติดต่อเซิร์ฟเวอร์ได้", "error");
    });
};
// [Submit Wrap Box] END
//===============



// 🚀 Phase 8: ระบบบันทึกข้อมูลกล่อง (UI สีเหลืองคำถาม + Backend 100%) END
// ======================================================================



//===================================
        // 📷 [addScannedItemToBox] START
        window.currentScannerContext = "box";

        window.addScannedItemToBox = async function (skuInput) {
          const boxDetailsView = document.getElementById("boxDetailsView");
          if (boxDetailsView) boxDetailsView.classList.remove("hide");

          const sku = skuInput ? skuInput.trim() : "";
          if (!sku) return;

          // 📍 [โหมด Audit: ตรวจเช็กกล่องแดง ห้ามบวกยอด]
          let isClosedBox = window.currentBoxElement && window.currentBoxElement.getAttribute("data-status") === "Closed";
          if (isClosedBox) {
            let existingItem = window.currentBoxItems.find(i => (i.sku || "").toString().toUpperCase() === sku.toUpperCase());
            if (existingItem) {
              if (navigator.vibrate) navigator.vibrate(100);
              
              const targetCard = document.getElementById(`box-item-${existingItem.sku}`);
              if (targetCard) {
                targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
                targetCard.style.transition = "background-color 0.3s";
                targetCard.style.backgroundColor = "#d1e7dd"; 
                setTimeout(() => { targetCard.style.backgroundColor = "#fff"; }, 1500);
              }
            } else {
              if (navigator.vibrate) navigator.vibrate(150);
              if (typeof window.safeAlert === "function") window.safeAlert("❌ ไม่พบสินค้า", `ไม่มีรหัส ${sku} ในกล่องนี้`, "error");
            }
            return; // ⛔ ห้ามบวกยอดเพิ่ม
          }

          // 📍 [โหมดปกติ: คืนชีพ The Phantom Search]
          let existingItem = window.currentBoxItems.find(i => (i.sku || "").toString().toUpperCase() === sku.toUpperCase());
          let oldManualQty = existingItem ? (existingItem.manualQty || 0) : 0;

          const boxSearchInput = document.getElementById("boxSearchInput");
          if (boxSearchInput) {
              boxSearchInput.value = sku;
              boxSearchInput.dispatchEvent(new Event("input", { bubbles: true }));

              setTimeout(() => {
                  // 🚨 [UPDATE FIX]: ตรวจสอบก่อนว่าสินค้านี้มีในฐานข้อมูลคลังจริงไหม!
                  if (typeof localProductDatabase !== "undefined") {
                      const productMatch = localProductDatabase.find(p => (p.sku || p.SKU || "").toString().trim().toUpperCase() === sku.toUpperCase());
                      
                      if (productMatch) {
                          // 🚨🚨 [NEW GATE]: เช็กสต็อกก่อนว่ามีของไหม? ถ้าสต็อก <= 0 บล็อกทันที!
                          const stockAvail = Number(productMatch.availableStock || 0);
                          if (stockAvail <= 0) {
                              if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // สั่นเตือน error
                              if (typeof window.clearBoxSearch === "function") window.clearBoxSearch(); 

                              // สร้างแถบแจ้งเตือนสีแดง (เลียนแบบแถบสีเหลือง)
                              const stockToast = document.createElement("div");
                              stockToast.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#dc3545; color:white; padding:8px 16px; border-radius:20px; font-weight:bold; z-index:99999999; box-shadow:0 4px 6px rgba(0,0,0,0.2); transition:opacity 0.5s;";
                              stockToast.innerHTML = `<i class="fas fa-ban"></i> สต็อกหมด: ${sku} (N/A)`;
                              document.body.appendChild(stockToast);
                              setTimeout(() => { stockToast.style.opacity = "0"; setTimeout(() => stockToast.remove(), 500); }, 2500);
                              
                              return; // ⛔ ตัดการทำงาน ห้ามเอาลงกล่องเด็ดขาด
                          }

                          // ✅ [พบสินค้าในระบบ และมีสต็อก] -> ดำเนินการเพิ่มลงกล่อง
                          if (typeof window.addSearchItemToBox === "function") {
                              window.addSearchItemToBox(sku); 
                              
                              setTimeout(() => {
                                  let updatedItem = window.currentBoxItems.find(i => (i.sku || "").toString().toUpperCase() === sku.toUpperCase());
                                  if (updatedItem) {
                                      if ((updatedItem.manualQty || 0) > oldManualQty) {
                                          updatedItem.manualQty = oldManualQty; 
                                      }
                                      updatedItem.scanQty = (updatedItem.scanQty || 0) + 1;
                                      updatedItem.totalQty = updatedItem.scanQty + updatedItem.manualQty;
                                      
                                      updatedItem.isManual = (updatedItem.manualQty > 0);
                                  }
                                  
                                  if (typeof window.renderBoxContentArea === "function") window.renderBoxContentArea();
                                  
                                  // แจ้งเตือนสีเขียว
                                  if (navigator.vibrate) navigator.vibrate(100);
                                  const toast = document.createElement("div");
                                  toast.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#28a745; color:white; padding:10px 20px; border-radius:30px; font-weight:bold; z-index:99999999; box-shadow:0 4px 6px rgba(0,0,0,0.2); transition:opacity 0.5s;";
                                  toast.innerHTML = `<i class="fas fa-check-circle"></i> สแกนลงกล่องแล้ว`;
                                  document.body.appendChild(toast);
                                  setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 500); }, 1500);
                              }, 50); 
                          }
                      } else {
                          // ❌ [ไม่พบสินค้าในระบบ] -> แจ้งเตือนสีเหลือง และไม่เพิ่มของ
                          if (navigator.vibrate) navigator.vibrate(150);
                          
                          if (typeof window.clearBoxSearch === "function") window.clearBoxSearch(); 

                          const failToast = document.createElement("div");
                          failToast.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#ffc107; color:#333; padding:8px 16px; border-radius:20px; font-weight:bold; z-index:99999999; box-shadow:0 4px 6px rgba(0,0,0,0.2); transition:opacity 0.5s;";
                          failToast.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ไม่พบสินค้า: ${sku} ในระบบ`;
                          document.body.appendChild(failToast);
                          setTimeout(() => { failToast.style.opacity = "0"; setTimeout(() => failToast.remove(), 500); }, 2500);
                      }
                  }
              }, 300);
          }
        };
        // [addScannedItemToBox] END
        //==================================



//==================================
// [Box Details View / Scanner Data Receiver] END
// =======================================================================





// ======================================================================
// 🖐️ Phase 10.1: ระบบจัดการยอดกดมือ (Manual Quantity Handler) START
                window.updateBoxItemQty = function (index, change) {
                  // 📍 ป้องกันไม่ให้แอบกดบวกลบตอนกล่องปิดไปแล้ว
                  let isClosedBox = window.currentBoxElement && window.currentBoxElement.getAttribute("data-status") === "Closed";
                  if (isClosedBox) {
                    if (typeof window.safeAlert === "function") window.safeAlert("LOCKED", "กล่องถูกปิดไปแล้ว ไม่สามารถแก้ไขจำนวนได้", "warning");
                    return;
                  }

                  let item = window.currentBoxItems[index];
                  if (!item) return;

                  // 📍 การกดปุ่ม + หรือ - ให้นับความเปลี่ยนแปลงที่ฝั่ง รูปมือ (manualQty) เท่านั้น!
                  let newManualQty = (item.manualQty || 0) + change;
                  if (newManualQty < 0) newManualQty = 0; // ห้ามติดลบ

                  item.manualQty = newManualQty;
                  item.totalQty = (item.scanQty || 0) + item.manualQty;

                  // ถ้าลดจนเหลือ 0 ชิ้น ให้ถามว่าจะลบไหม?
                  if (item.totalQty === 0) {
                    if (confirm("จำนวนสินค้าเป็น 0 ต้องการลบออกจากกล่องหรือไม่?")) {
                        window.currentBoxItems.splice(index, 1);
                    } else {
                        item.manualQty = 1; // คืนค่าให้ 1 ถ้าไม่ลบ
                        item.totalQty = (item.scanQty || 0) + 1;
                    }
                  }

                  if (typeof window.renderBoxContentArea === "function") window.renderBoxContentArea();
                };
// 🖐️ Phase 10.1: ระบบจัดการยอดกดมือ (Manual Quantity Handler) END
// ======================================================================



//===============
// [Auto-Save Box Draft System] START
window.saveCurrentBoxDraft = function() {
    // 1. ตรวจสอบว่ามีกล่องกำลังทำงานอยู่หรือไม่
    if (!window.currentActiveShipment || !window.currentActiveBoxNo) return;
    
    // 2. ไม่ต้องเซฟ draft ถ้าเป็นกล่องที่ "ปิด (Closed)" ไปแล้ว
    const isClosedBox = window.currentBoxElement && window.currentBoxElement.getAttribute("data-status") === "Closed";
    if (isClosedBox) return;

    // 3. สร้างกุญแจจำเพาะ (Key) สำหรับกล่องนี้ แล้วเซฟลงเครื่องมือถือ (localStorage)
    const draftKey = `draft_box_${window.currentActiveShipment}_${window.currentActiveBoxNo}`;
    localStorage.setItem(draftKey, JSON.stringify(window.currentBoxItems || []));
    console.log(`[Auto-Save] 💾 บันทึกสินค้าในกล่อง ${window.currentActiveBoxNo} อัตโนมัติ`);
};

window.loadCurrentBoxDraft = function(shipmentId, boxNo) {
    const draftKey = `draft_box_${shipmentId}_${boxNo}`;
    const savedData = localStorage.getItem(draftKey);
    if (savedData) {
        try {
            return JSON.parse(savedData);
        } catch (e) {
            console.error("Error parsing box draft", e);
            return [];
        }
    }
    return []; // ถ้าไม่มีของค้างอยู่ ส่งอาร์เรย์ว่างกลับไป
};

window.clearBoxDraft = function(shipmentId, boxNo) {
    const draftKey = `draft_box_${shipmentId}_${boxNo}`;
    localStorage.removeItem(draftKey); // ใช้ตอนกดปิดกล่อง (WRAP) เพื่อเคลียร์ความจำ
};
// [Auto-Save Box Draft System] END
//===============


// =================================================================
// 🚚 [Phase 4: Master Shipment Dispatch - Frontend] START

window.dispatchShipment = async function(shipmentNo) {
    const colElement = document.querySelector(`.shipment-column[data-shipment="${shipmentNo}"]`);
    if (!colElement) return;

    const childBoxes = colElement.querySelectorAll(".shipment-child-box");
    
    // กฎข้อที่ 1: ต้องมีอย่างน้อย 1 กล่อง
    if (childBoxes.length === 0) {
        if (typeof window.safeAlert === "function") window.safeAlert("EMPTY SHIPMENT", "ยังไม่มีการสร้างกล่องสินค้า ไม่สามารถจัดส่งได้ครับ", "warning");
        return;
    }

    // กฎข้อที่ 2: กล่องทุกใบต้องปิด (WRAP) แล้ว
    let allClosed = true;
    let openBoxes = [];
    childBoxes.forEach(box => {
        if (box.getAttribute("data-status") !== "Closed") {
            allClosed = false;
            openBoxes.push(box.getAttribute("data-box-no"));
        }
    });

    if (!allClosed) {
        if (typeof window.safeAlert === "function") {
            window.safeAlert(
                "UNFINISHED BOXES", 
                `มีกล่องที่ยังไม่ได้ WRAP จำนวน ${openBoxes.length} ใบ\n(เลขกล่อง: ${openBoxes.join(", ")})\n\nกรุณาปิดกล่องให้ครบทุกใบก่อนจัดส่งครับ`, 
                "error"
            );
        }
        return;
    }

    // 3. ยืนยันก่อนส่ง
    const isConfirm = await window.safeConfirm("ยืนยันการจัดส่ง (DISPATCH)?", `กล่องทั้งหมด ${childBoxes.length} ใบ (ปิดครบแล้ว)\nยืนยันการปล่อยรถชิปเมนต์ ${shipmentNo} ใช่หรือไม่?`, "question");
    if (!isConfirm) return;

    if (typeof window.safeAlert === "function") window.safeAlert("PROCESSING...", "กำลังส่งข้อมูลเข้าสู่ระบบส่วนกลาง...", "info");

    // 4. ส่งข้อมูล API ไปที่ Google Apps Script (Backend)
    const payload = {
        shipmentId: shipmentNo,
        branch: String(localStorage.getItem("pattcha_branch") || "").trim().toUpperCase()
    };

    fetch(CONFIG.API_URL + "?action=dispatch_shipment", {
        method: "POST",
        body: JSON.stringify(payload),
    })
    .then((res) => res.json())
    .then((data) => {
        if (data.status === "success" || data.success) {
            
            // 5. ล้างความจำ (Local Storage) ของชิปเมนต์นี้ทิ้งทั้งหมด
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && (key.startsWith(`draft_box_${shipmentNo}_`) || key.startsWith(`status_box_${shipmentNo}_`))) {
                    localStorage.removeItem(key);
                }
            }

            // 6. ลบคอลัมน์ออกจากหน้าจอ Lobby พร้อม Effect สวยงาม
            colElement.style.transition = "opacity 0.5s ease, transform 0.5s ease";
            colElement.style.opacity = "0";
            colElement.style.transform = "scale(0.9)";
            
            setTimeout(() => {
                colElement.remove();
                if (typeof window.safeAlert === "function") window.safeAlert("SUCCESS", `ปล่อยรถชิปเมนต์ ${shipmentNo} สำเร็จ!`, "success");
                
                // ถ้ารถใน Lobby หมดแล้ว ให้เด้งกลับไปหน้า Task Hub
                const remainingCols = document.querySelectorAll(".shipment-column");
                if (remainingCols.length === 0) {
                    const btnBack = document.getElementById("btnBackToTaskHub");
                    if(btnBack) btnBack.click(); 
                }
            }, 500);

        } else {
            if (typeof window.safeAlert === "function") window.safeAlert("ERROR", "เกิดข้อผิดพลาด: " + (data.message || "ไม่สามารถจัดส่งได้"), "error");
        }
    })
    .catch((error) => {
        if (typeof window.safeAlert === "function") window.safeAlert("ERROR", "ไม่สามารถติดต่อเซิร์ฟเวอร์ได้", "error");
    });
};
// 🚚 [Phase 4: Master Shipment Dispatch - Frontend] END
// =================================================================




// =================================================================
// 📦 [GROUP: CHECKBOX & EXPORT LOGIC] อัปเดต: UX สีแจ้งเตือน & โหลดที่ปุ่ม
// =================================================================

// 📡 1. เรดาร์ดักจับการติ๊ก Checkbox (ดักจับทั้งแม่และลูก)
document.addEventListener('change', function(e) {
    const colElement = e.target.closest('.shipment-column');
    if (!colElement) return;

    if (e.target.classList.contains('master-checkbox')) {
        const childBoxes = colElement.querySelectorAll('.shipment-child-box');
        let hasUnfinishedBoxes = false;

        childBoxes.forEach(box => {
            if (box.getAttribute("data-status") !== "Closed") hasUnfinishedBoxes = true;
        });

        // 🚨 บล็อกด้วยหน้าต่าง "สีแดง (error)"
        if (hasUnfinishedBoxes || childBoxes.length === 0) {
            e.target.checked = false;
            if (typeof window.safeAlert === "function") {
                window.safeAlert("UNFINISHED BOXES", "มีกล่องที่ยังไม่ได้ปิด หรือยังไม่มีกล่อง กรุณาจัดการให้เรียบร้อยก่อนครับ", "error");
            }
            return;
        }

        const isMasterChecked = e.target.checked;
        const childCheckboxes = colElement.querySelectorAll('.child-checkbox');
        childCheckboxes.forEach(cb => {
            if (!cb.disabled) cb.checked = isMasterChecked;
        });
    }

    if (e.target.classList.contains('child-checkbox')) {
        const masterCheckbox = colElement.querySelector('.master-checkbox');
        const allChildCheckboxes = colElement.querySelectorAll('.child-checkbox');
        
        let allChecked = true;
        allChildCheckboxes.forEach(cb => {
            if (!cb.checked) allChecked = false; 
        });

        if (masterCheckbox) masterCheckbox.checked = allChecked;
    }

    window.updateExportButtonState();
});

// 🔘 2. ฟังก์ชันอัปเดตหน้าตาปุ่ม EXPORT
window.updateExportButtonState = function() {
    const btnExport = document.getElementById('btnSubmitLobby');
    if (!btnExport) return;

    let hasReadyShipment = false;
    let readyShipmentCount = 0;

    const allShipments = document.querySelectorAll('.shipment-column');
    
    allShipments.forEach(col => {
        const childBoxes = col.querySelectorAll('.shipment-child-box');
        const checkedChildCheckboxes = col.querySelectorAll('.child-checkbox:checked');
        
        let allBoxesClosed = true;
        childBoxes.forEach(box => {
            if (box.getAttribute("data-status") !== "Closed") allBoxesClosed = false;
        });

        if (childBoxes.length > 0 && allBoxesClosed && childBoxes.length === checkedChildCheckboxes.length) {
            hasReadyShipment = true;
            readyShipmentCount++;
        }
    });

    if (hasReadyShipment) {
        btnExport.disabled = false;
        btnExport.style.background = "linear-gradient(to bottom, #b02a37 0%, #ff6b6b 50%, #b02a37 100%)";
        btnExport.style.color = "white";
        btnExport.style.borderLeft = "1px solid rgba(255,255,255,0.3)";
        btnExport.style.cursor = "pointer";
        btnExport.innerHTML = `EXPORT (${readyShipmentCount})`; 
    } else {
        btnExport.disabled = true;
        btnExport.style.background = "rgba(0, 0, 0, 0.466)";
        btnExport.style.color = "#aaa";
        btnExport.style.borderLeft = "1px solid rgba(255,255,255,0.2)";
        btnExport.style.cursor = "not-allowed";
        btnExport.innerHTML = `EXPORT`;
    }
};

// 📡 3. เรดาร์ดักจับการคลิกปุ่ม EXPORT
document.addEventListener('click', function(e) {
    const targetBtn = e.target.closest('#btnSubmitLobby');
    if (targetBtn) {
        if (targetBtn.disabled) return; 
        window.processExport();
    }
});

// 🚀 4. ฟังก์ชันเริ่มจัดส่ง (EXPORT)
window.processExport = async function() {
    const readyMasterCheckbox = document.querySelector('.master-checkbox:checked');
    if (!readyMasterCheckbox) return;

    const colElement = readyMasterCheckbox.closest('.shipment-column');
    const shipmentNo = colElement.getAttribute("data-shipment");

    // 🧮 สกัดข้อมูลนับยอดกล่องและยอดสินค้า
    const childBoxes = colElement.querySelectorAll(".shipment-child-box");
    let totalBoxCount = childBoxes.length;
    let totalItemCount = 0;

    childBoxes.forEach(box => {
        const savedData = box.getAttribute("data-saved-items");
        if (savedData) {
            try {
                const items = JSON.parse(savedData);
                items.forEach(item => {
                    totalItemCount += (item.scanQty || 0) + (item.manualQty || 0);
                });
            } catch(e) {}
        }
    });

    let isConfirm = false;
    if (typeof window.safeConfirm === "function") {
        isConfirm = await window.safeConfirm(
            "ยืนยันการ EXPORT?", 
            `ส่งข้อมูลชิปเมนต์ ${shipmentNo}\nจำนวนกล่อง: ${totalBoxCount} ใบ\nจำนวนสินค้า: ${totalItemCount} ชิ้น\nยืนยันใช่หรือไม่?`, 
            "question"
        );
    } else {
        isConfirm = confirm(`ต้องการส่งข้อมูลชิปเมนต์ ${shipmentNo} ใช่หรือไม่?`);
    }
    if (!isConfirm) return;

    // 🌟 [ปรับปรุง UI]: ลบ Popup แจ้งเตือนตรงกลางออก เปลี่ยนเป็นตัวหมุนที่ปุ่ม
    const btnExport = document.getElementById('btnSubmitLobby');
    let originalBtnHtml = btnExport ? btnExport.innerHTML : "EXPORT";
    if (btnExport) {
        btnExport.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> กำลังดำเนินการ...';
        btnExport.style.pointerEvents = "none";
        btnExport.style.opacity = "0.7";
    }

    const payload = {
        shipmentId: shipmentNo,
        branch: String(localStorage.getItem("pattcha_branch") || "").trim().toUpperCase(),
        totalBox: totalBoxCount,
        totalItem: totalItemCount
    };

    fetch(CONFIG.API_URL + "?action=dispatch_shipment", {
        method: "POST",
        body: JSON.stringify(payload),
    })
    .then((res) => res.json())
    .then((data) => {
        if (data.status === "success" || data.success) {
            // ล้างความจำ Draft
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && (key.startsWith(`draft_box_${shipmentNo}_`) || key.startsWith(`status_box_${shipmentNo}_`))) {
                    localStorage.removeItem(key);
                }
            }

            colElement.style.opacity = "0";
            setTimeout(() => {
                colElement.remove();
                window.updateExportButtonState();
                
                // แจ้งเตือนสีเขียว Success เพียงรอบเดียวจบ
                if (typeof window.safeAlert === "function") window.safeAlert("SUCCESS", `EXPORT ชิปเมนต์ ${shipmentNo} สำเร็จ!`, "success");
                
                if (document.querySelectorAll(".shipment-column").length === 0) {
                    const btnBack = document.getElementById("btnCancelFromLobby") || document.getElementById("btnBackToTaskHub");
                    if(btnBack) btnBack.click(); 
                }
            }, 500);
        } else {
            if (btnExport) { btnExport.innerHTML = originalBtnHtml; btnExport.style.pointerEvents = "auto"; btnExport.style.opacity = "1"; }
            if (typeof window.safeAlert === "function") window.safeAlert("ERROR", "ข้อผิดพลาด: " + (data.message || "ไม่สามารถ Export ได้"), "error");
        }
    })
    .catch((error) => {
        if (btnExport) { btnExport.innerHTML = originalBtnHtml; btnExport.style.pointerEvents = "auto"; btnExport.style.opacity = "1"; }
        if (typeof window.safeAlert === "function") window.safeAlert("ERROR", "ไม่สามารถติดต่อเซิร์ฟเวอร์ได้", "error");
    });
};

// =================================================================
// 📦 [GROUP: CHECKBOX & EXPORT LOGIC] END
// =================================================================