import { NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/auth";
import { getHotLeads } from "@/lib/analytics";

export async function GET(req: Request) {
  const token = req.headers.get("cookie")?.match(/crm_token=([^;]+)/)?.[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = verifyJwtToken(token);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await getHotLeads(new URL(req.url));
  return NextResponse.json(data);
}
