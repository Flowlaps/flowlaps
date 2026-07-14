"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { track } from "@vercel/analytics/server";
import { prisma } from "@/lib/prisma";
import { WAITLIST_SIGNUP_EVENT } from "@/lib/analytics";

export type WaitlistState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string; email: string };

const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

const INVALID_EMAIL_MESSAGE = "Please enter a valid email address.";
const UNEXPECTED_ERROR_MESSAGE = "Something went wrong. Please try again.";

export async function joinWaitlist(
  _prevState: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const rawEmail = formData.get("email");
  const submittedEmail = typeof rawEmail === "string" ? rawEmail : "";

  const parsed = waitlistSchema.safeParse({ email: rawEmail });

  if (!parsed.success) {
    return {
      status: "error",
      message: INVALID_EMAIL_MESSAGE,
      email: submittedEmail,
    };
  }

  try {
    // Upsert so a duplicate email still resolves to success, with no
    // distinction visible to the client between "new" and "already on the
    // list" — avoids leaking whether an address is already registered.
    await prisma.waitlist.upsert({
      where: { email: parsed.data.email },
      create: { email: parsed.data.email },
      update: {},
    });
  } catch (error) {
    console.error("joinWaitlist: failed to upsert waitlist entry", error);
    return {
      status: "error",
      message: UNEXPECTED_ERROR_MESSAGE,
      email: submittedEmail,
    };
  }

  // Fire-and-forget: track() swallows its own errors and, on Vercel, defers
  // the request via waitUntil, so it must never block or fail the response.
  void track(WAITLIST_SIGNUP_EVENT, undefined, { headers: await headers() });

  return { status: "success" };
}
