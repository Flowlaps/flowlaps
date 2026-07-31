import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ImportUploadForm } from "./import-upload-form";

const mockedFetch = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  mockedFetch.mockReset();
  push.mockReset();
  vi.stubGlobal("fetch", mockedFetch);
});

function selectFile(file: File) {
  fireEvent.change(screen.getByLabelText("Session CSV"), {
    target: { files: [file] },
  });
}

function fillMetadata() {
  fireEvent.change(screen.getByLabelText("Sim"), { target: { value: "Assetto Corsa Competizione" } });
  fireEvent.change(screen.getByLabelText("Track"), { target: { value: "Spa-Francorchamps" } });
  fireEvent.change(screen.getByLabelText("Car class"), { target: { value: "GT3" } });
  fireEvent.change(screen.getByLabelText("Car"), { target: { value: "Porsche 992" } });
  fireEvent.click(screen.getByRole("combobox", { name: "Session type" }));
  fireEvent.click(screen.getByRole("option", { name: "Practice" }));
}

const csvFile = new File(["lapNumber,timestampMs\n1,0\n"], "session.csv", {
  type: "text/csv",
});

describe("ImportUploadForm", () => {
  it("shows an error when submitting without choosing a file", () => {
    render(<ImportUploadForm />);

    fireEvent.click(screen.getByRole("button", { name: "Upload session" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Choose a CSV file to import.",
    );
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("shows an error when submitting without filling in session details", () => {
    render(<ImportUploadForm />);
    selectFile(csvFile);

    fireEvent.click(screen.getByRole("button", { name: "Upload session" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Fill in the session details before uploading.",
    );
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("uploads the selected file and session metadata to /api/imports", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ importId: "import-1", sessionId: "session-1" }),
    });

    render(<ImportUploadForm />);
    selectFile(csvFile);
    fillMetadata();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Upload session" }));
    });

    expect(mockedFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockedFetch.mock.calls[0];
    expect(url).toBe("/api/imports");
    expect(init.method).toBe("POST");
    const body = init.body as FormData;
    expect(body.get("file")).toBe(csvFile);
    expect(body.get("sim")).toBe("Assetto Corsa Competizione");
    expect(body.get("trackName")).toBe("Spa-Francorchamps");
    expect(body.get("carClassName")).toBe("GT3");
    expect(body.get("carName")).toBe("Porsche 992");
    expect(body.get("sessionType")).toBe("practice");
  });

  it("disables the button and shows a pending label while uploading", async () => {
    let resolveFetch!: (value: unknown) => void;
    mockedFetch.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    render(<ImportUploadForm />);
    selectFile(csvFile);
    fillMetadata();
    fireEvent.click(screen.getByRole("button", { name: "Upload session" }));

    const pendingButton = await screen.findByRole("button", {
      name: "Uploading…",
    });
    expect(pendingButton).toBeDisabled();

    await act(async () => {
      resolveFetch({ ok: true, json: async () => ({ importId: "import-1", sessionId: "session-1" }) });
    });
  });

  it("redirects to the session detail page on success", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ importId: "import-1", sessionId: "session-1" }),
    });

    render(<ImportUploadForm />);
    selectFile(csvFile);
    fillMetadata();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Upload session" }));
    });

    expect(push).toHaveBeenCalledWith("/sessions/session-1");
  });

  it("shows the server's validation error message on a rejected upload", async () => {
    mockedFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Track is required." }),
    });

    render(<ImportUploadForm />);
    selectFile(csvFile);
    fillMetadata();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Upload session" }));
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Track is required.");
    expect(push).not.toHaveBeenCalled();
  });

  it("shows a generic error message when the request fails outright", async () => {
    mockedFetch.mockRejectedValue(new Error("network down"));

    render(<ImportUploadForm />);
    selectFile(csvFile);
    fillMetadata();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Upload session" }));
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Something went wrong while uploading the file. Please try again.",
    );
  });

  it("clears a previous error once a new file is chosen", () => {
    render(<ImportUploadForm />);

    fireEvent.click(screen.getByRole("button", { name: "Upload session" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    selectFile(csvFile);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
