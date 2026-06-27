// ==========================================
// MODULE: DATA CONNECTOR & API DISPATCHER
// ==========================================

function dispatchTransferOutData(payload) {
    console.log("📥 [Dispatcher] ได้รับข้อมูลจากหน้าแอป:", payload);

    // เช็คประเภทงานจาก Toggle หรือเงื่อนไข
    if (payload.isExpress === true) {
        // วิ่งสายด่วน (Real-time)
        console.log("🔥 [Firebase] กำลังส่งข้อมูลแบบ Real-time...");
        // อนาคต: ใส่โค้ด Firebase ตรงนี้
    } else {
        // วิ่งสายปกติ (Lead time)
        console.log("❄️ [@Google Workspace] กำลังส่งข้อมูลเข้า App Script...");
        // อนาคต: ใส่โค้ด fetch() เรียก App Script ตรงนี้
    }
    
    // แจ้งเตือนเมื่อเสร็จสิ้น
    setTimeout(() => {
        console.log("✅ [Success] บันทึกข้อมูลสำเร็จ!");
    }, 1000);
}
