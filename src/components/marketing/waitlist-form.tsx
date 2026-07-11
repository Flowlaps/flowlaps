"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinWaitlist, type WaitlistState } from "@/app/actions/waitlist";

const initialState: WaitlistState = { status: "idle" };

export function WaitlistForm() {
  const [state, formAction, isPending] = useActionState(
    joinWaitlist,
    initialState,
  );

  if (state.status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl border border-border bg-card p-6 text-center"
      >
        <p className="font-medium">
          You&apos;re on the list. We&apos;ll be in touch.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      noValidate
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
    >
      <div className="flex-1">
        <label htmlFor="waitlist-email" className="sr-only">
          Email address
        </label>
        <Input
          // React resets uncontrolled form fields when a form action starts,
          // which would otherwise blank the input the moment an error
          // appears. Re-keying on the last submitted value forces a fresh
          // mount with that value as defaultValue, so what the user typed
          // stays visible next to the error message.
          key={state.status === "error" ? state.email : "idle"}
          id="waitlist-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          defaultValue={state.status === "error" ? state.email : undefined}
          aria-invalid={state.status === "error"}
          aria-describedby={
            state.status === "error" ? "waitlist-email-error" : undefined
          }
          className="h-10"
        />
        {state.status === "error" ? (
          <p
            id="waitlist-email-error"
            role="alert"
            className="mt-2 text-sm text-destructive"
          >
            {state.message}
          </p>
        ) : null}
      </div>
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Joining…" : "Join the waitlist"}
      </Button>
    </form>
  );
}
