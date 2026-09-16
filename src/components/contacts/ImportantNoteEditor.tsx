"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Textarea } from "@/components/ui/Field";

export function ImportantNoteEditor({
  contactId,
  initial,
}: {
  contactId: string;
  initial: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ important_note: value }),
      });
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-ink" htmlFor="important-note">
          Important note
        </label>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="text-xs font-medium text-brand hover:text-brand-strong"
        >
          {pending ? "Saving…" : saved ? "Saved" : "Save"}
        </button>
      </div>
      <Textarea
        id="important-note"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. Can only take calls after 4pm."
        className="min-h-20"
      />
    </div>
  );
}
