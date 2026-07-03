import { KeyboardEvent } from "react";

/**
 * Spreads the props needed to make a non-button element (span/div) behave like
 * a keyboard-operable button: focusable, activatable with Enter/Space, and
 * exposed to assistive tech as a button. Use for click-handled spans/divs:
 *   <span {...clickable(() => navigate('/pricing'))}>Pricing</span>
 */
export function clickable(onActivate: () => void, label?: string) {
  return {
    role: "button" as const,
    tabIndex: 0,
    "aria-label": label,
    onClick: onActivate,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onActivate();
      }
    },
  };
}
