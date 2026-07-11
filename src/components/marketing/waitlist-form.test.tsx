import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { WaitlistForm } from "./waitlist-form";
import { joinWaitlist } from "@/app/actions/waitlist";

vi.mock("@/app/actions/waitlist", () => ({
  joinWaitlist: vi.fn(),
}));

const mockedJoinWaitlist = vi.mocked(joinWaitlist);

beforeEach(() => {
  mockedJoinWaitlist.mockReset();
});

describe("WaitlistForm", () => {
  it("shows the server's validation error message", async () => {
    mockedJoinWaitlist.mockResolvedValue({
      status: "error",
      message: "Please enter a valid email address.",
      email: "not-an-email",
    });

    render(<WaitlistForm />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "not-an-email" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Join the waitlist" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please enter a valid email address.",
    );
  });

  it("keeps the submitted email visible in the input after a failed submission", async () => {
    // React clears uncontrolled form fields when a form action starts, so
    // the component has to restore the value from the returned state -
    // this test guards against that value silently disappearing again.
    mockedJoinWaitlist.mockResolvedValue({
      status: "error",
      message: "Please enter a valid email address.",
      email: "not-an-email",
    });

    render(<WaitlistForm />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "not-an-email" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Join the waitlist" }));

    await screen.findByRole("alert");
    expect(screen.getByLabelText("Email address")).toHaveValue("not-an-email");
  });

  it("submits the entered email to the server action", async () => {
    mockedJoinWaitlist.mockResolvedValue({ status: "success" });

    render(<WaitlistForm />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "driver@example.com" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Join the waitlist" }));
    });

    expect(mockedJoinWaitlist).toHaveBeenCalledTimes(1);
    const formData = mockedJoinWaitlist.mock.calls[0][1] as FormData;
    expect(formData.get("email")).toBe("driver@example.com");
  });

  it("disables the button and shows a static pending label while submitting", async () => {
    let resolveAction!: (state: Awaited<ReturnType<typeof joinWaitlist>>) => void;
    mockedJoinWaitlist.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );

    render(<WaitlistForm />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "driver@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Join the waitlist" }));

    const pendingButton = await screen.findByRole("button", { name: "Joining…" });
    expect(pendingButton).toBeDisabled();

    await act(async () => {
      resolveAction({ status: "success" });
    });
  });

  it("shows a quiet confirmation on success, with no exclamation marks", async () => {
    mockedJoinWaitlist.mockResolvedValue({ status: "success" });

    render(<WaitlistForm />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "driver@example.com" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Join the waitlist" }));
    });

    const confirmation = await screen.findByRole("status");
    expect(confirmation).toHaveTextContent(
      "You're on the list. We'll be in touch.",
    );
    expect(confirmation.textContent).not.toMatch(/!/);
  });
});
