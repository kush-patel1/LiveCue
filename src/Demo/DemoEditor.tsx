import { useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../Hooks/usePageTitle";
import { DemoBanner } from "./DemoBanner";
import "../Pages/Cue Input/CueInput.css";
import logo from "../Assets/Logo/LIVECUE-Logo.png";
import dayjs from "dayjs";
import { Cue } from "../Interfaces/Cue/Cue";
import { CustomField } from "../Interfaces/CustomField/CustomField";
import { DEMO_FIELDS, DEMO_TITLE, DEMO_DATE, DEMO_PROJECT_ID, makeDemoCues } from "./demoData";

const toTimeInput = (iso: string): string => {
  try { return dayjs(iso).format("HH:mm"); } catch { return ""; }
};
const fromTimeInput = (timeStr: string, existingISO: string): string => {
  if (!timeStr) return existingISO;
  const [h, m] = timeStr.split(":").map(Number);
  return dayjs(existingISO).hour(h).minute(m).second(0).millisecond(0).toISOString();
};

function AutoTextarea({ value, onChange, placeholder, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    if (ref.current) { ref.current.style.height = "auto"; ref.current.style.height = ref.current.scrollHeight + "px"; }
  }, [value]);
  return (
    <textarea ref={ref} className={className} placeholder={placeholder} value={value} rows={1}
      onChange={(e) => onChange(e.target.value)} />
  );
}

