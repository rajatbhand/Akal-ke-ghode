import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitBus } from "@/lib/bus";

export const dynamic = "force-dynamic";

export async function GET() {
  const gs = await prisma.gameState.findFirst();
  const q = gs?.currentQuestionId
    ? await prisma.question.findUnique({
        where: { id: gs.currentQuestionId },
        include: { answers: { orderBy: { index: "asc" } }, reveals: true },
      })
    : null;

  // Compute totals from reveals
  const totals: Record<string, number> = { R: 0, G: 0, B: 0 } as any;
  if (q) {
    for (const r of q.reveals) {
      if (r.attribution === "R" || r.attribution === "G" || r.attribution === "B") {
        const ans = q.answers.find((a) => a.index === r.answerIndex);
        totals[r.attribution] += ans?.value ?? 0;
      }
    }
  }

  return NextResponse.json({ state: gs, question: q, totals });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const gs0 = await prisma.gameState.findFirst();
  const id = gs0?.id ?? 1;

  const keys = [
    "currentQuestionId",
    "activeTeam",
    "currentRound",
    "r3AnswerCount",
    "timerSetting",
    "finalBonus",
    "logoOnly",
    "bigX",
    "scorecardOverlay",
  ] as const;

  const updateData: any = {};
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(body, k)) updateData[k] = body[k];

  const createData: any = { id, ...updateData };

  const updated = await prisma.gameState.upsert({
    where: { id },
    update: updateData,
    create: createData,
  });
  emitBus({ type: 'state:update' });
  return NextResponse.json({ state: updated });
}


