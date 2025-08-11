import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitBus } from "@/lib/bus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    // Clear show runtime data but keep questions/answers
    await prisma.$transaction([
      prisma.reveal.deleteMany({}),
      prisma.scoreAdjustment.deleteMany({}),
      prisma.audienceMember.deleteMany({}),
    ]);

    const defaults = {
      currentRound: 0,
      currentQuestionId: null as string | null,
      r3AnswerCount: 4,
      timerSetting: null as number | null,
      finalBonus: 0,
      activeTeam: null as any,
      logoOnly: false,
      bigX: false,
      scorecardOverlay: false,
      round2BonusApplied: false,
      audienceWindow: 0,
    };

    const existing = await prisma.gameState.findFirst();
    if (existing) {
      await prisma.gameState.update({ where: { id: existing.id }, data: defaults });
    } else {
      await prisma.gameState.create({ data: { id: 1, ...defaults } });
    }

    // Emit WebSocket events for complete refresh
    emitBus({ type: 'state:update' });
    emitBus({ type: 'scores:update' });
    emitBus({ type: 'audience:update' });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}


