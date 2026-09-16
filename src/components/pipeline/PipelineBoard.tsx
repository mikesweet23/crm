"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useMemo, useState, useTransition } from "react";
import type { Contact, PipelineStage, Appointment } from "@/lib/types";
import { PIPELINE_STAGES, STAGE_LABELS } from "@/lib/types";
import { displayPhone, fullName } from "@/lib/phone";
import { formatAppointmentSlot, formatDate, cn } from "@/lib/utils";

type CardContact = Contact & { next_appointment?: Appointment | null };

function PipelineCard({
  contact,
  dragging,
}: {
  contact: CardContact;
  dragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: contact.id,
    data: { stage: contact.current_stage },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition active:cursor-grabbing",
        (isDragging || dragging) && "opacity-40",
        contact.do_not_contact && "border-red-200 bg-red-50/50",
      )}
    >
      <Link
        href={`/contacts/${contact.id}`}
        onClick={(e) => e.stopPropagation()}
        className="block"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-ink">{fullName(contact.first_name, contact.last_name)}</p>
          <div className="flex flex-wrap justify-end gap-1">
            {contact.do_not_contact ? (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-danger">
                DNC
              </span>
            ) : null}
            {contact.marketing_email ? (
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                Mkt
              </span>
            ) : null}
            {contact.next_appointment ? (
              <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                Appt
              </span>
            ) : null}
            {contact.important_note ? (
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                Note
              </span>
            ) : null}
          </div>
        </div>
        <p className="mt-1 text-sm text-muted">
          {displayPhone(contact.phone) || contact.email || "No contact details"}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {contact.lead_source || "Unknown"} · Enquired {formatDate(contact.first_enquiry_at)}
        </p>
        {contact.next_appointment ? (
          <p className="mt-2 text-xs font-medium text-brand-strong">
            Consultation: {formatAppointmentSlot(contact.next_appointment.start_time)}
          </p>
        ) : null}
      </Link>
    </div>
  );
}

function Column({
  stage,
  contacts,
}: {
  stage: PipelineStage;
  contacts: CardContact[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[280px] shrink-0 flex-col rounded-2xl border border-slate-200/80 bg-white/60 p-3 backdrop-blur",
        isOver && "border-brand bg-brand-soft/30",
      )}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-ink">{STAGE_LABELS[stage]}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {contacts.length}
        </span>
      </div>
      <div className="flex min-h-[120px] flex-1 flex-col gap-2.5">
        {contacts.map((c) => (
          <PipelineCard key={c.id} contact={c} />
        ))}
      </div>
    </div>
  );
}

export function PipelineBoard({
  contacts: initial,
  filterStage,
  filterAwaiting,
  showDnc,
}: {
  contacts: CardContact[];
  filterStage?: string | null;
  filterAwaiting?: boolean;
  showDnc?: boolean;
}) {
  const router = useRouter();
  const [contacts, setContacts] = useState(initial);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [mobileStage, setMobileStage] = useState<PipelineStage>(
    (filterStage as PipelineStage) || "new_enquiry",
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const visible = useMemo(() => {
    let list = contacts.filter((c) => (showDnc ? c.do_not_contact : !c.do_not_contact));
    if (filterAwaiting) {
      list = list.filter(
        (c) => c.current_stage === "new_enquiry" || c.current_stage === "attempted_contact",
      );
    }
    if (filterStage) {
      list = list.filter((c) => c.current_stage === filterStage);
    }
    return list;
  }, [contacts, filterStage, filterAwaiting, showDnc]);

  const byStage = useMemo(() => {
    const map = Object.fromEntries(PIPELINE_STAGES.map((s) => [s, [] as CardContact[]])) as Record<
      PipelineStage,
      CardContact[]
    >;
    for (const c of visible) {
      map[c.current_stage]?.push(c);
    }
    return map;
  }, [visible]);

  const activeContact = contacts.find((c) => c.id === activeId) ?? null;

  async function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const contactId = String(active.id);
    const newStage = String(over.id) as PipelineStage;
    if (!PIPELINE_STAGES.includes(newStage)) return;
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact || contact.current_stage === newStage) return;

    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, current_stage: newStage } : c)),
    );

    startTransition(async () => {
      const res = await fetch(`/api/contacts/${contactId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (!res.ok) {
        setContacts(initial);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      {/* Mobile stage selector */}
      <div className="mb-4 lg:hidden">
        <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="mobile-stage">
          Stage
        </label>
        <select
          id="mobile-stage"
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm"
          value={mobileStage}
          onChange={(e) => setMobileStage(e.target.value as PipelineStage)}
        >
          {PIPELINE_STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]} ({byStage[s].length})
            </option>
          ))}
        </select>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e) => setActiveId(String(e.active.id))}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        {/* Desktop / tablet board */}
        <div className="pipeline-scroll hidden gap-3 overflow-x-auto pb-4 lg:flex">
          {PIPELINE_STAGES.map((stage) => (
            <Column key={stage} stage={stage} contacts={byStage[stage]} />
          ))}
        </div>

        {/* Mobile single column */}
        <div className="lg:hidden">
          <Column stage={mobileStage} contacts={byStage[mobileStage]} />
        </div>

        <DragOverlay>
          {activeContact ? <PipelineCard contact={activeContact} dragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
