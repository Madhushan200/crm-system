import { NextRequest, NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/auth";
import { FOLLOWUP_TYPES, addFollowup, canAccessLead, countFollowupByType, getLeadById } from "@/lib/lead";

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
  const followupType = String(body.followup_type ?? body.followupType ?? "").trim() as typeof FOLLOWUP_TYPES[number];
  const date = String(body.date ?? "").trim();
  const notes = String(body.notes ?? "").trim();

  if (!leadId || Number.isNaN(leadId)) {
    return NextResponse.json({ error: "lead_id is required" }, { status: 400 });
  }

  if (!FOLLOWUP_TYPES.includes(followupType)) {
    return NextResponse.json({ error: "Invalid followup_type" }, { status: 400 });
  }

  if (!date) {
    return NextResponse.json({ error: "Follow-up date is required" }, { status: 400 });
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const lead = await getLeadById(leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  if (!canAccessLead(user, lead)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existingCount = await countFollowupByType(leadId, followupType);
  if (existingCount > 0) {
    return NextResponse.json({ error: `Follow-up ${followupType} already exists for this lead` }, { status: 409 });
  }

  await addFollowup(leadId, followupType, parsedDate.toISOString().slice(0, 10), notes, user.id);
  return NextResponse.json({ success: true, leadId, followupType, date: parsedDate.toISOString().slice(0, 10) });
}
