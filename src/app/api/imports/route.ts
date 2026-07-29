import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { importUploadSchema } from "@/lib/validation/import";
import { importSessionMetadataSchema } from "@/lib/validation/import-session";
import { normalizeSimHubCsv } from "@/lib/import/simhub-csv";
import { buildSessionCreateInput } from "@/lib/import/build-session-input";
import { getOrCreateDefaultDriver } from "@/lib/import/default-driver";

const NO_FILE_MESSAGE = "No CSV file was provided.";
const UNEXPECTED_ERROR_MESSAGE =
  "Something went wrong while uploading the file. Please try again.";
const UNPARSEABLE_CSV_MESSAGE = "Could not parse this CSV file.";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: NO_FILE_MESSAGE }, { status: 400 });
  }

  const parsedFile = importUploadSchema.safeParse({
    filename: file.name,
    fileSizeBytes: file.size,
    rawContent: await file.text(),
  });

  if (!parsedFile.success) {
    return NextResponse.json(
      { error: parsedFile.error.issues[0]?.message ?? "Invalid file." },
      { status: 400 },
    );
  }

  const parsedMetadata = importSessionMetadataSchema.safeParse({
    sim: formData.get("sim"),
    trackName: formData.get("trackName"),
    carClassName: formData.get("carClassName"),
    carName: formData.get("carName"),
    sessionType: formData.get("sessionType"),
  });

  if (!parsedMetadata.success) {
    return NextResponse.json(
      { error: parsedMetadata.error.issues[0]?.message ?? "Invalid session details." },
      { status: 400 },
    );
  }

  let importRecord;
  try {
    importRecord = await prisma.import.create({
      data: {
        filename: parsedFile.data.filename,
        fileSizeBytes: parsedFile.data.fileSizeBytes,
        rawContent: parsedFile.data.rawContent,
        status: "uploaded",
      },
    });
  } catch (error) {
    console.error("POST /api/imports: failed to create import record", error);
    return NextResponse.json({ error: UNEXPECTED_ERROR_MESSAGE }, { status: 500 });
  }

  let normalized;
  try {
    normalized = normalizeSimHubCsv(parsedFile.data.rawContent);
  } catch (error) {
    const message = error instanceof Error ? error.message : UNPARSEABLE_CSV_MESSAGE;
    await prisma.import.update({
      where: { id: importRecord.id },
      data: { status: "failed", errorMessage: message },
    });
    return NextResponse.json({ error: message, importId: importRecord.id }, { status: 400 });
  }

  try {
    const driver = await getOrCreateDefaultDriver(prisma);
    const sessionInput = buildSessionCreateInput(
      driver.id,
      parsedMetadata.data,
      normalized.session,
      parsedFile.data.filename,
    );
    const session = await prisma.session.create({ data: sessionInput });

    await prisma.import.update({
      where: { id: importRecord.id },
      data: { status: "parsed", sessionId: session.id },
    });

    return NextResponse.json(
      {
        importId: importRecord.id,
        sessionId: session.id,
        filename: importRecord.filename,
        rowErrorCount: normalized.rowErrors.length,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/imports: failed to create session from normalized data", error);
    await prisma.import.update({
      where: { id: importRecord.id },
      data: { status: "failed", errorMessage: UNEXPECTED_ERROR_MESSAGE },
    });
    return NextResponse.json(
      { error: UNEXPECTED_ERROR_MESSAGE, importId: importRecord.id },
      { status: 500 },
    );
  }
}
