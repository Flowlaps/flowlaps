import { prisma } from "@/lib/prisma";
import { buildDriverSeedInput } from "@/lib/seed-data";

// Domain tables are re-seeded from scratch on every run so this script stays
// safely re-runnable in local dev. Waitlist is untouched - it isn't part of
// this domain graph. Deleting Session first lets cascades clear Lap,
// TelemetryPoint, CoachingReport, and PracticeFocusArea; Driver/Track/Car are
// only safe to delete once nothing references them anymore.
async function resetDomainData() {
  await prisma.session.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.track.deleteMany();
  await prisma.car.deleteMany();
}

async function main() {
  await resetDomainData();
  const driver = await prisma.driver.create({ data: buildDriverSeedInput() });
  console.log(`Seeded driver ${driver.displayName} (${driver.id}) with mock session data.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
