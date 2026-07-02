import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
 
  authDomain: "pattcha-project.firebaseapp.com",
  projectId: "pattcha-project",
  storageBucket: "pattcha-project.firebasestorage.app",
  messagingSenderId: "184198463915",
  appId: "1:184198463915:web:7fd3ddfaaaa33471f292ee",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ==========================================
// MODULE: DATA CONNECTOR & API DISPATCHER
// ==========================================
// data-connector.js
export function dispatchTransferOutData(payload) {
  console.log("📥 [Dispatcher] ได้รับข้อมูลจากหน้าแอป:", payload);
  if (payload.isExpress === true) {
    console.log("🔥 [Firebase] กำลังส่งข้อมูลแบบ Real-time...");
  } else {
    console.log("❄️ [@Google Workspace] กำลังส่งข้อมูลเข้า App Script...");
  }
}

// ฟังก์ชันส่งข้อมูลทดสอบ
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
