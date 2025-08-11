import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitBus } from "@/lib/bus";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { questionId, answerIndex, value } = await req.json();
    
    if (!questionId || answerIndex === undefined || value === undefined) {
      return NextResponse.json({ error: "questionId, answerIndex, and value required" }, { status: 400 });
    }

    if (typeof value !== "number" || value < 0) {
      return NextResponse.json({ error: "value must be a non-negative number" }, { status: 400 });
    }

    // Update the answer value
    const updatedAnswer = await prisma.answer.update({
      where: {
        questionId_index: {
          questionId,
          index: answerIndex
        }
      },
      data: {
        value: Math.floor(value) // Ensure integer
      }
    });

    // Emit WebSocket events for real-time updates
    emitBus({ type: 'state:update' });
    emitBus({ type: 'scores:update' });

    return NextResponse.json({ ok: true, answer: updatedAnswer });
  } catch (error) {
    console.error("Failed to update answer value:", error);
    return NextResponse.json({ error: "Failed to update answer value" }, { status: 500 });
  }
}
