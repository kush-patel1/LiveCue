import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// ─────────────────────────────────────────────────────────────────────────────
// Branded password-reset email (Option B).
//
// Instead of Firebase Auth's stock email, this Cloud Function generates the
// reset link with the Admin SDK and sends a fully designed HTML email through
// Resend (https://resend.com). The client calls this first and falls back to
// Firebase's built-in sendPasswordResetEmail() if it isn't configured, so
// nothing breaks before you finish setup.
//
// SETUP (once):
//   1. Create a Resend account and verify a sending domain (e.g. live-cue.com),
//      so mail comes from noreply@live-cue.com (fixes spam placement).
//   2. cd functions && npm install   (adds the `resend` dependency below)
//   3. Set the API key as a secret:
//        printf '%s' 're_xxx' | firebase functions:secrets:set RESEND_API_KEY --data-file=-
//   4. firebase deploy --only functions:sendPasswordResetBranded
//   5. Update FROM_ADDRESS / APP_URL below to your verified domain.
// ─────────────────────────────────────────────────────────────────────────────

const FROM_ADDRESS = "LiveCue <noreply@live-cue.com>"; // must be a Resend-verified domain
const APP_URL = "https://live-cue.com";
const RESEND_COOLDOWN_MS = 60 * 1000; // one branded email per address per minute

function resetEmailHtml(link: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0f1417;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f1417;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#161d21;border:1px solid rgba(127,168,181,0.16);border-radius:16px;overflow:hidden;">
          <tr><td style="padding:32px 40px 8px;">
            <div style="font-size:22px;font-weight:800;letter-spacing:0.5px;">
              <span style="color:#7fa8b5;">LIVE</span><span style="color:#fff6ee;">CUE</span>
            </div>
          </td></tr>
          <tr><td style="padding:16px 40px 0;">
            <h1 style="margin:0;color:#fff6ee;font-size:20px;font-weight:700;">Reset your password</h1>
            <p style="margin:14px 0 0;color:rgba(255,246,238,0.7);font-size:15px;line-height:1.6;">
              We got a request to reset the password for your LiveCue account.
              Click the button below to choose a new one.
            </p>
          </td></tr>
          <tr><td style="padding:28px 40px;">
            <a href="${link}" style="display:inline-block;background:#578493;color:#0f1417;font-weight:700;font-size:15px;text-decoration:none;padding:13px 28px;border-radius:10px;">
              Reset password
            </a>
          </td></tr>
          <tr><td style="padding:0 40px 32px;">
            <p style="margin:0;color:rgba(255,246,238,0.45);font-size:13px;line-height:1.6;">
              This link expires in 1 hour. If you didn't request this, you can safely ignore this
              email — your password won't change. If the button doesn't work, copy and paste this link:
            </p>
            <p style="margin:10px 0 0;word-break:break-all;font-size:12px;color:#7fa8b5;">${link}</p>
          </td></tr>
        </table>
        <p style="margin:20px 0 0;color:rgba(255,246,238,0.3);font-size:12px;">© LiveCue · <a href="${APP_URL}" style="color:rgba(255,246,238,0.4);">live-cue.com</a></p>
      </td></tr>
    </table>
  </body>
</html>`;
}

/**
 * Sends a branded password-reset email. Public (unauthenticated) callable —
 * users invoke it from the login page when they've forgotten their password.
 * Always returns { ok: true } regardless of whether the account exists, to
 * avoid leaking which emails are registered (email-enumeration protection).
 */
export const sendPasswordResetBranded = functions
  .runWith({ secrets: ["RESEND_API_KEY"] })
  .https.onCall(async (data: { email?: string }) => {
    const email = (data?.email || "").trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new functions.https.HttpsError("invalid-argument", "A valid email is required");
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // Not configured yet — signal the client to fall back to Firebase's default.
      throw new functions.https.HttpsError("failed-precondition", "Branded email not configured");
    }

    // Basic anti-abuse: at most one branded email per address per cooldown window.
    const db = admin.firestore();
    const throttleRef = db.collection("_pwResetThrottle").doc(Buffer.from(email).toString("base64url"));
    const throttle = await throttleRef.get();
    const last = throttle.exists ? (throttle.data()?.at as number | undefined) : undefined;
    if (last && Date.now() - last < RESEND_COOLDOWN_MS) {
      return { ok: true }; // silently succeed — don't reveal timing
    }

    // Generate the reset link. Throws if the account doesn't exist — swallow that
    // so the response is identical for existing and non-existing accounts.
    let link: string;
    try {
      link = await admin.auth().generatePasswordResetLink(email, {
        url: `${APP_URL}/#/login`,
        handleCodeInApp: false,
      });
    } catch (err: any) {
      if (err?.code === "auth/user-not-found") return { ok: true };
      throw new functions.https.HttpsError("internal", "Could not generate reset link");
    }

    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Reset your LiveCue password",
      html: resetEmailHtml(link),
    });

    await throttleRef.set({ at: Date.now() }, { merge: true });
    return { ok: true };
  });
