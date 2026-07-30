// ==========================================
// [Firebase Configuration & Initialization]
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  initializeFirestore, // 🚨 <--- 1. เพิ่มคำนี้เข้ามาเพื่อใช้ตั้งค่า Long Polling
  collection,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDoYWx6mMkU-WvaXyQcpWBhmpNNQToQqcE",
  authDomain: "pattcha-project.firebaseapp.com",
  projectId: "pattcha-project",
  storageBucket: "pattcha-project.firebasestorage.app",
  messagingSenderId: "184198463915",
  appId: "1:184198463915:web:7fd3ddfaaaa33471f292ee",
};

const app = initializeApp(firebaseConfig);

// 🛠️ 2. อัปเกรดการเชื่อมต่อ Firestore ให้บังคับใช้ Long Polling เพื่อแก้ปัญหา WebChannel 400/404
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});
window.db = db; // 🛡️ ผูกติด window ไว้เพื่อให้ฟังก์ชันอื่นเรียกใช้ได้อย่างปลอดภัย 100%

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
// 🔔 FIREBASE NOTIFICATION ENGINE (Dynamic Version)
// ==========================================

// 1. ตัวถอดรหัสสาขากลับแบบ Dynamic 100% (ดึงจากฐานข้อมูลสาขาอัตโนมัติ)
window.decodeBranch = function (obfCode) {
  if (!obfCode) return obfCode;

  const lettersOnly = obfCode.replace(/[0-9]/g, "").toUpperCase();

  if (window.appBranches && Array.isArray(window.appBranches)) {
    const matchedBranch = window.appBranches.find((b) => {
      const bId = String(b.id || b.Branch_ID || b.BranchID || "")
        .trim()
        .toUpperCase();
      return bId.substring(0, 2) === lettersOnly;
    });

    if (matchedBranch) {
      return String(
        matchedBranch.id ||
          matchedBranch.Branch_ID ||
          matchedBranch.BranchID ||
          "",
      )
        .trim()
        .toUpperCase();
    }
  }
  return obfCode;
};

// 2. ฟังก์ชันยิงสัญญาณแจ้งเตือนกลับไปยังสาขาต้นทาง
window.triggerFirebaseNotification = async function (
  docNo,
  targetOriginBranch,
) {
  try {
    if (!db) return console.error("Firebase DB is not initialized");

    const myBranch = localStorage.getItem("pattcha_branch") || "UNKN"; // สาขาปลายทาง (ผู้กดรับของ)

    // 🚨 ยิงข้อมูลขึ้น Firebase โดยล็อกเป้าหมาย (Destination) ไปที่สาขาต้นทาง!
    await addDoc(collection(db, "Pattcha_Notifications"), {
      Destination: targetOriginBranch, // 🎯 ชี้เป้าไปที่เครื่องของสาขาต้นทาง
      From: myBranch, // บอกให้รู้ว่าใครเป็นคนกดรับ
      DocNo: docNo,
      Message: `สาขา ${myBranch} ได้รับชิปเมนต์ ${docNo} เข้าสต๊อกเรียบร้อยแล้ว`,
      Timestamp: serverTimestamp(),
      isRead: false,
    });
    console.log(
      `✅ [Radar] ยิงสัญญาณแจ้งเตือนกลับไปที่ ${targetOriginBranch} สำเร็จ!`,
    );
  } catch (error) {
    console.error("🚨 [Radar Error] ยิงสัญญาณล้มเหลว:", error);
  }
};

// ==========================================
// 🔔 FIREBASE NOTIFICATION ENGINE (แก้บั๊ก WebChannel & Index 100%)
// ==========================================
window.startFirebaseListener = function() {
    const myBranch = localStorage.getItem("pattcha_branch");
    if (!myBranch || !window.db) {
        console.warn("🚨 Firebase หรือ Branch ยังไม่พร้อมทำงาน");
        return;
    }

    try {
        // 🛠️ ลบคำว่า window. ออกจาก query, collection, และ where เพื่อให้ใช้ตัวที่ Import มาจากด้านบน
        const q = query(
            collection(window.db, "Pattcha_Notifications"),
            where("Destination", "==", myBranch)
        );

        if (window.fbUnsubscribe) window.fbUnsubscribe();

        window.fbUnsubscribe = onSnapshot(q, (snapshot) => {
            const notifBadge = document.getElementById("notifBadge");
            
            // 🛠️ มาใช้ Javascript คัดกรองข้อความที่ยังไม่ได้อ่านแทน
            const unreadDocs = snapshot.docs.filter(doc => doc.data().isRead === false);

            if (unreadDocs.length === 0) {
                if (notifBadge) notifBadge.classList.add("hide");
                return;
            }

            // นับจำนวนข้อความที่ยังไม่ได้อ่าน
            if (notifBadge) {
                notifBadge.innerText = unreadDocs.length;
                notifBadge.classList.remove("hide");
            }

            let hasNew = false;
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const data = change.doc.data();
                    
                    // เช็กว่าเป็นข้อความที่ยังไม่ได้อ่านเท่านั้น
                    if (data && data.DocNo && data.isRead === false) {
                        hasNew = true;
                        
                        // 🎯 ปลุกระบบให้แจ้งเตือนและย้ายการ์ด
                        if (typeof window.handleIncomingSignal === "function") {
                            window.handleIncomingSignal(data.DocNo, 'COMPLETE');
                        }
                    }
                }
            });

            if (hasNew && typeof window.playAlertSound === "function") {
                window.playAlertSound();
            }
            
        }, (error) => {
            console.error("🚨 Firebase Snapshot Error:", error);
            if (error.message.includes("permission") || error.message.includes("Missing")) {
                alert("❌ ฐานข้อมูลติดล็อก (Permission)! กรุณาไปเปิดสิทธิ์ Rules ใน Firebase ครับ");
            } else if (error.message.includes("index")) {
                alert("❌ ขาด Index! กรุณากดลิงก์สีน้ำเงินในหน้าต่าง Console (F12) เพื่อสร้างครับ");
            }
        });

    } catch (error) {
        console.error("🚨 Setup Listener Error:", error);
    }
};

// 4. ฟังก์ชันเล่นเสียงเตือน
window.playAlertSound = function () {
  const audio = document.getElementById("alertSound");
  if (audio) {
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn(
          "เบราว์เซอร์บล็อกเสียง ต้องคลิกหน้าเว็บก่อน 1 ครั้ง:",
          error,
        );
      });
    }
  }
};
