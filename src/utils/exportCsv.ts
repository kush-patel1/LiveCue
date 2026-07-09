import { Cue } from "../Interfaces/Cue/Cue";
import { CustomField } from "../Interfaces/CustomField/CustomField";

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
}

function fmtDuration(startIso: string, endIso: string): string {
  const mins = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
  if (mins <= 0) return "";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// Quote a field if it contains a comma, quote, or newline (RFC 4180).
function esc(value: string): string {
  const s = value ?? "";
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Build a CSV of the cue sheet and trigger a browser download. */
export function exportCuesToCsv(title: string, cues: Cue[], fields: CustomField[]): void {
  const sorted = [...cues].sort((a, b) => a.cueNumber - b.cueNumber);
  const header = ["#", "Start", "End", "Duration", "Title", ...fields.map((f) => f.label)];
  const rows = sorted.map((c) => [
    String(c.cueNumber),
    fmtTime(c.startTime),
    fmtTime(c.endTime),
    fmtDuration(c.startTime, c.endTime),
    c.title || "",
    ...fields.map((f) => c.fieldValues[f.id] || ""),
  ]);

  const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  // Prepend BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(title || "cue-sheet").replace(/[^\w-]+/g, "_")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
