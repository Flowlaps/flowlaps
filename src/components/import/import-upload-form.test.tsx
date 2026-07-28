import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ImportUploadForm } from "./import-upload-form";

const mockedFetch = vi.fn();

beforeEach(() => {
  mockedFetch.mockReset();
  vi.stubGlobal("fetch", mockedFetch);
});

function selectFile(file: File) {
  fireEvent.change(screen.getByLabelText("Session CSV"), {
    target: { files: [file] },
  });
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

  it("uploads the selected file to /api/imports", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "import-1",
        filename: "session.csv",
        fileSizeBytes: csvFile.size,
        status: "uploaded",
        createdAt: "2026-07-28T12:00:00.000Z",
      }),
    });

    render(<ImportUploadForm />);
    selectFile(csvFile);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Upload session" }));
    });

    expect(mockedFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockedFetch.mock.calls[0];
    expect(url).toBe("/api/imports");
    expect(init.method).toBe("POST");
    expect((init.body as FormData).get("file")).toBe(csvFile);
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
    fireEvent.click(screen.getByRole("button", { name: "Upload session" }));

    const pendingButton = await screen.findByRole("button", {
      name: "Uploading…",
    });
    expect(pendingButton).toBeDisabled();

    await act(async () => {
      resolveFetch({ ok: true, json: async () => ({ filename: "session.csv" }) });
    });
  });

  it("shows a calm confirmation on success", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ filename: "session.csv" }),
    });

    render(<ImportUploadForm />);
    selectFile(csvFile);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Upload session" }));
    });

    const confirmation = await screen.findByRole("status");
    expect(confirmation).toHaveTextContent("session.csv was uploaded.");
  });

  it("shows the server's validation error message on a rejected upload", async () => {
    mockedFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Only .csv files are supported." }),
    });

    render(<ImportUploadForm />);
    selectFile(csvFile);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Upload session" }));
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Only .csv files are supported.",
    );
  });

  it("shows a generic error message when the request fails outright", async () => {
    mockedFetch.mockRejectedValue(new Error("network down"));

    render(<ImportUploadForm />);
    selectFile(csvFile);

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
