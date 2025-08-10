import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const questions = await prisma.question.findMany({
    orderBy: { id: "asc" },
    include: { answers: { orderBy: { index: "asc" } } },
  });
  return NextResponse.json({ questions });
}


