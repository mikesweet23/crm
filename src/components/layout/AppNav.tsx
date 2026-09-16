"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/contacts", label: "Contacts" },
  { href: "/search", label: "Search" },
  { href: "/settings", label: "Settings" },
];

export function AppNav({
  userName,
  demoMode,
}: {
  userName: string;
  demoMode: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleLogout() {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/absolute-mind-logo.png"
              alt="Absolute Mind"
              width={140}
              height={78}
              className="h-10 w-auto"
              priority
            />
            <span className="hidden text-xs font-medium uppercase tracking-[0.14em] text-brand-grey sm:inline">
              CRM
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-brand-soft text-brand-strong"
                      : "text-slate-600 hover:bg-slate-100 hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {demoMode ? (
            <span className="hidden rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 sm:inline">
              Demo mode
            </span>
          ) : null}
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-ink">{userName}</p>
            <p className="text-xs text-muted">Signed in</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={pending}
            className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-brand hover:text-brand sm:inline-flex"
          >
            {pending ? "…" : "Logout"}
          </button>
          <button
            type="button"
            className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Menu"
          >
            Menu
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium",
                  pathname.startsWith(item.href)
                    ? "bg-brand-soft text-brand-strong"
                    : "text-slate-700",
                )}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700"
            >
              Logout
            </button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
