import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { usePageTitle } from "../../Hooks/usePageTitle";
import { TimerDisplay } from "../../Components/TimerDisplay/TimerDisplay";
import { Cue } from "../../Interfaces/Cue/Cue";
import { db, collection, query, where, onSnapshot, doc } from "../../Backend/firebase";

/** Public full-screen speaker/stage countdown for a shared project. */
function TimerView() {
  const { projectId } = useParams<{ projectId: string }>();
  const [cues, setCues] = useState<Cue[]>([]);
  const [title, setTitle] = useState("");
  const [broadcast, setBroadcast] = useState<{ message: string; at: number } | null>(null);
  usePageTitle(title ? `${title} – Timer` : "Timer");

  useEffect(() => {
    if (!projectId) return;
    return onSnapshot(doc(db, "projects", projectId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setTitle(data.title || "");
      if (data.broadcastMessage && data.broadcastAt) {
        setBroadcast({ message: data.broadcastMessage, at: new Date(data.broadcastAt).getTime() });
      } else {
        setBroadcast(null);
      }
    });
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    const q = query(collection(db, "cues"), where("projectRef", "==", projectId));
    return onSnapshot(q, (snap) => {
      setCues(snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          cueNumber: data.cueNumber,
          title: data.title || "",
          startTime: data.startTime?.toDate ? data.startTime.toDate().toISOString() : (data.startTime || new Date().toISOString()),
          endTime: data.endTime?.toDate ? data.endTime.toDate().toISOString() : (data.endTime || new Date().toISOString()),
          projectRef: data.projectRef,
          isLive: data.isLive ?? false,
          fieldValues: data.fieldValues || {},
          actualStartTime: data.actualStartTime,
        };
      }));
    });
  }, [projectId]);

  return <TimerDisplay projectTitle={title} cues={cues} broadcast={broadcast} />;
}

export default TimerView;
