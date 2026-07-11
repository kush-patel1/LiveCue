import { CustomField } from '../../Interfaces/CustomField/CustomField';

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic spreadsheet-import engine. No AI: columns are matched to cue
// fields by header synonyms + content sniffing, and the user confirms/fixes
// the mapping in the wizard before anything is imported.
// ─────────────────────────────────────────────────────────────────────────────

export interface SheetData {
  headers: string[]; // raw header row (may contain empty strings)
  rows: string[][];  // data rows, same width as headers
}

/** What a spreadsheet column maps to. */
export type MapTarget =
  | 'skip'
  | 'title'
  | 'startTime'
  | 'endTime'
  | { field: string }              // existing cue-field id
  | { newField: string };          // label for a field to create

export interface ParsedCue {
  title: string;
  startTime: string; // "HH:MM" (or raw text if unparseable — flagged in review)
  endTime: string;
  fieldValues: Record<string, string>;
}

export interface RowIssue {
  row: number;            // index into ParsedCue[]
  reasons: string[];
}

// ── Header normalization + synonyms ─────────────────────────────────────────

export function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const BUILTIN_SYNONYMS: Record<'title' | 'startTime' | 'endTime', string[]> = {
  title: ['title', 'cue', 'cuename', 'cuetitle', 'item', 'segment', 'event', 'description', 'name', 'program', 'act', 'whatshappening'],
  startTime: ['start', 'starttime', 'begin', 'begins', 'from', 'timein', 'timestart', 'startclock'],
  endTime: ['end', 'endtime', 'finish', 'finishes', 'to', 'timeout', 'timeend', 'until', 'stop'],
};

// Extra aliases for the well-known default fields, applied only when the
// project actually has a field with that id ("Speaker" column → Presenter).
const FIELD_SYNONYMS: Record<string, string[]> = {
  presenter: ['speaker', 'speakers', 'host', 'talent', 'mc', 'emcee', 'who', 'performer'],
  location: ['room', 'venue', 'stage', 'place', 'where', 'area'],
  notes: ['note', 'comments', 'comment', 'remarks', 'details'],
  avMedia: ['av', 'media', 'video', 'visuals', 'screen', 'slides', 'playback'],
  audioSource: ['audio', 'sound', 'music', 'mic', 'mics'],
  lighting: ['lights', 'light', 'lx'],
};

// ── Time parsing ─────────────────────────────────────────────────────────────

