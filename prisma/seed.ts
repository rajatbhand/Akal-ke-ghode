import { prisma } from "../src/lib/prisma";

async function main() {
  // Seed fixed teams R/G/B
  await prisma.team.upsert({
    where: { id: "R" as any },
    update: {},
    create: { id: "R" as any, name: "Red", colorHex: "#FF3B30" },
  });
  await prisma.team.upsert({
    where: { id: "G" as any },
    update: {},
    create: { id: "G" as any, name: "Green", colorHex: "#34C759" },
  });
  await prisma.team.upsert({
    where: { id: "B" as any },
    update: {},
    create: { id: "B" as any, name: "Blue", colorHex: "#0A84FF" },
  });
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


