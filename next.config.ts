import type { NextConfig } from "next";

/**
 * Sites allowed to iframe the embeddable form (`/embed/*`).
 *
 * Override with a comma- or space-separated `EMBED_FRAME_ANCESTORS` at build
 * time (Vercel → Environment Variables, then redeploy). `'self'` is always
 * included so the `/forms` preview keeps working on every deployment URL.
 */
const DEFAULT_EMBED_FRAME_ANCESTORS = [
  "https://absolutemind.co.uk",
  "https://www.absolutemind.co.uk",
  "https://paulasweet.co.uk",
  "https://www.paulasweet.co.uk",
  "https://crm.absolutemind.co.uk",
  "http://localhost:3000",
];

// A CSP source is a scheme, a host (optionally with wildcard/port/path), or
// a quoted keyword. Anything else would corrupt the header, so drop it.
const CSP_SOURCE = /^(?:'self'|'none'|\*|[a-z][a-z0-9+.-]*:(?:\/\/[\w.*-]+(?::\d+)?)?(?:\/[^\s;,]*)?|[\w.*-]+(?::\d+)?)$/i;

function embedFrameAncestors(): string {
  const raw = process.env.EMBED_FRAME_ANCESTORS?.trim();
  const configured = raw ? raw.split(/[\s,]+/).filter(Boolean) : DEFAULT_EMBED_FRAME_ANCESTORS;
  const sources = configured.filter((entry) => {
    if (CSP_SOURCE.test(entry)) return true;
    console.warn(`[next.config] Ignoring invalid EMBED_FRAME_ANCESTORS entry: ${entry}`);
    return false;
  });
  return ["'self'", ...sources.filter((s) => s !== "'self'")].join(" ");
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Only allow the embeddable form to be framed by Absolute Mind sites.
        source: "/embed/:path*",
        headers: [
          { key: "Content-Security-Policy", value: `frame-ancestors ${embedFrameAncestors()}` },
        ],
      },
      {
        source: "/embed.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=300, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
