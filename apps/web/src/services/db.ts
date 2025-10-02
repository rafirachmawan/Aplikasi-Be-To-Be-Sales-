// apps/web/src/services/db.ts
"use client"; // kalau kamu pakai Next.js App Router, karena Firestore dipakai di client

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";

/* ======================= Types ======================= */

export type Temperature = "dingin" | "hangat" | "panas" | "menyala";

export type OfferedDetailed = {
  brand?: string;
  capacityPerMonth?: string;
  potentialBrand?: string;
  potentialQtyPerMonth?: string;
};

export type Visit = {
  id?: string;
  userId: string;
  customerId: string;
  customerName: string;
  dateISO: string;
  temperature: Temperature;
  offered?: { name: string; qty?: number }[];
  offeredDetailed?: Record<string, OfferedDetailed>;
  resultNote?: string;
  geo?: { lat: number; lng: number };
  locationLink?: string;
  photo?: { storagePath: string; downloadUrl: string };
  createdAt?: any;
};

export type Plan = {
  id?: string;
  userId: string;
  customerId: string;
  customerName: string;
  date: string; // YYYY-MM-DD
  status: "planned" | "done" | "skipped";
  time?: string; // HH:mm
  purpose?: "deal" | "demo" | "followup";
  note?: string;
  createdAt?: any;
};

export type BusinessType = "retail" | "umkm" | "restorant" | "supermarket";

export type Customer = {
  code: string; // PRIMARY (unik)
  userId: string;
  name: string;
  phone?: string;
  address?: string;
  businessType?: BusinessType;
  city?: string;
  district?: string;
  ownerNIK?: string;
  ownerName?: string;
  ownerAddress?: string;
  addressLink?: string;
  createdAt?: any;
  updatedAt?: any;
};

/* ======================= Utils ======================= */

export function todayStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const yyyy = d.getFullYear();
  const mm = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* ======================= Visits ======================= */

export async function addVisit(v: Visit) {
  const ref = collection(db, "visits");
  await addDoc(ref, { ...v, createdAt: serverTimestamp() });
}

export async function listVisitsByDateRange(
  dateList: string[],
  userId: string
): Promise<Visit[]> {
  const qs = query(
    collection(db, "visits"),
    where("userId", "==", userId),
    orderBy("dateISO", "desc"),
    limit(500)
  );
  const snap = await getDocs(qs);
  const set = new Set(dateList);
  const rows: Visit[] = [];
  snap.forEach((d) => {
    const data = d.data() as Visit;
    const day = data.dateISO.slice(0, 10);
    if (set.has(day)) rows.push({ ...data, id: d.id });
  });
  return rows;
}

export function listenVisitsByDateRange(
  dateList: string[],
  userId: string,
  cb: (rows: Visit[]) => void
): Unsubscribe {
  const qs = query(
    collection(db, "visits"),
    where("userId", "==", userId),
    orderBy("dateISO", "desc"),
    limit(500)
  );
  const set = new Set(dateList);
  return onSnapshot(qs, (snap) => {
    const out: Visit[] = [];
    snap.forEach((d) => {
      const v = d.data() as Visit;
      const day = v.dateISO.slice(0, 10);
      if (set.has(day)) out.push({ ...v, id: d.id });
    });
    cb(out);
  });
}

/* ======================= Plans ======================= */

export async function addPlan(p: Plan) {
  const ref = collection(db, "plans");
  await addDoc(ref, { ...p, createdAt: serverTimestamp() });
}

/**
 * ⚠️ Perlu composite index:
 * plans: userId ASC, date ASC, time ASC, createdAt ASC
 */
export async function listPlansByDate(
  date: string,
  userId: string
): Promise<Plan[]> {
  const qs = query(
    collection(db, "plans"),
    where("userId", "==", userId),
    where("date", "==", date),
    orderBy("time", "asc"),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(qs);
  const rows: Plan[] = [];
  snap.forEach((d) => rows.push({ ...(d.data() as Plan), id: d.id }));
  return rows;
}

export async function listPlansByRange(
  dates: string[],
  userId: string
): Promise<Plan[]> {
  const all: Plan[] = [];
  for (const date of dates) {
    const part = await listPlansByDate(date, userId);
    all.push(...part);
  }
  all.sort((a, b) =>
    a.date === b.date
      ? (a.time || "").localeCompare(b.time || "")
      : a.date.localeCompare(b.date)
  );
  return all;
}

export function listenPlansByDate(
  date: string,
  userId: string,
  cb: (rows: Plan[]) => void
): Unsubscribe {
  const qs = query(
    collection(db, "plans"),
    where("userId", "==", userId),
    where("date", "==", date),
    orderBy("time", "asc"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(qs, (snap) => {
    const rows: Plan[] = [];
    snap.forEach((d) => rows.push({ ...(d.data() as Plan), id: d.id }));
    cb(rows);
  });
}

/* ======================= Customers ======================= */

export async function getCustomerByCode(
  code: string
): Promise<Customer | null> {
  const refDoc = doc(db, "customers", code.trim());
  const snap = await getDoc(refDoc);
  if (!snap.exists()) return null;
  return snap.data() as Customer;
}

export async function addCustomerMinimal(input: {
  userId: string;
  code: string;
  name: string;
}) {
  const code = input.code.trim();
  if (!code) throw new Error("Kode customer wajib diisi");
  if (!input.name.trim()) throw new Error("Nama customer wajib diisi");

  const refDoc = doc(db, "customers", code);
  const exists = await getDoc(refDoc);
  if (exists.exists()) {
    throw new Error("Kode customer sudah dipakai. Gunakan kode lain.");
  }

  const payload: Customer = {
    code,
    userId: input.userId,
    name: input.name.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(refDoc, payload);
}

export async function addCustomer(c: Customer) {
  const code = c.code.trim();
  if (!code) throw new Error("Kode customer wajib diisi");

  const refDoc = doc(db, "customers", code);
  const exists = await getDoc(refDoc);
  if (exists.exists()) {
    throw new Error("Kode customer sudah dipakai. Gunakan kode lain.");
  }

  const payload: Customer = {
    ...c,
    code,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(refDoc, payload);
}

export async function listCustomers(
  userId: string,
  max = 100
): Promise<Customer[]> {
  const qs = query(
    collection(db, "customers"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(max)
  );
  const snap = await getDocs(qs);
  const rows: Customer[] = [];
  snap.forEach((d) => rows.push(d.data() as Customer));
  return rows;
}
