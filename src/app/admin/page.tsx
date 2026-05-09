"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

type Lead = {
  id: number;
  name: string;
  phone: string;
  course: string;
  counselor: string;
  status: string;
  firstFollowUp: string;
  secondFollowUp: string;
  thirdFollowUp: string;
  finalResult: string;
  notes: string;
  leadSection: string;
  assignedDate: string;
  importBatch: string;
};

type CRMUser = {
  username: string;
  password: string;
  role: "admin" | "counsellor";
  name: string;
  active: boolean;
};

const defaultCounselors = ["Ramya", "Swarnamali", "Vivek", "Kavindi"];
const defaultStatuses = ["New", "Hot", "Warm", "Cold", "Follow Up", "Closed"];
const defaultLeadSections = [
  "Daily Leads",
  "IT Leads",
  "Open Day Leads",
  "Walk-in Leads",
  "Online Leads",
  "Event Leads",
];

const defaultUsers: CRMUser[] = [
  { username: "admin", password: "1234", role: "admin", name: "Admin", active: true },
  { username: "ramya", password: "1234", role: "counsellor", name: "Ramya", active: true },
  { username: "vivek", password: "1234", role: "counsellor", name: "Vivek", active: true },
];

export default function AdminPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");

  const [crmName, setCrmName] = useState("NEX CRM");
  const [counselors, setCounselors] = useState<string[]>(defaultCounselors);
  const [activeCounselors, setActiveCounselors] = useState<string[]>(defaultCounselors);
  const [statuses, setStatuses] = useState<string[]>(defaultStatuses);
  const [users, setUsers] = useState<CRMUser[]>(defaultUsers);
  const [leadSections, setLeadSections] = useState<string[]>(defaultLeadSections);
  const [newLeadSection, setNewLeadSection] = useState("");

  const [newCounselor, setNewCounselor] = useState("");
  const [newCounselorUsername, setNewCounselorUsername] = useState("");
  const [newCounselorPassword, setNewCounselorPassword] = useState("1234");
  const [newStatus, setNewStatus] = useState("");

  const [leads, setLeads] = useState<Lead[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState("");
  const [counselor, setCounselor] = useState(defaultCounselors[0]);
  const [status, setStatus] = useState("New");

  const [search, setSearch] = useState("");
  const [filterCounselor, setFilterCounselor] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sectionFilter, setSectionFilter] = useState("All");

  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");

  const [dashboardFrom, setDashboardFrom] = useState("");
  const [dashboardTo, setDashboardTo] = useState("");

  const [selectedLeadSection, setSelectedLeadSection] = useState("Daily Leads");
  const [selectedUploadCounselors, setSelectedUploadCounselors] = useState<string[]>(defaultCounselors);
  const [batchName, setBatchName] = useState("");

  useEffect(() => {
    const loggedIn = localStorage.getItem("crm_logged_in");
    const savedRole = localStorage.getItem("crm_role");
    const savedName = localStorage.getItem("crm_user_name");

    if (loggedIn !== "true") {
      router.push("/login");
      return;
    }

    const savedCrmName = localStorage.getItem("crm_name");
    const savedCounselors = localStorage.getItem("crm_counselors");
    const savedActiveCounselors = localStorage.getItem("crm_active_counselors");
    const savedStatuses = localStorage.getItem("crm_statuses");
    const savedUsers = localStorage.getItem("crm_users");
    const savedLeadSections = localStorage.getItem("crm_lead_sections");

    if (savedCrmName) setCrmName(savedCrmName);

    if (savedCounselors) {
      const parsed = JSON.parse(savedCounselors);
      setCounselors(parsed);
      setCounselor(parsed[0] || "");
      setSelectedUploadCounselors(parsed);
    }

    if (savedActiveCounselors) setActiveCounselors(JSON.parse(savedActiveCounselors));

    if (savedStatuses) {
      const parsed = JSON.parse(savedStatuses);
      setStatuses(parsed);
      setStatus("New");
    }

    if (savedUsers) setUsers(JSON.parse(savedUsers));
    else localStorage.setItem("crm_users", JSON.stringify(defaultUsers));

    if (savedLeadSections) {
      const parsed = JSON.parse(savedLeadSections);
      setLeadSections(parsed);
      setSelectedLeadSection(parsed[0] || "Daily Leads");
    }

    setRole(savedRole || "");
    setUserName(savedName || "");
    setReady(true);
    fetchLeads(savedRole || "", savedName || "");
  }, [router]);

  const fetchLeads = async (userRole = role, currentUser = userName) => {
    let query = supabase.from("leads").select("*").order("id", { ascending: false });

    if (userRole === "counsellor") {
      query = query.eq("counselor", currentUser);
    }

    const { data, error } = await query;

    if (error) {
      alert("Error loading leads. Check Supabase columns: leadSection, assignedDate, importBatch.");
      console.error(error);
      return;
    }

    setLeads((data || []) as Lead[]);
  };

  const activeSelectedCounselors = selectedUploadCounselors.filter((item) =>
    activeCounselors.includes(item)
  );

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (activeSelectedCounselors.length === 0) {
      alert("Select at least one ACTIVE counsellor before upload");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

      const currentBatch = batchName.trim() || `${selectedLeadSection}-${Date.now()}`;
      const today = new Date().toISOString().split("T")[0];

      const importedLeads = rows
        .map((row, index) => {
          const leadName = row["Name"] || row["Student Name"] || row["Student"] || row["name"];
          const leadPhone = row["Phone"] || row["Mobile"] || row["Mobile Number"] || row["Phone Number"] || row["phone"];
          const leadCourse = row["Course"] || row["Programme"] || row["Program"] || row["Inquired Programme"] || row["course"];

          if (!leadName || !leadPhone || !leadCourse) return null;

          return {
            name: String(leadName),
            phone: String(leadPhone),
            course: String(leadCourse),
            counselor: activeSelectedCounselors[index % activeSelectedCounselors.length],
            status: "New",
            firstFollowUp: "",
            secondFollowUp: "",
            thirdFollowUp: "",
            finalResult: "",
            notes: "",
            leadSection: selectedLeadSection,
            assignedDate: today,
            importBatch: currentBatch,
          };
        })
        .filter(
  (lead): lead is NonNullable<typeof lead> => lead !== null
);

      if (importedLeads.length === 0) {
        alert("No valid leads found. Required columns: Name, Phone, Course");
        event.target.value = "";
        return;
      }

      const confirmImport = confirm(
        `Import ${importedLeads.length} NEW leads to ${selectedLeadSection}?\nRound-robin counsellors: ${activeSelectedCounselors.join(", ")}`
      );

      if (!confirmImport) {
        event.target.value = "";
        return;
      }

      const { error } = await supabase
  .from("leads")
  .insert(importedLeads as any[]);

      if (error) {
        alert("Error importing leads");
        console.error(error);
        event.target.value = "";
        return;
      }

      alert(`${importedLeads.length} new leads imported successfully`);
      setBatchName("");
      fetchLeads();
      event.target.value = "";
    };

    reader.readAsArrayBuffer(file);
  };

  const addLead = async () => {
    if (!name || !phone || !course) {
      alert("Fill student name, phone and course");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("leads").insert([
      {
        name,
        phone,
        course,
        counselor,
        status: "New",
        firstFollowUp: "",
        secondFollowUp: "",
        thirdFollowUp: "",
        finalResult: "",
        notes: "",
        leadSection: selectedLeadSection,
        assignedDate: today,
        importBatch: "Manual Entry",
      },
    ]);

    if (error) {
      alert("Error adding lead");
      console.error(error);
      return;
    }

    setName("");
    setPhone("");
    setCourse("");
    setStatus("New");
    fetchLeads();
  };

  const updateLead = async (id: number, field: keyof Lead, value: string) => {
    const { error } = await supabase.from("leads").update({ [field]: value }).eq("id", id);

    if (error) {
      alert("Error updating lead");
      console.error(error);
      return;
    }

    setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, [field]: value } : lead)));
  };

  const deleteLead = async (id: number) => {
    if (!confirm("Delete this lead?")) return;

    const { error } = await supabase.from("leads").delete().eq("id", id);

    if (error) {
      alert("Error deleting lead");
      return;
    }

    setLeads((prev) => prev.filter((lead) => lead.id !== id));
  };

  const saveCrmName = () => {
    if (!crmName.trim()) return alert("CRM name cannot be empty");
    localStorage.setItem("crm_name", crmName.trim());
    setCrmName(crmName.trim());
    alert("CRM name saved");
  };

  const addCounselorWithLogin = () => {
    const displayName = newCounselor.trim();
    const username = newCounselorUsername.trim().toLowerCase();
    const password = newCounselorPassword.trim();

    if (!displayName || !username || !password) {
      alert("Enter counsellor name, username and password");
      return;
    }

    if (counselors.includes(displayName)) return alert("Counsellor name already exists");
    if (users.some((u) => u.username === username)) return alert("Username already exists");

    const updatedCounselors = [...counselors, displayName];
    const updatedActive = [...activeCounselors, displayName];
    const updatedUsers: CRMUser[] = [
      ...users,
      { username, password, role: "counsellor", name: displayName, active: true },
    ];

    setCounselors(updatedCounselors);
    setActiveCounselors(updatedActive);
    setUsers(updatedUsers);
    setSelectedUploadCounselors(updatedCounselors);

    localStorage.setItem("crm_counselors", JSON.stringify(updatedCounselors));
    localStorage.setItem("crm_active_counselors", JSON.stringify(updatedActive));
    localStorage.setItem("crm_users", JSON.stringify(updatedUsers));

    setNewCounselor("");
    setNewCounselorUsername("");
    setNewCounselorPassword("1234");
    alert("Counsellor and login created");
  };

  const removeCounselor = (item: string) => {
    if (!confirm(`Remove ${item}?`)) return;

    const updatedCounselors = counselors.filter((c) => c !== item);
    const updatedActive = activeCounselors.filter((c) => c !== item);
    const updatedSelected = selectedUploadCounselors.filter((c) => c !== item);
    const updatedUsers = users.filter((u) => u.name !== item);

    setCounselors(updatedCounselors);
    setActiveCounselors(updatedActive);
    setSelectedUploadCounselors(updatedSelected);
    setUsers(updatedUsers);

    localStorage.setItem("crm_counselors", JSON.stringify(updatedCounselors));
    localStorage.setItem("crm_active_counselors", JSON.stringify(updatedActive));
    localStorage.setItem("crm_users", JSON.stringify(updatedUsers));

    if (counselor === item) setCounselor(updatedCounselors[0] || "");
    if (filterCounselor === item) setFilterCounselor("All");
  };

  const toggleCounselorActive = (item: string) => {
    const updatedActive = activeCounselors.includes(item)
      ? activeCounselors.filter((c) => c !== item)
      : [...activeCounselors, item];

    const updatedUsers = users.map((u) =>
      u.name === item ? { ...u, active: updatedActive.includes(item) } : u
    );

    setActiveCounselors(updatedActive);
    setUsers(updatedUsers);
    localStorage.setItem("crm_active_counselors", JSON.stringify(updatedActive));
    localStorage.setItem("crm_users", JSON.stringify(updatedUsers));
  };

  const toggleUploadCounselor = (item: string) => {
    if (!activeCounselors.includes(item)) return;

    setSelectedUploadCounselors((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]
    );
  };

  const addLeadSection = () => {
    const value = newLeadSection.trim();

    if (!value) return alert("Enter lead section name");
    if (leadSections.includes(value)) return alert("Lead section already exists");

    const updated = [...leadSections, value];

    setLeadSections(updated);
    setSelectedLeadSection(value);
    localStorage.setItem("crm_lead_sections", JSON.stringify(updated));
    setNewLeadSection("");
  };

  const removeLeadSection = (item: string) => {
    if (!confirm(`Remove ${item}?`)) return;

    const updated = leadSections.filter((s) => s !== item);

    setLeadSections(updated);
    localStorage.setItem("crm_lead_sections", JSON.stringify(updated));

    if (selectedLeadSection === item) {
      setSelectedLeadSection(updated[0] || "Daily Leads");
    }

    if (sectionFilter === item) {
      setSectionFilter("All");
    }
  };

  const addStatus = () => {
    const value = newStatus.trim();
    if (!value) return alert("Enter status name");
    if (statuses.includes(value)) return alert("Status already exists");

    const updated = [...statuses, value];
    setStatuses(updated);
    localStorage.setItem("crm_statuses", JSON.stringify(updated));
    setNewStatus("");
  };

  const removeStatus = (item: string) => {
    if (!confirm(`Remove ${item}?`)) return;

    const updated = statuses.filter((s) => s !== item);
    setStatuses(updated);
    localStorage.setItem("crm_statuses", JSON.stringify(updated));

    if (status === item) setStatus(updated[0] || "New");
    if (filterStatus === item) setFilterStatus("All");
  };

  const resetSettings = () => {
    if (!confirm("Reset CRM settings?")) return;

    setCrmName("NEX CRM");
    setCounselors(defaultCounselors);
    setActiveCounselors(defaultCounselors);
    setStatuses(defaultStatuses);
    setUsers(defaultUsers);
    setSelectedUploadCounselors(defaultCounselors);
    setLeadSections(defaultLeadSections);

    localStorage.setItem("crm_name", "NEX CRM");
    localStorage.setItem("crm_counselors", JSON.stringify(defaultCounselors));
    localStorage.setItem("crm_active_counselors", JSON.stringify(defaultCounselors));
    localStorage.setItem("crm_statuses", JSON.stringify(defaultStatuses));
    localStorage.setItem("crm_users", JSON.stringify(defaultUsers));
    localStorage.setItem("crm_lead_sections", JSON.stringify(defaultLeadSections));
  };

  const logout = () => {
    localStorage.removeItem("crm_logged_in");
    localStorage.removeItem("crm_role");
    localStorage.removeItem("crm_user_name");
    localStorage.removeItem("crm_username");
    router.push("/login");
  };

  const clearFilters = () => {
    setSearch("");
    setFilterCounselor("All");
    setFilterStatus("All");
    setSectionFilter("All");
    setReportFrom("");
    setReportTo("");
  };

  const filterByDate = (items: Lead[], from: string, to: string) => {
    return items.filter((lead) => {
      const date = lead.assignedDate || "";
      const okFrom = !from || date >= from;
      const okTo = !to || date <= to;
      return okFrom && okTo;
    });
  };

  const filteredLeads = useMemo(() => {
    return filterByDate(leads, reportFrom, reportTo).filter((lead) => {
      const text = search.toLowerCase();

      const matchesSearch =
        lead.name?.toLowerCase().includes(text) ||
        lead.phone?.toLowerCase().includes(text) ||
        lead.course?.toLowerCase().includes(text) ||
        lead.importBatch?.toLowerCase().includes(text);

      const matchesCounselor = filterCounselor === "All" || lead.counselor === filterCounselor;
      const matchesStatus = filterStatus === "All" || lead.status === filterStatus;
      const matchesSection = sectionFilter === "All" || lead.leadSection === sectionFilter;

      return matchesSearch && matchesCounselor && matchesStatus && matchesSection;
    });
  }, [leads, search, filterCounselor, filterStatus, sectionFilter, reportFrom, reportTo]);

  const dashboardLeads = useMemo(() => {
    return filterByDate(leads, dashboardFrom, dashboardTo);
  }, [leads, dashboardFrom, dashboardTo]);

  const dashboardNewLeads = dashboardLeads.filter((lead) => lead.status === "New").length;
  const dashboardSales = dashboardLeads.filter((lead) => lead.status === "Closed").length;

  const sectionCounts = leadSections.map((section) => ({
    name: section,
    leads: dashboardLeads.filter((lead) => lead.leadSection === section).length,
  }));

  const counselorSectionCounts = counselors.map((c) => ({
    counselor: c,
    total: dashboardLeads.filter((lead) => lead.counselor === c).length,
    newLeads: dashboardLeads.filter((lead) => lead.counselor === c && lead.status === "New").length,
    sales: dashboardLeads.filter((lead) => lead.counselor === c && lead.status === "Closed").length,
  }));

  const downloadCSVReport = () => {
    const headers = [
      "Name",
      "Phone",
      "Course",
      "Counsellor",
      "Status",
      "Section",
      "Assigned Date",
      "Import Batch",
      "1st Follow-up",
      "2nd Follow-up",
      "3rd Follow-up",
      "Final Result",
      "Notes",
    ];

    const rows = filteredLeads.map((lead) => [
      lead.name,
      lead.phone,
      lead.course,
      lead.counselor,
      lead.status,
      lead.leadSection,
      lead.assignedDate,
      lead.importBatch,
      lead.firstFollowUp,
      lead.secondFollowUp,
      lead.thirdFollowUp,
      lead.finalResult,
      lead.notes,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `crm-report-${Date.now()}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusChartData = statuses.map((item) => ({
    name: item,
    value: dashboardLeads.filter((lead) => lead.status === item).length,
  }));

  const counselorChartData = counselors.map((item) => ({
    name: item,
    leads: dashboardLeads.filter((lead) => lead.counselor === item).length,
  }));

  if (!ready) {
    return <main className="min-h-screen flex items-center justify-center">Loading CRM...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <aside className="w-72 bg-slate-950 text-white min-h-screen fixed left-0 top-0 p-6">
        <div className="mb-10">
          <h1 className="text-2xl font-bold">{crmName}</h1>
          <p className="text-slate-400 text-sm mt-1">Advanced CRM System</p>
        </div>

        <nav className="space-y-3">
          {(role === "admin" ? ["Dashboard", "Leads", "Follow-ups", "Analytics", "Reports", "Settings"] : ["Dashboard", "Leads", "Follow-ups", "Analytics", "Reports"]).map((item) => (
            <button
              key={item}
              onClick={() => setActiveTab(item)}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold ${
                activeTab === item ? "bg-white text-slate-950" : "text-slate-300 hover:bg-slate-900"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6 bg-slate-900 rounded-2xl p-4">
          <p className="text-sm text-slate-400">Logged in</p>
          <p className="font-bold">{userName}</p>
          <p className="text-xs text-slate-400 uppercase">{role}</p>
        </div>
      </aside>

      <section className="ml-72 w-full">
        <header className="bg-white border-b px-8 py-5 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{activeTab}</h2>
            <p className="text-slate-500">Welcome back, {userName}</p>
          </div>

          <button onClick={logout} className="bg-red-600 text-white px-5 py-2 rounded-xl">
            Logout
          </button>
        </header>

        <div className="p-8">
          {activeTab === "Dashboard" && (
            <>
              <DateRangePanel
                from={dashboardFrom}
                to={dashboardTo}
                setFrom={setDashboardFrom}
                setTo={setDashboardTo}
              />

              <section className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-8">
                <Card title="Total Leads" value={dashboardLeads.length} />
                <Card title="New Leads" value={dashboardNewLeads} />
                <Card title="Total Sales" value={dashboardSales} />
                <Card title="Open Day Leads" value={dashboardLeads.filter((l) => l.leadSection === "Open Day Leads").length} />
                <Card title="IT Leads" value={dashboardLeads.filter((l) => l.leadSection === "IT Leads").length} />
              </section>

              <Charts
                statusChartData={statusChartData}
                counselorChartData={counselorChartData}
                sectionChartData={sectionCounts}
              />

              <CounselorDashboardTable data={counselorSectionCounts} sections={leadSections} leads={dashboardLeads} />
            </>
          )}

          {activeTab === "Leads" && (
            <>
              {role === "admin" && (
                <UploadAndAddLeads
                  leadSections={leadSections}
                  selectedLeadSection={selectedLeadSection}
                  setSelectedLeadSection={setSelectedLeadSection}
                  batchName={batchName}
                  setBatchName={setBatchName}
                  handleExcelUpload={handleExcelUpload}
                  counselors={counselors}
                  activeCounselors={activeCounselors}
                  selectedUploadCounselors={selectedUploadCounselors}
                  toggleUploadCounselor={toggleUploadCounselor}
                  name={name}
                  setName={setName}
                  phone={phone}
                  setPhone={setPhone}
                  course={course}
                  setCourse={setCourse}
                  counselor={counselor}
                  setCounselor={setCounselor}
                  addLead={addLead}
                />
              )}

              <Filters
                role={role}
                search={search}
                setSearch={setSearch}
                counselors={counselors}
                filterCounselor={filterCounselor}
                setFilterCounselor={setFilterCounselor}
                statuses={statuses}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                leadSections={leadSections}
                sectionFilter={sectionFilter}
                setSectionFilter={setSectionFilter}
                reportFrom={reportFrom}
                setReportFrom={setReportFrom}
                reportTo={reportTo}
                setReportTo={setReportTo}
                clearFilters={clearFilters}
              />

              <LeadTable
                role={role}
                leads={filteredLeads}
                counselors={counselors}
                statuses={statuses}
                updateLead={updateLead}
                deleteLead={deleteLead}
              />
            </>
          )}

          {activeTab === "Follow-ups" && (
            <>
              <Filters
                role={role}
                search={search}
                setSearch={setSearch}
                counselors={counselors}
                filterCounselor={filterCounselor}
                setFilterCounselor={setFilterCounselor}
                statuses={statuses}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                leadSections={leadSections}
                sectionFilter={sectionFilter}
                setSectionFilter={setSectionFilter}
                reportFrom={reportFrom}
                setReportFrom={setReportFrom}
                reportTo={reportTo}
                setReportTo={setReportTo}
                clearFilters={clearFilters}
              />

              <LeadTable
                role={role}
                leads={filteredLeads}
                counselors={counselors}
                statuses={statuses}
                updateLead={updateLead}
                deleteLead={deleteLead}
              />
            </>
          )}

          {activeTab === "Analytics" && (
            <>
              <DateRangePanel
                from={dashboardFrom}
                to={dashboardTo}
                setFrom={setDashboardFrom}
                setTo={setDashboardTo}
              />

              <Charts
                statusChartData={statusChartData}
                counselorChartData={counselorChartData}
                sectionChartData={sectionCounts}
              />

              <CounselorDashboardTable data={counselorSectionCounts} sections={leadSections} leads={dashboardLeads} />
            </>
          )}

          {activeTab === "Reports" && (
            <>
              <Filters
                role={role}
                search={search}
                setSearch={setSearch}
                counselors={counselors}
                filterCounselor={filterCounselor}
                setFilterCounselor={setFilterCounselor}
                statuses={statuses}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                leadSections={leadSections}
                sectionFilter={sectionFilter}
                setSectionFilter={setSectionFilter}
                reportFrom={reportFrom}
                setReportFrom={setReportFrom}
                reportTo={reportTo}
                setReportTo={setReportTo}
                clearFilters={clearFilters}
              />

              <section className="bg-white rounded-2xl shadow p-6 mb-8">
                <h2 className="text-xl font-bold mb-3">Download Report</h2>
                <p className="text-slate-500 mb-5">
                  Download filtered leads date-wise, section-wise, counsellor-wise or status-wise.
                </p>

                <button onClick={downloadCSVReport} className="bg-green-600 text-white px-5 py-3 rounded-xl">
                  Download CSV Report
                </button>
              </section>

              <LeadTable
                role={role}
                leads={filteredLeads}
                counselors={counselors}
                statuses={statuses}
                updateLead={updateLead}
                deleteLead={deleteLead}
              />
            </>
          )}

          {activeTab === "Settings" && (
            <Settings
              crmName={crmName}
              setCrmName={setCrmName}
              saveCrmName={saveCrmName}
              counselors={counselors}
              activeCounselors={activeCounselors}
              newCounselor={newCounselor}
              setNewCounselor={setNewCounselor}
              newCounselorUsername={newCounselorUsername}
              setNewCounselorUsername={setNewCounselorUsername}
              newCounselorPassword={newCounselorPassword}
              setNewCounselorPassword={setNewCounselorPassword}
              addCounselorWithLogin={addCounselorWithLogin}
              removeCounselor={removeCounselor}
              toggleCounselorActive={toggleCounselorActive}
              users={users}
              statuses={statuses}
              newStatus={newStatus}
              setNewStatus={setNewStatus}
              addStatus={addStatus}
              removeStatus={removeStatus}
              leadSections={leadSections}
              newLeadSection={newLeadSection}
              setNewLeadSection={setNewLeadSection}
              addLeadSection={addLeadSection}
              removeLeadSection={removeLeadSection}
              resetSettings={resetSettings}
            />
          )}
        </div>
      </section>
    </main>
  );
}

function DateRangePanel({ from, to, setFrom, setTo }: any) {
  return (
    <section className="bg-white rounded-2xl shadow p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">Dashboard Date Range</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded-xl px-4 py-3" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded-xl px-4 py-3" />
        <button onClick={() => { setFrom(""); setTo(""); }} className="bg-slate-800 text-white rounded-xl px-4 py-3">Clear Date Range</button>
      </div>
    </section>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <p className="text-slate-500">{title}</p>
      <h2 className="text-4xl font-bold mt-2">{value}</h2>
    </div>
  );
}

function Charts({
  statusChartData,
  counselorChartData,
  sectionChartData,
}: {
  statusChartData: any[];
  counselorChartData: any[];
  sectionChartData: any[];
}) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <ChartCard title="Lead Status Overview" type="pie" data={statusChartData} />
      <ChartCard title="Counsellor Lead Count" type="bar" data={counselorChartData} dataKey="leads" />
      <ChartCard title="Section Wise Leads" type="bar" data={sectionChartData} dataKey="leads" />
    </section>
  );
}

function ChartCard({ title, type, data, dataKey = "value" }: any) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-bold mb-5">{title}</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {type === "pie" ? (
            <PieChart>
              <Pie data={data} dataKey={dataKey} nameKey="name" outerRadius={90} label>
                {data.map((_: any, index: number) => <Cell key={index} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          ) : (
            <BarChart data={data}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey={dataKey} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CounselorDashboardTable({ data, sections, leads }: any) {
  return (
    <section className="bg-white rounded-2xl shadow overflow-x-auto mb-8">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">Counsellor Dashboard Summary</h2>
        <p className="text-slate-500">New leads, sales and section-wise lead count</p>
      </div>

      <table className="w-full min-w-[1200px]">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left p-4">Counsellor</th>
            <th className="text-left p-4">Total Leads</th>
            <th className="text-left p-4">New Leads</th>
            <th className="text-left p-4">Total Sales</th>
            {sections.map((s: string) => (
              <th key={s} className="text-left p-4">{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any) => (
            <tr key={row.counselor} className="border-t">
              <td className="p-4 font-bold">{row.counselor}</td>
              <td className="p-4">{row.total}</td>
              <td className="p-4">{row.newLeads}</td>
              <td className="p-4">{row.sales}</td>
              {sections.map((s: string) => (
                <td key={s} className="p-4">
                  {leads.filter((l: Lead) => l.counselor === row.counselor && l.leadSection === s).length}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function UploadAndAddLeads(props: any) {
  return (
    <>
      <section className="bg-white rounded-2xl shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-5">Excel Upload & Round Robin Publish</h2>

        <div className="grid md:grid-cols-3 gap-4 mb-5">
          <select
            value={props.selectedLeadSection}
            onChange={(e) => props.setSelectedLeadSection(e.target.value)}
            className="border rounded-xl px-4 py-3"
          >
            {props.leadSections.map((item: string) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <input
            placeholder="Batch Name"
            value={props.batchName}
            onChange={(e) => props.setBatchName(e.target.value)}
            className="border rounded-xl px-4 py-3"
          />

          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={props.handleExcelUpload}
            className="border rounded-xl px-4 py-3"
          />
        </div>

        <h3 className="font-bold mb-3">Select Active Counsellors for Round Robin</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {props.counselors.map((item: string) => {
            const checked = props.selectedUploadCounselors.includes(item);
            const active = props.activeCounselors.includes(item);

            return (
              <button
                key={item}
                type="button"
                disabled={!active}
                onClick={() => props.toggleUploadCounselor(item)}
                className={`rounded-xl px-4 py-3 border font-semibold ${
                  checked ? "bg-slate-950 text-white" : "bg-white"
                } ${!active ? "opacity-40" : ""}`}
              >
                {item} {active ? "" : "(Inactive)"}
              </button>
            );
          })}
        </div>

        <p className="text-sm text-slate-500 mt-4">
          Excel columns required: Name, Phone, Course. Uploaded leads are always marked as New.
        </p>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-5">Manual Add Lead</h2>

        <div className="grid md:grid-cols-5 gap-4">
          <input placeholder="Student Name" value={props.name} onChange={(e) => props.setName(e.target.value)} className="border rounded-xl px-4 py-3" />
          <input placeholder="Phone Number" value={props.phone} onChange={(e) => props.setPhone(e.target.value)} className="border rounded-xl px-4 py-3" />
          <input placeholder="Course" value={props.course} onChange={(e) => props.setCourse(e.target.value)} className="border rounded-xl px-4 py-3" />
          <select value={props.counselor} onChange={(e) => props.setCounselor(e.target.value)} className="border rounded-xl px-4 py-3">
            {props.counselors.map((item: string) => <option key={item}>{item}</option>)}
          </select>
          <button onClick={props.addLead} className="bg-slate-950 text-white rounded-xl">
            Add as New Lead
          </button>
        </div>
      </section>
    </>
  );
}

function Filters(props: any) {
  return (
    <section className="bg-white rounded-2xl shadow p-6 mb-8">
      <h2 className="text-xl font-bold mb-5">Search, Filter & Date Range</h2>

      <div className="grid md:grid-cols-4 gap-4">
        <input placeholder="Search student, phone, course, batch..." value={props.search} onChange={(e) => props.setSearch(e.target.value)} className="border rounded-xl px-4 py-3" />

        {props.role === "admin" && (
          <select value={props.filterCounselor} onChange={(e) => props.setFilterCounselor(e.target.value)} className="border rounded-xl px-4 py-3">
            <option value="All">All Counsellors</option>
            {props.counselors.map((item: string) => <option key={item}>{item}</option>)}
          </select>
        )}

        <select value={props.filterStatus} onChange={(e) => props.setFilterStatus(e.target.value)} className="border rounded-xl px-4 py-3">
          <option value="All">All Status</option>
          {props.statuses.map((item: string) => <option key={item}>{item}</option>)}
        </select>

        <select value={props.sectionFilter} onChange={(e) => props.setSectionFilter(e.target.value)} className="border rounded-xl px-4 py-3">
          <option value="All">All Sections</option>
          {props.leadSections.map((item: string) => <option key={item}>{item}</option>)}
        </select>

        <input type="date" value={props.reportFrom} onChange={(e) => props.setReportFrom(e.target.value)} className="border rounded-xl px-4 py-3" />
        <input type="date" value={props.reportTo} onChange={(e) => props.setReportTo(e.target.value)} className="border rounded-xl px-4 py-3" />

        <button onClick={props.clearFilters} className="bg-slate-800 text-white rounded-xl px-4 py-3">Clear Filters</button>
      </div>
    </section>
  );
}

function LeadTable({ role, leads, counselors, statuses, updateLead, deleteLead }: any) {
  return (
    <section className="bg-white rounded-2xl shadow overflow-x-auto">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">Lead Table</h2>
        <p className="text-slate-500">Showing {leads.length} leads</p>
      </div>

      <table className="w-full min-w-[2100px]">
        <thead className="bg-slate-50">
          <tr>
            {["Name", "Phone", "Course", "Section", "Assigned Date", "Batch", "Counsellor", "Status", "1st Follow-up", "2nd Follow-up", "3rd Follow-up", "Final Result", "Notes", "WhatsApp"].map((h) => (
              <th key={h} className="text-left p-4">{h}</th>
            ))}
            {role === "admin" && <th className="text-left p-4">Action</th>}
          </tr>
        </thead>

        <tbody>
          {leads.map((lead: Lead) => (
            <tr key={lead.id} className="border-t align-top">
              <td className="p-4 font-medium">{lead.name}</td>
              <td className="p-4">{lead.phone}</td>
              <td className="p-4">{lead.course}</td>
              <td className="p-4">{lead.leadSection}</td>
              <td className="p-4">{lead.assignedDate}</td>
              <td className="p-4">{lead.importBatch}</td>

              <td className="p-4">
                {role === "admin" ? (
                  <select value={lead.counselor} onChange={(e) => updateLead(lead.id, "counselor", e.target.value)} className="border rounded-lg px-3 py-2">
                    {counselors.map((item: string) => <option key={item}>{item}</option>)}
                  </select>
                ) : lead.counselor}
              </td>

              <td className="p-4">
                <select value={lead.status} onChange={(e) => updateLead(lead.id, "status", e.target.value)} className="border rounded-lg px-3 py-2">
                  {statuses.map((item: string) => <option key={item}>{item}</option>)}
                </select>
              </td>

              {["firstFollowUp", "secondFollowUp", "thirdFollowUp", "finalResult", "notes"].map((field) => (
                <td key={field} className="p-4">
                  <textarea value={String(lead[field as keyof Lead] || "")} onChange={(e) => updateLead(lead.id, field, e.target.value)} className="border rounded-lg p-2 w-44 h-20" />
                </td>
              ))}

              <td className="p-4">
                <a href={`https://wa.me/94${String(lead.phone).replace(/^0/, "")}`} target="_blank" className="bg-green-600 text-white px-4 py-2 rounded-lg inline-block">
                  WhatsApp
                </a>
              </td>

              {role === "admin" && (
                <td className="p-4">
                  <button onClick={() => deleteLead(lead.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg">Delete</button>
                </td>
              )}
            </tr>
          ))}

          {leads.length === 0 && (
            <tr>
              <td colSpan={role === "admin" ? 15 : 14} className="p-8 text-center text-slate-500">No leads found</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

function Settings(props: any) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-bold mb-5">CRM Settings</h2>
        <label className="block text-slate-500 mb-2">CRM Name</label>
        <div className="flex gap-3">
          <input value={props.crmName} onChange={(e) => props.setCrmName(e.target.value)} className="border rounded-xl px-4 py-3 w-full" />
          <button onClick={props.saveCrmName} className="bg-slate-950 text-white px-5 rounded-xl">Save</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-bold mb-5">Create Counsellor Login</h2>
        <div className="grid gap-3">
          <input placeholder="Counsellor Display Name" value={props.newCounselor} onChange={(e) => props.setNewCounselor(e.target.value)} className="border rounded-xl px-4 py-3" />
          <input placeholder="Login Username" value={props.newCounselorUsername} onChange={(e) => props.setNewCounselorUsername(e.target.value)} className="border rounded-xl px-4 py-3" />
          <input placeholder="Password" value={props.newCounselorPassword} onChange={(e) => props.setNewCounselorPassword(e.target.value)} className="border rounded-xl px-4 py-3" />
          <button onClick={props.addCounselorWithLogin} className="bg-green-600 text-white px-5 py-3 rounded-xl">Add Counsellor + Login</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-bold mb-5">Counsellors Active / Inactive</h2>
        <div className="space-y-3">
          {props.counselors.map((item: string) => {
            const user = props.users.find((u: CRMUser) => u.name === item);
            const active = props.activeCounselors.includes(item);

            return (
              <div key={item} className="border rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold">{item}</p>
                    <p className="text-sm text-slate-500">Username: {user?.username || "No login"}</p>
                  </div>
                  <button onClick={() => props.removeCounselor(item)} className="bg-red-600 text-white px-3 py-1 rounded-lg">Remove</button>
                </div>
                <button onClick={() => props.toggleCounselorActive(item)} className={`mt-3 px-4 py-2 rounded-lg text-white ${active ? "bg-green-600" : "bg-gray-500"}`}>
                  {active ? "ACTIVE" : "INACTIVE"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-bold mb-5">Manage Status / Labels</h2>
        <div className="flex gap-3 mb-5">
          <input placeholder="New status" value={props.newStatus} onChange={(e) => props.setNewStatus(e.target.value)} className="border rounded-xl px-4 py-3 w-full" />
          <button onClick={props.addStatus} className="bg-green-600 text-white px-5 rounded-xl">Add</button>
        </div>
        <div className="space-y-3">
          {props.statuses.map((item: string) => (
            <div key={item} className="border rounded-xl px-4 py-3 flex justify-between items-center">
              <span>{item}</span>
              <button onClick={() => props.removeStatus(item)} className="bg-red-600 text-white px-3 py-1 rounded-lg">Remove</button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 lg:col-span-2">
        <h2 className="text-xl font-bold mb-5">Create Lead Sections</h2>

        <div className="flex gap-3 mb-5">
          <input
            placeholder="New lead section e.g. Engineering Leads"
            value={props.newLeadSection}
            onChange={(e) => props.setNewLeadSection(e.target.value)}
            className="border rounded-xl px-4 py-3 w-full"
          />

          <button
            onClick={props.addLeadSection}
            className="bg-green-600 text-white px-5 rounded-xl"
          >
            Add Section
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {props.leadSections.map((item: string) => (
            <div
              key={item}
              className="border rounded-xl px-4 py-3 flex justify-between items-center"
            >
              <span>{item}</span>

              <button
                onClick={() => props.removeLeadSection(item)}
                className="bg-red-600 text-white px-3 py-1 rounded-lg"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 lg:col-span-2">
        <h2 className="text-xl font-bold mb-3">Danger Zone</h2>
        <button onClick={props.resetSettings} className="bg-red-600 text-white px-5 py-3 rounded-xl">Reset Default Settings</button>
      </div>
    </section>
  );
}
