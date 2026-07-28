import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { importUploadSchema } from "@/lib/validation/import";

const NO_FILE_MESSAGE = "No CSV file was provided.";
const UNEXPECTED_ERROR_MESSAGE =
  "Something went wrong while uploading the file. Please try again.";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: NO_FILE_MESSAGE }, { status: 400 });
  }

  const parsed = importUploadSchema.safeParse({
    filename: file.name,
    fileSizeBytes: file.size,
    rawContent: await file.text(),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid file." },
      { status: 400 },
    );
  }

  try {
    const importRecord = await prisma.import.create({
      data: {
        filename: parsed.data.filename,
        fileSizeBytes: parsed.data.fileSizeBytes,
        rawContent: parsed.data.rawContent,
        status: "uploaded",
      },
    });

    return NextResponse.json(
      {
        id: importRecord.id,
        filename: importRecord.filename,
        fileSizeBytes: importRecord.fileSizeBytes,
        status: importRecord.status,
        createdAt: importRecord.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/imports: failed to create import record", error);
    return NextResponse.json({ error: UNEXPECTED_ERROR_MESSAGE }, { status: 500 });
  }
}
