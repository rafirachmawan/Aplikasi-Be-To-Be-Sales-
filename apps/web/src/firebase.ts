// apps/web/src/firebase.ts
import { getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "PASTE_API_KEY_MU_DI_SINI",
  authDomain: "aplikasibetobesales.firebaseapp.com",
  projectId: "aplikasibetobesales",
  storageBucket: "aplikasibetobesales.appspot.com",
  messagingSenderId: "533572977473",
  appId: "1:533572977473:web:f5664c0e422265a02b97c0",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
