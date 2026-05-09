"use client";

import { useMemo, useState } from "react";

const sheets = ["Daily Leads", "Engineering Leads", "Open Day Leads", "Custom Sheets"];

const counsellors = [
  { name: "Riya Patel", status: "Active" },
  { name: "Vikram Singh", status: "Active" },
  { name: "Sneha Rao", status: "Inactive" },
  { name: "Amit Joshi", status: "Active" },
  { name: "Naveen Kumar", status: "Active" },
];

export default function DistributeLeadsPage() {
  const [selectedSheet, setSelectedSheet] = useState(sheets[0]);
  const [selectedCounsellors, setSelectedCounsellors] = useState<string[]>(["Riya Patel", "Vikram Singh", "Amit Joshi"]);
  const [distributionMode, setDistributionMode] = useState("Round Robin");
  const [success, setSuccess] = useState(false);

  const sheetLeadCounts = useMemo<Record<string, number>>(
    () => ({
      "Daily Leads": 120,
      "Engineering Leads": 78,
      "Open Day Leads": 54,
      "Custom Sheets": 32,
    }),
    []
  );

  const activeCounsellorCount = useMemo(
    () => counsellors.filter((c) => c.status === "Active" && selectedCounsellors.includes(c.name)).length,
    [selectedCounsellors]
  );

  const leadsPerCounsellor = useMemo(() => {
    if (activeCounsellorCount === 0) return 0;
    return Math.floor(sheetLeadCounts[selectedSheet] / activeCounsellorCount);
  }, [activeCounsellorCount, selectedSheet, sheetLeadCounts]);

  const toggleCounsellor = (name: string) => {
    setSuccess(false);
    setSelectedCounsellors((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name]
    );
  };

  const handleDistribute = () => {
    setSuccess(true);
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-200/80 sm:p-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-sky-500">Admin Panel</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">Lead Distribution Panel</h1>
            </div>
            <div className="rounded-3xl bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700 ring-1 ring-sky-200">
              {distributionMode} mode selected
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Sheet Selection</h2>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">Choose sheet</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {sheets.map((sheet) => (
                    <button
                      key={sheet}
                      type="button"
                      onClick={() => {
                        setSelectedSheet(sheet);
                        setSuccess(false);
                      }}
                      className={`rounded-3xl border px-4 py-4 text-left transition ${
                        selectedSheet === sheet
                          ? "border-sky-500 bg-white shadow-sm"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">{sheet}</p>
                      <p className="mt-1 text-sm text-slate-500">Preview distribution for this lead sheet.</p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Counsellor Selection</h2>
                  <p className="text-sm text-slate-500">Select participants</p>
                </div>
                <div className="space-y-3">
                  {counsellors.map((counsellor) => {
                    const isChecked = selectedCounsellors.includes(counsellor.name);
                    return (
                      <button
                        key={counsellor.name}
                        type="button"
                        onClick={() => toggleCounsellor(counsellor.name)}
                        className={`flex w-full items-center justify-between rounded-3xl border px-4 py-4 text-left transition ${
                          isChecked ? "border-sky-500 bg-sky-50" : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{counsellor.name}</p>
                          <p className="mt-1 text-sm text-slate-500">Counsellor status: {counsellor.status}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            counsellor.status === "Active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}>
                            {counsellor.status}
                          </span>
                          <span className={`h-5 w-5 rounded-full border ${isChecked ? "border-sky-500 bg-sky-500" : "border-slate-300 bg-white"}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Distribution Settings</h2>
                  <p className="text-sm text-slate-500">Select how leads are assigned</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {['Round Robin', 'Manual Assignment'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setDistributionMode(mode);
                        setSuccess(false);
                      }}
                      className={`rounded-3xl border px-4 py-4 text-left text-sm font-semibold transition ${
                        distributionMode === mode
                          ? "border-sky-500 bg-white shadow-sm text-slate-900"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Stats Preview</h2>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">Live preview</span>
                </div>
                <div className="space-y-4">
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Total leads in sheet</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{sheetLeadCounts[selectedSheet]}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Active counsellors</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{activeCounsellorCount}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Estimated leads per counsellor</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{leadsPerCounsellor}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Action</h2>
                  <p className="text-sm text-slate-500">Confirm distribution</p>
                </div>
                <button
                  type="button"
                  onClick={handleDistribute}
                  className="inline-flex w-full items-center justify-center rounded-3xl bg-sky-600 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-500"
                >
                  DISTRIBUTE LEADS
                </button>
                {success && (
                  <div className="mt-5 rounded-3xl bg-emerald-50 p-4 text-sm text-emerald-700 ring-1 ring-emerald-200">
                    Leads successfully distributed
                  </div>
                )}
              </section>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
