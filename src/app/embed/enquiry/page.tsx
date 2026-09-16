import { Suspense } from "react";
import { EmbedEnquiryClient } from "./EmbedEnquiryClient";

export const metadata = {
  title: "Enquiry form",
  robots: { index: false, follow: false },
};

export default function EmbedEnquiryPage() {
  return (
    <Suspense fallback={null}>
      <EmbedEnquiryClient />
    </Suspense>
  );
}