function DemoEditor() {
  usePageTitle("Demo · Cue Sheet Editor");
  const navigate = useNavigate();
  const [cues, setCues] = useState<Cue[]>(() => makeDemoCues());
  const [fields] = useState<CustomField[]>(DEMO_FIELDS);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [deleteCueId, setDeleteCueId] = useState<string | null>(null);
  const idSeq = useRef(100);

  // Flash a "saved" state so it feels live — but nothing leaves the browser.
  const flashSaved = () => {
    setSaveStatus("saving");
    window.setTimeout(() => setSaveStatus("saved"), 350);
  };

  const handleInputChange = (index: number, fieldId: string, value: string) => {
    flashSaved();
    setCues((prev) => prev.map((c, i) => {
      if (i !== index) return c;
      if (fieldId === "title") return { ...c, title: value };
      return { ...c, fieldValues: { ...c.fieldValues, [fieldId]: value } };
    }));
  };

  const handleTimeChange = (index: number, field: "startTime" | "endTime", timeStr: string) => {
    if (!timeStr) return;
    flashSaved();
    setCues((prev) => {
      const updated = prev.map((c, i) => i === index ? { ...c, [field]: fromTimeInput(timeStr, c[field]) } : c);
      // Keep the next cue's start aligned to this cue's end (same as production).
      if (field === "endTime" && index + 1 < updated.length) {
        updated[index + 1] = { ...updated[index + 1], startTime: updated[index].endTime };
      }
      return updated;
    });
  };

  const addCue = () => {
    flashSaved();
    setCues((prev) => {
      const last = prev[prev.length - 1];
      const start = last ? last.endTime : (() => { const d = new Date(DEMO_DATE); d.setHours(18, 0, 0, 0); return d.toISOString(); })();
      const end = new Date(new Date(start).getTime() + 30 * 60000).toISOString();
      return [...prev, {
        id: `demo-new-${idSeq.current++}`, cueNumber: prev.length + 1, title: "",
        startTime: start, endTime: end, projectRef: DEMO_PROJECT_ID, isLive: false, fieldValues: {},
      }];
    });
  };

  const handleDeleteCue = () => {
    flashSaved();
    setCues((prev) => prev.filter((c) => c.id !== deleteCueId).map((c, i) => ({ ...c, cueNumber: i + 1 })));
    setDeleteCueId(null);
  };

  const cueToDelete = cues.find((c) => c.id === deleteCueId);

  return (
    <>
      <DemoBanner section="Cue Sheet Editor" />
      <div className="ci-shell">
        <header className="ci-topbar">
          <div className="ci-topbar-left">
            <img src={logo} className="ci-logo" alt="LiveCue" onClick={() => navigate("/demo")} />
            <div className="ci-topbar-divider" />
            <div>
              <div className="ci-proj-name">{DEMO_TITLE}</div>
              <div className="ci-proj-date">
                {DEMO_DATE.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })}
              </div>
            </div>
          </div>
          <div className="ci-topbar-right">
            <span className={`ci-save-status ci-save-${saveStatus}`}>
              {saveStatus === "saving" && "● Saving…"}
              {saveStatus === "saved" && "✓ Saved (demo — not persisted)"}
            </span>
            <span className="ci-count-badge">{cues.length} cue{cues.length !== 1 ? "s" : ""}</span>
            <button className="ci-btn-live" onClick={() => navigate("/demo/admin")}>⊙ Go Live</button>
          </div>
        </header>

        <div className="ci-table-wrap">
          <div className="ci-table-inner">
            <div className="ci-header-row">
              <div className="ci-col-spine ci-th-corner" />
              <div className="ci-col-title ci-th">Title</div>
              <div className="ci-col-field ci-th">Start</div>
              <div className="ci-col-field ci-th">End</div>
              <div className="ci-col-duration ci-th">Duration</div>
              {fields.map((f) => (
                <div key={f.id} className="ci-col-field ci-th">{f.label}</div>
              ))}
              <div className="ci-col-del ci-th" />
            </div>

            {cues.map((cue, index) => {
              const durationMinutes = Math.max(0, Math.round(
                (dayjs(cue.endTime).startOf("minute").valueOf() - dayjs(cue.startTime).startOf("minute").valueOf()) / 60000
              ));
              const isLast = index === cues.length - 1;
              return (
                <div key={cue.id} className="ci-row">
                  <div className="ci-col-spine">
                    <span className="ci-spine-time">{dayjs(cue.startTime).format("h:mm")}</span>
                    <div className="ci-spine-track">
                      <div className="ci-dot" />
                      {!isLast && <div className="ci-spine-connector" />}
                    </div>
                  </div>

                  <div className="ci-col-title">
                    <div className="ci-num">{cue.cueNumber}</div>
                    <AutoTextarea className="ci-title-input" placeholder="Untitled cue" value={cue.title}
                      onChange={(v) => handleInputChange(index, "title", v)} />
                  </div>

                  <div className="ci-col-field">
                    <input className="ci-time-input" type="time" value={toTimeInput(cue.startTime)}
                      onChange={(e) => handleTimeChange(index, "startTime", e.target.value)} />
                  </div>
                  <div className="ci-col-field">
                    <input className="ci-time-input" type="time" value={toTimeInput(cue.endTime)}
                      onChange={(e) => handleTimeChange(index, "endTime", e.target.value)} />
                  </div>

                  <div className="ci-col-duration">
                    <input key={`${cue.id}-dur-${durationMinutes}`} className="ci-duration-input" type="number" min="0"
                      defaultValue={durationMinutes}
                      onBlur={(e) => { const m = parseInt(e.target.value, 10); if (!isNaN(m) && m >= 0) handleTimeChange(index, "endTime", dayjs(cue.startTime).add(m, "minute").format("HH:mm")); }}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
                    <span className="ci-duration-unit">min</span>
                  </div>

                  {fields.map((field) => (
                    <div key={field.id} className="ci-col-field">
                      <AutoTextarea className="ci-field-input" placeholder="—" value={cue.fieldValues[field.id] || ""}
                        onChange={(v) => handleInputChange(index, field.id, v)} />
                    </div>
                  ))}

                  <div className="ci-col-del">
                    <button className="ci-del-btn" onClick={() => setDeleteCueId(cue.id)} title="Delete cue">×</button>
                  </div>
                </div>
              );
            })}

            <div className="ci-add-row" onClick={addCue}>
              <div className="ci-col-spine ci-add-spine" />
              <div className="ci-add-label">+ Add cue</div>
            </div>
          </div>
        </div>

        {deleteCueId && (
          <div className="confirm-overlay" onClick={() => setDeleteCueId(null)}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="inter-bold" style={{ color: "var(--text-primary)", marginBottom: 10 }}>Delete Cue?</h3>
              <p className="inter-regular" style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
                Are you sure you want to delete{cueToDelete?.title
                  ? <> cue <strong style={{ color: "var(--text-primary)" }}>"{cueToDelete.title}"</strong></>
                  : " this cue"}?
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="confirm-btn-cancel" onClick={() => setDeleteCueId(null)}>Cancel</button>
                <button className="confirm-btn-delete" onClick={handleDeleteCue}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default DemoEditor;
