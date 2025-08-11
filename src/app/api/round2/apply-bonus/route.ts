import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitBus } from "@/lib/bus";

export const dynamic = "force-dynamic";

export async function POST() {
  const gs = await prisma.gameState.findFirst();
  if (!gs) return NextResponse.json({ error: "state missing" }, { status: 400 });
  if (gs.currentRound !== 2) return NextResponse.json({ error: "not in Round 2" }, { status: 400 });
  if (gs.round2BonusApplied) return NextResponse.json({ error: "already applied" }, { status: 409 });

  // Collect all reveals from Round 2 (across questions)
  const reveals = await prisma.reveal.findMany({ where: { roundNumber: 2 } });

  const correctCounts: Record<string, number> = { R: 0, G: 0, B: 0 } as any;
  const round2Totals: Record<string, number> = { R: 0, G: 0, B: 0 } as any;

  for (const r of reveals) {
    if (r.attribution === "R" || r.attribution === "G" || r.attribution === "B") {
      // Fetch the exact answer for this reveal to get its per-answer value
      const ans = await prisma.answer.findUnique({ where: { questionId_index: { questionId: r.questionId, index: r.answerIndex } } });
      const value = ans?.value ?? 0;
      correctCounts[r.attribution]++;
      round2Totals[r.attribution] += value;
    }
  }

  const adjustments: { team: "R" | "G" | "B"; amount: number; reason: string }[] = [];
  (['R','G','B'] as const).forEach((t) => {
    const count = correctCounts[t] || 0;
    const subtotal = round2Totals[t] || 0;
    let multiplier = 1;
    if (count >= 4) multiplier = 3; else if (count >= 3) multiplier = 2;
    if (multiplier > 1 && subtotal > 0) {
      const bonus = subtotal * (multiplier - 1);
      adjustments.push({ team: t, amount: bonus, reason: `Round 2 x${multiplier}` });
    }
  });

  await prisma.$transaction(async (tx) => {
    for (const adj of adjustments) {
      await tx.scoreAdjustment.create({ data: adj as any });
    }
    await tx.gameState.update({ where: { id: gs.id }, data: { round2BonusApplied: true } });
  });

  // Emit WebSocket events for real-time updates
  emitBus({ type: 'scores:update' });
  emitBus({ type: 'state:update' });

  return NextResponse.json({ ok: true, applied: adjustments });
}


