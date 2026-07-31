import type { Driver, PrismaClient } from "@prisma/client";

// The app has no auth yet, so every import attaches to a single standing
// driver rather than asking who's uploading - same "Demo Driver" identity
// the seed script uses.
const DEFAULT_DRIVER_NAME = "Demo Driver";

// Read-only counterpart for page renders: a GET shouldn't have the side
// effect of inserting a Driver row. Callers treat a null result as "no data
// yet" (empty state / not found) rather than provisioning one on the spot.
export async function getDefaultDriver(
  client: Pick<PrismaClient, "driver">,
): Promise<Driver | null> {
  return client.driver.findFirst();
}

export async function getOrCreateDefaultDriver(
  client: Pick<PrismaClient, "driver">,
): Promise<Driver> {
  const existing = await getDefaultDriver(client);
  if (existing) return existing;

  return client.driver.create({
    data: { displayName: DEFAULT_DRIVER_NAME, preferredSims: [] },
  });
}
