import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";

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

    const req = await db.verificationRequest.findUnique({ where: { id } });
    if (!req || req.status !== "OPEN") {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (action === "reject") {
      await db.verificationRequest.update({
        where: { id },
        data: { status: "REJECTED" },
      });
      return NextResponse.json({ ok: true });
    }

    const target = await db.user.findUnique({ where: { id: req.userId } });
    await db.$transaction([
      db.user.update({
        where: { id: req.userId },
        data: {
          verified: true,
          // Verified members become Developers (Owners keep their role).
          ...(target?.role === "USER" ? { role: "DEVELOPER" } : {}),
        },
      }),
      db.verificationRequest.update({
        where: { id },
        data: { status: "APPROVED" },
      }),
      db.notification.create({
        data: {
          userId: req.userId,
          title: "You are now a Verified Developer! ✔",
          body: "Your verification request was approved. The blue badge now appears next to your name.",
          link: "/developers",
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
