"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Start" },
  { href: "/matches", label: "Spiele" },
  { href: "/ranking", label: "Rangliste" },
];

export function AppNav() {
  const pathname = usePathname();
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch("/api/live/status");
        if (!res.ok) return;
        const data = await res.json();
        if (active) setLiveCount(data.liveCount ?? 0);
      } catch {
        // ignore
      }
    }

    poll();
    const id = setInterval(poll, 30_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-chalk/10 bg-pitch-night/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/dashboard" className="font-display text-lg font-bold tracking-tight text-floodlight">
          WM<span className="text-chalk">26</span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                pathname.startsWith(link.href)
                  ? "bg-floodlight/15 text-floodlight"
                  : "text-chalk/60 hover:text-chalk",
              )}
            >
              {link.label}
              {link.href === "/matches" && liveCount > 0 && (
                <span className="live-dot absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-signal" />
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
