import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitBus } from "@/lib/bus";

export const dynamic = "force-dynamic";

function sum<T>(arr: T[], pick: (t: T) => number) {
  return arr.reduce((a, b) => a + pick(b), 0);
}

export async function GET() {
  // Sum all reveals across the entire game and add manual adjustments
  const reveals = await prisma.reveal.findMany();
  const adjustments = await prisma.scoreAdjustment.findMany();

  // Collect all questionIds touched by reveals and fetch their answers
  const qIds = Array.from(new Set(reveals.map((r) => r.questionId)));
  const answers = await prisma.answer.findMany({ where: { questionId: { in: qIds } } });
  const valueMap = new Map<string, number>();
  for (const a of answers) valueMap.set(`${a.questionId}:${a.index}`, a.value);

  const base = { R: 0, G: 0, B: 0 } as Record<string, number>;
  for (const r of reveals) {
    if (r.attribution === "R" || r.attribution === "G" || r.attribution === "B") {
      const v = valueMap.get(`${r.questionId}:${r.answerIndex}`) ?? 0;
      base[r.attribution] += v;
    }
  }

  const extra = { R: 0, G: 0, B: 0 } as Record<string, number>;
  for (const adj of adjustments) extra[adj.team] += adj.amount;

  return NextResponse.json({ totals: { R: base.R + extra.R, G: base.G + extra.G, B: base.B + extra.B } });
}

export async function POST(req: Request) {
  const { team, amount, reason } = await req.json().catch(() => ({}));
  if (!team || typeof amount !== "number") return NextResponse.json({ error: "team, amount required" }, { status: 400 });
  if (!["R", "G", "B"].includes(team)) return NextResponse.json({ error: "invalid team" }, { status: 400 });
  const adj = await prisma.scoreAdjustment.create({ data: { team, amount, reason: reason || "manual" } as any });
  emitBus({ type: 'scores:update' });
  return NextResponse.json({ ok: true, adjustment: adj });
}


