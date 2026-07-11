import React from "react";

// Shared inline SVG icons — stroke-based, inherit color via currentColor and
// size via font-size (1em). Never use emojis in the UI; add icons here instead.
type P = { size?: number; className?: string; strokeWidth?: number };

const base = (
  children: React.ReactNode,
  { size = 18, className, strokeWidth = 1.8 }: P
) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true" focusable="false"
  >{children}</svg>
);

export const IconFolder = (p: P) => base(
  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />, p);

export const IconFolderPlus = (p: P) => base(<>
  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  <line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
</>, p);

export const IconMove = (p: P) => base(<>
  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  <path d="M12 15l3-3-3-3" /><line x1="15" y1="12" x2="8" y2="12" />
</>, p);

export const IconClock = (p: P) => base(<>
  <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
</>, p);

export const IconEdit = (p: P) => base(<>
  <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
</>, p);

export const IconBroadcast = (p: P) => base(<>
  <circle cx="12" cy="12" r="2.5" />
  <path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4" />
  <path d="M3.5 3.5a13 13 0 0 0 0 17M20.5 3.5a13 13 0 0 1 0 17" />
</>, p);

export const IconCopy = (p: P) => base(<>
  <rect x="9" y="9" width="11" height="11" rx="2" />
  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
</>, p);

export const IconTrash = (p: P) => base(<>
  <path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
  <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
</>, p);

export const IconGrid = (p: P) => base(<>
  <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
  <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
</>, p);

export const IconSettings = (p: P) => base(<>
  <circle cx="12" cy="12" r="3" />
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
</>, p);

export const IconCheck = (p: P) => base(<polyline points="20 6 9 17 4 12" />, p);

export const IconX = (p: P) => base(<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>, p);

export const IconPrinter = (p: P) => base(<>
  <path d="M6 9V3h12v6" /><path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
  <rect x="6" y="14" width="12" height="7" rx="1" />
</>, p);

export const IconDownload = (p: P) => base(<>
  <path d="M12 3v12" /><path d="M7 11l5 4 5-4" /><path d="M4 20h16" />
</>, p);

export const IconUpload = (p: P) => base(<>
  <path d="M12 20V8" /><path d="M7 12l5-4 5 4" /><path d="M4 20h16" opacity="0" /><path d="M20 16v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3" />
</>, p);

export const IconMessage = (p: P) => base(
  <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />, p);

export const IconHistory = (p: P) => base(<>
  <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 8v4l3 2" />
</>, p);

export const IconRefresh = (p: P) => base(<>
  <path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" />
</>, p);

export const IconSave = (p: P) => base(<>
  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
  <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
</>, p);

export const IconMegaphone = (p: P) => base(<>
  <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z" />
  <path d="M15 8a4 4 0 0 1 0 8" />
</>, p);

export const IconPlay = (p: P) => base(<polygon points="6 4 20 12 6 20 6 4" />, p);
export const IconPause = (p: P) => base(<><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></>, p);
export const IconTimer = (p: P) => base(<><line x1="10" y1="2" x2="14" y2="2" /><circle cx="12" cy="14" r="8" /><line x1="12" y1="14" x2="12" y2="10" /></>, p);

export const IconMoon = (p: P) => base(<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />, p);
export const IconSun = (p: P) => base(<>
  <circle cx="12" cy="12" r="4" />
  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
</>, p);

export const IconEye = (p: P) => base(<>
  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
</>, p);

export const IconChevronLeft = (p: P) => base(<polyline points="15 6 9 12 15 18" />, p);
export const IconChevronRight = (p: P) => base(<polyline points="9 6 15 12 9 18" />, p);

export const IconUsers = (p: P) => base(<>
  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
  <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
</>, p);

export const IconSliders = (p: P) => base(<>
  <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
  <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
  <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
  <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
</>, p);
