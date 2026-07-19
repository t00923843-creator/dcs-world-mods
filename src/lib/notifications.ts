import "server-only";
import { db } from "./db";

/** Notify everyone following `authorId` that a new mod went live. */
export async function notifyFollowersOfNewMod(
  authorId: string,
  modTitle: string,
  modSlug: string
): Promise<void> {
  const [author, followers] = await Promise.all([
    db.user.findUnique({ where: { id: authorId }, select: { username: true } }),
    db.follow.findMany({
      where: { followingId: authorId },
      select: { followerId: true },
    }),
  ]);
  if (!author || followers.length === 0) return;

  await db.notification.createMany({
    data: followers.map((f) => ({
      userId: f.followerId,
      title: `New mod from ${author.username}: ${modTitle}`,
      body: "A developer you follow just published a new mod.",
      link: `/mods/${modSlug}`,
    })),
  });
}
