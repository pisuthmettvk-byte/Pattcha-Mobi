// ============================================================================
// 🚚 PATTCHA INVENTORY - TRANSFER IN (SIMULATOR MODULE)
// ============================================================================

// 1. สร้างและฝัง Modal จำลองสัญญาณลงใน DOM แบบอัตโนมัติ
function injectTransferInSimulatorModal() {
  if (document.getElementById("transferInSimulatorModal")) return;

  const modalHTML = `
        <div id="transferInSimulatorModal" class="hide" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 100000; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(3px);">
            <div style="background: white; width: 95%; max-width: 450px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); display: flex; flex-direction: column; max-height: 85vh; overflow: hidden; animation: popIn 0.3s ease-out;">
                
                <!-- Header -->
                <div style="background: linear-gradient(to bottom, #198754 0%, #20c997 50%, #198754 100%); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #146c43;">
                    <h3 style="margin: 0; color: white; font-size: 16px; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);"><i class="fas fa-satellite-dish fa-pulse"></i> จำลองสัญญาณ Transfer In</h3>
                    <i class="fas fa-times" id="btnCloseSimulator" style="color: white; font-size: 20px; cursor: pointer;"></i>
                </div>

                <!-- Body (List of Pending Shipments) -->
                <div id="simulatorListContainer" style="padding: 20px; overflow-y: auto; flex-grow: 1; background: #f8f9fa;">
                    <!-- รายการจะถูกสร้างตรงนี้ -->
                </div>

                <!-- Footer -->
                <div style="padding: 15px; background: white; border-top: 1px solid #eee; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #888;">*หน้านี้ใช้สำหรับทดสอบ (UAT) ดึงของจาก Pending -> Complete</p>
                </div>
            </div>
        </div>
    `;

  const div = document.createElement("div");
  div.innerHTML = modalHTML;
  document.body.appendChild(div.firstElementChild);

  document.getElementById("btnCloseSimulator").addEventListener("click", () => {
    document.getElementById("transferInSimulatorModal").classList.add("hide");
  });
}


window.openTransferInSimulator = async function () {
  const modal = document.getElementById("transferInSimulatorModal");
  const container = document.getElementById("simulatorListContainer");
  if (!modal || !container) return;

  modal.classList.remove("hide");
  container.innerHTML =
    '<div style="text-align:center; padding: 30px;"><i class="fas fa-spinner fa-spin fa-2x" style="color: #198754;"></i><p>กำลังค้นหาสินค้าที่ส่งมาถึงคุณ...</p></div>';

  if (!window.cachedTransferTasks) {
    if (typeof loadExistingTasks === "function") await loadExistingTasks();
  }

  const tasks = window.cachedTransferTasks || [];
  const myBranch = String(localStorage.getItem("pattcha_branch") || "")
    .trim()
    .toUpperCase();

  // 🚨 ลอจิกใหม่: ดึงมาเฉพาะชิปเมนต์ที่ "สาขาเราเป็นปลายทาง (Destination)" เท่านั้น
  const pendingTasks = tasks.filter(
    (task) =>
      (task.Status || "").toUpperCase() === "PENDING" &&
      String(task.Destination || "")
        .trim()
        .toUpperCase() === myBranch,
  );

  if (pendingTasks.length === 0) {
    container.innerHTML = `
            <div style="text-align:center; padding: 40px 10px; color: #888;">
                <i class="fas fa-box-open" style="font-size: 40px; color: #ccc; margin-bottom: 10px;"></i>
                <p style="margin:0; font-weight: bold;">ไม่มีชิปเมนต์ส่งมาถึงสาขาคุณ</p>
                <p style="font-size: 12px; margin-top: 5px; color: #dc3545;">*หากคุณเป็นผู้ส่ง จะไม่สามารถกดรับของตัวเองได้</p>
            </div>`;
    return;
  }

  let html = "";
  pendingTasks.forEach((task) => {
    const originBranch = task.Origin_Branch || "-";
    html += `
            <div style="background: white; border: 1px solid #ddd; border-left: 5px solid #28a745; border-radius: 8px; padding: 12px 15px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: bold; font-size: 14px; color: #0044ff;">${task.Shipment_No}</div>
                    <div style="font-size: 12px; color: #555; margin-top: 4px;">
                        <i class="fas fa-store-alt" style="color: #666;"></i> ส่งมาจาก: <b>${originBranch}</b>
                    </div>
                </div>
                <!-- ส่งตัวแปร myBranch ไปเป็นตัวยืนยันว่าสาขานี้คือคนกดรับจริง -->
                <button onclick="simulateReceiveShipment('${task.Shipment_No}', '${myBranch}')" style="background: #198754; color: white; border: none; padding: 8px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: 0.2s;">
                    <i class="fas fa-check-circle"></i> รับของ
                </button>
            </div>
        `;
  });
  container.innerHTML = html;
};

