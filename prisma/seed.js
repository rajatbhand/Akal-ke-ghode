// Seed database with fixed teams using plain Node (CJS) to avoid TS/ESM loader issues
const { PrismaClient } = require("../src/generated/prisma");
const prisma = new PrismaClient();

async function main() {
  await prisma.team.upsert({
    where: { id: "R" },
    update: {},
    create: { id: "R", name: "Red", colorHex: "#FF3B30" },
  });
  await prisma.team.upsert({
    where: { id: "G" },
    update: {},
    create: { id: "G", name: "Green", colorHex: "#34C759" },
  });
  await prisma.team.upsert({
    where: { id: "B" },
    update: {},
    create: { id: "B", name: "Blue", colorHex: "#0A84FF" },
  });

  // Ensure GameState row exists
  const gs = await prisma.gameState.findFirst();
  if (!gs) {
    await prisma.gameState.create({ data: { id: 1, currentRound: 0, r3AnswerCount: 4, finalBonus: 0, audienceWindow: 0 } });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


