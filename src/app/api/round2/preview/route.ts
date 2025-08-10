import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const gs = await prisma.gameState.findFirst();
  if (!gs || gs.currentRound !== 2) {
    return NextResponse.json({ round: gs?.currentRound ?? 0, preview: { R: null, G: null, B: null } });
  }

  const reveals = await prisma.reveal.findMany({ where: { roundNumber: 2 } });

  // For subtotals we need answer values per reveal
  const qIds = Array.from(new Set(reveals.map((r) => r.questionId)));
  const answers = await prisma.answer.findMany({ where: { questionId: { in: qIds } } });
  const valueMap = new Map<string, number>();
  for (const a of answers) valueMap.set(`${a.questionId}:${a.index}`, a.value);

  const correctCounts: Record<'R'|'G'|'B', number> = { R: 0, G: 0, B: 0 };
  const subtotals: Record<'R'|'G'|'B', number> = { R: 0, G: 0, B: 0 };

  for (const r of reveals) {
    if (r.attribution === 'R' || r.attribution === 'G' || r.attribution === 'B') {
      correctCounts[r.attribution] += 1;
      const v = valueMap.get(`${r.questionId}:${r.answerIndex}`) ?? 0;
      subtotals[r.attribution] += v;
    }
  }

  const preview: Record<'R'|'G'|'B', { count: number; subtotal: number; multiplier: number; bonus: number }> = {
    R: { count: correctCounts.R, subtotal: subtotals.R, multiplier: 1, bonus: 0 },
    G: { count: correctCounts.G, subtotal: subtotals.G, multiplier: 1, bonus: 0 },
    B: { count: correctCounts.B, subtotal: subtotals.B, multiplier: 1, bonus: 0 },
  };

  (['R','G','B'] as const).forEach((t) => {
    const c = preview[t].count;
    const sub = preview[t].subtotal;
    const mult = c >= 4 ? 3 : c >= 3 ? 2 : 1;
    preview[t].multiplier = mult;
    preview[t].bonus = mult > 1 ? sub * (mult - 1) : 0;
  });

  return NextResponse.json({ round: 2, preview });
}