/** Parse a cell into "HH:MM" (24h), or null if it isn't a time of day. */
export function parseTimeOfDay(raw: string): string | null {
  const s = (raw || '').trim();
  if (!s) return null;

  // "6:30 PM", "06:30:00 pm", "6.30pm"
  let m = s.match(/^(\d{1,2})[:.](\d{2})(?::(\d{2}))?\s*([ap])\.?\s*m\.?$/i);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (h < 1 || h > 12 || min > 59) return null;
    if (m[4].toLowerCase() === 'p' && h !== 12) h += 12;
    if (m[4].toLowerCase() === 'a' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  // "18:30", "6:30", "06:30:00"
  m = s.match(/^(\d{1,2})[:.](\d{2})(?::(\d{2}))?$/);
  if (m) {
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (h > 23 || min > 59) return null;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  // "6 PM", "12am"
  m = s.match(/^(\d{1,2})\s*([ap])\.?\s*m\.?$/i);
  if (m) {
    let h = parseInt(m[1], 10);
    if (h < 1 || h > 12) return null;
    if (m[2].toLowerCase() === 'p' && h !== 12) h += 12;
    if (m[2].toLowerCase() === 'a' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:00`;
  }

  // Excel day-fraction serial that slipped through as text ("0.775" = 6:36 PM)
  m = s.match(/^0?\.\d+$/);
  if (m) {
    const f = parseFloat(s);
    const totalMin = Math.round(f * 24 * 60);
    return `${String(Math.floor(totalMin / 60) % 24).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
  }

  return null;
}

/** Fraction of non-empty cells in a column that parse as times. */
function timeRatio(rows: string[][], col: number): number {
  let nonEmpty = 0;
  let parsed = 0;
  for (const row of rows) {
    const cell = (row[col] || '').trim();
    if (!cell) continue;
    nonEmpty++;
    if (parseTimeOfDay(cell)) parsed++;
  }
  return nonEmpty === 0 ? 0 : parsed / nonEmpty;
}

// ── Auto-mapping ─────────────────────────────────────────────────────────────

/**
 * Propose a mapping for every column: header synonyms first (exact, then
 * substring), then content sniffing for the start/end time columns, then
 * "create new field" for anything left with a header, "skip" otherwise.
 */
export function autoMapColumns(sheet: SheetData, fields: CustomField[]): MapTarget[] {
  const n = sheet.headers.length;
  const targets: MapTarget[] = new Array(n).fill('skip');
  const taken = new Set<string>(); // 'title' | 'startTime' | 'endTime' | field ids

  const norm = sheet.headers.map(normalizeHeader);

  // Candidate matchers, in priority order. Existing-field labels win over the
  // generic built-ins so a project field literally named "Description" doesn't
  // lose its column to the title heuristic.
  type Candidate = { key: string; target: MapTarget; names: string[] };
  const candidates: Candidate[] = [
    ...fields.map((f) => ({
      key: `field:${f.id}`,
      target: { field: f.id } as MapTarget,
      names: [
        normalizeHeader(f.label),
        normalizeHeader(f.id),
        ...(FIELD_SYNONYMS[f.id] || []),
      ].filter(Boolean),
    })),
    { key: 'title', target: 'title', names: BUILTIN_SYNONYMS.title },
    { key: 'startTime', target: 'startTime', names: BUILTIN_SYNONYMS.startTime },
    { key: 'endTime', target: 'endTime', names: BUILTIN_SYNONYMS.endTime },
  ];

  // Pass 1: exact normalized match.
  for (const c of candidates) {
    if (taken.has(c.key)) continue;
    for (let col = 0; col < n; col++) {
      if (targets[col] !== 'skip' || !norm[col]) continue;
      if (c.names.includes(norm[col])) {
        targets[col] = c.target;
        taken.add(c.key);
        break;
      }
    }
  }

  // Pass 2: substring match (header contains the synonym or vice versa).
  for (const c of candidates) {
    if (taken.has(c.key)) continue;
    for (let col = 0; col < n; col++) {
      if (targets[col] !== 'skip' || norm[col].length < 3) continue;
      if (c.names.some((s) => s.length >= 3 && (norm[col].includes(s) || s.includes(norm[col])))) {
        targets[col] = c.target;
        taken.add(c.key);
        break;
      }
    }
  }

  // Pass 3: content sniffing — unmatched columns that are mostly times become
  // start/end (in left-to-right order), since time headers are often junk.
  if (!taken.has('startTime') || !taken.has('endTime')) {
    for (let col = 0; col < n; col++) {
      if (targets[col] !== 'skip') continue;
      if (timeRatio(sheet.rows, col) >= 0.6) {
        if (!taken.has('startTime')) {
          targets[col] = 'startTime';
          taken.add('startTime');
        } else if (!taken.has('endTime')) {
          targets[col] = 'endTime';
          taken.add('endTime');
        } else break;
      }
    }
  }

  // Pass 4: leftover columns with a real header → propose a new field.
  for (let col = 0; col < n; col++) {
    if (targets[col] === 'skip' && sheet.headers[col].trim()) {
      targets[col] = { newField: sheet.headers[col].trim() };
    }
  }

  return targets;
}

// ── Building cues from a confirmed mapping ───────────────────────────────────

/** camelCase a label into a field id, unique against `used`. */
export function makeFieldId(label: string, used: Set<string>): string {
  const words = label.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean);
  let base = words.map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1))).join('') || 'field';
  let id = base;
  let i = 2;
  while (used.has(id)) id = `${base}${i++}`;
  used.add(id);
  return id;
}

export interface BuildResult {
  cues: ParsedCue[];
  newFields: CustomField[];
  issues: RowIssue[];
}

const HHMM = /^\d{2}:\d{2}$/;

/** Problems with a single parsed cue (empty array = clean). Used both at build
 *  time and live in the review table as the user edits cells. */
