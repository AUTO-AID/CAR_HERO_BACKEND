/**
 * ============================================================================
 * DEVELOPMENT FLAGS — TEMPORARY, REMOVE BEFORE PRODUCTION HARDENING
 * ============================================================================
 *
 * This is the SINGLE source of truth for temporary development bypasses.
 * Nothing else in the codebase should read these env vars directly.
 *
 * ---------------------------------------------------------------------------
 * DEV_SKIP_OTP — temporarily disables the OTP step during development.
 * ---------------------------------------------------------------------------
 * WHY: OTP delivery goes through WhatsApp Web (`whatsapp-web.js`), which needs
 * a QR-code login on the server. Until that account is linked, every flow that
 * sends an OTP fails, which blocks development/testing of registration and
 * password recovery.
 *
 * WHAT IT CHANGES (only when enabled AND NODE_ENV !== 'production'):
 *   1. POST /auth/register        → creates the account immediately and returns
 *                                   a session, instead of returning an OTP
 *                                   challenge.
 *   2. POST /auth/forgot-password → returns `otpBypassed: true` so the client
 *                                   can skip the OTP screen.
 *   3. POST /auth/reset-password  → accepts the request without validating an
 *                                   OTP code.
 *
 * WHAT IT DOES NOT CHANGE:
 *   - The OTP generation/validation logic itself is fully intact and unmodified.
 *   - Production behaviour is unreachable: the flag is hard-gated on NODE_ENV.
 *
 * HOW TO RE-ENABLE OTP:
 *   Set `DEV_SKIP_OTP=false` (or delete the line) in `.env` and restart.
 *   No other code change is required anywhere in the backend or the client —
 *   the client reacts to the server's response shape, it does not carry its own
 *   copy of this flag.
 *
 * HOW TO REMOVE THIS BYPASS PERMANENTLY:
 *   Delete this file and the handful of `isOtpBypassed()` call sites it is
 *   imported into (auth.service.ts, otp.service.ts). Everything else stays.
 */

/** True when the temporary OTP bypass is active. Never true in production. */
export function isOtpBypassed(): boolean {
  return (
    process.env.DEV_SKIP_OTP === 'true' &&
    (process.env.NODE_ENV || 'development') !== 'production'
  );
}
