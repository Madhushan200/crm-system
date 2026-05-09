import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const sheets = await query<{ id: number; sheet_name: string }[]>(
    "SELECT id, sheet_name FROM sheets ORDER BY sheet_name ASC"
  );
  return NextResponse.json(sheets);
}
