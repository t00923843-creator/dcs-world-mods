/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { RoleBadge } from "@/components/RoleBadge";
import { Stars } from "@/components/Stars";
import {
  MOD_CATEGORY_LABELS,
  type ModCategory,
} from "@/lib/constants";
import { formatDate, formatNumber, timeAgo } from "@/lib/utils";
import { DownloadButton } from "./DownloadButton";
import { RatingWidget } from "./RatingWidget";
import { CommentForm } from "./CommentForm";
import { ReportButton } from "@/components/ReportButton";
import { categoryPlaceholder } from "@/components/ModCard";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export const dynamic = "force-dynamic";

export default async function ModPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();

  const mod = await db.mod.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          role: true,
          verified: true,
        },
      },
      ratings: true,
      screenshots: { orderBy: { sortOrder: "asc" } },
      comments: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              username: true,
              avatarUrl: true,
              role: true,
              verified: true,
            },
          },
        },
      },
    },
  });

  if (!mod) notFound();
  // Pending/rejected mods are only visible to their author and admins.
  const canSeeUnpublished =
    user && (user.id === mod.author.id || user.role === "ADMIN");
  if (mod.status !== "APPROVED" && !canSeeUnpublished) notFound();

  const avg =
    mod.ratings.length > 0
      ? mod.ratings.reduce((sum, r) => sum + r.value, 0) / mod.ratings.length
      : 0;
  const myRating = user
    ? mod.ratings.find((r) => r.userId === user.id)?.value ?? 0
    : 0;

  return (
    <div className="mt-8 space-y-8 pb-8">
      <nav className="font-mono text-xs text-muted">
        <Link href="/mods" className="hover:text-hud">Mods Library</Link>
        {" / "}
        <span className="text-ink">{mod.title}</span>
      </nav>

      {mod.status !== "APPROVED" && (
        <div className="card border-hud/50 p-4 font-mono text-sm text-hud">
          ⚠ This mod is {mod.status.toLowerCase()} and not publicly visible.
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="relative aspect-video w-full bg-raised">
              <img
                src={mod.imageUrl ?? categoryPlaceholder(mod.category)}
                alt={mod.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="hud-tag">
                  {MOD_CATEGORY_LABELS[mod.category as ModCategory] ?? mod.category}
                </span>
                <span className="font-mono text-xs text-muted">
                  v{mod.version} · updated {formatDate(mod.updatedAt)}
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-wide text-ink">
                {mod.title}
              </h1>
              <p className="mt-1 text-muted">{mod.summary}</p>
              <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-ink/90">
                {mod.description}
              </div>
            </div>
          </div>

          {/* Screenshots */}
          {mod.screenshots.length > 0 && (
            <section className="card p-6">
              <h2 className="section-title mb-4">Screenshots</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {mod.screenshots.map((shot) => (
                  <a
                    key={shot.id}
                    href={shot.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group overflow-hidden rounded border border-line"
                  >
                    <img
                      src={shot.url}
                      alt={`${mod.title} screenshot`}
                      className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Comments */}
          <section className="card p-6">
            <h2 className="section-title mb-4">
              Comments ({mod.comments.length})
            </h2>
            {user ? (
              <CommentForm modId={mod.id} />
            ) : (
              <p className="mb-4 text-sm text-muted">
                <Link href="/login" className="text-hud hover:underline">
                  Log in
                </Link>{" "}
                to join the discussion.
              </p>
            )}
            <div className="mt-6 space-y-5">
              {mod.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar
                    username={comment.user.username}
                    avatarUrl={comment.user.avatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/profile/${comment.user.username}`}
                        className="flex items-center gap-1 text-sm font-semibold text-radar hover:text-hud"
                      >
                        {comment.user.username}
                        {comment.user.verified && <VerifiedBadge size={13} />}
                      </Link>
                      <RoleBadge role={comment.user.role} />
                      <span className="font-mono text-xs text-muted">
                        {timeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm text-ink/90">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="card hud-corners space-y-4 p-6">
            <DownloadButton
              modId={mod.id}
              available={mod.status === "APPROVED" && Boolean(mod.fileUrl || mod.externalUrl)}
            />
            <div className="grid grid-cols-2 gap-3 font-mono text-center">
              <div className="rounded border border-line p-3">
                <div className="text-xl font-bold text-hud">
                  {formatNumber(mod.downloads)}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted">
                  Downloads
                </div>
              </div>
              <div className="rounded border border-line p-3">
                <div className="text-xl font-bold text-hud">
                  {avg > 0 ? avg.toFixed(1) : "—"}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted">
                  Rating ({mod.ratings.length})
                </div>
              </div>
            </div>
            <div>
              <p className="label">Rate this mod</p>
              {user ? (
                <RatingWidget modId={mod.id} initial={myRating} />
              ) : (
                <Stars value={avg} count={mod.ratings.length} />
              )}
            </div>
          </div>

          <div className="card p-6">
            <p className="label">Created by</p>
            <Link
              href={`/profile/${mod.author.username}`}
              className="flex items-center gap-3"
            >
              <Avatar
                username={mod.author.username}
                avatarUrl={mod.author.avatarUrl}
              />
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-ink hover:text-hud">
                  {mod.author.username}
                  {mod.author.verified && <VerifiedBadge size={15} />}
                </div>
                <RoleBadge role={mod.author.role} />
              </div>
            </Link>
          </div>

          {user && (
            <div className="text-right">
              <ReportButton targetType="MOD" targetId={mod.id} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
