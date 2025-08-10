import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitBus } from "@/lib/bus";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { name, phone, team } = await req.json().catch(() => ({}));
  if (!name || !phone || !team) return NextResponse.json({ error: "name, phone, team required" }, { status: 400 });

  const gs = await prisma.gameState.findFirst();
  const window = gs?.audienceWindow ?? 0;
  if (window === 0) return NextResponse.json({ error: "selection closed" }, { status: 403 });

  // Rules: one submission per phone overall; Window 2 allows first-time submissions only
  const existing = await prisma.audienceMember.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json({ error: "already submitted" }, { status: 409 });
  }

  // Validate team
  if (!["R", "G", "B"].includes(team)) {
    return NextResponse.json({ error: "invalid team" }, { status: 400 });
  }

  const created = await prisma.audienceMember.create({
    data: { name, phone, team, windowNumber: window },
  });
  emitBus({ type: 'audience:update' });
  return NextResponse.json({ ok: true, id: created.id });
}