export function cueIssues(cue: ParsedCue): string[] {
  const reasons: string[] = [];
  for (const key of ['startTime', 'endTime'] as const) {
    const label = key === 'startTime' ? 'start' : 'end';
    const v = cue[key].trim();
    if (!v) reasons.push(`Missing ${label} time`);
    else if (!HHMM.test(v) && !parseTimeOfDay(v)) reasons.push(`${label === 'start' ? 'Start' : 'End'} time "${v}" not recognized`);
  }
  if (HHMM.test(cue.startTime) && HHMM.test(cue.endTime) && cue.endTime <= cue.startTime) {
    reasons.push('End time is not after start time');
  }
  return reasons;
}

export function buildCues(sheet: SheetData, targets: MapTarget[], existingFields: CustomField[]): BuildResult {
  // Resolve new fields first so every row writes to stable ids.
  const usedIds = new Set(existingFields.map((f) => f.id));
  const newFields: CustomField[] = [];
  const colFieldId: (string | null)[] = targets.map((t) => {
    if (typeof t === 'object' && 'field' in t) return t.field;
    if (typeof t === 'object' && 'newField' in t) {
      const id = makeFieldId(t.newField, usedIds);
      newFields.push({ id, label: t.newField, type: 'text' });
      return id;
    }
    return null;
  });

  const cues: ParsedCue[] = [];
  const issues: RowIssue[] = [];

  for (const row of sheet.rows) {
    // Only look at mapped cells when deciding if the row is blank.
    const mappedCells = targets.map((t, c) => (t === 'skip' ? '' : (row[c] || '').trim()));
    if (mappedCells.every((v) => !v)) continue;

    const cue: ParsedCue = { title: '', startTime: '', endTime: '', fieldValues: {} };

    targets.forEach((t, c) => {
      const raw = (row[c] || '').trim();
      if (t === 'title') cue.title = raw;
      else if (t === 'startTime' || t === 'endTime') {
        // Keep the raw text when unparseable so the user can see and fix it.
        cue[t] = parseTimeOfDay(raw) ?? raw;
      } else if (colFieldId[c]) {
        if (raw) cue.fieldValues[colFieldId[c]!] = raw;
      }
    });

    const reasons = cueIssues(cue);
    if (reasons.length) issues.push({ row: cues.length, reasons });
    cues.push(cue);
  }

  return { cues, newFields, issues };
}

// ── Raw text (paste) → SheetData ─────────────────────────────────────────────

/** Parse pasted text: tab-separated (straight from Excel/Sheets) or comma CSV. */
export function parsePastedText(text: string): SheetData | null {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim());
  if (lines.length < 2) return null; // need a header + at least one data row
  const delim = text.includes('\t') ? '\t' : ',';
  const grid = lines.map((l) => l.split(delim).map((c) => c.trim()));
  const width = Math.max(...grid.map((r) => r.length));
  const padded = grid.map((r) => [...r, ...new Array(width - r.length).fill('')]);
  return { headers: padded[0], rows: padded.slice(1) };
}

/** Normalize a 2-D array from XLSX into SheetData (find header row, trim blanks). */
export function gridToSheet(grid: string[][]): SheetData | null {
  const cleaned = grid.map((r) => r.map((c) => (c ?? '').toString()));
  // Header = first row with at least 2 non-empty cells.
  const headerIdx = cleaned.findIndex((r) => r.filter((c) => c.trim()).length >= 2);
  if (headerIdx === -1) return null;
  const width = Math.max(...cleaned.map((r) => r.length));
  const pad = (r: string[]) => [...r, ...new Array(Math.max(0, width - r.length)).fill('')];
  const rows = cleaned.slice(headerIdx + 1).map(pad).filter((r) => r.some((c) => c.trim()));
  if (rows.length === 0) return null;
  return { headers: pad(cleaned[headerIdx]), rows };
}

/** Combine a cue's HH:MM time with the project's date into an ISO string. */
export function toDateTimeString(projectDate: Date, timeStr: string): string {
  if (!timeStr) return new Date(projectDate).toISOString();
  const dateStr = projectDate.toISOString().split('T')[0];
  const iso = new Date(`${dateStr}T${timeStr}`);
  if (!isNaN(iso.getTime())) return iso.toISOString();
  const ampm = new Date(`${dateStr} ${timeStr}`);
  return isNaN(ampm.getTime()) ? new Date(projectDate).toISOString() : ampm.toISOString();
}
