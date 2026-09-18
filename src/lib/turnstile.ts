const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileVerification =
  | { ok: true; skipped: boolean }
  | { ok: false; reason: "missing" | "invalid" | "unavailable" };

/** True when the server is configured to enforce Turnstile. */
export function isTurnstileEnforced(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}

/**
 * Verify a Turnstile token with Cloudflare Siteverify.
 *
 * When `TURNSTILE_SECRET_KEY` is unset (demo mode / local development) the
 * check is skipped so the public form keeps working without Cloudflare.
 * When it is set a valid, unused token is required.
 */
export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteIp?: string | null,
): Promise<TurnstileVerification> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return { ok: true, skipped: true };

  const response = token?.trim();
  if (!response) return { ok: false, reason: "missing" };

  const body = new URLSearchParams({ secret, response });
  if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`Turnstile siteverify responded ${res.status}`);
      return { ok: false, reason: "unavailable" };
    }
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (data.success) return { ok: true, skipped: false };

    const codes = data["error-codes"] ?? [];
    // These indicate Cloudflare could not evaluate the request rather than a
    // failed challenge — surface them as a server-side problem.
    if (codes.some((c) => c === "internal-error" || c === "invalid-input-secret" || c === "missing-input-secret")) {
      console.error("Turnstile siteverify configuration error:", codes.join(", "));
      return { ok: false, reason: "unavailable" };
    }
    return { ok: false, reason: "invalid" };
  } catch (err) {
    console.error("Turnstile siteverify request failed:", err);
    return { ok: false, reason: "unavailable" };
  }
}
