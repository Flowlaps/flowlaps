# Spec: Waitlist Email Capture

## Objective

Replace the landing page's mocked client-only waitlist submit with a real, persisted signup: validate the email server-side, store it once per unique address, and drive the existing calm-tone UI states (idle/pending/success/error) from a real Server Action instead of a `setTimeout`.

## Tech stack

Next.js App Router, TypeScript, Prisma, Zod, PostgreSQL (Vercel Postgres, already provisioned — `DATABASE_URL` pulled into `.env.local` via `vercel env pull`).

## Data model

```prisma
model Waitlist {
  id        String   @id @default(uuid())
  email     String   @unique
  createdAt DateTime @default(now())
}
```

## Server Action contract

`src/app/actions/waitlist.ts`, `"use server"`.

**Signature:** `joinWaitlist(prevState: WaitlistState, formData: FormData): Promise<WaitlistState>` — matches `useActionState`'s required shape.

```ts
type WaitlistState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };
```

**Behavior:**
1. Parse `formData.get("email")` with `z.string().trim().toLowerCase().email()`.
2. On validation failure → `{ status: "error", message: "Please enter a valid email address." }`. No distinction between empty/malformed — one message either way, per the requested UX.
3. On success, `prisma.waitlist.upsert({ where: { email }, create: { email }, update: {} })` — atomic insert-or-noop. A duplicate email always returns `{ status: "success" }`, identical to a first-time signup. This is the graceful duplicate-handling the requirement asked for: no unique-constraint error ever reaches the client, and the response gives no signal about whether the address was already present.
4. Any unexpected error (DB unreachable, etc.) is caught and mapped to `{ status: "error", message: "Something went wrong. Please try again." }` — not in the original requirements list, but CLAUDE.md's Definition of Done requires an error state for every feature, and an uncaught exception would surface Next.js's default error boundary instead of the calm inline message.

Email is lowercased before the uniqueness check so `Foo@x.com` and `foo@x.com` are treated as the same signup — an assumption, flagging it in case case-sensitive emails are wanted instead.

## Client UI states

`src/components/marketing/waitlist-form.tsx` (`"use client"`), via `useActionState(joinWaitlist, { status: "idle" })`, using the hook's own `isPending` flag rather than a separate `useFormStatus` subcomponent (unnecessary indirection for a single-button form).

| State | Trigger | UI |
|---|---|---|
| idle/error | `status !== "success"` | Input + button. Button reads "Join the waitlist" |
| pending | `isPending === true` | Button disabled, text → "Joining…" |
| error | `status === "error"` | Red text below input: the returned `message`, `role="alert"` |
| success | `status === "success"` | Input+button replaced with: "You're on the list. We'll be in touch." — `role="status" aria-live="polite"`, no exclamation marks |

**Dropped from the previous mock implementation:** client-side regex validation and "clear error as you type" (previously done by tracking `email` in local `useState`). The server is now the single source of truth for validation, and the form becomes an uncontrolled `<form action={formAction}>` — no local email state needed. This is a minor UX regression (the red error text won't clear until the next submit attempt) that I'm accepting for simplicity since it wasn't in the requirements; flagging it explicitly rather than silently dropping it.

## Boundaries

- **Always:** run lint/test/build before considering done; keep the Prisma client a singleton (avoid exhausting Postgres connections in dev via hot-reload).
- **Ask first:** anything involving the production DB directly (already resolved — using the pulled dev connection string, `prisma db push` only, no migrations against prod).
- **Never:** commit `.env.local` or any connection string; log the raw email in server-side error paths beyond what's needed to debug.

## Success criteria

- `pnpm exec prisma db push` succeeds against the real Postgres instance and creates the `Waitlist` table.
- Submitting a new email persists a row and shows the success state.
- Re-submitting the same email again still shows success (no error, no duplicate row — verified via `upsert`).
- Submitting an invalid email shows the red error text, no DB write.
- All existing marketing test suite passes with the mocked-timer tests replaced by mocked-server-action tests.
