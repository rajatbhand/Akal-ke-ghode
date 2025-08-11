import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Unified dashboard API to reduce network round-trips
export async function GET() {
  try {
    // Fetch all data in parallel from database - optimized queries
    const [gameState, teams, questions, reveals, adjustments, audienceMembers] = await Promise.all([
      prisma.gameState.findFirst(),
      prisma.team.findMany({ orderBy: { id: "asc" } }),
      prisma.question.findMany({ 
        include: { 
          answers: { orderBy: { index: "asc" } },
          reveals: { orderBy: { createdAt: "desc" } } // Most recent first for performance
        }
      }),
      prisma.reveal.findMany({ orderBy: { createdAt: "desc" } }), // Most recent first
      prisma.scoreAdjustment.findMany(),
      prisma.audienceMember.groupBy({
        by: ["team"],
        _count: { team: true },
      })
    ]);

    // Calculate scores
    const base = { R: 0, G: 0, B: 0 } as Record<string, number>;
    const qIds = Array.from(new Set(reveals.map((r) => r.questionId)));
    const answers = await prisma.answer.findMany({ where: { questionId: { in: qIds } } });
    const valueMap = new Map<string, number>();
    for (const a of answers) valueMap.set(`${a.questionId}:${a.index}`, a.value);

    for (const r of reveals) {
      if (r.attribution === "R" || r.attribution === "G" || r.attribution === "B") {
        const v = valueMap.get(`${r.questionId}:${r.answerIndex}`) ?? 0;
        base[r.attribution] += v;
      }
    }

    const extra = { R: 0, G: 0, B: 0 } as Record<string, number>;
    for (const adj of adjustments) extra[adj.team] += adj.amount;

    // Calculate dugout counts
    const dugoutMap = Object.fromEntries(audienceMembers.map((c) => [c.team, c._count.team]));
    const teamsWithDugout = teams.map((t) => ({ ...t, dugout: dugoutMap[t.id] ?? 0 }));

    // Round 2 preview
    let r2Preview = null;
    if (gameState?.currentRound === 2) {
      const round2Reveals = reveals.filter(r => r.roundNumber === 2);
      const correctCounts: Record<string, number> = { R: 0, G: 0, B: 0 };
      const round2Totals: Record<string, number> = { R: 0, G: 0, B: 0 };

      for (const r of round2Reveals) {
        if (r.attribution === "R" || r.attribution === "G" || r.attribution === "B") {
          const value = valueMap.get(`${r.questionId}:${r.answerIndex}`) ?? 0;
          correctCounts[r.attribution]++;
          round2Totals[r.attribution] += value;
        }
      }

      const bonuses: Record<string, number> = { R: 0, G: 0, B: 0 };
      (['R','G','B'] as const).forEach((t) => {
        const count = correctCounts[t] || 0;
        const subtotal = round2Totals[t] || 0;
        let multiplier = 1;
        if (count >= 4) multiplier = 3; else if (count >= 3) multiplier = 2;
        if (multiplier > 1 && subtotal > 0) {
          bonuses[t] = subtotal * (multiplier - 1);
        }
      });

      r2Preview = {
        round: 2,
        applied: gameState?.round2BonusApplied ?? false,
        bonuses,
        correctCounts
      };
    }

    // Find current question with reveals - include full data
    let currentQuestion = null;
    if (gameState?.currentQuestionId) {
      currentQuestion = questions.find(q => q.id === gameState.currentQuestionId);
      // Include reveals in the question object for immediate display
      if (currentQuestion) {
        currentQuestion.reveals = reveals.filter(r => r.questionId === currentQuestion.id);
      }
    }

    // Return unified response
    return NextResponse.json({
      // Game state
      state: {
        state: gameState,
        question: currentQuestion
      },
      
      // Teams with dugout counts
      teams: teamsWithDugout,
      
      // All questions
      questions: questions.map(q => ({
        id: q.id,
        text: q.text
      })),
      
      // Scores
      totals: { 
        R: base.R + extra.R, 
        G: base.G + extra.G, 
        B: base.B + extra.B 
      },
      
      // Audience window
      window: gameState?.audienceWindow ?? 0,
      
      // Round 2 preview
      r2Preview
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
