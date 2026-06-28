// ==========================================
// MODULE: DATA CONNECTOR & API DISPATCHER
// ==========================================
// data-connector.js
function dispatchTransferOutData(payload) {
  console.log("📥 [Dispatcher] ได้รับข้อมูลจากหน้าแอป:", payload);
  if (payload.isExpress === true) {
    console.log("🔥 [Firebase] กำลังส่งข้อมูลแบบ Real-time...");
  } else {
    console.log("❄️ [@Google Workspace] กำลังส่งข้อมูลเข้า App Script...");
  }
}
