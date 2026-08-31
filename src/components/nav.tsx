"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/(app)/actions";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/mare", label: "Mare — Affitti brevi", icon: "🌊" },
  { href: "/mensili", label: "Affitti mensili", icon: "🏢" },
  { href: "/spese", label: "Spese e manutenzione", icon: "🧾" },
  { href: "/documenti", label: "Documenti", icon: "📁" },
  { href: "/note", label: "Note", icon: "📝" },
  { href: "/promemoria", label: "Promemoria", icon: "⏰" },
  { href: "/report", label: "Report e statistiche", icon: "📊" },
  { href: "/assistente", label: "Assistente IA", icon: "✨" },
  { href: "/impostazioni", label: "Impostazioni", icon: "⚙️" },
];

const MOBILE_TABS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/mare", label: "Mare", icon: "🌊" },
  { href: "/mensili", label: "Mensili", icon: "🏢" },
  { href: "/spese", label: "Spese", icon: "🧾" },
  { href: "/assistente", label: "IA", icon: "✨" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({ userEmail }: { userEmail: string | null | undefined }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-lg font-bold text-white">
          M
        </div>
        <span className="text-lg font-semibold text-slate-900">Marea</span>
      </div>
      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive(pathname, item.href)
                ? "bg-teal-50 text-teal-800"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-3">
        <p className="truncate px-2 text-xs text-slate-500">{userEmail}</p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="mt-1 w-full rounded-lg px-2 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
          >
            Esci
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileHeader({ userEmail }: { userEmail: string | null | undefined }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-sm font-bold text-white">
            M
          </div>
          <span className="font-semibold text-slate-900">Marea</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Apri menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          ☰
        </button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-4">
              <span className="font-semibold text-slate-900">Menu</span>
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                ✕
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 px-3 overflow-y-auto">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive(pathname, item.href) ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span aria-hidden>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-slate-200 p-3">
              <p className="truncate px-2 text-xs text-slate-500">{userEmail}</p>
              <form action={logoutAction}>
                <button type="submit" className="mt-1 w-full rounded-lg px-2 py-2 text-left text-sm text-slate-600">
                  Esci
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      {MOBILE_TABS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
            isActive(pathname, item.href) ? "text-teal-700" : "text-slate-500"
          }`}
        >
          <span className="text-lg" aria-hidden>
            {item.icon}
          </span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
