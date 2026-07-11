import { useMemo, useRef, useState } from 'react';
import { IconX, IconUpload, IconChevronLeft, IconCheck, IconDownload } from '../../Components/Icons/Icons';
import * as XLSX from 'xlsx';
import { CustomField } from '../../Interfaces/CustomField/CustomField';
import {
  SheetData, MapTarget, ParsedCue,
  autoMapColumns, buildCues, cueIssues, gridToSheet, parsePastedText, parseTimeOfDay,
} from './importParsing';

// Spreadsheet-import wizard: upload → map columns → review → import.
// Entirely deterministic — headers are auto-matched to cue fields by synonym
// and content sniffing, and the user confirms the mapping before anything is
// written. Replaces the old AI-backed importer.

interface ImportWizardProps {
  projectId: string;
  projectDate: Date;
  fields: CustomField[];
  existingCueCount: number;
  onClose: () => void;
  onImport: (cues: ParsedCue[], newFields: CustomField[]) => Promise<void>;
}

type Stage = 'upload' | 'map' | 'review' | 'importing' | 'done';

// <select> values are strings; encode/decode the MapTarget union.
function encodeTarget(t: MapTarget): string {
  if (t === 'skip' || t === 'title' || t === 'startTime' || t === 'endTime') return t;
  if ('field' in t) return `field:${t.field}`;
  return 'new';
}

const UNIQUE_TARGETS = new Set(['title', 'startTime', 'endTime']);

