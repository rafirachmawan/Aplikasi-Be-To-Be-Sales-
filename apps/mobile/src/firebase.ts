// apps/mobile/src/firebase.ts
import { initializeApp, getApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ← Salin persis dari Firebase Console (punya kamu)
const firebaseConfig = {
  apiKey: "AIzaSyAGBQE4z_ts4QFAQ2XDjRClJrK_MyezsB0",
  authDomain: "aplikasibetobesales.firebaseapp.com",
  projectId: "aplikasibetobesales",
  storageBucket: "aplikasibetobesales.appspot.com", // ⬅️ yang benar (bukan firebasestorage.app)
  messagingSenderId: "533572977473",
  appId: "1:533572977473:web:f5664c0e422265a02b97c0",
  // measurementId opsional untuk Analytics:
  // measurementId: "G-P8Y932DXH1",
};

// Hindari double init saat Fast Refresh
let app;
try {
  app = getApp();
} catch {
  app = initializeApp(firebaseConfig);
}
console.log("[firebase] project:", app.options.projectId);
console.log("[firebase] authDomain:", firebaseConfig.authDomain);

// Firestore: stabil untuk emulator/jaringan ketat + offline cache
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // paksa long-polling biar tidak “offline”
  experimentalAutoDetectLongPolling: false,
  localCache: persistentLocalCache(), // enable cache offline
});

// Storage untuk upload foto
export const storage = getStorage(app);
