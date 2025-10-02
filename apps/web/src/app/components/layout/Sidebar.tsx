"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, History, Users } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Dashboard", Icon: BarChart3 },
  { href: "/customers", label: "Customers", Icon: Users }, // ⬅️ baru
  { href: "/visits", label: "Visits", Icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 shrink-0 bg-slate-900 text-slate-200">
      <div className="flex h-full flex-col">
        {/* brand */}
        <div className="px-4 py-4 border-b border-slate-800 bg-slate-900">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white font-bold">
              SA
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Sales Admin
            </span>
          </Link>
        </div>

        {/* nav */}
        <nav className="px-2 py-3 space-y-1 text-sm">
          {items.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* footer */}
        <div className="mt-auto p-4 text-[11px] text-slate-500 border-t border-slate-800">
          © {new Date().getFullYear()} Sales Suite
        </div>
      </div>
    </aside>
  );
}
