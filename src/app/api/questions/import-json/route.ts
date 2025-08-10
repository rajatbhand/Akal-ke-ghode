import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const AnswerSchema = z.object({
  index: z.number().int().positive().optional(),
  text: z.string().min(1),
  value: z.number().int().nonnegative(),
});

const QuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  answerCount: z.number().int().positive().optional(),
  isFinalRound: z.boolean().optional(),
  answers: z.array(AnswerSchema).min(1),
});

const PayloadSchema = z.object({
  questions: z.array(QuestionSchema).min(1),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { questions } = parsed.data;
  const importedIds: string[] = [];

  await prisma.$transaction(async (tx) => {
    for (const q of questions) {
      const answerCount = q.answerCount ?? q.answers.length;
      await tx.question.upsert({
        where: { id: q.id },
        update: { text: q.text, answerCount, isFinalRound: q.isFinalRound ?? false },
        create: { id: q.id, text: q.text, answerCount, isFinalRound: q.isFinalRound ?? false },
      });

      await tx.answer.deleteMany({ where: { questionId: q.id } });
      for (let i = 0; i < answerCount; i++) {
        const ans = q.answers[i];
        if (!ans) continue;
        await tx.answer.create({
          data: {
            questionId: q.id,
            index: ans.index ?? i + 1,
            text: ans.text,
            value: ans.value,
          },
        });
      }
      importedIds.push(q.id);
    }
  });

  return NextResponse.json({ imported: importedIds.length, ids: importedIds });
}


