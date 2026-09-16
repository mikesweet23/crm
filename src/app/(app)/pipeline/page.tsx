import Link from "next/link";
import { PageHeader } from "@/components/ui/Card";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { listPipelineContacts } from "@/lib/data/crm";
import { STAGE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata = { title: "Pipeline" };

export default async function PipelinePage(props: PageProps<"/pipeline">) {
  const searchParams = await props.searchParams;
  const stage = typeof searchParams.stage === "string" ? searchParams.stage : null;
  const filter = typeof searchParams.filter === "string" ? searchParams.filter : null;
  const dnc = searchParams.dnc === "1" || searchParams.dnc === "true";

  const contacts = await listPipelineContacts(
    dnc ? { dnc: true } : stage ? { stage } : undefined,
  );

  const filters = [
    { href: "/pipeline", label: "All", active: !stage && !filter && !dnc },
    {
      href: "/pipeline?filter=awaiting",
      label: "Awaiting contact",
      active: filter === "awaiting",
    },
    {
      href: "/pipeline?stage=new_enquiry",
      label: STAGE_LABELS.new_enquiry,
      active: stage === "new_enquiry",
    },
    { href: "/pipeline?dnc=1", label: "Do Not Contact", active: dnc },
  ];

  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Drag people between stages. Click a card to open their contact record."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition",
              f.active
                ? "bg-brand text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-brand",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <PipelineBoard
        contacts={contacts}
        filterStage={stage}
        filterAwaiting={filter === "awaiting"}
        showDnc={dnc}
      />
    </div>
  );
}
