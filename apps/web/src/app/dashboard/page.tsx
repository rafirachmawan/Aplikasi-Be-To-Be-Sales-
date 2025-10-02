"use client";

import { useState } from "react";
import Sidebar from "@/app/components/layout/Sidebar";
import Topbar from "@/app/components/layout/Topbar";
import PageHeader from "@/app/components/layout/PageHeader";
import StatCard from "@/app/components/StatCard";
import VisitsTable, { Visit } from "@/app/components/VisitsTable";

export default function DashboardPage() {
  const [q, setQ] = useState("");
  const [temp, setTemp] = useState<Visit["temperature"] | "all">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [user, setUser] = useState("");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1">
        <Topbar />

        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 space-y-6">
          <PageHeader
            title="Dashboard"
            subtitle="Ringkasan performa & kunjungan terkini"
          />

          {/* Filters */}
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
                <label className="text-xs font-medium text-slate-600">
                  From
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">To</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  User ID
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="opsional"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              title="Total Visits (view)"
              value="—"
              hint="berdasarkan filter aktif"
            />
            <StatCard title="Menyala" value="—" />
            <StatCard title="Panas" value="—" />
            <StatCard title="Hangat / Dingin" value="—" />
          </div>

          {/* Table */}
          <VisitsTable
            search={q}
            filterTemp={temp}
            filterDateFrom={from}
            filterDateTo={to}
            filterUser={user}
          />
        </div>
      </main>
    </div>
  );
}
