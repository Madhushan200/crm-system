import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

type Counsellor = {
  id: number;
  name: string;
};

type LeadRecord = {
  id: number;
  sheet_id: number;
};

async function getActiveCounsellors(): Promise<Counsellor[]> {
  return query<Counsellor[]>(
    "SELECT id, name FROM users WHERE role = 'counsellor' AND status = 'active' ORDER BY id ASC"
  );
}

async function getUnassignedLeads(sheetId: number): Promise<LeadRecord[]> {
  return query<LeadRecord[]>(
    "SELECT id, sheet_id FROM leads WHERE sheet_id = ? AND assigned_to IS NULL ORDER BY id ASC",
    [sheetId]
  );
}

function buildRoundRobinAssignments(leads: LeadRecord[], counsellors: Counsellor[]) {
  const assignments: Array<{ leadId: number; counsellorId: number }> = [];
  const summary: Record<number, number> = {};

  if (counsellors.length === 0) return { assignments, summary };

  let currentIndex = 0;
  for (const lead of leads) {
    const counsellor = counsellors[currentIndex];
    assignments.push({ leadId: lead.id, counsellorId: counsellor.id });
    summary[counsellor.id] = (summary[counsellor.id] ?? 0) + 1;
    currentIndex = (currentIndex + 1) % counsellors.length;
  }

  return { assignments, summary };
}

async function applyDistribution(
  assignments: Array<{ leadId: number; counsellorId: number }>,
  sheetId: number
) {
  if (assignments.length === 0) return;

  const updateCases = assignments
    .map((assignment) => `WHEN ${assignment.leadId} THEN ${assignment.counsellorId}`)
    .join(" ");
  const leadIds = assignments.map((assignment) => assignment.leadId);

  await query(
    `UPDATE leads SET assigned_to = CASE id ${updateCases} END WHERE id IN (${leadIds.join(",")})`,
  );

  const logValues = assignments.map((assignment) => [
    assignment.leadId,
    assignment.counsellorId,
    sheetId,
    new Date(),
  ]);

  await query(
    "INSERT INTO distribution_logs (lead_id, counsellor_id, sheet_id, assigned_date) VALUES ?",
    [logValues]
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sheetId = Number(body.sheet_id ?? body.sheetId ?? 0);

  if (!sheetId || Number.isNaN(sheetId)) {
    return NextResponse.json({ error: "sheet_id is required and must be a valid number." }, { status: 400 });
  }

  const counsellors = await getActiveCounsellors();
  if (counsellors.length === 0) {
    return NextResponse.json({ error: "No active counsellors available for distribution." }, { status: 400 });
  }

  const leads = await getUnassignedLeads(sheetId);
  if (leads.length === 0) {
    return NextResponse.json({ message: "No unassigned leads found for the selected sheet.", totalDistributed: 0 }, { status: 200 });
  }

  const { assignments, summary } = buildRoundRobinAssignments(leads, counsellors);
  await applyDistribution(assignments, sheetId);

  const counsellorSummary = counsellors.map((counsellor) => ({
    counsellorId: counsellor.id,
    name: counsellor.name,
    assignedLeads: summary[counsellor.id] ?? 0,
  }));

  return NextResponse.json({
    message: "Leads distributed successfully.",
    totalDistributed: assignments.length,
    counsellorsUsed: counsellors.length,
    distributionSummary: counsellorSummary,
  });
}
