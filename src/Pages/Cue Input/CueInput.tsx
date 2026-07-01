import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePageTitle } from '../../Hooks/usePageTitle';
import { useParams, useNavigate } from 'react-router-dom';
import { LoadingScreen } from '../../Components/LoadingScreen/LoadingScreen';
import './CueInput.css';
import logo from '../../Assets/Logo/LIVECUE-Logo.png';
import { Project } from '../../Interfaces/Project/Project';
import { Cue } from '../../Interfaces/Cue/Cue';
import { CustomField, DEFAULT_FIELDS } from '../../Interfaces/CustomField/CustomField';
import { AIImportModal, toDateTimeString, ParsedCue } from './AIImportModal';
import { usePlan } from '../../Hooks/usePlan';
import { UpgradeModal, UpgradeFeature } from '../../Components/UpgradeModal/UpgradeModal';
import dayjs from 'dayjs';
import { db, collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from '../../Backend/firebase';
import { debounce } from 'lodash';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CueInputProps { projects: Project[]; }

const toTimeInput = (iso: string): string => {
  try { return dayjs(iso).format('HH:mm'); } catch { return ''; }
};

const fromTimeInput = (timeStr: string, existingISO: string): string => {
  if (!timeStr) return existingISO;
  const [h, m] = timeStr.split(':').map(Number);
  return dayjs(existingISO).hour(h).minute(m).second(0).millisecond(0).toISOString();
};

function AutoTextarea({ value, onChange, placeholder, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      className={className}
      placeholder={placeholder}
      value={value}
      rows={1}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function SortableFieldHeader({ field, onRemove }: {
  field: CustomField;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="ci-col-field ci-th"
    >
      <div className="ci-col-drag-handle" {...attributes} {...listeners} title="Drag to reorder column">⠿</div>
      <span>{field.label}</span>
      <button className="ci-th-remove" onClick={() => onRemove(field.id)} title={`Remove ${field.label}`}>×</button>
    </div>
  );
}

function cascadeTimes(cues: Cue[]): Cue[] {
  const result = [...cues];
  for (let i = 1; i < result.length; i++) {
    const prev = result[i - 1];
    const curr = result[i];
    const duration = new Date(curr.endTime).getTime() - new Date(curr.startTime).getTime();
    const newStart = new Date(prev.endTime);
    const newEnd = new Date(newStart.getTime() + Math.max(duration, 0));
    result[i] = { ...curr, startTime: newStart.toISOString(), endTime: newEnd.toISOString() };
  }
  return result;
}

function SortableCueRow({
  cue, index, fields, isLast, dragEnabled, onInputChange, onTimeChange, onDelete,
}: {
  cue: Cue; index: number; fields: CustomField[]; isLast: boolean; dragEnabled: boolean;
  onInputChange: (index: number, fieldId: string, value: string) => void;
  onTimeChange: (index: number, field: 'startTime' | 'endTime', timeStr: string) => void;
  onDelete: (id: string) => void;
}) {
  // Strip seconds/ms from both ends before diffing so partial minutes don't skew the display
  const durationMinutes = Math.max(0, Math.round(
    (dayjs(cue.endTime).startOf('minute').valueOf() - dayjs(cue.startTime).startOf('minute').valueOf()) / 60000
  ));
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cue.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={`ci-row${cue.isLive ? ' ci-row-live' : ''}`}
    >
      {/* Timeline spine — sticky left:0 */}
      <div className="ci-col-spine">
        <span className="ci-spine-time">{dayjs(cue.startTime).format('h:mm')}</span>
        <div className="ci-spine-track">
          <div className={`ci-dot${cue.isLive ? ' ci-dot-live' : ''}`} />
          {!isLast && <div className="ci-spine-connector" />}
        </div>
      </div>

      {/* Title — sticky left:72px */}
      <div className={`ci-col-title${cue.isLive ? ' ci-col-title-live' : ''}`}>
        <div
          className={`ci-drag${dragEnabled ? '' : ' ci-drag--locked'}`}
          title={dragEnabled ? "Drag to reorder" : "Upgrade to Pro to reorder cues"}
          {...(dragEnabled ? { ...attributes, ...listeners } : {})}
        >⠿</div>
        <div className="ci-num">{cue.cueNumber}</div>
        <AutoTextarea
          className="ci-title-input"
          placeholder="Untitled cue"
          value={cue.title}
          onChange={(v) => onInputChange(index, 'title', v)}
        />
      </div>

      {/* Start time */}
      <div className="ci-col-field">
        <input
          className="ci-time-input"
          type="time"
          value={toTimeInput(cue.startTime)}
          onChange={(e) => onTimeChange(index, 'startTime', e.target.value)}
        />
      </div>

      {/* End time */}
      <div className="ci-col-field">
        <input
          className="ci-time-input"
          type="time"
          value={toTimeInput(cue.endTime)}
          onChange={(e) => onTimeChange(index, 'endTime', e.target.value)}
        />
      </div>

      {/* Duration */}
      <div className="ci-col-duration">
        <input
          key={`${cue.id}-dur-${durationMinutes}`}
          className="ci-duration-input"
          type="number"
          min="0"
          defaultValue={durationMinutes}
          onBlur={(e) => {
            const m = parseInt(e.target.value, 10);
            if (!isNaN(m) && m >= 0)
              onTimeChange(index, 'endTime', dayjs(cue.startTime).add(m, 'minute').format('HH:mm'));
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        />
        <span className="ci-duration-unit">min</span>
      </div>

      {/* Dynamic fields */}
      {fields.map((field) => (
        <div key={field.id} className="ci-col-field">
          {field.type === 'time' ? (
            <input
              className="ci-time-input"
              type="time"
              value={cue.fieldValues[field.id] ? toTimeInput(cue.fieldValues[field.id]) : ''}
              onChange={(e) => {
                if (e.target.value)
                  onInputChange(index, field.id, fromTimeInput(e.target.value, cue.startTime));
              }}
            />
          ) : (
            <AutoTextarea
              className="ci-field-input"
              placeholder="—"
              value={cue.fieldValues[field.id] || ''}
              onChange={(v) => onInputChange(index, field.id, v)}
            />
          )}
        </div>
      ))}

      <div className="ci-col-del">
        <button className="ci-del-btn" onClick={() => onDelete(cue.id)} title="Delete cue">✕</button>
      </div>
    </div>
  );
}

function CueInput({ projects }: CueInputProps) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [cues, setCues] = useState<Cue[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  usePageTitle(project ? project.title : "Cue Editor");
  const [fields, setFields] = useState<CustomField[]>(DEFAULT_FIELDS);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showAIImport, setShowAIImport] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<UpgradeFeature | null>(null);

  const uid = (JSON.parse(sessionStorage.getItem('CURRENT_USER') || 'null'))?.id ?? null;
  const { plan, canAddCue, canUseCustomFields, canDragReorder, canUseAIImport } = usePlan(uid);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'time'>('text');
  const [deleteCueId, setDeleteCueId] = useState<string | null>(null);
  const cueToDelete = cues.find(c => c.id === deleteCueId);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  // Ref so the debounced function can always access the latest setter without stale closure
  const setSaveStatusRef = useRef(setSaveStatus);
  setSaveStatusRef.current = setSaveStatus;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (projectId) {
      fetchCues(projectId);
      const found = projects.find((p) => p.firebaseID === projectId);
      if (found) {
        setProject(found);
        setFields(found.fields?.length ? found.fields : DEFAULT_FIELDS);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, projects]);

  const fetchCues = async (pid: string) => {
    try {
      const q = query(collection(db, 'cues'), where('projectRef', '==', pid));
      const snap = await getDocs(q);
      const fetched: Cue[] = snap.docs.map((d) => {
        const data = d.data();
        const fieldValues: Record<string, string> = data.fieldValues || {};
        if (!data.fieldValues) {
          const legacyKeys = ['presenter', 'location', 'avMedia', 'audioSource', 'sideScreens', 'centerScreen', 'lighting', 'ambientLights', 'notes'];
          legacyKeys.forEach((k) => { if (data[k]) fieldValues[k] = data[k]; });
        }
        return {
          id: d.id,
          cueNumber: data.cueNumber,
          title: data.title || '',
          startTime: data.startTime?.toDate ? data.startTime.toDate().toISOString() : (data.startTime || new Date().toISOString()),
          endTime: data.endTime?.toDate ? data.endTime.toDate().toISOString() : (data.endTime || new Date().toISOString()),
          projectRef: data.projectRef,
          isLive: data.isLive ?? false,
          fieldValues,
        };
      });
      fetched.sort((a, b) => a.cueNumber - b.cueNumber);
      const withLive = fetched.map((c, i) => ({ ...c, isLive: i === 0 }));
      setCues(withLive);
      withLive.forEach(async (c) => {
        await updateDoc(doc(db, 'cues', c.id), { isLive: c.isLive });
      });
    } catch (err) {
      console.error('Error fetching cues:', err);
    } finally {
      setLoading(false);
    }
  };

  const debouncedUpdate = useRef(
    debounce(async (cue: Cue) => {
      try {
        await updateDoc(doc(db, 'cues', cue.id), {
          title: cue.title,
          startTime: cue.startTime,
          endTime: cue.endTime,
          fieldValues: cue.fieldValues,
          isLive: cue.isLive,
        });
        setSaveStatusRef.current('saved');
      } catch (err) {
        console.error('Error updating cue:', err);
        setSaveStatusRef.current('error');
      }
    }, 800)
  ).current;

  // Flush pending writes before the component unmounts (e.g. navigating away)
  useEffect(() => () => { debouncedUpdate.flush(); }, [debouncedUpdate]);

  // Writes first-cue startTime and cue count back to the project doc so the homepage reflects changes
  const syncProjectMeta = (updatedCues: Cue[]) => {
    if (!projectId) return;
    updateDoc(doc(db, 'projects', projectId), {
      cueAmount: updatedCues.length,
      ...(updatedCues.length > 0 && { startTime: new Date(updatedCues[0].startTime) }),
    }).catch(err => console.error('Error syncing project meta:', err));
  };

  const handleInputChange = (index: number, fieldId: string, value: string) => {
    setSaveStatus('saving');
    const updated = [...cues];
    if (fieldId === 'title') {
      updated[index] = { ...updated[index], title: value };
    } else {
      updated[index] = { ...updated[index], fieldValues: { ...updated[index].fieldValues, [fieldId]: value } };
    }
    setCues(updated);
    debouncedUpdate(updated[index]);
  };

  const handleTimeChange = (index: number, field: 'startTime' | 'endTime', timeStr: string) => {
    if (!timeStr) return;
    setSaveStatus('saving');
    const updated = [...cues];
    updated[index] = { ...updated[index], [field]: fromTimeInput(timeStr, updated[index][field]) };
    const cascaded = cascadeTimes(updated);
    setCues(cascaded);
    cascaded.slice(index).forEach((c) => debouncedUpdate(c));
    // Keep homepage start time in sync when first cue's start changes
    if (index === 0 && field === 'startTime') syncProjectMeta(cascaded);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = cues.findIndex((c) => c.id === active.id);
    const newIndex = cues.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(cues, oldIndex, newIndex).map((c, i) => ({
      ...c, cueNumber: i + 1, isLive: i === 0,
    }));
    const cascaded = cascadeTimes(reordered);
    setCues(cascaded);
    syncProjectMeta(cascaded);
    await Promise.all(
      cascaded.map((c) =>
        updateDoc(doc(db, 'cues', c.id), {
          cueNumber: c.cueNumber, startTime: c.startTime,
          endTime: c.endTime, isLive: c.isLive,
        })
      )
    );
  };

  const handleColDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex(f => f.id === active.id);
    const newIndex = fields.findIndex(f => f.id === over.id);
    const reordered = arrayMove(fields, oldIndex, newIndex);
    setFields(reordered);
    await persistFields(reordered);
  };

  const addCue = async () => {
    if (!canAddCue(cues.length)) { setUpgradeFeature('cues'); return; }
    if (!projectId) return;
    const isFirst = cues.length === 0;
    let startTime = new Date().toISOString();
    let endTime = new Date(Date.now() + 30 * 60000).toISOString();
    if (cues.length > 0) {
      const last = cues[cues.length - 1];
      startTime = last.endTime;
      endTime = new Date(new Date(last.endTime).getTime() + 30 * 60000).toISOString();
    }
    const newCue: Cue = {
      id: '', cueNumber: cues.length + 1, title: '',
      startTime, endTime, projectRef: projectId, isLive: isFirst, fieldValues: {},
    };
    try {
      const ref = await addDoc(collection(db, 'cues'), newCue);
      const next = [...cues, { ...newCue, id: ref.id }];
      setCues(next);
      syncProjectMeta(next);
    } catch (err) { console.error('Error adding cue:', err); }
  };

  const addField = async () => {
    if (!canUseCustomFields()) { setUpgradeFeature('customFields'); return; }
    if (!newFieldLabel.trim() || !projectId) return;
    const newField: CustomField = {
      id: `field_${Date.now()}`, label: newFieldLabel.trim(), type: newFieldType,
    };
    const updated = [...fields, newField];
    setFields(updated);
    setNewFieldLabel('');
    setNewFieldType('text');
    setShowFieldModal(false);
    await persistFields(updated);
  };

  const removeField = async (id: string) => {
    const updated = fields.filter((f) => f.id !== id);
    setFields(updated);
    await persistFields(updated);
  };

  const persistFields = async (updated: CustomField[]) => {
    if (!projectId) return;
    try { await updateDoc(doc(db, 'projects', projectId), { fields: updated }); }
    catch (err) { console.error('Error saving fields:', err); }
  };

  const handleDeleteCue = async () => {
    if (!deleteCueId) return;
    try {
      await deleteDoc(doc(db, 'cues', deleteCueId));
      const remaining = cues
        .filter(c => c.id !== deleteCueId)
        .map((c, i) => ({ ...c, cueNumber: i + 1, isLive: i === 0 }));
      setCues(remaining);
      syncProjectMeta(remaining);
      await Promise.all(remaining.map(c =>
        updateDoc(doc(db, 'cues', c.id), { cueNumber: c.cueNumber, isLive: c.isLive })
      ));
    } catch (err) { console.error('Error deleting cue:', err); }
    finally { setDeleteCueId(null); }
  };

  const handleAIImport = async (parsedCues: ParsedCue[], newFields: CustomField[]) => {
    if (!projectId || !project) return;
    const startCueNumber = cues.length + 1;
    const projectDate = project.date instanceof Date ? project.date : new Date(project.date);
    if (newFields.length > 0) {
      const updatedFields = [...fields, ...newFields];
      setFields(updatedFields);
      await persistFields(updatedFields);
    }
    const created: Cue[] = [];
    for (let i = 0; i < parsedCues.length; i++) {
      const p = parsedCues[i];
      const newCue: Omit<Cue, 'id'> = {
        cueNumber: startCueNumber + i, title: p.title,
        startTime: toDateTimeString(projectDate, p.startTime),
        endTime: toDateTimeString(projectDate, p.endTime),
        projectRef: projectId, isLive: cues.length === 0 && i === 0,
        fieldValues: p.fieldValues,
      };
      const ref = await addDoc(collection(db, 'cues'), newCue);
      created.push({ ...newCue, id: ref.id });
    }
    setCues((prev) => [...prev, ...created]);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="ci-shell">

      {/* ── Topbar ── */}
      <header className="ci-topbar">
        <div className="ci-topbar-left">
          <img src={logo} className="ci-logo" alt="LiveCue" onClick={() => navigate('/HomePage')} />
          <div className="ci-topbar-divider" />
          <div>
            <div className="ci-proj-name">{project?.title}</div>
            <div className="ci-proj-date">
              {project?.date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>
        <div className="ci-topbar-right">
          <span className={`ci-save-status ci-save-${saveStatus}`}>
            {saveStatus === 'saving' && '● Saving…'}
            {saveStatus === 'saved'  && '✓ Saved'}
            {saveStatus === 'error'  && '⚠ Error saving'}
          </span>
          <span className="ci-count-badge">{cues.length} cue{cues.length !== 1 ? 's' : ''}</span>
          <button className="ci-btn-ghost" onClick={() => canUseCustomFields() ? setShowFieldModal(true) : setUpgradeFeature('customFields')}>⚙ Fields</button>
          <button className="ci-btn-ghost" onClick={() => canUseAIImport(0) ? setShowAIImport(true) : setUpgradeFeature('aiImport')}>📥 Import</button>
          <button className="ci-btn-live" onClick={() => navigate(`/AdminPage/${projectId}`)}>⊙ Go Live</button>
        </div>
      </header>

      {/* ── Table (scrolls both axes) ── */}
      <div className="ci-table-wrap">
        <div className="ci-table-inner">

          {/* Column headers — sticky top */}
          <div className="ci-header-row">
            <div className="ci-col-spine ci-th-corner" />
            <div className="ci-col-title ci-th">Title</div>
            <div className="ci-col-field ci-th">Start</div>
            <div className="ci-col-field ci-th">End</div>
            <div className="ci-col-duration ci-th">Duration</div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleColDragEnd}>
              <SortableContext items={fields.map(f => f.id)} strategy={horizontalListSortingStrategy}>
                {fields.map(f => (
                  <SortableFieldHeader key={f.id} field={f} onRemove={removeField} />
                ))}
              </SortableContext>
            </DndContext>
            <div className="ci-col-del ci-th" />
          </div>

          {/* Cue rows */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={cues.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {cues.map((cue, index) => (
                <SortableCueRow
                  key={cue.id}
                  cue={cue}
                  index={index}
                  fields={fields}
                  isLast={index === cues.length - 1}
                  dragEnabled={canDragReorder()}
                  onInputChange={handleInputChange}
                  onTimeChange={handleTimeChange}
                  onDelete={setDeleteCueId}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Add cue row */}
          <div className="ci-add-row" onClick={addCue}>
            <div className="ci-col-spine ci-add-spine" />
            <div className="ci-add-label">+ Add cue</div>
          </div>

        </div>
      </div>

      {/* ── Delete confirmation ── */}
      {deleteCueId && (
        <div className="confirm-overlay" onClick={() => setDeleteCueId(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3 className="inter-bold" style={{ color: 'var(--text-primary)', marginBottom: 10 }}>Delete Cue?</h3>
            <p className="inter-regular" style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              Are you sure you want to delete{cueToDelete?.title
                ? <> cue <strong style={{ color: 'var(--text-primary)' }}>"{cueToDelete.title}"</strong></>
                : ' this cue'}? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="confirm-btn-cancel" onClick={() => setDeleteCueId(null)}>Cancel</button>
              <button className="confirm-btn-delete" onClick={handleDeleteCue}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Import modal ── */}
      {showAIImport && project && (
        <AIImportModal
          projectId={projectId!}
          projectDate={project.date instanceof Date ? project.date : new Date(project.date)}
          fields={fields}
          existingCueCount={cues.length}
          onClose={() => setShowAIImport(false)}
          onImport={handleAIImport}
        />
      )}

      {/* ── Add field modal ── */}
      {showFieldModal && (
        <div className="field-modal-overlay" onClick={() => setShowFieldModal(false)}>
          <div className="field-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="inter-bold" style={{ marginBottom: 16, color: 'var(--text-primary)' }}>Add Custom Field</h3>
            <label className="inter-medium" style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
              Field Label
            </label>
            <input
              className="field-modal-input"
              placeholder="e.g. Microphone Type"
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addField(); }}
              autoFocus
            />
            <label className="inter-medium" style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '12px 0 6px', display: 'block' }}>
              Field Type
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className={`field-type-btn ${newFieldType === 'text' ? 'active' : ''}`} onClick={() => setNewFieldType('text')}>Text</button>
              <button className={`field-type-btn ${newFieldType === 'time' ? 'active' : ''}`} onClick={() => setNewFieldType('time')}>Time</button>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="field-modal-cancel" onClick={() => setShowFieldModal(false)}>Cancel</button>
              <button className="field-modal-add" onClick={addField}>Add Field</button>
            </div>
          </div>
        </div>
      )}

      {upgradeFeature && (
        <UpgradeModal feature={upgradeFeature} currentPlan={plan} onClose={() => setUpgradeFeature(null)} />
      )}

    </div>
  );
}

export default CueInput;
