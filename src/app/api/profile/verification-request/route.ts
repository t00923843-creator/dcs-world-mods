import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";

const requestSchema = z.object({
  message: z.string().max(1000).optional(),
});

// A user asks to become a Verified Developer; only the Owner can approve.
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const { message } = requestSchema.parse(await request.json());

    const full = await db.user.findUnique({ where: { id: user.id } });
    if (full?.verified) {
      return NextResponse.json(
        { error: "You are already verified" },
        { status: 400 }
      );
    }

    const open = await db.verificationRequest.findFirst({
      where: { userId: user.id, status: "OPEN" },
    });
    if (open) {
      await db.verificationRequest.update({
        where: { id: open.id },
        data: { message: message ?? open.message },
      });
    } else {
      await db.verificationRequest.create({
        data: { userId: user.id, message },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
