/**
 * Returns a safe in-app redirect path, or the fallback if the value is unsafe.
 *
 * Only allows same-origin relative paths beginning with a single "/". Rejects
 * protocol-relative ("//evil.com"), absolute URLs ("https://…"), and scheme
 * payloads ("javascript:…") so a crafted ?redirect= param can't bounce a user
 * off-site or inject a scheme.
 */
export function safeRedirect(value: string | null, fallback = "/HomePage"): string {
  if (!value) return fallback;
  // Must start with "/" but not "//" (protocol-relative) or "/\" variants.
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  // Reject any scheme-like content just in case.
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return fallback;
  return value;
}
