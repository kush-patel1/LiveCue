import { useEffect } from "react";

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} – LiveCue` : "LiveCue";
    return () => { document.title = "LiveCue"; };
  }, [title]);
}
