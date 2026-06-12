import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { CustomField } from '../../Interfaces/CustomField/CustomField';

interface ParsedCue {
  title: string;
  startTime: string;
  endTime: string;
  fieldValues: Record<string, string>;
}

interface AIImportModalProps {
  projectId: string;
  projectDate: Date;
  fields: CustomField[];
  existingCueCount: number;
  onClose: () => void;
  onImport: (cues: ParsedCue[], newFields: CustomField[]) => Promise<void>;
}

type Stage = 'upload' | 'parsing' | 'preview' | 'importing' | 'done';

async function callClaude(prompt: string): Promise<string> {
  const baseUrl = process.env.REACT_APP_ANTHROPIC_PROXY_URL || '';
  const res = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.REACT_APP_ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.content?.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('') || '';
}

function toDateTimeString(projectDate: Date, timeStr: string): string {
  if (!timeStr) return new Date(projectDate).toISOString();
  const dateStr = projectDate.toISOString().split('T')[0];
  const iso = new Date(`${dateStr}T${timeStr}`);
  if (!isNaN(iso.getTime())) return iso.toISOString();
  const ampm = new Date(`${dateStr} ${timeStr}`);
  return isNaN(ampm.getTime()) ? new Date(projectDate).toISOString() : ampm.toISOString();
}

