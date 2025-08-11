import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitBus } from "@/lib/bus";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { questionId, answerIndex, attribution } = await req.json().catch(() => ({}));
  if (!questionId || !answerIndex || !attribution) {
    return NextResponse.json({ error: "questionId, answerIndex, attribution required" }, { status: 400 });
  }
  if (!["R", "G", "B", "Host", "Neutral"].includes(attribution)) {
    return NextResponse.json({ error: "invalid attribution" }, { status: 400 });
  }

  // Ensure question exists and answer exists
  const ans = await prisma.answer.findUnique({ where: { questionId_index: { questionId, index: answerIndex } } });
  if (!ans) return NextResponse.json({ error: "answer not found" }, { status: 404 });

  const gs = await prisma.gameState.findFirst();
  const roundNumber = gs?.currentRound ?? 0;
  // Create reveal with roundNumber from game state
  const r = await prisma.reveal.create({ data: { questionId, answerIndex, attribution, roundNumber } as any });
  emitBus({ type: 'reveal' });
  emitBus({ type: 'scores:update' });
  return NextResponse.json({ ok: true, reveal: r });
}

export async function DELETE(req: Request) {
  const { questionId, answerIndex } = await req.json().catch(() => ({}));
  if (!questionId || !answerIndex) {
    return NextResponse.json({ error: "questionId, answerIndex required" }, { status: 400 });
  }

  // Delete reveal for this question and answer
  await prisma.reveal.deleteMany({ 
    where: { 
      questionId, 
      answerIndex 
    } 
  });
  
  emitBus({ type: 'reveal' });
  emitBus({ type: 'scores:update' });
  return NextResponse.json({ ok: true });
}


