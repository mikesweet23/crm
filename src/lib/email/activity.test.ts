import { describe, expect, it } from "vitest";
import { ACK_LABEL, NOTIFY_LABEL, emailActivity } from "@/lib/email/activity";

describe("emailActivity", () => {
  it("maps a sent result to an email_sent activity that does not imply delivery", () => {
    const activity = emailActivity("c1", ACK_LABEL, { status: "sent", id: "re_123" });
    expect(activity).toMatchObject({
      contact_id: "c1",
      activity_type: "email_sent",
      title: "Acknowledgement email sent to provider",
    });
    expect(activity.body).toMatch(/does not confirm delivery/i);
  });

  it("maps a skipped result to a note carrying the reason", () => {
    const activity = emailActivity("c1", NOTIFY_LABEL, {
      status: "skipped",
      reason: "email provider not configured",
    });
    expect(activity.activity_type).toBe("note");
    expect(activity.title).toBe("Paula notification email not sent");
    expect(activity.body).toContain("email provider not configured");
  });

  it("maps a failed result to a note carrying the error reason", () => {
    const activity = emailActivity("c1", ACK_LABEL, {
      status: "failed",
      reason: "domain not verified",
    });
    expect(activity.activity_type).toBe("note");
    expect(activity.title).toBe("Acknowledgement email failed");
    expect(activity.body).toContain("domain not verified");
  });

  it("keeps the acknowledgement and notification labels distinct", () => {
    const ack = emailActivity("c1", ACK_LABEL, { status: "sent", id: null });
    const notify = emailActivity("c1", NOTIFY_LABEL, { status: "sent", id: null });
    expect(ack.title).not.toBe(notify.title);
  });
});
