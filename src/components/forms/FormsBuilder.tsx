"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/Field";
import { LEAD_SOURCES } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONAL_FIELDS = [
  { key: "phone", label: "Telephone" },
  { key: "preferred", label: "Preferred contact method" },
  { key: "category", label: "Help category" },
  { key: "message", label: "Brief message" },
  { key: "marketing", label: "Marketing opt-in" },
  { key: "source", label: '"How did you hear?"' },
] as const;

type FieldKey = (typeof OPTIONAL_FIELDS)[number]["key"];

interface BuilderState {
  form: "enquiry";
  heading: string;
  intro: string;
  source: string;
  accent: string;
  submitLabel: string;
  bg: "transparent" | "white";
  compact: boolean;
  redirect: string;
  maxWidth: string;
  fields: Record<FieldKey, boolean>;
}

const DEFAULT_ACCENT = "#e5772a";

const ALL_ON: Record<FieldKey, boolean> = {
  phone: true,
  preferred: true,
  category: true,
  message: true,
  marketing: true,
  source: true,
};

const PRESETS: { name: string; description: string; state: Partial<BuilderState> }[] = [
  {
    name: "Full enquiry",
    description: "Every field — the complete website contact form.",
    state: {
      heading: "Get in touch",
      intro: "Send a brief enquiry and Paula will respond.",
      submitLabel: "Submit enquiry",
      compact: false,
      redirect: "",
      fields: { ...ALL_ON },
    },
  },
  {
    name: "Quick callback",
    description: "Short form for a phone call back.",
    state: {
      heading: "Request a callback",
      intro: "Leave your details and Paula will call you back.",
      submitLabel: "Request a callback",
      compact: true,
      redirect: "",
      fields: {
        phone: true,
        preferred: true,
        category: false,
        message: true,
        marketing: false,
        source: false,
      },
    },
  },
  {
    name: "Booking funnel",
    description: "Sends people to the booking diary after enquiring.",
    state: {
      heading: "Book a free consultation",
      intro: "Tell Paula a little about you, then choose a time.",
      submitLabel: "Enquire & book",
      compact: false,
      redirect: "https://booking.absolutemind.co.uk",
      fields: {
        phone: true,
        preferred: false,
        category: true,
        message: true,
        marketing: false,
        source: false,
      },
    },
  },
];

const INITIAL: BuilderState = {
  form: "enquiry",
  heading: "Get in touch",
  intro: "Send a brief enquiry and Paula will respond.",
  source: "Website",
  accent: DEFAULT_ACCENT,
  submitLabel: "Submit enquiry",
  bg: "transparent",
  compact: false,
  redirect: "",
  maxWidth: "640px",
  fields: { ...ALL_ON },
};

function buildParams(s: BuilderState): URLSearchParams {
  const p = new URLSearchParams();
  p.set("source", s.source);
  if (s.heading.trim()) p.set("heading", s.heading.trim());
  if (s.intro.trim()) p.set("intro", s.intro.trim());
  if (s.accent && s.accent.toLowerCase() !== DEFAULT_ACCENT) p.set("accent", s.accent);
  if (s.submitLabel.trim() && s.submitLabel.trim() !== "Submit enquiry")
    p.set("submit", s.submitLabel.trim());
  if (s.bg !== "transparent") p.set("bg", s.bg);
  if (s.compact) p.set("compact", "1");
  if (s.redirect.trim()) p.set("redirect", s.redirect.trim());

  const keys = OPTIONAL_FIELDS.map((f) => f.key);
  const enabled = keys.filter((k) => s.fields[k]);
  if (enabled.length !== keys.length) p.set("fields", enabled.join(","));
  return p;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      className="shrink-0"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "Copied ✓" : "Copy"}
    </Button>
  );
}

