"use client";

import Script from "next/script";
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

/**
 * Cloudflare Turnstile widget (explicit rendering).
 *
 * The public site key is inlined at build time. When it is unset the form
 * simply does not render a widget and the API skips verification, so demo
 * mode and local development keep working without a Cloudflare account.
 */
export const TURNSTILE_SITE_KEY = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();
export const TURNSTILE_ENABLED = TURNSTILE_SITE_KEY.length > 0;

const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileRenderOptions {
  sitekey: string;
  action?: string;
  theme?: "auto" | "light" | "dark";
  size?: "normal" | "flexible" | "compact";
  appearance?: "always" | "execute" | "interaction-only";
  "response-field"?: boolean;
  "refresh-expired"?: "auto" | "manual" | "never";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
  "error-callback"?: (code: string) => boolean | void;
}

interface TurnstileApi {
  render: (container: HTMLElement | string, options: TurnstileRenderOptions) => string | undefined;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
  getResponse: (widgetId?: string) => string | undefined;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export interface TurnstileHandle {
  /** Discard the current token and run a fresh challenge. */
  reset: () => void;
}

export interface TurnstileProps {
  siteKey: string;
  /** Called with the token when a challenge passes, or `null` when it expires/fails. */
  onToken: (token: string | null) => void;
  action?: string;
  className?: string;
  ref?: Ref<TurnstileHandle>;
}

export function Turnstile({ siteKey, onToken, action, className, ref }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  // `onReady` fires on first load and again on every re-mount (e.g. after
  // "Send another enquiry"); the initialiser covers the case where the API is
  // already on the page before this component mounts.
  const [ready, setReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.turnstile),
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    const api = window.turnstile;
    const el = containerRef.current;
    if (!ready || !api || !el) return;

    const id = api.render(el, {
      sitekey: siteKey,
      action,
      theme: "light",
      size: "flexible",
      appearance: "always",
      "refresh-expired": "auto",
      callback: (token) => {
        setFailed(false);
        onTokenRef.current(token);
      },
      "expired-callback": () => onTokenRef.current(null),
      "timeout-callback": () => onTokenRef.current(null),
      "error-callback": () => {
        setFailed(true);
        onTokenRef.current(null);
      },
    });
    widgetIdRef.current = id ?? null;

    return () => {
      if (id) {
        try {
          api.remove(id);
        } catch {
          // Widget may already be gone if the script was torn down.
        }
      }
      widgetIdRef.current = null;
      onTokenRef.current(null);
    };
  }, [ready, siteKey, action]);

  useImperativeHandle(
    ref,
    () => ({
      reset: () => {
        const api = window.turnstile;
        if (api && widgetIdRef.current) {
          onTokenRef.current(null);
          api.reset(widgetIdRef.current);
        }
      },
    }),
    [],
  );

  return (
    <div className={className}>
      <Script src={TURNSTILE_SCRIPT} strategy="afterInteractive" onReady={() => setReady(true)} />
      <div ref={containerRef} className="min-h-[65px]" />
      {failed ? (
        <p className="mt-1.5 text-xs text-danger">
          The spam check could not load. Please refresh the page or disable content blockers and
          try again.
        </p>
      ) : null}
    </div>
  );
}
