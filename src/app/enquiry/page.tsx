import Image from "next/image";
import Link from "next/link";
import { EnquiryForm } from "@/components/enquiry/EnquiryForm";

export const metadata = {
  title: "Get in touch",
  description: "Send a brief enquiry to Absolute Mind and Paula will respond.",
};

export default function EnquiryPage() {
  return (
    <div className="min-h-full">
      <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-3">
          <Link href="https://absolutemind.co.uk">
            <Image
              src="/absolute-mind-logo.png"
              alt="Absolute Mind"
              width={150}
              height={84}
              className="h-11 w-auto"
              priority
            />
          </Link>
          <a href="tel:+447713385007" className="text-sm font-medium text-slate-500 hover:text-brand">
            07713 385007
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-14">
        <section className="animate-fade-up text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Get in touch
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted">
            Send a brief enquiry and Paula will respond. Please avoid detailed medical or highly
            sensitive information in this form.
          </p>
        </section>

        <div className="mt-10">
          <EnquiryForm source="Website" />
        </div>
      </main>
    </div>
  );
}
