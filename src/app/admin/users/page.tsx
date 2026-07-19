import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { formatDate } from "@/lib/utils";
import { UserActions } from "./UserActions";
import { UsernameRequestActions } from "./UsernameRequestActions";
import { VerificationRequestActions } from "./VerificationRequestActions";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export const metadata: Metadata = { title: "Manage Users" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = await getCurrentUser();
  const [users, usernameRequests, verificationRequests] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { mods: true, posts: true } } },
    }),
    db.usernameChangeRequest.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { username: true } } },
    }),
    db.verificationRequest.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            username: true,
            createdAt: true,
            _count: { select: { mods: true } },
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      {verificationRequests.length > 0 && (
        <section>
          <h2 className="section-title mb-4">
            Verification Requests ({verificationRequests.length})
          </h2>
          <div className="card divide-y divide-line">
            {verificationRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <span className="font-semibold text-radar">
                    {req.user.username}
                  </span>{" "}
                  <span className="font-mono text-xs text-muted">
                    · {req.user._count.mods} mods
                  </span>
                  {req.message && (
                    <p className="mt-1 text-sm text-muted">{req.message}</p>
                  )}
                </div>
                <VerificationRequestActions requestId={req.id} />
              </div>
            ))}
          </div>
        </section>
      )}
      {usernameRequests.length > 0 && (
        <section>
          <h2 className="section-title mb-4">
            Username Change Requests ({usernameRequests.length})
          </h2>
          <div className="card divide-y divide-line">
            {usernameRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <span className="text-sm text-ink">
                  <span className="font-semibold text-radar">
                    {req.user.username}
                  </span>{" "}
                  → <span className="font-semibold text-hud">{req.newUsername}</span>
                </span>
                <UsernameRequestActions requestId={req.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="card overflow-x-auto">
      <table className="w-full min-w-160 text-sm">
        <thead>
          <tr className="border-b border-line text-left font-mono text-xs uppercase tracking-wider text-muted">
            <th className="p-4">User</th>
            <th className="p-4">Email</th>
            <th className="p-4">Joined</th>
            <th className="p-4">Activity</th>
            <th className="p-4">Role</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <Avatar username={user.username} avatarUrl={user.avatarUrl} size="sm" />
                  <span className="font-semibold text-ink">{user.username}</span>
                  {user.verified && <VerifiedBadge size={14} />}
                </div>
              </td>
              <td className="p-4 text-muted">{user.email}</td>
              <td className="p-4 font-mono text-xs text-muted">
                {formatDate(user.createdAt)}
              </td>
              <td className="p-4 font-mono text-xs text-muted">
                {user._count.mods} mods · {user._count.posts} posts
              </td>
              <td className="p-4" colSpan={2}>
                <UserActions
                  userId={user.id}
                  username={user.username}
                  role={user.role}
                  isSelf={user.id === admin?.id}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
