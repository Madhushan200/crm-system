import { NextRequest, NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/auth";
import { LEAD_STATUSES, canAccessLead, getLeadById, updateLeadStatus } from "@/lib/lead";

type LeadStatus = typeof LEAD_STATUSES[number];

function isLeadStatus(value: string): value is LeadStatus {
  return LEAD_STATUSES.includes(value as LeadStatus);
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("crm_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = verifyJwtToken(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const leadId = Number(body.lead_id ?? body.leadId ?? 0);
  const status = String(body.status ?? "").trim();

  if (!leadId || Number.isNaN(leadId)) {
    return NextResponse.json({ error: "lead_id is required" }, { status: 400 });
  }

  if (!isLeadStatus(status)) {
    return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
  }

  const lead = await getLeadById(leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  if (!canAccessLead(user, lead)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await updateLeadStatus(leadId, status);
  return NextResponse.json({ success: true, leadId, status });
}
