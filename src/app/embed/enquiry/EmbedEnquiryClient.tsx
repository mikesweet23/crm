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
    };
    body.style.margin = "0";
    body.style.minHeight = "0";
    body.style.display = "block";
    const surface = bg === "white" ? "#ffffff" : "transparent";
    body.style.background = surface;
    html.style.background = surface;
    return () => {
      body.style.background = prev.bodyBg;
      body.style.margin = prev.bodyMargin;
      body.style.minHeight = prev.bodyMinHeight;
      body.style.display = prev.bodyDisplay;
      html.style.background = prev.htmlBg;
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
      const rect = el.getBoundingClientRect();
      const lastChild = el.lastElementChild as HTMLElement | null;
      const innerBottom = lastChild
        ? lastChild.getBoundingClientRect().bottom - rect.top
        : 0;
      const height = Math.ceil(Math.max(rect.height, innerBottom)) + 12;
      if (height > 12 && height !== last) {
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
    // A few delayed posts catch late web-font / layout shifts.
    const timers = [setTimeout(post, 150), setTimeout(post, 500), setTimeout(post, 1200)];

    return () => {
      ro.disconnect();
      window.removeEventListener("load", post);
      window.removeEventListener("resize", post);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={rootRef} className="p-2 sm:p-3">
      <div className="mx-auto w-full max-w-[640px]">
        <EnquiryForm {...config} />
      </div>
    </div>
  );
}
