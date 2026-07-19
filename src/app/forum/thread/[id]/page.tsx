import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { RoleBadge } from "@/components/RoleBadge";
import { ReportButton } from "@/components/ReportButton";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { formatDate, timeAgo } from "@/lib/utils";
import { ReplyForm } from "./ReplyForm";
import { LikeButton } from "./LikeButton";
import { ModerateBar } from "./ModerateBar";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const thread = await db.thread.findUnique({
    where: { id },
    include: {
      category: { select: { name: true, slug: true } },
      author: { select: { username: true } },
      posts: {
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: {
              username: true,
              avatarUrl: true,
              role: true,
              verified: true,
              createdAt: true,
              _count: { select: { posts: true } },
            },
          },
          likes: { select: { userId: true } },
        },
      },
    },
  });
  if (!thread) notFound();

  // Fire-and-forget view counter.
  db.thread
    .update({ where: { id }, data: { views: { increment: 1 } } })
    .catch(() => {});

  return (
    <div className="mt-8 space-y-6 pb-8">
      <nav className="font-mono text-xs text-muted">
        <Link href="/forum" className="hover:text-hud">Forum</Link>
        {" / "}
        <Link href={`/forum/${thread.category.slug}`} className="hover:text-hud">
          {thread.category.name}
        </Link>
        {" / "}
        <span className="text-ink">{thread.title}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-3">
        {thread.pinned && <span className="hud-tag">Pinned</span>}
        {thread.locked && (
          <span className="hud-tag !border-line !text-muted">Locked</span>
        )}
        <h1 className="text-2xl font-black tracking-wide text-ink sm:text-3xl">
          {thread.title}
        </h1>
      </div>

      {user?.role === "ADMIN" && (
        <ModerateBar
          threadId={thread.id}
          pinned={thread.pinned}
          locked={thread.locked}
          categorySlug={thread.category.slug}
        />
      )}

      <div className="space-y-4">
        {thread.posts.map((post, index) => (
          <article key={post.id} className="card flex flex-col gap-4 p-5 sm:flex-row">
            {/* Author panel */}
            <div className="flex shrink-0 items-center gap-3 sm:w-44 sm:flex-col sm:items-start sm:border-r sm:border-line sm:pr-4">
              <Avatar
                username={post.author.username}
                avatarUrl={post.author.avatarUrl}
              />
              <div>
                <Link
                  href={`/profile/${post.author.username}`}
                  className="flex items-center gap-1 font-semibold text-radar hover:text-hud"
                >
                  {post.author.username}
                  {post.author.verified && <VerifiedBadge size={14} />}
                </Link>
                <div className="mt-1">
                  <RoleBadge role={post.author.role} />
                </div>
                <div className="mt-1 font-mono text-[10px] text-muted">
                  joined {formatDate(post.author.createdAt)} ·{" "}
                  {post.author._count.posts} posts
                </div>
              </div>
            </div>

            {/* Post body */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between font-mono text-xs text-muted">
                <span>
                  #{index + 1} · {timeAgo(post.createdAt)}
                </span>
                {user && <ReportButton targetType="POST" targetId={post.id} />}
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/90">
                {post.content}
              </p>
              <div className="mt-4">
                <LikeButton
                  postId={post.id}
                  count={post.likes.length}
                  liked={Boolean(user && post.likes.some((l) => l.userId === user.id))}
                  canLike={Boolean(user)}
                />
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Reply */}
      {thread.locked && user?.role !== "ADMIN" ? (
        <div className="card p-6 text-center font-mono text-sm text-muted">
          🔒 This thread is locked.
        </div>
      ) : user ? (
        <div className="card p-6">
          <h2 className="section-title mb-4">Reply</h2>
          <ReplyForm threadId={thread.id} />
        </div>
      ) : (
        <div className="card p-6 text-center text-sm text-muted">
          <Link href="/login" className="text-hud hover:underline">
            Log in
          </Link>{" "}
          to join the discussion.
        </div>
      )}
    </div>
  );
}
