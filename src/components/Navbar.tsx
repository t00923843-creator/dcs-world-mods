import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SITE_NAME } from "@/lib/constants";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  const user = await getCurrentUser();
  const unread = user
    ? await db.notification.count({ where: { userId: user.id, read: false } })
    : 0;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-base/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt={SITE_NAME} className="h-10 w-10" />
          <span className="font-mono text-sm font-bold uppercase tracking-widest text-ink sm:text-base">
            DCS<span className="text-hud"> World Mods</span>
          </span>
          <span className="sr-only">{SITE_NAME}</span>
        </Link>
        <NavbarClient
          user={
            user
              ? {
                  username: user.username,
                  role: user.role,
                  avatarUrl: user.avatarUrl,
                }
              : null
          }
          unread={unread}
        />
      </div>
    </header>
  );
}
