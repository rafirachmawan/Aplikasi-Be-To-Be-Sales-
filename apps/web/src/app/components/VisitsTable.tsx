"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import { TemperatureBadge } from "./TemperatureBadge";

export type Visit = {
  id: string;
  userId: string;
  customerId: string;
  customerName?: string;
  temperature: "dingin" | "hangat" | "panas" | "menyala";
  photo?: { downloadUrl?: string };
  locationLink?: string;
  resultNote?: string;
  dateISO: string; // from mobile
  createdAt?: any; // Firestore Timestamp
};

export default function VisitsTable({
  defaultLimit = 200,
  search,
  filterTemp,
  filterDateFrom,
  filterDateTo,
  filterUser,
}: {
  defaultLimit?: number;
  search?: string;
  filterTemp?: Visit["temperature"] | "all";
  filterDateFrom?: string; // YYYY-MM-DD
  filterDateTo?: string; // YYYY-MM-DD
  filterUser?: string; // userId
}) {
  const [items, setItems] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const qy = query(
        collection(db, "visits"),
        orderBy("createdAt", "desc"),
        limit(defaultLimit)
      );
      const snap = await getDocs(qy);
      const rows: Visit[] = [];
      snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }));
      setItems(rows);
      setLoading(false);
    })();
  }, [defaultLimit]);

  const filtered = useMemo(() => {
    const q = (search || "").toLowerCase();
    return items.filter((v) => {
      if (filterUser && v.userId !== filterUser) return false;
      if (filterTemp && filterTemp !== "all" && v.temperature !== filterTemp)
        return false;

      if (filterDateFrom) {
        const d = v.dateISO.slice(0, 10);
        if (d < filterDateFrom) return false;
      }
      if (filterDateTo) {
        const d = v.dateISO.slice(0, 10);
        if (d > filterDateTo) return false;
      }

      if (q) {
        const hay = `${v.customerName ?? ""} ${v.resultNote ?? ""} ${
          v.customerId
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, search, filterTemp, filterDateFrom, filterDateTo, filterUser]);

  function downloadCSV() {
    const headers = [
      "id",
      "date",
      "userId",
      "customerId",
      "customerName",
      "temperature",
      "note",
      "photoUrl",
      "maps",
    ];
    const lines = filtered.map((v) =>
      [
        v.id,
        new Date(v.dateISO).toLocaleString(),
        v.userId,
        v.customerId,
        v.customerName || "",
        v.temperature,
        (v.resultNote || "").replace(/\n/g, " "),
        v.photo?.downloadUrl || "",
        v.locationLink || "",
      ]
        .map((s) => `"${String(s).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "visits.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="flex items-center justify-between p-4">
        <p className="text-sm text-slate-600">
          Showing <span className="font-semibold">{filtered.length}</span> of{" "}
          {items.length} visits
        </p>
        <button
          onClick={downloadCSV}
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Customer</th>
              <th className="px-3 py-2 text-left">Sales</th>
              <th className="px-3 py-2 text-left">Temp</th>
              <th className="px-3 py-2 text-left">Note</th>
              <th className="px-3 py-2 text-left">Photo</th>
              <th className="px-3 py-2 text-left">Maps</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  className="px-3 py-6 text-center text-slate-400"
                  colSpan={7}
                >
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-6 text-center text-slate-400"
                  colSpan={7}
                >
                  No data
                </td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.id} className="border-t hover:bg-slate-50/60">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(v.dateISO).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">
                      {v.customerName || v.customerId}
                    </div>
                    <div className="text-xs text-slate-400">{v.customerId}</div>
                  </td>
                  <td className="px-3 py-2">{v.userId}</td>
                  <td className="px-3 py-2">
                    <TemperatureBadge value={v.temperature} />
                  </td>
                  <td className="px-3 py-2 max-w-[320px]">
                    <div className="line-clamp-2">{v.resultNote}</div>
                  </td>
                  <td className="px-3 py-2">
                    {v.photo?.downloadUrl ? (
                      <a href={v.photo.downloadUrl} target="_blank">
                        <img
                          src={v.photo.downloadUrl}
                          alt=""
                          className="h-12 w-12 rounded object-cover border"
                        />
                      </a>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {v.locationLink ? (
                      <a
                        className="text-blue-600 underline"
                        target="_blank"
                        href={v.locationLink}
                      >
                        Open
                      </a>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
