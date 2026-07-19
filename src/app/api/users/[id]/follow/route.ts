import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";

// Toggle following a developer.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    if (id === user.id) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    const target = await db.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = await db.follow.findUnique({
      where: {
        followerId_followingId: { followerId: user.id, followingId: id },
      },
    });

    if (existing) {
      await db.follow.delete({ where: { id: existing.id } });
    } else {
      await db.follow.create({
        data: { followerId: user.id, followingId: id },
      });
    }

    const count = await db.follow.count({ where: { followingId: id } });
    return NextResponse.json({ ok: true, following: !existing, count });
  } catch (error) {
    return handleApiError(error);
  }
}
