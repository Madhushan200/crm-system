import { NextRequest, NextResponse } from "next/server";
import * as xlsx from "xlsx";
import type { OkPacket } from "mysql2";
import { query } from "@/lib/db";

const REQUIRED_COLUMNS = [
  "Date of Lead",
  "Campaign Name",
  "Student Name",
  "Email",
  "Phone Number",
  "Qualification",
  "Programme",
];

function parseSheetName(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidExcelFile(filename: string) {
  return filename.match(/\.xlsx?$/i) !== null;
}

function normalizeRow(row: Record<string, unknown>) {
  return {
    dateOfLead: row["Date of Lead"],
    campaignName: row["Campaign Name"],
    studentName: String(row["Student Name"] ?? "").trim(),
    email: String(row["Email"] ?? "").trim(),
    phone: String(row["Phone Number"] ?? "").trim(),
    qualification: String(row["Qualification"] ?? "").trim(),
    programme: String(row["Programme"] ?? "").trim(),
  };
}

function toDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  const date = new Date(String(value || ""));
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  const sheetName = parseSheetName(formData.get("sheetName"));

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "File upload is required." }, { status: 400 });
  }

  if (!isValidExcelFile(file.name)) {
    return NextResponse.json({ error: "Invalid file format. Please upload an Excel file." }, { status: 400 });
  }

  if (!sheetName) {
    return NextResponse.json({ error: "Lead sheet selection is required." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let workbook: xlsx.WorkBook;

  try {
    workbook = xlsx.read(buffer, { type: "buffer", cellDates: true, dateNF: "yyyy-mm-dd" });
  } catch {
    return NextResponse.json({ error: "Unable to parse Excel file. Ensure it is valid." }, { status: 400 });
  }

  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!worksheet) {
    return NextResponse.json({ error: "Excel sheet is empty or invalid." }, { status: 400 });
  }

  const jsonRows = xlsx.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: null });
  const headerRows = xlsx.utils.sheet_to_json<(string | null)[][]>(worksheet, { header: 1, range: 0, defval: null });
  const headers = (headerRows[0] ?? []).map((value) => String(value ?? ""));

  const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  if (missingColumns.length > 0) {
    return NextResponse.json({
      error: "Missing required columns.",
      warnings: missingColumns.map((column) => `Missing column: ${column}`),
    }, { status: 400 });
  }

  const sheetRecord = await query<{ id: number }[]>("SELECT id FROM sheets WHERE sheet_name = ? LIMIT 1", [sheetName]);
  let sheetId: number;

  if (sheetRecord.length > 0) {
    sheetId = sheetRecord[0].id;
  } else {
    const result = await query<OkPacket>("INSERT INTO sheets (sheet_name, created_at, created_by) VALUES (?, NOW(), ?)", [sheetName, 1]);
    sheetId = result.insertId ?? 0;
  }

  const insertRows: Array<Array<unknown>> = [];
  const warnings: string[] = [];
  let failedCount = 0;

  jsonRows.forEach((rawRow, index) => {
    const row = normalizeRow(rawRow);
    if (!row.studentName || !row.email || !row.phone || !row.programme) {
      failedCount += 1;
      warnings.push(`Row ${index + 2} missing required values`);
      return;
    }

    const date = toDate(row.dateOfLead) ?? new Date();
    insertRows.push([
      sheetId,
      row.studentName,
      row.email,
      row.phone,
      row.qualification || null,
      row.programme,
      "Not Contacted",
      null,
      date,
    ]);
  });

  if (insertRows.length === 0) {
    return NextResponse.json({ error: "No valid rows found to upload.", warnings }, { status: 400 });
  }

  await query("INSERT INTO leads (sheet_id, student_name, email, phone, qualification, programme, status, assigned_to, created_at) VALUES ?", [insertRows]);

  return NextResponse.json({
    uploadedCount: insertRows.length,
    failedCount,
    message: `Upload complete. ${insertRows.length} leads imported successfully.`,
    warnings,
  });
}
