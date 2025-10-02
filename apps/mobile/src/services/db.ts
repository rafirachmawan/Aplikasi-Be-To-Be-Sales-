// apps/mobile/src/services/db.ts
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
  limit as qLimit,
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

// apps/mobile/src/services/db.ts

// apps/mobile/src/services/db.ts
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
  photo?: { storagePath: string; downloadUrl?: string }; // ⬅️ opsional
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
  code: string;
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

/* ======================= Helpers ======================= */

function cleanUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([_, v]) => v !== undefined && v !== null && v !== ""
    )
  ) as T;
}

/* ======================= Utils tanggal ======================= */
export function todayStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const yyyy = d.getFullYear();
  const mm = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* ======================= Visits ======================= */
/**
 * Simpan kunjungan:
 * - Tetap add ke koleksi root "visits" (kompatibel dengan kode lama kamu/riwayat lama).
 * - Mirror ke subcollection "visits/{userId}/items/{id}" (punya dateKey untuk filter N hari).
 *
 * Catatan: id dokumen subcollection DISAMAKAN dengan id dari koleksi root
 * agar mudah menghindari duplikasi saat merge cloud+lokal.
 */
export async function addVisit(v: Visit) {
  const payload = cleanUndefined({
    ...v,
    createdAt: serverTimestamp(),
  });

  // 1) root koleksi "visits" (lama)
  const rootCol = collection(db, "visits");
  const rootRef = await addDoc(rootCol, payload);
  const visitId = rootRef.id;

  // 2) mirror ke subcollection per user
  try {
    const dateKey =
      typeof v.dateISO === "string" && v.dateISO.length >= 10
        ? v.dateISO.slice(0, 10)
        : todayStr(0);

    const subDoc = doc(db, "visits", v.userId, "items", visitId);
    await setDoc(
      subDoc,
      cleanUndefined({
        visitId,
        userId: v.userId,
        customerId: v.customerId,
        customerName: v.customerName,
        dateISO: v.dateISO,
        dateKey, // YYYY-MM-DD → buat filter cepat
        temperature: v.temperature,
        offered: Array.isArray(v.offered)
          ? v.offered.map((o) => cleanUndefined({ name: o.name, qty: o.qty }))
          : undefined,
        offeredDetailed: v.offeredDetailed ?? undefined,
        resultNote: v.resultNote ?? null,
        geo: v.geo
          ? cleanUndefined({ lat: v.geo.lat, lng: v.geo.lng })
          : undefined,
        locationLink: v.locationLink ?? undefined,
        photo: v.photo
          ? cleanUndefined({
              storagePath: v.photo.storagePath,
              downloadUrl: v.photo.downloadUrl,
            })
          : undefined,
        createdAt: serverTimestamp(),
      })
    );
  } catch (e) {
    console.warn(
      "[addVisit] mirror subcollection gagal:",
      (e as any)?.message || e
    );
  }
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

/** Ambil kunjungan user dalam N hari terakhir (default 30) — koleksi root (lama) */
export async function listVisitsRecent(
  userId: string,
  days = 30
): Promise<Visit[]> {
  const sinceISO = new Date(Date.now() - days * 86400000).toISOString();
  const qs = query(
    collection(db, "visits"),
    where("userId", "==", userId),
    orderBy("dateISO", "desc"),
    limit(1000)
  );
  const snap = await getDocs(qs);
  const rows: Visit[] = [];
  snap.forEach((d) => {
    const v = d.data() as Visit;
    if (v.dateISO >= sinceISO) rows.push({ ...v, id: d.id });
  });
  return rows;
}

/** Ambil kunjungan pada 1 tanggal (YYYY-MM-DD) */
export async function listVisitsByDate(
  date: string,
  userId: string
): Promise<Visit[]> {
  return listVisitsByDateRange([date], userId);
}

/** Realtime kunjungan pada 1 tanggal (YYYY-MM-DD) */
export function listenVisitsByDate(
  date: string,
  userId: string,
  cb: (rows: Visit[]) => void
): Unsubscribe {
  return listenVisitsByDateRange([date], userId, cb);
}

/* ---------- Tambahan untuk RIWAYAT (cloud subcollection) ---------- */
/** Ambil dari subcollection visits/{userId}/items untuk N hari terakhir */
export async function listVisitsRecentCloud(
  userId: string,
  days = 30
): Promise<Visit[]> {
  const today = todayStr(0);
  const d = new Date(today + "T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() - (days - 1));
  const minKey = d.toISOString().slice(0, 10);

  const col = collection(db, "visits", userId, "items");
  const qs = query(
    col,
    where("dateKey", ">=", minKey),
    orderBy("dateKey", "desc"),
    limit(1000)
  );
  const snap = await getDocs(qs);

  const rows: Visit[] = [];
  snap.forEach((docSnap) => {
    const v = docSnap.data() as any;
    rows.push(
      cleanUndefined({
        id: docSnap.id,
        userId,
        customerId: v?.customerId,
        customerName: v?.customerName,
        dateISO:
          typeof v?.dateISO === "string" ? v.dateISO : new Date().toISOString(),
        temperature: v?.temperature,
        offered: Array.isArray(v?.offered) ? v.offered : undefined,
        offeredDetailed: v?.offeredDetailed,
        resultNote: v?.resultNote ?? undefined,
        geo: v?.geo,
        locationLink: v?.locationLink,
        photo: v?.photo,
        createdAt: v?.createdAt,
      })
    );
  });

  rows.sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  return rows;
}

/* ======================= Plans ======================= */
export async function addPlan(p: Plan) {
  const ref = collection(db, "plans");
  await addDoc(ref, { ...p, createdAt: serverTimestamp() });
}

/**
 * ⚠️ Butuh index gabungan:
 *   Collection: plans
 *   Fields: userId ASC, date ASC, time ASC, createdAt ASC
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

  const payload = cleanUndefined({
    code,
    userId: input.userId,
    name: input.name.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(refDoc, payload);
}

/** Upsert (tanpa getDoc) – aman saat offline/jaringan ketat */
export async function upsertCustomer(c: Customer) {
  const code = c.code.trim();
  if (!code) throw new Error("Kode customer wajib diisi");

  const refDoc = doc(db, "customers", code);
  const now = serverTimestamp();

  const payload = cleanUndefined({
    ...c,
    code,
    createdAt: c.createdAt ?? now,
    updatedAt: now,
  });

  await setDoc(refDoc, payload, { merge: true });
}

export async function addCustomer(c: Customer) {
  // versi lama (cek duplikat dulu)
  const code = c.code.trim();
  if (!code) throw new Error("Kode customer wajib diisi");

  const refDoc = doc(db, "customers", code);
  const exists = await getDoc(refDoc);
  if (exists.exists()) {
    throw new Error("Kode customer sudah dipakai. Gunakan kode lain.");
  }

  const payload = cleanUndefined({
    ...c,
    code,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

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

// === Tipe lite untuk picker ===
export type CustomerLite = { id: string; name: string };

// === Realtime daftar customer ringkas (dipakai CustomerPicker) ===
export function subscribeCustomersLite(
  userId: string,
  cb: (rows: CustomerLite[]) => void,
  opts?: { limit?: number }
): Unsubscribe {
  // TANPA orderBy agar TIDAK butuh composite index
  const q = query(
    collection(db, "customers"),
    where("userId", "==", userId),
    qLimit(opts?.limit ?? 500)
  );

  return onSnapshot(q, (snap) => {
    const out: CustomerLite[] = [];
    snap.forEach((d) => {
      const data = d.data() as { name?: string } | undefined;
      if (data?.name) out.push({ id: d.id, name: String(data.name) });
    });
    cb(out);
  });
}
