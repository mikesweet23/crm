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

  // Make the embed blend into the host page and remove default UA chrome.
  useLayoutEffect(() => {
    const prevBodyBg = document.body.style.background;
    const prevBodyMargin = document.body.style.margin;
    const prevHtmlBg = document.documentElement.style.background;
    document.body.style.margin = "0";
    if (bg === "white") {
      document.body.style.background = "#ffffff";
      document.documentElement.style.background = "#ffffff";
    } else {
      document.body.style.background = "transparent";
      document.documentElement.style.background = "transparent";
    }
    return () => {
      document.body.style.background = prevBodyBg;
      document.body.style.margin = prevBodyMargin;
      document.documentElement.style.background = prevHtmlBg;
    };
  }, [bg]);

  // Report height to the parent window so the iframe can auto-resize.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    let last = 0;
    const post = () => {
      const height = Math.ceil(el.getBoundingClientRect().height);
      if (height > 0 && height !== last) {
        last = height;
        window.parent?.postMessage({ type: "am-embed-height", height }, "*");
      }
    };

    post();
    const ro = new ResizeObserver(post);
    ro.observe(el);
    window.addEventListener("load", post);
    // A couple of delayed posts catch late web-font / layout shifts.
    const timers = [setTimeout(post, 250), setTimeout(post, 800)];

    return () => {
      ro.disconnect();
      window.removeEventListener("load", post);
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
