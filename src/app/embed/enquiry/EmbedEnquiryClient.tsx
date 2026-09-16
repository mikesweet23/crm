"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { EnquiryForm, type EnquiryFormConfig } from "@/components/enquiry/EnquiryForm";

function normaliseColor(value: string | null): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  if (v.startsWith("#") || v.startsWith("rgb") || v.startsWith("hsl")) return v;
  if (/^[0-9a-fA-F]{3,8}$/.test(v)) return `#${v}`;
  return v;
}

export function EmbedEnquiryClient() {
  const params = useSearchParams();
  const rootRef = useRef<HTMLDivElement>(null);

  const fieldsParam = params.get("fields");
  const fieldSet = fieldsParam
    ? new Set(fieldsParam.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean))
    : null;
  const has = (name: string) => (fieldSet ? fieldSet.has(name) : true);

  const bg = (params.get("bg") || "transparent").toLowerCase();

  const config: EnquiryFormConfig = {
    source: params.get("source") || "Website",
    heading: params.get("heading"),
    intro: params.get("intro"),
    accent: normaliseColor(params.get("accent")),
    submitLabel: params.get("submit") || undefined,
    bookingUrl: params.get("redirect"),
    compact: params.get("compact") === "1" || params.get("compact") === "true",
    showPhone: has("phone"),
    showPreferred: has("preferred"),
    showCategory: has("category"),
    showMessage: has("message"),
    showMarketing: has("marketing"),
    showSource: has("source"),
  };

  // Blend the embed into the host page. The app shell renders the form inside a
  // `min-h-full flex flex-col` <body>; as a lone flex item the form gets shrunk
  // (its submit button collapses). Switching the body to a plain block for the
  // embed restores natural flow. We also drop the UA margin and let the surface
  // be transparent so the form sits directly on the host page.
  useLayoutEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    const prev = {
      bodyBg: body.style.background,
      bodyMargin: body.style.margin,
      bodyMinHeight: body.style.minHeight,
      bodyDisplay: body.style.display,
      htmlBg: html.style.background,
      htmlHeight: html.style.height,
    };
    body.style.margin = "0";
    body.style.minHeight = "0";
    body.style.display = "block";
    html.style.height = "auto";
    const surface = bg === "white" ? "#ffffff" : "transparent";
    body.style.background = surface;
    html.style.background = surface;
    return () => {
      body.style.background = prev.bodyBg;
      body.style.margin = prev.bodyMargin;
      body.style.minHeight = prev.bodyMinHeight;
      body.style.display = prev.bodyDisplay;
      html.style.background = prev.htmlBg;
      html.style.height = prev.htmlHeight;
    };
  }, [bg]);

  // Report height to the parent window so the iframe can auto-resize. We measure
  // only the content wrapper — its height is independent of the iframe height, so
  // there is no resize feedback loop. The buffer keeps shadows / sub-pixel
  // rounding from clipping the submit button.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    let last = 0;
    const post = () => {
      // With the body switched to block flow (above) the wrapper's box is an
      // accurate measure of content height. The buffer absorbs shadows and
      // sub-pixel rounding so the submit button is never clipped.
      const height = Math.ceil(el.getBoundingClientRect().height) + 40;
      if (height > 24 && height !== last) {
        last = height;
        window.parent?.postMessage({ type: "am-embed-height", height }, "*");
      }
    };

    post();
    const ro = new ResizeObserver(post);
    ro.observe(el);
    window.addEventListener("load", post);
    window.addEventListener("resize", post);
    if (document.fonts?.ready) document.fonts.ready.then(post).catch(() => {});
    // Delayed + short polling catches late web-font / layout shifts and any
    // resize message that was missed during a load race.
    const timeouts = [80, 200, 400, 700, 1100, 1600, 2200].map((ms) => setTimeout(post, ms));
    const poll = setInterval(post, 400);
    const stopPoll = setTimeout(() => clearInterval(poll), 4000);

    return () => {
      ro.disconnect();
      window.removeEventListener("load", post);
      window.removeEventListener("resize", post);
      timeouts.forEach(clearTimeout);
      clearInterval(poll);
      clearTimeout(stopPoll);
    };
  }, []);

  return (
    <div ref={rootRef} className="px-2 pt-2 pb-6 sm:px-3 sm:pt-3">
      <div className="mx-auto w-full max-w-[640px]">
        <EnquiryForm {...config} />
      </div>
    </div>
  );
}
