import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { RoleBadge } from "@/components/RoleBadge";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { FollowButton } from "@/components/FollowButton";
import { ModCard, type ModCardData } from "@/components/ModCard";
import { formatDate, formatNumber, timeAgo } from "@/lib/utils";
import { ProfileEditor } from "./ProfileEditor";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const viewer = await getCurrentUser();

  const user = await db.user.findUnique({
    where: { username },
    include: {
      mods: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { username: true } },
          ratings: { select: { value: true } },
        },
      },
      threads: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, createdAt: true },
      },
      posts: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          content: true,
          createdAt: true,
          thread: { select: { id: true, title: true } },
        },
      },
      _count: { select: { posts: true, mods: true, followers: true } },
    },
  });
  if (!user) notFound();

  const isOwn = viewer?.id === user.id;

  const [pendingUsername, pendingVerification, viewerFollows] =
    await Promise.all([
      isOwn
        ? db.usernameChangeRequest.findFirst({
            where: { userId: user.id, status: "OPEN" },
          })
        : null,
      isOwn
        ? db.verificationRequest.findFirst({
            where: { userId: user.id, status: "OPEN" },
          })
        : null,
      viewer && !isOwn
        ? db.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: viewer.id,
                followingId: user.id,
              },
            },
          })
        : null,
    ]);

  const cards: ModCardData[] = user.mods.map((mod) => ({
    slug: mod.slug,
    title: mod.title,
    summary: mod.summary,
    version: mod.version,
    category: mod.category,
    imageUrl: mod.imageUrl,
    downloads: mod.downloads,
    author: mod.author,
    avgRating:
      mod.ratings.length > 0
        ? mod.ratings.reduce((sum, r) => sum + r.value, 0) / mod.ratings.length
        : 0,
    ratingCount: mod.ratings.length,
  }));

  // Developer stats across all published mods.
  const totalDownloads = user.mods.reduce((sum, m) => sum + m.downloads, 0);
  const allRatings = user.mods.flatMap((m) => m.ratings.map((r) => r.value));
  const avgRating =
    allRatings.length > 0
      ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
      : 0;

  const socials = [
    { url: user.discordUrl, label: "⌬ Discord" },
    { url: user.githubUrl, label: "⌥ GitHub" },
    { url: user.youtubeUrl, label: "▶ YouTube" },
  ].filter((s): s is { url: string; label: string } => Boolean(s.url));

  return (
    <div className="mt-8 space-y-10 pb-8">
      {/* Header */}
      <div className="card hud-corners p-8">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <Avatar username={user.username} avatarUrl={user.avatarUrl} size="lg" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-3xl font-black tracking-wide text-ink">
                {user.username}
              </h1>
              {user.verified && <VerifiedBadge size={22} />}
              <RoleBadge role={user.role} />
              {user.verified && (
                <span className="rounded-sm border border-blue-500/50 bg-blue-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-blue-400">
                  Verified Developer
                </span>
              )}
            </div>
            <p className="mt-1 font-mono text-xs text-muted">
              joined {formatDate(user.createdAt)} · {user._count.followers}{" "}
              followers · {user._count.posts} forum posts
            </p>
            {user.bio && (
              <p className="mt-3 max-w-xl text-sm text-muted">{user.bio}</p>
            )}
            {socials.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost !px-3 !py-1 text-xs"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            )}
          </div>
          {viewer && !isOwn && (
            <FollowButton
              userId={user.id}
              initialFollowing={Boolean(viewerFollows)}
              initialCount={user._count.followers}
            />
          )}
        </div>

        {/* Developer stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-6 font-mono sm:grid-cols-4">
          {[
            { value: String(cards.length), label: "Published Mods" },
            { value: formatNumber(totalDownloads), label: "Total Downloads" },
            {
              value: avgRating > 0 ? avgRating.toFixed(1) + " ★" : "—",
              label: `Avg Rating (${allRatings.length})`,
            },
            { value: String(user._count.followers), label: "Followers" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-hud">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isOwn && (
        <ProfileEditor
          initialBio={user.bio ?? ""}
          initialDiscord={user.discordUrl ?? ""}
          initialGithub={user.githubUrl ?? ""}
          initialYoutube={user.youtubeUrl ?? ""}
          pendingUsername={pendingUsername?.newUsername ?? null}
          verified={user.verified}
          pendingVerification={Boolean(pendingVerification)}
        />
      )}

      {/* Mods */}
      {cards.length > 0 && (
        <section>
          <h2 className="section-title mb-5">Published Mods</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((mod) => (
              <ModCard key={mod.slug} mod={mod} />
            ))}
          </div>
        </section>
      )}

      {/* Activity */}
      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="section-title mb-5">Recent Threads</h2>
          <div className="card divide-y divide-line">
            {user.threads.length === 0 && (
              <p className="p-6 text-center text-sm text-muted">No threads yet.</p>
            )}
            {user.threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/forum/thread/${thread.id}`}
                className="block p-4 hover:bg-raised/60"
              >
                <div className="font-semibold text-ink">{thread.title}</div>
                <div className="mt-0.5 font-mono text-xs text-muted">
                  {timeAgo(thread.createdAt)}
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="section-title mb-5">Recent Posts</h2>
          <div className="card divide-y divide-line">
            {user.posts.length === 0 && (
              <p className="p-6 text-center text-sm text-muted">No posts yet.</p>
            )}
            {user.posts.map((post) => (
              <Link
                key={post.id}
                href={`/forum/thread/${post.thread.id}`}
                className="block p-4 hover:bg-raised/60"
              >
                <div className="line-clamp-2 text-sm text-ink/90">
                  {post.content}
                </div>
                <div className="mt-1 font-mono text-xs text-muted">
                  in {post.thread.title} · {timeAgo(post.createdAt)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
