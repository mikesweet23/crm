import type { EmailResult } from "@/lib/email/send";

export const ACK_LABEL = "Acknowledgement email";
export const NOTIFY_LABEL = "Paula notification email";

export type EmailActivityInput = {
  contact_id: string;
  activity_type: "email_sent" | "note";
  title: string;
  body: string;
};

/**
 * Map an email send outcome to a system activity so the CRM timeline records,
 * per email, whether it was sent, skipped, or failed.
 *
 * "Sent" reflects provider acceptance only — it never implies inbox delivery.
 */
export function emailActivity(
  contactId: string,
  label: string,
  result: EmailResult,
): EmailActivityInput {
  switch (result.status) {
    case "sent":
      return {
        contact_id: contactId,
        activity_type: "email_sent",
        title: `${label} sent to provider`,
        body: "Submitted to the email provider and accepted. Provider acceptance does not confirm delivery to the recipient's inbox.",
      };
    case "skipped":
      return {
        contact_id: contactId,
        activity_type: "note",
        title: `${label} not sent`,
        body: `Not sent — ${result.reason}.`,
      };
    case "failed":
      return {
        contact_id: contactId,
        activity_type: "note",
        title: `${label} failed`,
        body: `The email provider returned an error — ${result.reason}.`,
      };
  }
}
