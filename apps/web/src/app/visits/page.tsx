"use client";

import Sidebar from "@/app/components/layout/Sidebar";
import Topbar from "@/app/components/layout/Topbar";
import PageHeader from "@/app/components/layout/PageHeader";
import VisitsTable, { Visit } from "@/app/components/VisitsTable";
import { useState } from "react";

export default function VisitsPage() {
  const [q, setQ] = useState("");
  const [temp, setTemp] = useState<Visit["temperature"] | "all">("all");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1">
        <Topbar />
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 space-y-6">
          <PageHeader title="Visits" subtitle="Daftar kunjungan terbaru" />

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Search
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Customer / note"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Temperature
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm capitalize text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  value={temp}
                  onChange={(e) =>
                    setTemp(e.target.value as Visit["temperature"] | "all")
                  }
                >
                  <option value="all">All</option>
                  <option value="dingin">Dingin</option>
                  <option value="hangat">Hangat</option>
                  <option value="panas">Panas</option>
                  <option value="menyala">Menyala</option>
                </select>
              </div>
            </div>
          </div>

          <VisitsTable search={q} filterTemp={temp} />
        </div>
      </main>
    </div>
  );
}
