"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();
  const onBlog = pathname.startsWith("/blog");

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
      <Link
        href="/"
        className="font-display text-xl font-bold text-foreground hover:text-accent transition-colors select-none"
      >
        🥬 Wongbot
      </Link>

      <Link
        href="/blog"
        className={`text-sm font-medium transition-colors ${
          onBlog ? "text-foreground" : "text-muted hover:text-foreground"
        }`}
      >
        Blog
      </Link>
    </nav>
  );
}
