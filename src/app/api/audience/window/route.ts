import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitBus } from "@/lib/bus";

export const dynamic = "force-dynamic";

export async function GET() {
  const gs = await prisma.gameState.findFirst({});
  return NextResponse.json({ window: gs?.audienceWindow ?? 0 });
}

export async function POST(req: Request) {
  const { window } = await req.json().catch(() => ({}));
  if (![0, 1, 2].includes(window)) {
    return NextResponse.json({ error: "window must be 0,1,2" }, { status: 400 });
  }
  const gs0 = await prisma.gameState.findFirst();
  const id = gs0?.id ?? 1;
  await prisma.gameState.upsert({
    where: { id },
    update: { audienceWindow: window },
    create: { id, audienceWindow: window },
  });
  emitBus({ type: 'audience:update' });
  return NextResponse.json({ ok: true, window });
}


