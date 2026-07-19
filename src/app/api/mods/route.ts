import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { saveImage, saveModFile } from "@/lib/uploads";
import { MOD_CATEGORIES } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { notifyFollowersOfNewMod } from "@/lib/notifications";

const modSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  summary: z.string().min(10, "Summary must be at least 10 characters").max(200),
  description: z.string().min(20, "Description must be at least 20 characters").max(10000),
  version: z.string().min(1, "Version is required").max(20),
  category: z.enum(MOD_CATEGORIES),
  externalUrl: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const form = await request.formData();

    const data = modSchema.parse({
      title: form.get("title"),
      summary: form.get("summary"),
      description: form.get("description"),
      version: form.get("version"),
      category: form.get("category"),
      externalUrl: form.get("externalUrl") ?? "",
    });

    const image = form.get("image");
    const modFile = form.get("file");

    if (!(modFile instanceof File && modFile.size > 0) && !data.externalUrl) {
      return NextResponse.json(
        { error: "Provide a mod archive or an external download link" },
        { status: 400 }
      );
    }

    let imageUrl: string | null = null;
    if (image instanceof File && image.size > 0) {
      imageUrl = await saveImage(image, "mods");
    }

    let fileUrl: string | null = null;
    if (modFile instanceof File && modFile.size > 0) {
      fileUrl = await saveModFile(modFile);
    }

    const screenshotUrls: string[] = [];
    for (const shot of form.getAll("screenshots").slice(0, 8)) {
      if (shot instanceof File && shot.size > 0) {
        screenshotUrls.push(await saveImage(shot, "mods"));
      }
    }

    // Ensure a unique slug.
    const base = slugify(data.title) || "mod";
    let slug = base;
    for (let i = 2; await db.mod.findUnique({ where: { slug } }); i++) {
      slug = `${base}-${i}`;
    }

    const mod = await db.mod.create({
      data: {
        title: data.title,
        slug,
        summary: data.summary,
        description: data.description,
        version: data.version,
        category: data.category,
        externalUrl: data.externalUrl || null,
        imageUrl,
        fileUrl,
        authorId: user.id,
        // Owner uploads go live immediately; everyone else awaits approval.
        status: user.role === "ADMIN" ? "APPROVED" : "PENDING",
        screenshots: {
          create: screenshotUrls.map((url, index) => ({
            url,
            sortOrder: index,
          })),
        },
      },
    });

    // Owner uploads go live immediately — notify their followers right away.
    if (mod.status === "APPROVED") {
      await notifyFollowersOfNewMod(user.id, mod.title, mod.slug);
    }

    return NextResponse.json({ ok: true, slug: mod.slug, status: mod.status });
  } catch (error) {
    return handleApiError(error);
  }
}
