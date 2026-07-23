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


// ==========================================
// 📦 1. ฟังก์ชันวาดหน้าจอแสดงงานให้สาขาปลายทาง
// ==========================================
window.openTransferInSimulator = async function () {
  const modal = document.getElementById("transferInSimulatorModal");
  const container = document.getElementById("simulatorListContainer");
  if (!modal || !container) return;

  modal.classList.remove("hide");
  container.innerHTML = '<div style="text-align:center; padding: 30px;"><i class="fas fa-spinner fa-spin fa-2x" style="color: #198754;"></i><p>กำลังดึงข้อมูล...</p></div>';

  if (typeof loadExistingTasks === "function") {
    await loadExistingTasks();
  }

  const tasks = window.cachedTransferTasks || [];
  let myBranch = String(localStorage.getItem("pattcha_branch") || "").trim().toUpperCase();

  const pendingTasks = tasks.filter((task) => {
    const status = String(task.Status || "").trim().toUpperCase();
    const dest = String(task.Destination || "").trim().toUpperCase();
    const branchCol = String(task.Branch || "").trim().toUpperCase(); // 💡 อ่านคอลัมน์ Branch (แก้ตาบอด)

    if (!myBranch) return false;
    
    // เช็คว่าตรงกับคอลัมน์ Destination หรือคอลัมน์ Branch ก็ให้ดึงมาแสดงหมด
    const isMatchBranch = dest === myBranch || branchCol === myBranch || myBranch.includes(dest) || dest.includes(myBranch) || myBranch.includes(branchCol);
    
    return status === "PENDING" && isMatchBranch;
  });

  if (pendingTasks.length === 0) {
    container.innerHTML = `
        <div style="text-align:center; padding: 40px 10px; color: #888;">
            <i class="fas fa-box-open" style="font-size: 40px; color: #ccc; margin-bottom: 10px;"></i>
            <p style="margin:0; font-weight: bold;">ไม่มีชิปเมนต์ส่งมาถึงสาขาคุณ</p>
            <p style="font-size: 12px; margin-top: 5px; color: #dc3545;">*แน่ใจนะว่าปลายทางคือ ${myBranch}</p>
        </div>`;
    return;
  }

  // 🟢 วาดการ์ดและปุ่ม "รับของ"
  let html = "";
  pendingTasks.forEach((task) => {
    const originBranch = task.Origin_Branch || "-";
    html += `
        <div id="transfer-card-${task.Shipment_No}" style="background: white; border: 1px solid #ddd; border-left: 5px solid #28a745; border-radius: 8px; padding: 12px 15px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-weight: bold; font-size: 14px; color: #0044ff;">${task.Shipment_No}</div>
                <div style="font-size: 12px; color: #555; margin-top: 4px;">
                    <i class="fas fa-store-alt" style="color: #666;"></i> ส่งมาจาก: <b>${originBranch}</b>
                </div>
            </div>
            <!-- ปุ่มกดส่งรหัสคนส่ง (originBranch) เข้าไปในฟังก์ชันด้วย -->
            <button id="btn-receive-${task.Shipment_No}" onclick="simulateReceiveShipment('${task.Shipment_No}', '${myBranch}', '${originBranch}')" style="background: #198754; color: white; border: none; padding: 8px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: 0.2s;">
                <i class="fas fa-check-circle"></i> รับของ
            </button>
        </div>
    `;
  });
  container.innerHTML = html;
};

// ==========================================
// 📦 2. ฟังก์ชันกด "รับของ" และยิงเรดาร์
// ==========================================
window.simulateReceiveShipment = async function(shipmentNo, myBranch, originBranch) {
    const btn = document.getElementById(`btn-receive-${shipmentNo}`);
    if(btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> รอสักครู่...';
    }

    try {
        // (1) ยิง API ไปหา Google Workspace เพื่อแจ้งว่ารับของแล้ว + ตัดสต๊อก
        const response = await fetch(`${CONFIG.API_URL}?action=receive_shipment`, {
            method: 'POST',
            body: JSON.stringify({
                shipmentNo: shipmentNo,
                branch: myBranch
            })
        });
        const data = await response.json();

        // 🌟 (2) [นางเอกของงาน]: ยิงสัญญาณกลับไปสะกิด "สาขาต้นทาง (ผู้ส่ง)"
        if (typeof window.triggerFirebaseNotification === "function") {
            window.triggerFirebaseNotification(originBranch, shipmentNo);
        }

        // (3) ลบการ์ดออกจากหน้าจอ
        const card = document.getElementById(`transfer-card-${shipmentNo}`);
        if(card) {
            card.style.background = "#d1e7dd";
            card.innerHTML = `<div style="padding: 10px; width: 100%; text-align: center; color: #0f5132; font-weight: bold;"><i class="fas fa-check-circle"></i> รับชิปเมนต์ ${shipmentNo} สำเร็จ!</div>`;
            setTimeout(() => card.remove(), 2000); 
        }
        
        if (typeof customAlert === "function") {
            customAlert(`รับชิปเมนต์ ${shipmentNo} เข้าสต๊อกเรียบร้อย!`, "SUCCESS");
        } else {
            alert(`รับชิปเมนต์ ${shipmentNo} เข้าสต๊อกเรียบร้อย!`);
        }

        if(typeof loadExistingTasks === "function") await loadExistingTasks();

    } catch(e) {
        console.error("Error receiving shipment:", e);
        if(btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check-circle"></i> ลองรับของใหม่';
        }
    }
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


// ฟังก์ชันส่งสัญญาณเมื่อกดปุ่มรับของ
async function simulateReceiveShipment(shipmentNo, myBranch) {
    if (!confirm(`ยืนยันการรับชิปเมนต์ ${shipmentNo} เข้าสต๊อกสาขา ${myBranch} ใช่หรือไม่?`)) return;

    // เปลี่ยนหน้าตาปุ่มเพื่อบอกว่ากำลังทำงาน
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังประมวลผล...';
    btn.disabled = true;

    try {
        const payload = {
            action: 'receive_shipment',
            shipmentNo: shipmentNo,
            destBranch: myBranch
        };

        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.status === 'success') {
            alert(`✅ รับชิปเมนต์ ${shipmentNo} สำเร็จ! สต๊อกอัปเดตเรียบร้อยครับ`);
            window.openTransferInSimulator(); // รีเฟรชหน้าจอ
        } else {
            alert(`❌ เกิดข้อผิดพลาด: ${result.message}`);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        alert(`❌ การเชื่อมต่อล้มเหลว: ${error.message}`);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}