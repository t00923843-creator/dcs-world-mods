import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE_URL = process.env.APP_URL ?? "https://dcs-world-mods.vercel.app";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [mods, categories, threads, guides, news] = await Promise.all([
    db.mod.findMany({
      where: { status: "APPROVED" },
      select: { slug: true, updatedAt: true },
    }),
    db.forumCategory.findMany({ select: { slug: true } }),
    db.thread.findMany({ select: { id: true, updatedAt: true }, take: 500 }),
    db.guide.findMany({ select: { slug: true, createdAt: true } }),
    db.newsItem.findMany({
      where: { slug: { not: null } },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/mods`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/forum`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/developers`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/news`, changeFrequency: "daily", priority: 0.7 },
  ];

  return [
    ...staticPages,
    ...mods.map((mod) => ({
      url: `${BASE_URL}/mods/${mod.slug}`,
      lastModified: mod.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...categories.map((cat) => ({
      url: `${BASE_URL}/forum/${cat.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...threads.map((thread) => ({
      url: `${BASE_URL}/forum/thread/${thread.id}`,
      lastModified: thread.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...guides.map((guide) => ({
      url: `${BASE_URL}/developers/${guide.slug}`,
      lastModified: guide.createdAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...news.map((item) => ({
      url: `${BASE_URL}/news/${item.slug}`,
      lastModified: item.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
