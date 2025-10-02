"use client";

import { Bell, Search } from "lucide-react";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="mx-auto max-w-screen-2xl h-16 px-4 flex items-center justify-between">
        {/* brand mini (mobile view) */}
        <a href="/dashboard" className="flex items-center gap-2 md:hidden">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">
            SA
          </span>
          <span className="font-semibold text-slate-900">Sales Admin</span>
        </a>

        {/* Search (desktop) */}
        <div className="relative w-full max-w-xl mx-0 md:mx-6 hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            placeholder="Search (customer, note)…"
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              const input = e.currentTarget;
              if (e.key === "Enter") {
                const url = new URL(window.location.href);
                if (input.value) url.searchParams.set("q", input.value);
                else url.searchParams.delete("q");
                window.location.href = url.toString();
              }
            }}
          />
        </div>

        {/* actions */}
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
