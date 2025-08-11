import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitBus } from "@/lib/bus";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { teamBonuses } = await req.json();
    
    if (!teamBonuses || typeof teamBonuses !== 'object') {
      return NextResponse.json({ error: "teamBonuses object required with R, G, B amounts" }, { status: 400 });
    }

    const gs = await prisma.gameState.findFirst();
    if (!gs) return NextResponse.json({ error: "game state missing" }, { status: 400 });
    
    if (gs.round2BonusApplied) {
      return NextResponse.json({ error: "R2 bonus already applied" }, { status: 409 });
    }

    const adjustments: { team: "R" | "G" | "B"; amount: number; reason: string }[] = [];
    
    // Add manual bonuses for each team
    (['R','G','B'] as const).forEach((team) => {
      const amount = parseInt(teamBonuses[team]) || 0;
      if (amount > 0) {
        adjustments.push({ team, amount, reason: `Round 2 Manual Bonus` });
      }
    });

    await prisma.$transaction(async (tx) => {
      // Create score adjustments for manual bonuses
      for (const adj of adjustments) {
        await tx.scoreAdjustment.create({ data: adj as any });
      }
      // Mark R2 bonus as applied
      await tx.gameState.update({ where: { id: gs.id }, data: { round2BonusApplied: true } });
    });

    // Emit WebSocket events for real-time updates
    emitBus({ type: 'scores:update' });
    emitBus({ type: 'state:update' });

    return NextResponse.json({ ok: true, applied: adjustments });
  } catch (error) {
    console.error("Failed to apply manual R2 bonus:", error);
    return NextResponse.json({ error: "Failed to apply manual R2 bonus" }, { status: 500 });
  }
}
