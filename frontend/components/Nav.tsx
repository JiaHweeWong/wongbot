"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "🥬 Wongbot" },
    { href: "/blog", label: "✍️ Blog" },
  ];

  return (
    <nav className="flex items-center gap-1 px-6 py-4 border-b border-border bg-surface">
      {links.map(({ href, label }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isActive
                ? "bg-surface-raised text-foreground"
                : "text-muted hover:text-foreground hover:bg-surface-raised"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
