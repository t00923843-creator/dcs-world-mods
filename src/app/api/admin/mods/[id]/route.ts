import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { notifyFollowersOfNewMod } from "@/lib/notifications";

const reviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { action } = reviewSchema.parse(await request.json());

    const before = await db.mod.findUnique({ where: { id } });
    const mod = await db.mod.update({
      where: { id },
      data: { status: action === "approve" ? "APPROVED" : "REJECTED" },
    });

    // A mod going live for the first time notifies the author's followers.
    if (action === "approve" && before?.status !== "APPROVED") {
      await notifyFollowersOfNewMod(mod.authorId, mod.title, mod.slug);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.mod.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
