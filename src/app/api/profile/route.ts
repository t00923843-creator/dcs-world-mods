import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { saveImage } from "@/lib/uploads";

const optionalUrl = z
  .string()
  .url("Invalid URL")
  .max(300)
  .optional()
  .or(z.literal(""));

const profileSchema = z.object({
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
  discordUrl: optionalUrl,
  githubUrl: optionalUrl,
  youtubeUrl: optionalUrl,
});

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    const form = await request.formData();

    const data = profileSchema.parse({
      bio: form.get("bio") ?? undefined,
      discordUrl: form.get("discordUrl") ?? undefined,
      githubUrl: form.get("githubUrl") ?? undefined,
      youtubeUrl: form.get("youtubeUrl") ?? undefined,
    });

    let avatarUrl: string | undefined;
    const avatar = form.get("avatar");
    if (avatar instanceof File && avatar.size > 0) {
      avatarUrl = await saveImage(avatar, "avatars");
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.discordUrl !== undefined
          ? { discordUrl: data.discordUrl || null }
          : {}),
        ...(data.githubUrl !== undefined
          ? { githubUrl: data.githubUrl || null }
          : {}),
        ...(data.youtubeUrl !== undefined
          ? { youtubeUrl: data.youtubeUrl || null }
          : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
