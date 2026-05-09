"use client";

import { useEffect, useState } from "react";

type SheetOption = { id: number; sheet_name: string };

type UploadResult = {
  uploadedCount: number;
  failedCount: number;
  message: string;
  warnings?: string[];
};

const staticSheets = [
  "Daily Leads",
  "Engineering Leads",
  "Open Day Leads",
  "Custom Sheets",
];

export default function UploadLeadsPage() {
  const [customSheets, setCustomSheets] = useState<SheetOption[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>(staticSheets[0]);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetch("/api/sheets")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCustomSheets(data);
        }
      })
      .catch(() => {
        setCustomSheets([]);
      });
  }, []);

  const handleFileChange = (selected: File | null) => {
    setErrorMessage("");
    setResult(null);
    if (!selected) {
      setFile(null);
      return;
    }

    if (!selected.name.match(/\.xlsx$/i) && !selected.name.match(/\.xls$/i)) {
      setErrorMessage("Please upload a valid Excel file (.xlsx or .xls).");
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const droppedFile = event.dataTransfer.files[0];
    handleFileChange(droppedFile ?? null);
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage("Please choose an Excel file to upload.");
      return;
    }

    setStatus("uploading");
    setErrorMessage("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sheetName", selectedSheet);

    try {
      const response = await fetch("/api/upload-leads", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();
      if (!response.ok) {
        setStatus("error");
        setErrorMessage(json.error || "Upload failed. Please check the file format and try again.");
        return;
      }

      setStatus("success");
      setResult({
        uploadedCount: json.uploadedCount ?? 0,
        failedCount: json.failedCount ?? 0,
        message: json.message || "Upload complete",
        warnings: json.warnings || [],
      });
      setFile(null);
    } catch {
      setStatus("error");
      setErrorMessage("Upload failed. Please try again.");
    }
  };

  const sheetOptions = [...staticSheets, ...customSheets.map((sheet) => sheet.sheet_name)];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1100px] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full rounded-[32px] bg-white p-8 shadow-2xl shadow-slate-200/50 ring-1 ring-slate-200">
          <div className="mb-8 sm:flex sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-sky-500">Admin Upload</p>
              <h1 className="mt-4 text-3xl font-semibold text-slate-900">Upload Leads from Excel</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Select a lead sheet and upload a properly formatted Excel file to import leads into the CRM.
              </p>
            </div>
            <div className="mt-6 rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:mt-0">
              Supported: .xlsx, .xls
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
              <label className="mb-3 block text-sm font-medium text-slate-700">Select Lead Sheet</label>
              <select
                value={selectedSheet}
                onChange={(event) => setSelectedSheet(event.target.value)}
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
              >
                {sheetOptions.map((sheet) => (
                  <option key={sheet} value={sheet}>
                    {sheet}
                  </option>
                ))}
              </select>
            </div>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`rounded-[28px] border-2 px-6 py-12 text-center transition ${
                dragActive
                  ? "border-sky-500 bg-sky-50"
                  : "border-dashed border-slate-300 bg-slate-50"
              }`}
            >
              <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                  <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                    <path d="M8 12l4-4 4 4" />
                    <path d="M12 8v8" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Drag & drop your file here</h2>
                  <p className="mt-2 text-sm text-slate-500">or select an Excel file from your computer.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  <span>Select file</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    hidden
                    onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                  />
                </label>
                {file && <p className="text-sm text-slate-600">Selected file: {file.name}</p>}
              </div>
            </div>

            {errorMessage ? (
              <div className="rounded-3xl bg-rose-50 p-4 text-sm text-rose-700 ring-1 ring-rose-200">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Upload progress</p>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full bg-sky-500 transition-all ${
                      status === "uploading" ? "w-3/4" : status === "success" ? "w-full" : "w-0"
                    }`}
                  />
                </div>
              </div>
              <button
                onClick={handleUpload}
                className="inline-flex items-center justify-center rounded-3xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={!file || status === "uploading"}
              >
                {status === "uploading" ? "Uploading..." : "Upload Leads"}
              </button>
            </div>

            {status === "success" && result ? (
              <div className="rounded-3xl bg-emerald-50 p-5 text-sm text-emerald-700 ring-1 ring-emerald-200">
                <p className="font-semibold text-slate-900">{result.message}</p>
                <p className="mt-2">Uploaded rows: {result.uploadedCount}</p>
                <p>Failed rows: {result.failedCount}</p>
                {result.warnings?.length ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-600">
                    {result.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
