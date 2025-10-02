// src/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAGBQE4z_ts4QFAQ2XDjRClJrK_MyezsB0",
  authDomain: "aplikasibetobesales.firebaseapp.com",
  projectId: "aplikasibetobesales",
  storageBucket: "aplikasibetobesales.appspot.com", // ⬅️ yang benar (bukan firebasestorage.app)
  messagingSenderId: "533572977473",
  appId: "1:533572977473:web:f5664c0e422265a02b97c0",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
