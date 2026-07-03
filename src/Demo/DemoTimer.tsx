import { useState } from "react";
import { usePageTitle } from "../Hooks/usePageTitle";
import { DemoBanner } from "./DemoBanner";
import { TimerDisplay } from "../Components/TimerDisplay/TimerDisplay";
import { DEMO_TITLE, makeDemoCues } from "./demoData";

/** Demo of the speaker countdown. The live cue's end time is shifted to a few
 *  minutes from now so the countdown is actually ticking for the visitor. */
function DemoTimer() {
  usePageTitle("Demo · Speaker Timer");
  const [cues] = useState(() => {
    const base = makeDemoCues();
    const now = new Date();
    // Make cue 1 live and ending 3.5 minutes from now so the timer counts down.
    const end = new Date(now.getTime() + 3.5 * 60000);
    const start = new Date(now.getTime() - 5 * 60000);
    base[0] = { ...base[0], isLive: true, startTime: start.toISOString(), endTime: end.toISOString() };
    return base.map((c, i) => (i === 0 ? c : { ...c, isLive: false }));
  });

  return (
    <>
      <DemoBanner section="Speaker Timer" />
      <TimerDisplay projectTitle={DEMO_TITLE} cues={cues} broadcast={null} />
    </>
  );
}

export default DemoTimer;
