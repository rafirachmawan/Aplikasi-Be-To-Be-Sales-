// src/app/customers/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/app/components/layout/PageHeader";
import {
  listenCustomers,
  updateCustomer,
  addCustomer,
  USER_ID,
  type Customer,
} from "@/services/db";

type EditState = Record<string, Partial<Customer>>;

export default function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<EditState>({});
  const [adding, setAdding] = useState({
    code: "",
    name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    const unsub = listenCustomers(USER_ID, (r) => {
      setRows(r);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [rows]
  );

  const startEdit = (c: Customer) =>
    setEdit((prev) => ({
      ...prev,
      [c.id]: { name: c.name, phone: c.phone, address: c.address },
    }));

  const cancelEdit = (id: string) =>
    setEdit((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });

  const saveEdit = async (id: string) => {
    const patch = edit[id];
    if (!patch) return;
    await updateCustomer(USER_ID, id, patch);
    cancelEdit(id);
  };

  const addNew = async () => {
    const code = adding.code.trim();
    const name = adding.name.trim();
    if (!code || !name) return alert("Code dan Name wajib diisi.");
    await addCustomer(USER_ID, {
      code,
      name,
      phone: adding.phone || undefined,
      address: adding.address || undefined,
    });
    setAdding({ code: "", name: "", phone: "", address: "" });
  };

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 space-y-6">
      <PageHeader
        title="Customers"
        subtitle="Master Customers (realtime) — tambah & edit data."
      />

      {/* Quick stats / badge jumlah */}
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>Jumlah customer:</span>
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-blue-700 ring-1 ring-inset ring-blue-200">
          {loading ? "—" : sorted.length}
        </span>
      </div>

      {/* Form tambah */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">
          Tambah Customer
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
          <label className="sr-only" htmlFor="code">
            Code
          </label>
          <input
            id="code"
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="Code"
            value={adding.code}
            onChange={(e) => setAdding((s) => ({ ...s, code: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && addNew()}
          />

          <label className="sr-only" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="Name"
            value={adding.name}
            onChange={(e) => setAdding((s) => ({ ...s, name: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && addNew()}
          />

          <label className="sr-only" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="Phone"
            value={adding.phone}
            onChange={(e) =>
              setAdding((s) => ({ ...s, phone: e.target.value }))
            }
            onKeyDown={(e) => e.key === "Enter" && addNew()}
          />

          <label className="sr-only" htmlFor="address">
            Address
          </label>
          <input
            id="address"
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="Address"
            value={adding.address}
            onChange={(e) =>
              setAdding((s) => ({ ...s, address: e.target.value }))
            }
            onKeyDown={(e) => e.key === "Enter" && addNew()}
          />

          <button
            onClick={addNew}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[.98] focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            Tambah
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Tekan <kbd className="rounded bg-slate-100 px-1">Enter</kbd> untuk
          cepat menambah saat mengisi field.
        </p>
      </div>

      {/* Tabel */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Code</th>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Phone</th>
                <th className="px-4 py-3 text-left font-semibold">Address</th>
                <th className="px-4 py-3 text-left font-semibold">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-slate-500">
                    Memuat data…
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-slate-500">
                    Belum ada data.
                  </td>
                </tr>
              ) : (
                sorted.map((c) => {
                  const e = edit[c.id];
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-slate-900">{c.code}</td>

                      <td className="px-4 py-3">
                        {e ? (
                          <input
                            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            value={e.name ?? ""}
                            onChange={(ev) =>
                              setEdit((s) => ({
                                ...s,
                                [c.id]: { ...s[c.id], name: ev.target.value },
                              }))
                            }
                          />
                        ) : (
                          <span className="text-slate-900">{c.name}</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {e ? (
                          <input
                            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            value={e.phone ?? ""}
                            onChange={(ev) =>
                              setEdit((s) => ({
                                ...s,
                                [c.id]: { ...s[c.id], phone: ev.target.value },
                              }))
                            }
                          />
                        ) : (
                          <span className="text-slate-700">
                            {c.phone || "-"}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {e ? (
                          <input
                            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            value={e.address ?? ""}
                            onChange={(ev) =>
                              setEdit((s) => ({
                                ...s,
                                [c.id]: {
                                  ...s[c.id],
                                  address: ev.target.value,
                                },
                              }))
                            }
                          />
                        ) : (
                          <span className="text-slate-700">
                            {c.address || "-"}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {e ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => saveEdit(c.id)}
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => cancelEdit(c.id)}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(c)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                          >
                            Edit
                          </button>
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

      <p className="text-xs text-slate-500">
        *Realtime dari Firestore: <code>users/{USER_ID}/customers</code>
      </p>
    </div>
  );
}
