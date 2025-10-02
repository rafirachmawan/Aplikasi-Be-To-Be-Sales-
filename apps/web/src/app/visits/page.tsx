// src/app/visits/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/app/components/layout/PageHeader";
import StatCard from "@/app/components/StatCard";
import { db, USER_ID } from "@/services/db";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

type Temperature = "dingin" | "hangat" | "panas" | "menyala";
type Offered = { name: string; qty?: number };
type OfferedDetailed = Record<
  string,
  {
    brand?: string;
    capacityPerMonth?: string;
    potentialBrand?: string;
    potentialQtyPerMonth?: string;
    potensiSwitch?: string;
  }
>;
type Visit = {
  id: string;
  customerName: string;
  userId?: string;
  dateISO: string;
  temperature?: Temperature;
  resultNote?: string;
  photo?: {
    downloadUrl?: string;
    url?: string;
    storagePath?: string;
    path?: string;
  };
  locationLink?: string;
  offered?: Offered[];
  offeredDetailed?: OfferedDetailed;
};

function formatDT(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("id-ID")} ${d.toTimeString().slice(0, 8)}`;
}

export default function VisitsPage() {
  // Filters
  const [q, setQ] = useState("");
  const [temp, setTemp] = useState<Temperature | "all">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [user, setUser] = useState("");

  const [rows, setRows] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  // Realtime Firestore
  useEffect(() => {
    const base = query(
      collection(db, "users", USER_ID, "visits"),
      orderBy("dateISO", "desc")
    );
    const unsub = onSnapshot(base, (snap) => {
      const list: Visit[] = snap.docs.map((d) => {
        const x = d.data() as any;
        return {
          id: d.id,
          customerName: x.customerName ?? "-",
          userId: x.userId,
          dateISO: x.dateISO ?? new Date().toISOString(),
          temperature: x.temperature,
          resultNote: x.resultNote,
          photo: x.photo,
          locationLink: x.locationLink,
          offered: Array.isArray(x.offered) ? x.offered : undefined,
          offeredDetailed:
            x.offeredDetailed && typeof x.offeredDetailed === "object"
              ? (x.offeredDetailed as OfferedDetailed)
              : undefined,
        };
      });
      setRows(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Client-side filtering
  const filtered = useMemo(() => {
    const qlc = q.trim().toLowerCase();
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    return rows.filter((v) => {
      const text = `${v.customerName} ${v.resultNote ?? ""} ${
        v.userId ?? ""
      }`.toLowerCase();
      if (qlc && !text.includes(qlc)) return false;
      if (temp !== "all" && v.temperature !== temp) return false;
      if (user.trim() && v.userId !== user.trim()) return false;

      if (fromDate || toDate) {
        const dt = new Date(v.dateISO);
        if (fromDate && dt < new Date(new Date(fromDate).setHours(0, 0, 0, 0)))
          return false;
        if (toDate && dt > new Date(new Date(toDate).setHours(23, 59, 59, 999)))
          return false;
      }
      return true;
    });
  }, [rows, q, temp, from, to, user]);

  // Stats
  const statTotal = filtered.length;
  const statMenyala = filtered.filter(
    (v) => v.temperature === "menyala"
  ).length;
  const statPanas = filtered.filter((v) => v.temperature === "panas").length;
  const statHangatDingin = filtered.filter(
    (v) => v.temperature === "hangat" || v.temperature === "dingin"
  ).length;

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 space-y-6">
      <PageHeader
        title="Visits"
        subtitle="Riwayat kunjungan (realtime) dengan filter & detail."
      />

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Search</label>
            <input
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="customer / note / user"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Temperature
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm capitalize text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              value={temp}
              onChange={(e) => setTemp(e.target.value as any)}
            >
              <option value="all">All Temperature</option>
              <option value="dingin">Dingin</option>
              <option value="hangat">Hangat</option>
              <option value="panas">Panas</option>
              <option value="menyala">Menyala</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">From</label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">To</label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              User ID
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="opsional"
              value={user}
              onChange={(e) => setUser(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Total Visits (sesuai filter)"
          value={String(statTotal)}
          hint="berdasarkan filter aktif"
        />
        <StatCard title="Menyala" value={String(statMenyala)} />
        <StatCard title="Panas" value={String(statPanas)} />
        <StatCard title="Hangat / Dingin" value={String(statHangatDingin)} />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">Date</th>
                <th className="px-5 py-3 text-left font-semibold">Customer</th>
                <th className="px-5 py-3 text-left font-semibold">User</th>
                <th className="px-5 py-3 text-left font-semibold">Temp</th>
                <th className="px-5 py-3 text-left font-semibold">Note</th>
                <th className="px-5 py-3 text-left font-semibold">Produk</th>
                <th className="px-5 py-3 text-left font-semibold">Detail</th>
                <th className="px-5 py-3 text-left font-semibold">Photo</th>
                <th className="px-5 py-3 text-left font-semibold">Maps</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-6 text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-6 text-slate-500">
                    No data
                  </td>
                </tr>
              ) : (
                filtered.map((v) => {
                  const rowKey = v.id ?? `${v.dateISO}|${v.customerName}`;
                  const publicId = v.photo?.path || v.photo?.storagePath;
                  const photoUrl =
                    v.photo?.downloadUrl ||
                    v.photo?.url ||
                    (publicId
                      ? `https://res.cloudinary.com/dbefoaekm/image/upload/${encodeURIComponent(
                          publicId.replace(/^\/+/, "")
                        )}`
                      : undefined);

                  return (
                    <tr key={rowKey} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 text-slate-900">
                        {formatDT(v.dateISO)}
                      </td>
                      <td className="px-5 py-3">{v.customerName}</td>
                      <td className="px-5 py-3">{v.userId ?? USER_ID}</td>
                      <td className="px-5 py-3 capitalize">
                        {v.temperature ?? "-"}
                      </td>
                      <td className="px-5 py-3">{v.resultNote ?? "-"}</td>

                      <td className="px-5 py-3">
                        {Array.isArray(v.offered) && v.offered.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {v.offered.map((o, i) => (
                              <span
                                key={`${rowKey}-offered-${i}`}
                                className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700"
                              >
                                {o.name}
                                {o.qty ? ` (${o.qty})` : ""}
                              </span>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="px-5 py-3">
                        {v.offeredDetailed &&
                        Object.keys(v.offeredDetailed).length > 0 ? (
                          <div className="space-y-1">
                            {Object.entries(v.offeredDetailed).map(([k, d]) => (
                              <div key={`${rowKey}-detail-${k}`}>
                                <div className="font-semibold">{k}</div>
                                <div className="text-[12px] text-slate-600">
                                  Merek: {d?.brand || "-"} | Kap/bln:{" "}
                                  {d?.capacityPerMonth || "-"}
                                </div>
                                <div className="text-[12px] text-slate-600">
                                  Potensi Brand: {d?.potentialBrand || "-"} |
                                  Potensi Qty/bln:{" "}
                                  {d?.potentialQtyPerMonth || "-"}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="px-5 py-3">
                        {photoUrl ? (
                          <a
                            href={photoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Open
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="px-5 py-3">
                        {v.locationLink ? (
                          <a
                            href={v.locationLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Open
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
