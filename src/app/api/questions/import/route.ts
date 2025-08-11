import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parse } from "csv-parse/sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60; // seconds

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("text/csv") && !contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Send CSV (text/csv or multipart/form-data with file)" }, { status: 400 });
    }

    let csvText = "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });
      csvText = await file.text();
    } else {
      csvText = await req.text();
    }

    const records: string[][] = parse(csvText, { skip_empty_lines: true });
    if (!records.length) return NextResponse.json({ imported: 0 });

    const header = records[0];
    const answerCols = Array.from({ length: 15 }, (_, i) => `Answer${i + 1}`);
    const valueCols = Array.from({ length: 15 }, (_, i) => `Value${i + 1}`);

    for (const col of ["QuestionID", "QuestionText", "AnswerCount"]) {
      if (!header.includes(col)) return NextResponse.json({ error: `Missing column ${col}` }, { status: 400 });
    }

    const colIndex = (name: string) => header.indexOf(name);
    const importedIds: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (let i = 1; i < records.length; i++) {
        const row = records[i];
        const id = String(row[colIndex("QuestionID")] || "").trim();
        const text = String(row[colIndex("QuestionText")] || "").trim();
        const answerCount = parseInt(String(row[colIndex("AnswerCount")] || "0"), 10) || 0;
        if (!id || !text || answerCount <= 0) continue;

        await tx.question.upsert({
          where: { id },
          update: { text, answerCount },
          create: { id, text, answerCount },
        });

        await tx.answer.deleteMany({ where: { questionId: id } });

        for (let idx = 0; idx < answerCount; idx++) {
          const a = String(row[colIndex(answerCols[idx])] || "").trim();
          const v = parseInt(String(row[colIndex(valueCols[idx])] || "0"), 10) || 0;
          if (!a) continue;
          await tx.answer.create({
            data: { questionId: id, index: idx + 1, text: a, value: v },
          });
        }

        importedIds.push(id);
      }
    });

    return NextResponse.json({ imported: importedIds.length, ids: importedIds });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}


