import type { Driver, PrismaClient } from "@prisma/client";

// The app has no auth yet, so every import attaches to a single standing
// driver rather than asking who's uploading - same "Demo Driver" identity
// the seed script uses.
const DEFAULT_DRIVER_NAME = "Demo Driver";

export async function getOrCreateDefaultDriver(
  client: Pick<PrismaClient, "driver">,
): Promise<Driver> {
  const existing = await client.driver.findFirst();
  if (existing) return existing;

  return client.driver.create({
    data: { displayName: DEFAULT_DRIVER_NAME, preferredSims: [] },
  });
}
