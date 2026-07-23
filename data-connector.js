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



// ==========================================
// 🔔 FIREBASE NOTIFICATION ENGINE (100% COMPLETE)
// ==========================================

// 1. ตัวถอดรหัสสาขากลับ (01CK -> CKC01)
window.decodeBranch = function(obfCode) {
    const map = { "01CK": "CKC01", "02KK": "KKN02", "03IC": "ICS03" };
    return map[obfCode] || obfCode;
};

// 2. ฟังก์ชันยิงสัญญาณ (เมื่อปลายทางกด "รับของ")
window.triggerFirebaseNotification = async function(docNo) {
    try {
        if (!window.db) return console.error("Firebase DB is not initialized");
        
        // แยกสาขาต้นทางออกจากเลขที่เอกสาร (เช่น TS-23072026-01CK-0005-02KK)
        const parts = docNo.split("-");
        if (parts.length < 4) return;
        const sourceObf = parts[2]; // ได้ "01CK"
        const destinationBranch = window.decodeBranch(sourceObf); // แปลงเป็น "CKC01"
        const myBranch = localStorage.getItem("pattcha_branch") || "UNKN";

        await window.addDoc(window.collection(window.db, "Pattcha_Notifications"), {
            Destination: destinationBranch, // ส่งไปหา CKC01
            From: myBranch, // จาก KKN02
            DocNo: docNo,
            Message: `สาขา ${myBranch} ได้รับเอกสาร ${docNo} เรียบร้อยแล้ว`,
            Timestamp: window.serverTimestamp(),
            isRead: false
        });
        console.log("✅ ยิงสัญญาณแจ้งเตือนไปที่", destinationBranch, "สำเร็จ!");
    } catch (error) {
        console.error("🚨 ยิงสัญญาณล้มเหลว:", error);
    }
};

// 3. ฟังก์ชันดักฟังเสียงและจุดแดง (ทำงานฝั่งต้นทางที่รอรับ)
window.startFirebaseListener = function() {
    const myBranch = localStorage.getItem("pattcha_branch");
    if (!myBranch || !window.db) return;

    const q = window.query(
        window.collection(window.db, "Pattcha_Notifications"),
        window.where("Destination", "==", myBranch),
        window.where("isRead", "==", false)
    );

    // ปิดตัวเก่าก่อนเปิดตัวใหม่ ป้องกันการฟังซ้ำซ้อน
    if (window.fbUnsubscribe) window.fbUnsubscribe();

    window.fbUnsubscribe = window.onSnapshot(q, (snapshot) => {
        const notifBadge = document.getElementById("notifBadge");
        
        if (snapshot.empty) {
            if (notifBadge) notifBadge.classList.add("hide");
            return;
        }

        // นับจำนวนข้อความที่ยังไม่ได้อ่าน
        if (notifBadge) {
            notifBadge.innerText = snapshot.size;
            notifBadge.classList.remove("hide");
        }

        // ตรวจสอบว่ามีข้อความ "เข้ามาใหม่สดๆ" หรือไม่ ถ้ามีให้ร้องเตือน!
        let hasNew = false;
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") hasNew = true;
        });

        if (hasNew) window.playAlertSound();
    });
};

// 4. ฟังก์ชันเล่นเสียงเตือน 
window.playAlertSound = function() {
    const audio = document.getElementById("alertSound");
    if (audio) {
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("เบราว์เซอร์บล็อกเสียง ต้องคลิกหน้าเว็บก่อน 1 ครั้ง:", error);
            });
        }
    }
};