export function ImportWizard({
  projectDate,
  fields,
  existingCueCount,
  onClose,
  onImport,
}: ImportWizardProps) {
  const [stage, setStage] = useState<Stage>('upload');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [sheet, setSheet] = useState<SheetData | null>(null);
  const [targets, setTargets] = useState<MapTarget[]>([]);
  const [parsedCues, setParsedCues] = useState<ParsedCue[]>([]);
  const [newFields, setNewFields] = useState<CustomField[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allFields = [...fields, ...newFields];

  // Live validation in the review table (recomputed as cells are edited).
  const rowIssues = useMemo(() => parsedCues.map(cueIssues), [parsedCues]);
  const issueCount = rowIssues.filter((r) => r.length > 0).length;

  // ── Upload ────────────────────────────────────────────────────────────────

  const startMapping = (data: SheetData) => {
    setSheet(data);
    setTargets(autoMapColumns(data, fields));
    setError('');
    setStage('map');
  };

  const processFile = async (file: File) => {
    setError('');
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      // raw:false renders cells as displayed text, so Excel time cells arrive
      // as "6:30 PM" instead of day-fraction serial numbers.
      const grid: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
      const data = gridToSheet(grid);
      if (!data) {
        setError('Couldn’t find a header row and data in that file.');
        return;
      }
      startMapping(data);
    } catch {
      setError('Couldn’t read that file. Make sure it’s a valid .xlsx, .xls, or .csv.');
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Please upload an .xlsx, .xls, or .csv file.');
      return;
    }
    processFile(file);
  };

  const handlePasteSubmit = () => {
    const data = parsePastedText(pasteText);
    if (!data) {
      setError('Paste at least a header row and one data row.');
      return;
    }
    startMapping(data);
  };

  const downloadTemplate = () => {
    const headers = ['Title', 'Start Time', 'End Time', ...fields.map((f) => f.label)];
    const example = ['Doors Open', '6:00 PM', '6:30 PM', ...fields.map(() => '')];
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cue Sheet');
    XLSX.writeFile(wb, 'LiveCue-Import-Template.xlsx');
  };

  // ── Mapping ───────────────────────────────────────────────────────────────

  const setColumnTarget = (col: number, value: string) => {
    setTargets((prev) => {
      const next = [...prev];
      let t: MapTarget;
      if (value === 'new') {
        t = { newField: sheet?.headers[col].trim() || `Column ${col + 1}` };
      } else if (value.startsWith('field:')) {
        t = { field: value.slice(6) };
      } else {
        t = value as MapTarget;
      }
      // Unique targets (title/start/end/an existing field) can only be held by
      // one column — selecting one steals it from any other column.
      const key = encodeTarget(t);
      if (UNIQUE_TARGETS.has(key) || key.startsWith('field:')) {
        for (let i = 0; i < next.length; i++) {
          if (i !== col && encodeTarget(next[i]) === key) next[i] = 'skip';
        }
      }
      next[col] = t;
      return next;
    });
  };

  const renameNewField = (col: number, label: string) => {
    setTargets((prev) => prev.map((t, i) => (i === col ? { newField: label } : t)));
  };

  const startMapped = targets.some((t) => t === 'startTime');
  const endMapped = targets.some((t) => t === 'endTime');

  const continueToReview = () => {
    if (!sheet) return;
    const result = buildCues(sheet, targets, fields);
    if (result.cues.length === 0) {
      setError('No data rows found with the current mapping.');
      return;
    }
    setParsedCues(result.cues);
    setNewFields(result.newFields);
    setError('');
    setStage('review');
  };

  // ── Review (same editing surface as before) ───────────────────────────────

  const handleCellEdit = (cueIdx: number, field: string, value: string) => {
    setParsedCues((prev) => {
      const updated = [...prev];
      const cue = { ...updated[cueIdx] };
      if (field === 'title' || field === 'startTime' || field === 'endTime') {
        (cue as any)[field] = value;
      } else {
        cue.fieldValues = { ...cue.fieldValues, [field]: value };
      }
      updated[cueIdx] = cue;
      return updated;
    });
  };

  const handleDeleteRow = (cueIdx: number) => {
    setParsedCues((prev) => prev.filter((_, i) => i !== cueIdx));
  };

  const handleAddRow = () => {
    setParsedCues((prev) => [...prev, { title: '', startTime: '', endTime: '', fieldValues: {} }]);
  };

  const handleConfirmImport = async () => {
    setStage('importing');
    try {
      // Normalize any hand-edited times ("6:40 PM" → "18:40") before writing.
      const normalized = parsedCues.map((c) => ({
        ...c,
        startTime: parseTimeOfDay(c.startTime) ?? c.startTime,
        endTime: parseTimeOfDay(c.endTime) ?? c.endTime,
      }));
      await onImport(normalized, newFields);
      setStage('done');
    } catch (err: any) {
      setError(err.message || 'Import failed. Please try again.');
      setStage('review');
    }
  };

  const sampleRows = sheet ? sheet.rows.slice(0, 3) : [];

  return (
    <div className="ai-import-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ai-import-modal">

        {/* Header */}
        <div className="ai-import-header">
          <div>
            <h3 className="inter-bold">Import from Spreadsheet</h3>
            <p className="inter-regular" style={{ fontSize: 13, color: 'rgba(255,246,238,0.5)', margin: 0 }}>
              {stage === 'map'
                ? 'Match each spreadsheet column to a cue field'
                : stage === 'review'
                  ? 'Double-check everything before importing'
                  : 'Upload a file or paste rows — columns are matched to your cue fields'}
            </p>
          </div>
          <button className="ai-import-close" onClick={onClose} aria-label="Close import"><IconX size={18} /></button>
        </div>

        {/* Error */}
        {error && <div className="ai-import-error">{error}</div>}

        {/* ── Step 1: Upload ── */}
        {stage === 'upload' && (
          <>
            <div
              className={`ai-drop-zone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="ai-drop-icon"><IconUpload size={40} /></div>
              <p className="inter-semibold" style={{ fontSize: 16, color: '#fff6ee', marginBottom: 6 }}>
                Drop your file here or click to browse
              </p>
              <p className="inter-regular" style={{ fontSize: 13, color: 'rgba(255,246,238,0.45)' }}>
                Supports .xlsx, .xls, .csv
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>

            <div className="imp-upload-alt">
              <button className="ai-btn-secondary" onClick={() => setShowPaste((p) => !p)}>
                Paste from Excel / Sheets
              </button>
              <button className="ai-btn-secondary" onClick={downloadTemplate}>
                <IconDownload size={14} /> Download template
              </button>
            </div>

            {showPaste && (
              <div className="imp-paste-block">
                <textarea
                  className="imp-paste-input"
                  placeholder={'Copy rows in Excel or Google Sheets (including the header row), then paste here…'}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={6}
                />
                <button className="ai-btn-primary" onClick={handlePasteSubmit} disabled={!pasteText.trim()}>
                  Continue
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Step 2: Map columns ── */}
        {stage === 'map' && sheet && (
          <>
            <div className="ai-preview-bar">
              <div className="imp-map-status">
                <span className="inter-medium" style={{ fontSize: 13, color: 'rgba(255,246,238,0.6)' }}>
                  {sheet.rows.length} row{sheet.rows.length !== 1 ? 's' : ''} found
                </span>
                {(!startMapped || !endMapped) && (
                  <span className="imp-warn-chip">
                    {!startMapped && !endMapped ? 'No start or end time column mapped'
                      : !startMapped ? 'No start time column mapped' : 'No end time column mapped'}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="ai-btn-secondary" onClick={() => setStage('upload')}><IconChevronLeft size={14} /> Back</button>
                <button className="ai-btn-primary" onClick={continueToReview}>Continue</button>
              </div>
            </div>

            <div className="ai-preview-table-wrapper">
              <table className="ai-preview-table imp-map-table">
                <thead>
                  <tr>
                    <th>Spreadsheet column</th>
                    <th>Sample data</th>
                    <th>Imports as</th>
                  </tr>
                </thead>
                <tbody>
                  {sheet.headers.map((h, col) => {
                    const t = targets[col];
                    const encoded = encodeTarget(t);
                    return (
                      <tr key={col} className={encoded === 'skip' ? 'imp-row-skipped' : ''}>
                        <td className="imp-col-header">{h.trim() || <span className="imp-col-unnamed">Column {col + 1}</span>}</td>
                        <td className="imp-col-samples">
                          {sampleRows.map((r) => (r[col] || '').trim()).filter(Boolean).slice(0, 3).join('  ·  ') || '—'}
                        </td>
                        <td className="imp-col-target">
                          <select
                            className="imp-target-select"
                            value={encoded}
                            aria-label={`Map column ${h.trim() || col + 1}`}
                            onChange={(e) => setColumnTarget(col, e.target.value)}
                          >
                            <option value="skip">Don&rsquo;t import</option>
                            <option value="title">Title</option>
                            <option value="startTime">Start time</option>
                            <option value="endTime">End time</option>
                            {fields.map((f) => (
                              <option key={f.id} value={`field:${f.id}`}>{f.label}</option>
                            ))}
                            <option value="new">New field&hellip;</option>
                          </select>
                          {typeof t === 'object' && 'newField' in t && (
                            <input
                              className="imp-newfield-input"
                              value={t.newField}
                              aria-label="New field name"
                              placeholder="Field name"
                              onChange={(e) => renameNewField(col, e.target.value)}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Step 3: Review ── */}
        {stage === 'review' && (
          <>
            <div className="ai-preview-bar">
              <div>
                <span className="inter-medium" style={{ fontSize: 13, color: 'rgba(255,246,238,0.6)' }}>
                  {parsedCues.length} cue{parsedCues.length !== 1 ? 's' : ''} ready
                </span>
                {issueCount > 0 && (
                  <span className="imp-warn-chip">
                    {issueCount} row{issueCount !== 1 ? 's' : ''} need{issueCount === 1 ? 's' : ''} attention
                  </span>
                )}
                {newFields.length > 0 && (
                  <span className="ai-new-fields-badge">
                    +{newFields.length} new field{newFields.length !== 1 ? 's' : ''}: {newFields.map((f) => f.label).join(', ')}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="ai-btn-secondary" onClick={() => setStage('map')}><IconChevronLeft size={14} /> Back to mapping</button>
                <button className="ai-btn-primary" onClick={handleConfirmImport}>
                  Import {parsedCues.length} Cue{parsedCues.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>

            <div className="ai-preview-table-wrapper">
              <table className="ai-preview-table">
                <thead>
                  <tr>
                    <th style={{ width: 32 }} />
                    <th>#</th>
                    <th>Title</th>
                    <th>Start</th>
                    <th>End</th>
                    {allFields.map((f) => <th key={f.id}>{f.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {parsedCues.map((cue, i) => (
                    <tr key={i} className={rowIssues[i].length ? 'imp-row-issue' : ''} title={rowIssues[i].join('\n') || undefined}>
                      <td>
                        <button className="ai-delete-row-btn" title="Delete row" onClick={() => handleDeleteRow(i)}><IconX size={14} /></button>
                      </td>
                      <td style={{ color: 'rgba(255,246,238,0.35)', fontSize: 12 }}>{existingCueCount + i + 1}</td>
                      <td>
                        <input className="ai-cell-input" value={cue.title}
                          onChange={(e) => handleCellEdit(i, 'title', e.target.value)} />
                      </td>
                      <td>
                        <input className={`ai-cell-input ai-cell-time${rowIssues[i].some((r) => r.toLowerCase().includes('start')) ? ' imp-cell-bad' : ''}`}
                          value={cue.startTime} placeholder="HH:MM"
                          onChange={(e) => handleCellEdit(i, 'startTime', e.target.value)} />
                      </td>
                      <td>
                        <input className={`ai-cell-input ai-cell-time${rowIssues[i].some((r) => r.toLowerCase().includes('end')) ? ' imp-cell-bad' : ''}`}
                          value={cue.endTime} placeholder="HH:MM"
                          onChange={(e) => handleCellEdit(i, 'endTime', e.target.value)} />
                      </td>
                      {allFields.map((f) => (
                        <td key={f.id}>
                          <input className="ai-cell-input" value={cue.fieldValues[f.id] || ''}
                            onChange={(e) => handleCellEdit(i, f.id, e.target.value)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={5 + allFields.length} style={{ paddingTop: 8 }}>
                      <button className="ai-add-row-btn" onClick={handleAddRow}>+ Add Row</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Importing ── */}
        {stage === 'importing' && (
          <div className="ai-parsing-state">
            <div className="ai-spinner" />
            <p className="inter-medium" style={{ color: '#578493', marginTop: 20, fontSize: 15 }}>
              Creating {parsedCues.length} cues...
            </p>
          </div>
        )}

        {/* ── Done ── */}
        {stage === 'done' && (
          <div className="ai-done-state">
            <div style={{ marginBottom: 12, color: '#4ea88c' }}><IconCheck size={48} /></div>
            <p className="inter-bold" style={{ fontSize: 18, color: '#fff6ee', marginBottom: 8 }}>
              {parsedCues.length} cues imported!
            </p>
            {newFields.length > 0 && (
              <p className="inter-regular" style={{ fontSize: 13, color: 'rgba(255,246,238,0.5)', marginBottom: 8 }}>
                {newFields.length} new field{newFields.length !== 1 ? 's' : ''} added to this project.
              </p>
            )}
            <p className="inter-regular" style={{ fontSize: 14, color: 'rgba(255,246,238,0.5)', marginBottom: 24 }}>
              Your cue sheet has been updated.
            </p>
            <button className="ai-btn-primary" onClick={onClose}>Close</button>
          </div>
        )}

      </div>
    </div>
  );
}

export type { ParsedCue };
export { toDateTimeString } from './importParsing';