export function AIImportModal({
  projectDate,
  fields,
  existingCueCount,
  onClose,
  onImport,
}: AIImportModalProps) {
  const [stage, setStage] = useState<Stage>('upload');
  const [error, setError] = useState('');
  const [parsedCues, setParsedCues] = useState<ParsedCue[]>([]);
  const [newFields, setNewFields] = useState<CustomField[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // All fields visible in the preview = existing + newly detected
  const allFields = [...fields, ...newFields];

  const processFile = async (file: File) => {
    setError('');
    setStage('parsing');

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const csvText = XLSX.utils.sheet_to_csv(sheet);

      if (!csvText.trim()) {
        setError('The file appears to be empty.');
        setStage('upload');
        return;
      }

      const existingFieldDescriptions = fields.length
        ? fields.map((f) => `  - id: "${f.id}", label: "${f.label}", type: "${f.type}"`).join('\n')
        : '  (none — create all fields from scratch)';

      const prompt = `You are parsing a spreadsheet for a live event cue sheet application.

Spreadsheet data (CSV):
\`\`\`
${csvText.slice(0, 8000)}
\`\`\`

This project currently has these custom fields:
${existingFieldDescriptions}

Your job:
1. Map each spreadsheet column to the closest existing field if one matches semantically.
2. For columns that don't match any existing field, create a NEW field with a short camelCase id and a readable label.
3. Return every data row as a cue with ALL columns filled in.

Return ONLY valid JSON — no explanation, no markdown:
{
  "newFields": [
    { "id": "camelCaseId", "label": "Human Readable Label", "type": "text" }
  ],
  "cues": [
    {
      "title": "cue title or description",
      "startTime": "HH:MM or empty string",
      "endTime": "HH:MM or empty string",
      "fieldValues": {
        "<fieldId>": "value"
      }
    }
  ]
}

Rules:
- "newFields" lists only fields you are creating that don't already exist — leave it [] if all columns map to existing fields
- Use 24-hour HH:MM for times, or "" if absent
- "title" = the main name/description of the cue (look for a Title, Name, Event, or Description column)
- Every column that has meaningful data must appear in fieldValues — don't skip anything
- fieldValues keys must exactly match an existing field id OR a new field id you defined in "newFields"
- Skip blank rows and the header row`;

      const responseText = await callClaude(prompt);

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse AI response.');

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.cues || !Array.isArray(parsed.cues)) throw new Error('Unexpected response format.');

      const detectedNewFields: CustomField[] = (parsed.newFields || []).map((f: any) => ({
        id: f.id,
        label: f.label,
        type: f.type === 'time' ? 'time' : 'text',
      }));

      setNewFields(detectedNewFields);
      setParsedCues(parsed.cues);
      setStage('preview');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
      setStage('upload');
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    if (!allowed.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Please upload an .xlsx, .xls, or .csv file.');
      return;
    }
    processFile(file);
  };

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

  const handleRemoveNewField = (fieldId: string) => {
    setNewFields((prev) => prev.filter((f) => f.id !== fieldId));
    setParsedCues((prev) =>
      prev.map((cue) => {
        const { [fieldId]: _, ...rest } = cue.fieldValues;
        return { ...cue, fieldValues: rest };
      })
    );
  };

  const handleConfirmImport = async () => {
    setStage('importing');
    try {
      await onImport(parsedCues, newFields);
      setStage('done');
    } catch (err: any) {
      setError(err.message || 'Import failed. Please try again.');
      setStage('preview');
    }
  };

  return (
    <div className="ai-import-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ai-import-modal">

        {/* Header */}
        <div className="ai-import-header">
          <div>
            <h3 className="inter-bold">Import from Spreadsheet</h3>
            <p className="inter-regular" style={{ fontSize: 13, color: 'rgba(255,246,238,0.5)', margin: 0 }}>
              Upload an Excel or CSV file — AI will map your columns to cue fields automatically
            </p>
          </div>
          <button className="ai-import-close" onClick={onClose}>✕</button>
        </div>

        {/* Error */}
        {error && <div className="ai-import-error">⚠ {error}</div>}

        {/* ── Upload stage ── */}
        {stage === 'upload' && (
          <div
            className={`ai-drop-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="ai-drop-icon">📊</div>
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
        )}

        {/* ── Parsing stage ── */}
        {stage === 'parsing' && (
          <div className="ai-parsing-state">
            <div className="ai-spinner" />
            <p className="inter-medium" style={{ color: '#578493', marginTop: 20, fontSize: 15 }}>
              Reading your spreadsheet...
            </p>
            <p className="inter-regular" style={{ color: 'rgba(255,246,238,0.4)', fontSize: 13, marginTop: 6 }}>
              AI is mapping your columns to cue fields
            </p>
          </div>
        )}

        {/* ── Preview stage ── */}
        {stage === 'preview' && (
          <>
            <div className="ai-preview-bar">
              <div>
                <span className="inter-medium" style={{ fontSize: 13, color: 'rgba(255,246,238,0.6)' }}>
                  {parsedCues.length} cue{parsedCues.length !== 1 ? 's' : ''} found
                </span>
                {newFields.length > 0 && (
                  <span className="ai-new-fields-badge">
                    +{newFields.length} new field{newFields.length !== 1 ? 's' : ''}: {newFields.map(f => f.label).join(', ')}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="ai-btn-secondary" onClick={() => setStage('upload')}>← Re-upload</button>
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
                    {fields.map((f) => <th key={f.id}>{f.label}</th>)}
                    {newFields.map((f) => (
                      <th key={f.id} className="ai-th-new">
                        {f.label}
                        <span className="ai-new-tag">new</span>
                        <button className="ai-remove-field-btn" title="Remove this field" onClick={() => handleRemoveNewField(f.id)}>×</button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedCues.map((cue, i) => (
                    <tr key={i}>
                      <td>
                        <button className="ai-delete-row-btn" title="Delete row" onClick={() => handleDeleteRow(i)}>✕</button>
                      </td>
                      <td style={{ color: 'rgba(255,246,238,0.35)', fontSize: 12 }}>{existingCueCount + i + 1}</td>
                      <td>
                        <input className="ai-cell-input" value={cue.title}
                          onChange={(e) => handleCellEdit(i, 'title', e.target.value)} />
                      </td>
                      <td>
                        <input className="ai-cell-input ai-cell-time" value={cue.startTime} placeholder="HH:MM"
                          onChange={(e) => handleCellEdit(i, 'startTime', e.target.value)} />
                      </td>
                      <td>
                        <input className="ai-cell-input ai-cell-time" value={cue.endTime} placeholder="HH:MM"
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

        {/* ── Importing stage ── */}
        {stage === 'importing' && (
          <div className="ai-parsing-state">
            <div className="ai-spinner" />
            <p className="inter-medium" style={{ color: '#578493', marginTop: 20, fontSize: 15 }}>
              Creating {parsedCues.length} cues...
            </p>
          </div>
        )}

        {/* ── Done stage ── */}
        {stage === 'done' && (
          <div className="ai-done-state">
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
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

export { toDateTimeString };
export type { ParsedCue };
