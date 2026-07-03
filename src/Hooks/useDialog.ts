import { useEffect, useRef } from "react";

/**
 * Accessibility helper for modal dialogs and drawers:
 * - moves focus into the dialog when it opens
 * - closes on Escape
 * - restores focus to the previously-focused element when it closes
 *
 * Attach the returned ref to the dialog container and give it tabIndex={-1}.
 */
export function useDialog(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Focus the first focusable element inside, else the dialog itself.
    const focusable = ref.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    (focusable ?? ref.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);
  return ref;
}
