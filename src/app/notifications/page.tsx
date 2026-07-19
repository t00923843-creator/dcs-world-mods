import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Opening the page marks everything as read.
  await db.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });

  return (
    <div className="mx-auto mt-8 max-w-2xl space-y-6 pb-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-radar">
          // Incoming Transmissions
        </p>
        <h1 className="mt-1 text-3xl font-black uppercase tracking-wider text-ink">
          Notifications
        </h1>
      </div>

      <div className="card divide-y divide-line">
        {notifications.length === 0 && (
          <p className="p-10 text-center text-sm text-muted">
            No notifications yet. Follow developers to get notified when they
            publish new mods.
          </p>
        )}
        {notifications.map((n) => {
          const inner = (
            <div className={n.read ? "opacity-70" : ""}>
              <div className="flex items-center gap-2">
                {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-hud" />}
                <span className="font-semibold text-ink">{n.title}</span>
              </div>
              {n.body && <p className="mt-0.5 text-sm text-muted">{n.body}</p>}
              <p className="mt-1 font-mono text-xs text-muted">
                {timeAgo(n.createdAt)}
              </p>
            </div>
          );
          return n.link ? (
            <Link key={n.id} href={n.link} className="block p-4 hover:bg-raised/60">
              {inner}
            </Link>
          ) : (
            <div key={n.id} className="p-4">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
