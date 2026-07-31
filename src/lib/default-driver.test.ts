import { describe, expect, it, vi } from "vitest";
import { getOrCreateDefaultDriver, getDefaultDriver } from "./default-driver";

describe("getOrCreateDefaultDriver", () => {
  it("returns the existing driver without creating a new one", async () => {
    const existingDriver = { id: "driver-1", displayName: "Demo Driver" };
    const client = {
      driver: {
        findFirst: vi.fn().mockResolvedValue(existingDriver),
        create: vi.fn(),
      },
    };

    const result = await getOrCreateDefaultDriver(client as never);

    expect(result).toBe(existingDriver);
    expect(client.driver.create).not.toHaveBeenCalled();
  });

  it("creates a default driver when none exists", async () => {
    const createdDriver = { id: "driver-2", displayName: "Demo Driver" };
    const client = {
      driver: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(createdDriver),
      },
    };

    const result = await getOrCreateDefaultDriver(client as never);

    expect(result).toBe(createdDriver);
    expect(client.driver.create).toHaveBeenCalledWith({
      data: { displayName: "Demo Driver", preferredSims: [] },
    });
  });
});

describe("getDefaultDriver", () => {
  it("returns the existing driver", async () => {
    const existingDriver = { id: "driver-1", displayName: "Demo Driver" };
    const client = { driver: { findFirst: vi.fn().mockResolvedValue(existingDriver) } };

    const result = await getDefaultDriver(client as never);

    expect(result).toBe(existingDriver);
  });

  it("returns null without creating one when no driver exists", async () => {
    const create = vi.fn();
    const client = { driver: { findFirst: vi.fn().mockResolvedValue(null), create } };

    const result = await getDefaultDriver(client as never);

    expect(result).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });
});
