import type { NextConfig } from "next";

// Which sites may embed the form in an iframe. Defaults to any site so the
// WordPress embed keeps working out of the box; set EMBED_FRAME_ANCESTORS to
// lock it down, e.g. "'self' https://*.absolutemind.co.uk https://absolutemind.co.uk".
const frameAncestors = process.env.EMBED_FRAME_ANCESTORS?.trim() || "*";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Allow the embeddable form to be iframed on external sites
        // (e.g. Paula's WordPress pages).
        source: "/embed/:path*",
        headers: [{ key: "Content-Security-Policy", value: `frame-ancestors ${frameAncestors}` }],
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
