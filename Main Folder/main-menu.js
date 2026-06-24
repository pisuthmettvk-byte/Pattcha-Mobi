// ไฟล์: main-menu.js
// โมดูล: จัดการระบบเมนูหลักและการแจ้งเตือน (Notification Badge)

function mockReceiveSignal(hasPendingDelivery, qty = 0) {
  const badge = document.getElementById("badgeInbound");
  const countDisplay = badge.querySelector(".badge-count");

  // ป้องกัน Error หากหา Element ไม่เจอ
  if (!badge || !countDisplay) return; 

  if (hasPendingDelivery) {
    badge.classList.remove("hide"); // โชว์สัญลักษณ์รถบรรทุก
    countDisplay.innerText = qty;   // อัปเดตตัวเลข
  } else {
    badge.classList.add("hide");    // ซ่อนสัญลักษณ์
  }
}

// 🌟 พื้นที่สำหรับใส่ Event Listener ของปุ่มเมนูหลักอื่นๆ ในอนาคต