import type { MetadataRoute } from "next";

const BASE_URL = process.env.APP_URL ?? "https://dcs-world-mods.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/messages", "/notifications"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
