"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Card, PageHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { STAGE_LABELS, type Contact } from "@/lib/types";
import { displayPhone, fullName } from "@/lib/phone";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Contact[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (q.trim().length < 2) return;
    const handle = setTimeout(() => {
      startTransition(async () => {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.contacts ?? []);
        }
      });
    }, 180);
    return () => clearTimeout(handle);
  }, [q]);

  return (
    <div>
      <PageHeader
        title="Search"
        description="Find anyone by name, email or telephone number."
      />
      <Card className="p-4 sm:p-5">
        <Input
          autoFocus
          placeholder="Start typing a name, email or phone…"
          value={q}
          onChange={(e) => {
            const value = e.target.value;
            setQ(value);
            if (value.trim().length < 2) setResults([]);
          }}
          aria-label="Search contacts"
        />
        <p className="mt-2 text-xs text-muted">
          {pending ? "Searching…" : q.trim().length < 2 ? "Type at least 2 characters" : `${results.length} result(s)`}
        </p>
      </Card>

      <div className="mt-4 space-y-2">
        {results.map((c) => (
          <Link
            key={c.id}
            href={`/contacts/${c.id}`}
            className="block animate-fade-up rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 transition hover:border-brand hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{fullName(c.first_name, c.last_name)}</p>
                <p className="text-sm text-muted">
                  {displayPhone(c.phone) || c.email || "No details"} · {STAGE_LABELS[c.current_stage]}
                </p>
              </div>
              {c.do_not_contact ? (
                <span className="text-xs font-bold uppercase text-danger">DNC</span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
