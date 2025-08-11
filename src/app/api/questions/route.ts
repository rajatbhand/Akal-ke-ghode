import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const questions = await prisma.question.findMany({
    orderBy: { id: "asc" },
    include: { answers: { orderBy: { index: "asc" } } },
  });
  return NextResponse.json({ 
    questions,
    count: questions.length,
    debug: questions.map(q => ({ id: q.id, text: q.text.substring(0, 50), answerCount: q.answers.length }))
  });
}


