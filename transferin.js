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

// ==========================================
// 📦 ฟังก์ชันกด "รับของ" (แบบธรรมดา ตัดระบบ Real-time ออกเพื่อปิดจบ Flow)
// ==========================================
window.simulateReceiveShipment = async function (shipmentNo, myBranch, originBranch) {
  // 1. หยุดการทำงานซ้ำซ้อน (ป้องกันการกดรัวๆ)
  if (window.isReceivingTask) return;
  
  if (
    !confirm(
      `ยืนยันการรับชิปเมนต์ ${shipmentNo} เข้าสต๊อกสาขา ${myBranch} ใช่หรือไม่?`,
    )
  )
    return;

  // เปิดสถานะกำลังประมวลผล
  window.isReceivingTask = true;

  const btn = document.getElementById(`btn-receive-${shipmentNo}`);
  const originalText = btn ? btn.innerHTML : "";

  // 🛡️ ป้องกันการกดซ้ำ: ปิดปุ่มทันทีและแสดงสถานะ
  if (btn) {
    btn.disabled = true;
    btn.style.pointerEvents = "none";
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังประมวลผล...';
  }

  try {
    // 📦 1. แพ็กข้อมูลแบบ Form Data ธรรมดา เพื่อให้หลังบ้าน (Google Workspace) อ่านออก
    const formData = new URLSearchParams();
    formData.append("action", "receive_shipment"); // ส่งคำสั่งรับของ / อัปเดตสถานะเป็น Complete
    formData.append("shipmentNo", shipmentNo);
    formData.append("destBranch", myBranch);
    formData.append("originBranch", originBranch); 

    // 🚀 2. ยิง POST ไปที่ App Script ตรงๆ 
    const response = await fetch(CONFIG.API_URL, {
      method: "POST",
      body: formData 
    });

    const result = await response.json();

    // ✅ 3. ถ้าระบบหลังบ้านตอบกลับมาว่าสำเร็จ
    if (result.status === "success" || result.success) {
      
      // ❌ (ตัดฟังก์ชัน triggerFirebaseNotification ทิ้งไปตามคำสั่ง) ❌

      // อัปเดตหน้าจอแอปฝั่งคนรับให้รู้ว่ารับเสร็จแล้ว
      const card = document.getElementById(`transfer-card-${shipmentNo}`);
      if (card) {
        card.style.background = "#d1e7dd";
        card.innerHTML = `<div style="padding: 10px; width: 100%; text-align: center; color: #0f5132; font-weight: bold;"><i class="fas fa-check-circle"></i> รับชิปเมนต์ ${shipmentNo} สำเร็จ! (สถานะ: COMPLETE)</div>`;
        setTimeout(() => card.remove(), 2000);
      }

      if (typeof customAlert === "function") {
        customAlert(`รับชิปเมนต์ ${shipmentNo} เข้าสต๊อกเรียบร้อย!`, "SUCCESS");
      } else {
        alert(`✅ รับชิปเมนต์ ${shipmentNo} สำเร็จ! สถานะเปลี่ยนเป็น COMPLETE เรียบร้อยครับ`);
      }

      // รีโหลดข้อมูลงานใหม่ทันที 
      if (typeof loadExistingTasks === "function") {
          setTimeout(loadExistingTasks, 1500); 
      }
      
    } else {
      // ❌ กรณี Backend ฟ้องว่ามีข้อผิดพลาด
      alert(
        `❌ เกิดข้อผิดพลาด: ${result.message || "ไม่สามารถรับของได้"}\n(Action ที่ส่งไปคือ: ${result.receivedAction || "ไม่มี"})`,
      );

      // คืนค่าปุ่มให้กลับมากดใหม่ได้
      if (btn) {
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.style.pointerEvents = "auto";
      }
    }
  } catch (e) {
    console.error("Error receiving shipment:", e);
    alert(`❌ การเชื่อมต่อล้มเหลว: ${e.message}`);

    // คืนค่าปุ่มเมื่อเกิด Error จาก Network
    if (btn) {
      btn.innerHTML = originalText;
      btn.disabled = false;
      btn.style.pointerEvents = "auto";
    }
  } finally {
      // ปิดสถานะประมวลผล เพื่อให้กดปุ่มอื่นต่อได้
      window.isReceivingTask = false;
  }
};