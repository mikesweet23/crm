import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sendEnquiryAcknowledgement, sendPaulaEnquiryEmail } from "@/lib/email/send";
import type { Contact, Enquiry } from "@/lib/types";

function makeContact(overrides: Partial<Contact> = {}): Contact {
  const now = new Date().toISOString();
  return {
    id: "c1",
    first_name: "Sam",
    last_name: "Jones",
    email: "sam@example.com",
    phone: "+447700900000",
    preferred_contact_method: "email",
    current_stage: "new_enquiry",
    lead_source: "Website",
    marketing_email: false,
    marketing_sms: false,
    do_not_contact: false,
    do_not_contact_date: null,
    do_not_contact_reason: null,
    important_note: null,
    first_enquiry_at: now,
    last_activity_at: now,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function makeEnquiry(): Enquiry {
  return {
    id: "e1",
    contact_id: "c1",
    created_at: new Date().toISOString(),
    help_category: "Sleep",
    message: "Hello",
    lead_source: "Website",
    campaign: null,
    landing_page: null,
    status: "open",
    outcome: null,
    assigned_to: null,
    closed_at: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
  };
}

// With no RESEND_API_KEY the provider is not configured, so nothing is sent and
// both helpers return a `skipped` result rather than throwing — this is what
// keeps the two sends independent and best-effort.
describe("email helpers without a configured provider", () => {
  const original = process.env.RESEND_API_KEY;
  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
  });
  afterEach(() => {
    if (original === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = original;
  });

  it("skips the acknowledgement when the provider is not configured", async () => {
    const result = await sendEnquiryAcknowledgement({ contact: makeContact() });
    expect(result).toEqual({ status: "skipped", reason: "email provider not configured" });
  });

  it("skips the acknowledgement for a Do Not Contact recipient", async () => {
    const result = await sendEnquiryAcknowledgement({
      contact: makeContact({ do_not_contact: true }),
    });
    expect(result.status).toBe("skipped");
    expect(result.status === "skipped" && result.reason).toMatch(/Do Not Contact/i);
  });

  it("skips the acknowledgement when there is no email on file", async () => {
    const result = await sendEnquiryAcknowledgement({ contact: makeContact({ email: null }) });
    expect(result.status).toBe("skipped");
    expect(result.status === "skipped" && result.reason).toMatch(/no email/i);
  });

  it("skips the Paula notification when the provider is not configured", async () => {
    const result = await sendPaulaEnquiryEmail({
      contact: makeContact(),
      enquiry: makeEnquiry(),
    });
    expect(result).toEqual({ status: "skipped", reason: "email provider not configured" });
  });
});
