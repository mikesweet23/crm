import { PageHeader } from "@/components/ui/Card";
import { FormsBuilder } from "@/components/forms/FormsBuilder";

export const metadata = { title: "Forms" };

export default function FormsPage() {
  return (
    <div>
      <PageHeader
        title="Forms"
        description="Build embeddable contact forms for the Absolute Mind website. Configure the fields, copy the code, and paste it into any WordPress page. Enquiries flow straight into the CRM."
      />
      <FormsBuilder />
    </div>
  );
}
