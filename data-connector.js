// ==========================================
// [Firebase Configuration & Initialization]
// ==========================================
//===============
// [Firebase Setup] START
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
  getDocs, // 🚨 [เพิ่มใหม่]: สั่งนำเข้าคำสั่งดึงข้อมูลชุดใหญ่
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
// [Firebase Setup] END
//===============

// ==========================================
// [Firebase Real-Time Engine (Transfer Out)]
// ==========================================
//===============
// [fbSyncBoxData] START
//📍 [เครื่องส่งสัญญาณ: อัปเดตข้อมูลกล่องขึ้น Firebase]
window.fbSyncBoxData = async function (shipmentNo, boxNo, status, itemsArray) {
  try {
    const boxRef = doc(db, "LiveShipmentBoxes", `${shipmentNo}_${boxNo}`);
    await setDoc(boxRef, {
      shipmentNo: shipmentNo,
      boxNo: boxNo,
      status: status,
      items: itemsArray || [],
      updatedAt: new Date().getTime(),
    });
  } catch (error) {
    console.error("🔥 Firebase Sync Error:", error);
  }
};
// [fbSyncBoxData] END
//===============

//===============
// [fbDeleteBox] START
//📍 [เครื่องส่งสัญญาณ: แจ้งลบกล่องเดี่ยวทิ้ง]
window.fbDeleteBox = async function (shipmentNo, boxNo) {
  try {
    const boxRef = doc(db, "LiveShipmentBoxes", `${shipmentNo}_${boxNo}`);
    await deleteDoc(boxRef);
  } catch (error) {
    console.error("🔥 Firebase Delete Error:", error);
  }
};
// [fbDeleteBox] END
//===============

//===============
// [fbNukeShipment] START
//📍 [THE NUKE: ล้างบางข้อมูลกล่องทั้งหมดของชิปเมนต์นี้ออกจาก Firebase]
window.fbNukeShipment = async function (shipmentNo) {
  try {
    const q = query(
      collection(db, "LiveShipmentBoxes"),
      where("shipmentNo", "==", shipmentNo),
    );
    const querySnapshot = await getDocs(q);
    const deletePromises = [];
    querySnapshot.forEach((docSnap) => {
      deletePromises.push(deleteDoc(docSnap.ref));
    });
    await Promise.all(deletePromises);
    console.log(
      `💣 [Firebase Nuke] ระเบิดข้อมูลผีของชิปเมนต์ ${shipmentNo} ทิ้งเรียบร้อย!`,
    );
  } catch (error) {
    console.error("🔥 Firebase Nuke Error:", error);
  }
};
// [fbNukeShipment] END
//===============

//===============
// [fbListenToShipment] START
//📍 [หูฟังเรดาร์: ดักฟังชิปเมนต์แบบ Real-time ทำงานเมื่อเข้าหน้า Lobby]
window.fbCurrentListener = null;

window.fbListenToShipment = function (shipmentNo, colElement) {
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
      if (change.type === "removed") {
        if (typeof window.uiRemoveBoxFromFirebase === "function") {
          window.uiRemoveBoxFromFirebase(data.boxNo);
        }
      }
    });
  });
};
// [fbListenToShipment] END
//===============

//===============
// [fbStopListening] START
//📍 [ปิดหูฟัง: ประหยัดเน็ตตอนวางสายหรือถูกระเบิด]
window.fbStopListening = function () {
  if (window.fbCurrentListener) {
    window.fbCurrentListener();
    window.fbCurrentListener = null;
    console.log(`🔇 [Firebase Radar] ปิดการดักฟังชิปเมนต์แล้ว`);
  }
};
// [fbStopListening] END
//===============

// ==========================================
// [Module: Data Connector & API Dispatcher]
// ==========================================
//===============
// [Dispatcher Tests] START
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
// [Dispatcher Tests] END
//===============


// ==================================================================
// 📡 1. เปิดเรดาร์ Firebase (รอฟังเสียงตี๊ด) - สำหรับเครื่องที่รอรับแจ้งเตือน
// ==================================================================
window.startFirebaseListener = function() {
  const myBranch = String(localStorage.getItem("pattcha_branch") || "").trim().toUpperCase();
  if (!myBranch) return;

  // เช็คว่ามี Firebase โหลดไว้หรือยัง
  const db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
  if(!db) return;
  
  const q = db.collection("Pattcha_Notifications")
              .where("Destination", "==", myBranch)
              .where("Status", "==", "UNREAD");
  
  const alertSound = document.getElementById("alertSound") || new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');

  q.onSnapshot((snapshot) => {
    let hasNew = false;
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") hasNew = true; // มีคนยิงสัญญาณใหม่เข้ามา
    });

    const badge = document.getElementById("notifBadge"); // 💡 อย่าลืมเช็ค id แจ้งเตือนกระดิ่งให้ตรงกับ HTML เจเลอร์นะครับ
    
    if (!snapshot.empty) {
      if (badge) {
          badge.classList.remove("hide");
          badge.innerText = snapshot.docs.length;
      }
      // ร้อง ตี๊ด! ทันที
      if (hasNew) alertSound.play().catch(()=>{}); 
    } else {
      if (badge) badge.classList.add("hide");
    }
  });
};

// ==================================================================
// 🚀 2. ยิงสัญญาณกระตุ้น Firebase - สำหรับคนกดรับของ
// ==================================================================
window.triggerFirebaseNotification = async function(destBranch, shipmentNo) {
  try {
    const db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
    if(!db) return;

    await db.collection("Pattcha_Notifications").add({
      Destination: destBranch, // ส่งไปให้สาขาไหนดัง (ในที่นี้คือส่งกลับไปให้ ต้นทาง)
      Shipment_No: shipmentNo,
      Status: "UNREAD",
      Timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log(`ส่งสัญญาณ Firebase สะกิดสาขา ${destBranch} สำเร็จ!`);
  } catch (error) {
    console.error("ยิง Firebase ไม่ผ่าน:", error);
  }
};