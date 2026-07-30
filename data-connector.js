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
  apiKey: "AIzaSyDoYWx6mMkU-WvaXyQcpWBhmpNNQToQqcE",
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
// 🔔 FIREBASE NOTIFICATION ENGINE (Dynamic Version)
// ==========================================

// 1. ตัวถอดรหัสสาขากลับแบบ Dynamic 100% (ดึงจากฐานข้อมูลสาขาอัตโนมัติ)
window.decodeBranch = function(obfCode) {
    if (!obfCode) return obfCode;
    
    // 💡 1. ตัดตัวเลขทิ้งให้เหลือแค่ตัวอักษร (เช่น "01KK" -> "KK", "01CK" -> "CK")
    const lettersOnly = obfCode.replace(/[0-9]/g, '').toUpperCase();
    
    // 💡 2. วิ่งไปค้นหาในตัวแปร window.appBranches ที่ระบบโหลดมาจาก Google Sheets ตั้งแต่ตอนเปิดแอป
    if (window.appBranches && Array.isArray(window.appBranches)) {
        const matchedBranch = window.appBranches.find(b => {
            const bId = String(b.id || b.Branch_ID || b.BranchID || "").trim().toUpperCase();
            // ตรวจสอบว่า 2 ตัวอักษรแรกของรหัสสาขาตรงกันหรือไม่ (เช่น "CK" ตรงกับ "CKC01")
            return bId.substring(0, 2) === lettersOnly;
        });

        // ถ้าค้นเจอ ให้ส่งรหัสสาขาเต็มๆ กลับไป (เช่น "CKC01")
        if (matchedBranch) {
            return String(matchedBranch.id || matchedBranch.Branch_ID || matchedBranch.BranchID || "").trim().toUpperCase();
        }
    }
    
    // 💡 3. Fallback ป้องกันระบบพัง กรณีที่เน็ตหลุดหรือหาข้อมูลสาขาไม่เจอ จะส่งรหัสเดิมกลับไป
    return obfCode;
};

// 2. ฟังก์ชันยิงสัญญาณ (เหมือนเดิม)
window.triggerFirebaseNotification = async function(docNo) {
    try {
        if (!window.db) return console.error("Firebase DB is not initialized");
        
        // แยกสาขาต้นทางออกจากเลขที่เอกสาร (เช่น TS-23072026-01CK-0005-02KK)
        const parts = docNo.split("-");
        if (parts.length < 4) return;
        
        const sourceObf = parts[2]; // ดึงรหัสต้นทาง เช่น "01CK" หรือ "01KK"
        const destinationBranch = window.decodeBranch(sourceObf); // แปลงกลับเป็น "CKC01" หรือ "KKN02" อัตโนมัติ
        const myBranch = localStorage.getItem("pattcha_branch") || "UNKN";

        // ยิงข้อมูลขึ้น Firebase Firestore
        await window.addDoc(window.collection(window.db, "Pattcha_Notifications"), {
            Destination: destinationBranch, 
            From: myBranch, 
            DocNo: docNo,
            Message: `สาขา ${myBranch} ได้รับชิปเมนต์ ${docNo} เข้าสต๊อกเรียบร้อยแล้ว`,
            Timestamp: window.serverTimestamp(),
            isRead: false
        });
        console.log(`✅ [Radar] ยิงสัญญาณแจ้งเตือนกลับไปที่ ${destinationBranch} สำเร็จ!`);
    } catch (error) {
        console.error("🚨 [Radar Error] ยิงสัญญาณล้มเหลว:", error);
    }
};

window.startFirebaseListener = function () {
  // สมมติว่าใช้ Firebase Realtime Database อ้างอิงตาม branch ปัจจุบัน
  const branch = localStorage.getItem("pattcha_branch");
  if (!branch) return;

  const dbRef = firebase.database().ref(`notifications/${branch}`);

  // ดักจับข้อมูลที่ถูกเพิ่มเข้ามาใหม่
  dbRef.on("child_added", (snapshot) => {
    const data = snapshot.val();

    // ถ้าเป็นการแจ้งเตือนแบบ COMPLETE
    if (data.status === "COMPLETE" && !data.isRead) {
      // 1. เรียกใช้งาน Alert & Reload แบบ Real-Time
      if (typeof window.handleIncomingSignal === "function") {
        window.handleIncomingSignal(data.shipmentNo, data.status);
      }

      // 2. มาร์คว่าอ่านแล้วในฐานข้อมูล (ป้องกันแจ้งเตือนซ้ำเวลาโหลดหน้าใหม่)
      snapshot.ref.update({ isRead: true });
    }
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