export function FormsBuilder() {
  const [state, setState] = useState<BuilderState>(INITIAL);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  // Read the origin without a hydration mismatch or setState-in-effect.
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );

  const params = useMemo(() => buildParams(state).toString(), [state]);
  const previewSrc = `/embed/${state.form}${params ? `?${params}` : ""}`;
  const publicSrc = `${origin}/embed/${state.form}${params ? `?${params}` : ""}`;

  const scriptSnippet = useMemo(() => {
    const attrs: string[] = [
      "data-absolute-mind-form",
      `data-form="${state.form}"`,
      `data-source="${state.source}"`,
    ];
    if (state.heading.trim()) attrs.push(`data-heading="${state.heading.trim()}"`);
    if (state.intro.trim()) attrs.push(`data-intro="${state.intro.trim()}"`);
    if (state.accent.toLowerCase() !== DEFAULT_ACCENT) attrs.push(`data-accent="${state.accent}"`);
    if (state.submitLabel.trim() && state.submitLabel.trim() !== "Submit enquiry")
      attrs.push(`data-submit="${state.submitLabel.trim()}"`);
    if (state.bg !== "transparent") attrs.push(`data-bg="${state.bg}"`);
    if (state.compact) attrs.push(`data-compact="1"`);
    if (state.redirect.trim()) attrs.push(`data-redirect="${state.redirect.trim()}"`);
    const keys = OPTIONAL_FIELDS.map((f) => f.key);
    const enabled = keys.filter((k) => state.fields[k]);
    if (enabled.length !== keys.length) attrs.push(`data-fields="${enabled.join(",")}"`);
    if (state.maxWidth.trim() && state.maxWidth.trim() !== "640px")
      attrs.push(`data-max-width="${state.maxWidth.trim()}"`);

    return `<div\n  ${attrs.join("\n  ")}></div>\n<script src="${origin}/embed.js" async></script>`;
  }, [state, origin]);

  const iframeSnippet = useMemo(
    () =>
      `<iframe\n  src="${publicSrc}"\n  title="Absolute Mind enquiry form"\n  width="100%"\n  height="720"\n  loading="lazy"\n  style="border:0;display:block;margin:0 auto;max-width:${state.maxWidth || "640px"}"></iframe>`,
    [publicSrc, state.maxWidth],
  );

  function update<K extends keyof BuilderState>(key: K, value: BuilderState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function toggleField(key: FieldKey) {
    setState((s) => ({ ...s, fields: { ...s.fields, [key]: !s.fields[key] } }));
  }

  function applyPreset(preset: (typeof PRESETS)[number]) {
    setState((s) => ({ ...s, ...preset.state, fields: { ...ALL_ON, ...preset.state.fields } }));
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      {/* Controls */}
      <div className="space-y-4">
        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-grey">
            Start from a template
          </h2>
          <div className="mt-3 space-y-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-brand hover:bg-brand-soft/40"
              >
                <p className="text-sm font-medium text-ink">{preset.name}</p>
                <p className="text-xs text-muted">{preset.description}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-grey">Content</h2>
          <Field label="Heading" hint="Leave blank to hide (host page already has a title).">
            <Input value={state.heading} onChange={(e) => update("heading", e.target.value)} />
          </Field>
          <Field label="Intro text">
            <Textarea
              className="min-h-16"
              value={state.intro}
              onChange={(e) => update("intro", e.target.value)}
            />
          </Field>
          <Field label="Submit button label">
            <Input
              value={state.submitLabel}
              onChange={(e) => update("submitLabel", e.target.value)}
            />
          </Field>
          <Field label="Lead source" hint="Tags every enquiry from this form.">
            <Select value={state.source} onChange={(e) => update("source", e.target.value)}>
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="After submit — booking URL"
            hint="Optional. Shows a 'Book your consultation' button that opens this link."
          >
            <Input
              placeholder="https://booking.absolutemind.co.uk"
              value={state.redirect}
              onChange={(e) => update("redirect", e.target.value)}
            />
          </Field>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-grey">Fields</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {OPTIONAL_FIELDS.map((f) => (
              <label
                key={f.key}
                className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2 text-sm text-ink"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={state.fields[f.key]}
                  onChange={() => toggleField(f.key)}
                />
                {f.label}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted">
            First name, last name, email and the privacy consent are always included.
          </p>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-grey">
            Appearance
          </h2>
          <div>
            <Label>Accent colour</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={state.accent}
                onChange={(e) => update("accent", e.target.value)}
                className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                aria-label="Accent colour"
              />
              <Input
                value={state.accent}
                onChange={(e) => update("accent", e.target.value)}
                className="font-mono"
              />
            </div>
          </div>
          <Field label="Background">
            <Select
              value={state.bg}
              onChange={(e) => update("bg", e.target.value as BuilderState["bg"])}
            >
              <option value="transparent">Transparent (blend into page)</option>
              <option value="white">White</option>
            </Select>
          </Field>
          <Field label="Max width" hint="e.g. 640px or 100%">
            <Input value={state.maxWidth} onChange={(e) => update("maxWidth", e.target.value)} />
          </Field>
          <label className="flex items-center gap-2.5 text-sm text-ink">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
              checked={state.compact}
              onChange={(e) => update("compact", e.target.checked)}
            />
            Compact spacing
          </label>
        </Card>
      </div>

      {/* Preview + code */}
      <div className="space-y-4">
        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-grey">
              Live preview
            </h2>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm">
              {(["desktop", "mobile"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  className={cn(
                    "rounded-md px-3 py-1 font-medium capitalize transition",
                    device === d ? "bg-brand-soft text-brand-strong" : "text-slate-500",
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-dashed border-slate-300 bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%,transparent_75%,#f1f5f9_75%),linear-gradient(45deg,#f1f5f9_25%,#fff_25%,#fff_75%,#f1f5f9_75%)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] p-3 sm:p-5">
            <div
              className={cn("mx-auto transition-all", device === "mobile" ? "max-w-[390px]" : "w-full")}
            >
              <iframe
                key={previewSrc}
                src={previewSrc}
                title="Form preview"
                className="w-full rounded-lg bg-white/70 shadow-sm"
                style={{ height: 720, border: 0 }}
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">
            On your site the frame auto-resizes to its content. This preview uses a fixed height.
          </p>
        </Card>

        <Card className="space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">Embed code — recommended</h2>
              <p className="text-xs text-muted">
                Paste into a WordPress “Custom HTML” block. Auto-resizes on mobile and desktop.
              </p>
            </div>
            <CopyButton text={scriptSnippet} />
          </div>
          <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
            <code>{scriptSnippet}</code>
          </pre>
        </Card>

        <Card className="space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">Plain iframe — fixed height</h2>
              <p className="text-xs text-muted">
                Simplest option if you can’t add the script. Adjust the height manually.
              </p>
            </div>
            <CopyButton text={iframeSnippet} />
          </div>
          <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
            <code>{iframeSnippet}</code>
          </pre>
        </Card>
      </div>
    </div>
  );
}
