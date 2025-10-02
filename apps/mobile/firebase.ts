// apps/mobile/src/firebase.ts  (duplikasikan dengan path serupa di web)
// atau buat satu package shared lalu import dari sana.

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "XXX",
  authDomain: "XXX.firebaseapp.com",
  projectId: "XXX",
  storageBucket: "XXX.appspot.com",
  messagingSenderId: "XXX",
  appId: "XXX",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// (Opsional) Emulator untuk dev lokal:
// if (__DEV__) {
//   // import { connectFirestoreEmulator } from "firebase/firestore";
//   // import { connectAuthEmulator } from "firebase/auth";
//   // import { connectStorageEmulator } from "firebase/storage";
//   // connectFirestoreEmulator(db, "localhost", 8080);
//   // connectAuthEmulator(auth, "http://localhost:9099");
//   // connectStorageEmulator(storage, "localhost", 9199);
// }
