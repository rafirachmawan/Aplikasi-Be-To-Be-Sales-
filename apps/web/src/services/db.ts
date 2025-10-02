// src/services/db.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

/** SAMAKAN CONFIG INI DENGAN FILE LAIN JIKA ADA */
const firebaseConfig = {
  apiKey: "AIzaSyAGBQE4z_ts4QFAQ2XDjRClJrK_MyezsB0",
  authDomain: "aplikasibetobesales.firebaseapp.com",
  projectId: "aplikasibetobesales",
  storageBucket: "aplikasibetobesales.appspot.com",
  messagingSenderId: "533572977473",
  appId: "1:533572977473:web:f5664c0e422265a02b97c0",
};

// ✅ gunakan app yang sudah ada agar tidak “duplicate-app”
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);

/* ====== Tipe & konstanta ====== */
export type Customer = {
  id: string;
  code: string;
  name?: string;
  phone?: string;
  address?: string;
  createdAt?: any;
  updatedAt?: any;
};

// ⚠️ Samakan dengan mobile
export const USER_ID = "USER-DEMO";

/* ====== Helper path ====== */
const customersCol = (userId: string) =>
  collection(db, "users", userId, "customers");

/* ====== Realtime listen ====== */
export function listenCustomers(
  userId: string,
  cb: (rows: Customer[]) => void
) {
  const q = query(customersCol(userId), orderBy("name"));
  return onSnapshot(q, (snap) => {
    const rows: Customer[] = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        code: data.code,
        name: data.name ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });
    cb(rows);
  });
}

/* ====== Create (pakai code sebagai documentId) ====== */
export async function addCustomer(
  userId: string,
  c: { code: string; name: string; phone?: string; address?: string }
) {
  const ref = doc(db, "users", userId, "customers", c.code);
  await setDoc(
    ref,
    {
      code: c.code,
      name: c.name ?? "",
      phone: c.phone ?? "",
      address: c.address ?? "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/* ====== Update ====== */
export async function updateCustomer(
  userId: string,
  id: string,
  patch: Partial<Omit<Customer, "id" | "code">>
) {
  const ref = doc(db, "users", userId, "customers", id);
  await updateDoc(ref, {
    ...patch,
    updatedAt: serverTimestamp(),
  } as any);
}
