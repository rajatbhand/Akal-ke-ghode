import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const teams = await prisma.team.findMany({ orderBy: { id: "asc" } });
  const counts = await prisma.audienceMember.groupBy({
    by: ["team"],
    _count: { team: true },
  });
  const map = Object.fromEntries(counts.map((c) => [c.team, c._count.team]));
  return NextResponse.json({
    teams: teams.map((t) => ({ ...t, dugout: map[t.id] ?? 0 })),
  });
}