// 3. ฟังก์ชันยิงสัญญาณจำลองเข้าหลังบ้าน
window.simulateReceiveShipment = async function (shipmentNo, destBranch) {
  const isConfirm = await window.safeConfirm(
    "จำลองการรับของ?",
    `ส่งสัญญาณว่าสาขา [${destBranch}] ได้รับชิปเมนต์\n${shipmentNo}\nเรียบร้อยแล้ว ใช่หรือไม่?`,
    "question",
  );

  if (!isConfirm) return;

  // เปิด Loading
  const loadingOverlay = document.createElement("div");
  loadingOverlay.style.cssText =
    "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 100005; display: flex; justify-content: center; align-items: center; color: white; font-size: 18px; font-weight: bold; backdrop-filter: blur(3px);";
  loadingOverlay.innerHTML =
    "<i class='fas fa-satellite-dish fa-spin' style='margin-right: 10px;'></i> กำลังส่งสัญญาณ...";
  document.body.appendChild(loadingOverlay);

  // 💡 [จุดเชื่อม API]: แก้ไข action ให้ตรงกับที่ทีมหลังบ้านเขียนไว้ได้เลย (สมมติใช้ update_shipment_status)
  const payload = {
    shipmentNo: shipmentNo,
    status: "Complete",
    branch: destBranch, // สาขาปลายทางที่กดรับ
  };

  fetch(CONFIG.API_URL + "?action=update_shipment_status", {
    method: "POST",
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then(async (data) => {
      document.body.removeChild(loadingOverlay);

      if (data.status === "success" || data.success) {
        if (typeof window.safeAlert === "function")
          window.safeAlert(
            "SUCCESS",
            `เปลี่ยนสถานะชิปเมนต์ ${shipmentNo} เป็น COMPLETE สำเร็จ!`,
            "success",
          );

        // 1. อัปเดต Cache ในเครื่องให้เป็น Complete
        if (window.cachedTransferTasks) {
          const targetTask = window.cachedTransferTasks.find(
            (t) => t.Shipment_No === shipmentNo,
          );
          if (targetTask) targetTask.Status = "Complete";
        }

        // 2. เคลียร์ข้อมูลขยะ (Draft) ของชิปเมนต์นี้ทิ้ง เพื่อคืนพื้นที่มือถือ
        if (typeof window.nukeShipmentCache === "function")
          window.nukeShipmentCache(shipmentNo);

        // 3. ปิดหน้าต่าง Modal
        document
          .getElementById("transferInSimulatorModal")
          .classList.add("hide");

        // 4. รีเฟรชหน้ารวมงาน (Task Hub) ให้การ์ดย้ายไปสีเขียว
        if (typeof loadExistingTasks === "function") await loadExistingTasks();
      } else {
        if (typeof window.safeAlert === "function")
          window.safeAlert(
            "ERROR",
            "หลังบ้านแจ้งเตือน: " + (data.message || "ไม่สามารถอัปเดตได้"),
            "error",
          );
      }
    })
    .catch((error) => {
      document.body.removeChild(loadingOverlay);
      if (typeof window.safeAlert === "function")
        window.safeAlert(
          "ERROR",
          "ไม่สามารถเชื่อมต่อ Server หลังบ้านได้",
          "error",
        );
    });
};

// 4. ฝัง Modal และผูกสวิตช์เข้ากับปุ่ม Transfer In เดิม
document.addEventListener("DOMContentLoaded", () => {
  // เสก Modal เตรียมไว้
  injectTransferInSimulatorModal();

  // ดักจับการกดปุ่ม Transfer In ในหน้าเมนูหลัก (สมมติว่าปุ่มมี ID หรือ Class ที่เฉพาะเจาะจง)
  // 💡 หากปุ่มของคุณมี ID อื่น ให้แก้ตรง "btnTransferIn" ได้เลยครับ
  const btnTransferIn = document.getElementById("btnTransferIn");
  if (btnTransferIn) {
    // ถอด Event เดิมออกก่อน (ถ้ามี) แล้วใส่ Event Simulator เข้าไปแทน
    const newBtnTransferIn = btnTransferIn.cloneNode(true);
    btnTransferIn.parentNode.replaceChild(newBtnTransferIn, btnTransferIn);

    newBtnTransferIn.addEventListener("click", () => {
      window.openTransferInSimulator();
    });
  } else {
    // หากไม่มี ID แต่เป็นปุ่มในหน้า Product Movement
    // เราสามารถดักจาก class หรือ text ได้ (fallback)
    const allButtons = document.querySelectorAll(".menu-button, .btn");
    allButtons.forEach((btn) => {
      if (btn.innerText.includes("Transfer In")) {
        btn.addEventListener("click", (e) => {
          e.preventDefault(); // ป้องกันการไปหน้าอื่น
          window.openTransferInSimulator();
        });
      }
    });
  }
});
