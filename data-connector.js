import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDJSD2e6CnRVlRaB9XwiqX7rbTqBQ8r8Oo",
  authDomain: "pattcha-project.firebaseapp.com",
  projectId: "pattcha-project",
  storageBucket: "pattcha-project.firebasestorage.app",
  messagingSenderId: "184198463915",
  appId: "1:184198463915:web:7fd3ddfaaaa33471f292ee",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ==========================================
// 🚀 FIREBASE REAL-TIME ENGINE (TRANSFER OUT)
// ==========================================

// 📡 1. เครื่องส่งสัญญาณ: อัปเดตข้อมูลกล่องขึ้น Firebase (สร้าง/แก้/ปิดกล่อง)
window.fbSyncBoxData = async function (shipmentNo, boxNo, status, itemsArray) {
  try {
    const boxRef = doc(db, "LiveShipmentBoxes", `${shipmentNo}_${boxNo}`);
    await setDoc(boxRef, {
      shipmentNo: shipmentNo,
      boxNo: boxNo,
      status: status, // สถานะ "open" (กล่องเขียว) หรือ "Closed" (กล่องแดง)
      items: itemsArray || [],
      updatedAt: new Date().getTime(),
    });
  } catch (error) {
    console.error("🔥 Firebase Sync Error:", error);
  }
};

// 💣 2. เครื่องส่งสัญญาณ: แจ้งลบกล่องทิ้ง
window.fbDeleteBox = async function (shipmentNo, boxNo) {
  try {
    const boxRef = doc(db, "LiveShipmentBoxes", `${shipmentNo}_${boxNo}`);
    await deleteDoc(boxRef);
  } catch (error) {
    console.error("🔥 Firebase Delete Error:", error);
  }
};

// 🎧 3. หูฟังเรดาร์: ดักฟังชิปเมนต์แบบ Real-time (ทำงานเมื่อเข้าหน้า Lobby)
window.fbCurrentListener = null;

window.fbListenToShipment = function (shipmentNo, colElement) {
  // ปิดหูฟังอันเก่าก่อน (ถ้ามี) เพื่อไม่ให้โหลดข้อมูลข้ามสาขาซ้ำซ้อน
  if (window.fbCurrentListener) {
    window.fbCurrentListener();
  }

  console.log(
    `📡 [Firebase Radar] เริ่มดักฟังความเคลื่อนไหวชิปเมนต์: ${shipmentNo}`,
  );

  const q = query(
    collection(db, "LiveShipmentBoxes"),
    where("shipmentNo", "==", shipmentNo),
  );

  window.fbCurrentListener = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data();

      // ถ้าเพื่อนสร้างกล่องใหม่ หรืออัปเดตของในกล่อง หรือกด WRAP
      if (change.type === "added" || change.type === "modified") {
        if (typeof window.uiSyncBoxFromFirebase === "function") {
          window.uiSyncBoxFromFirebase(
            data.shipmentNo,
            data.boxNo,
            data.status,
            data.items,
            colElement,
          );
        }
      }
      // ถ้าเพื่อนกดยกเลิก/ลบกล่องทิ้ง
      if (change.type === "removed") {
        if (typeof window.uiRemoveBoxFromFirebase === "function") {
          window.uiRemoveBoxFromFirebase(data.boxNo);
        }
      }
    });
  });
};

// 🔇 4. ปิดหูฟัง (ใช้เพื่อประหยัดเน็ตตอนกด Back ออกจากหน้า Lobby)
window.fbStopListening = function () {
  if (window.fbCurrentListener) {
    window.fbCurrentListener();
    window.fbCurrentListener = null;
    console.log(`🔇 [Firebase Radar] ปิดการดักฟังชิปเมนต์แล้ว`);
  }
};

// ==========================================
// MODULE: DATA CONNECTOR & API DISPATCHER (ของเดิม)
// ==========================================
export function dispatchTransferOutData(payload) {
  console.log("📥 [Dispatcher] ได้รับข้อมูลจากหน้าแอป:", payload);
  if (payload.isExpress === true) {
    console.log("🔥 [Firebase] กำลังส่งข้อมูลแบบ Real-time...");
  } else {
    console.log("❄️ [@Google Workspace] กำลังส่งข้อมูลเข้า App Script...");
  }
}

export async function testSendData() {
  try {
    const docRef = await addDoc(collection(db, "TransferOut"), {
      SKU: "TEST-001",
      QTY: 1,
      fromBranch: "TestBranch",
      toBranch: "TestBranch2",
      status: "Pending",
    });
    console.log("ส่งข้อมูลสำเร็จ ID:", docRef.id);
  } catch (e) {
    console.error("ส่งไม่ผ่าน:", e);
  }
}
