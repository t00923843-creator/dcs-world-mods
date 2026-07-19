"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "./Avatar";

const LINKS = [
  { href: "/mods", label: "Mods" },
  { href: "/forum", label: "Forum" },
  { href: "/developers", label: "Developers" },
];

type NavUser = {
  username: string;
  role: string;
  avatarUrl: string | null;
} | null;

export function NavbarClient({
  user,
  unread = 0,
}: {
  user: NavUser;
  unread?: number;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const links = (
    <>
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => setOpen(false)}
          className={`text-sm font-semibold uppercase tracking-wider transition-colors hover:text-hud ${
            pathname.startsWith(link.href) ? "text-hud" : "text-muted"
          }`}
        >
          {link.label}
        </Link>
      ))}
      {user?.role === "ADMIN" && (
        <Link
          href="/admin"
          onClick={() => setOpen(false)}
          className={`text-sm font-semibold uppercase tracking-wider transition-colors hover:text-hud ${
            pathname.startsWith("/admin") ? "text-hud" : "text-muted"
          }`}
        >
          Admin
        </Link>
      )}
    </>
  );

  const auth = user ? (
    <div className="flex items-center gap-3">
      <Link
        href="/notifications"
        onClick={() => setOpen(false)}
        className="relative text-lg text-muted transition-colors hover:text-hud"
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-hud px-1 font-mono text-[10px] font-bold text-[#0a0e14]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
      <Link
        href={`/profile/${user.username}`}
        onClick={() => setOpen(false)}
        className="flex items-center gap-2 text-sm font-semibold text-ink hover:text-hud"
      >
        <Avatar username={user.username} avatarUrl={user.avatarUrl} size="sm" />
        <span>{user.username}</span>
      </Link>
      <button onClick={logout} className="btn-ghost !px-3 !py-1.5 text-xs">
        Log out
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link href="/login" className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setOpen(false)}>
        Log in
      </Link>
      <Link href="/register" className="btn-primary !px-3 !py-1.5 text-xs" onClick={() => setOpen(false)}>
        Sign up
      </Link>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <nav className="hidden items-center gap-6 md:flex">
        {links}
        {auth}
      </nav>

      {/* Mobile toggle */}
      <button
        className="flex h-9 w-9 items-center justify-center rounded border border-line text-ink md:hidden"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? "✕" : "☰"}
      </button>

      {/* Mobile menu */}
      {open && (
        <nav className="absolute inset-x-0 top-16 flex flex-col gap-4 border-b border-line bg-base/95 p-4 backdrop-blur md:hidden">
          {links}
          {auth}
        </nav>
      )}
    </>
  );
}
