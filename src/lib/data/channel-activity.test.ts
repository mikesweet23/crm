import { describe, expect, it } from "vitest";
import { demoAddActivity, demoGetContact } from "@/lib/data/demo-store";
import { CHANNEL_ACTIVITY_TITLES } from "@/lib/contact-actions";

// Recording a channel-opened action reuses the existing activity/timeline model.
// This exercises the demo data layer the API route writes through.
describe("channel activity recording", () => {
  it("records a channel-opened activity on the contact timeline with user and timestamp", () => {
    const contactId = "c1"; // seeded demo contact

    const activity = demoAddActivity({
      contact_id: contactId,
      activity_type: "whatsapp_opened",
      title: CHANNEL_ACTIVITY_TITLES.whatsapp_opened,
      created_by: "user-1",
      created_by_name: "Paula",
    });

    expect(activity.id).toBeTruthy();
    expect(Number.isNaN(Date.parse(activity.created_at))).toBe(false);

    const contact = demoGetContact(contactId);
    expect(contact).not.toBeNull();

    const latest = contact!.activities![0];
    expect(latest.id).toBe(activity.id);
    expect(latest.activity_type).toBe("whatsapp_opened");
    expect(latest.title).toBe("WhatsApp opened");
    expect(latest.created_by_name).toBe("Paula");
    expect(latest.title).not.toMatch(/sent|delivered|replied/i);
  });

  it("bumps the contact's last activity when a channel is opened", () => {
    const contactId = "c2";
    const before = demoGetContact(contactId)?.last_activity_at ?? null;

    demoAddActivity({
      contact_id: contactId,
      activity_type: "call_opened",
      title: CHANNEL_ACTIVITY_TITLES.call_opened,
      created_by: "user-1",
      created_by_name: "Paula",
    });

    const after = demoGetContact(contactId)?.last_activity_at ?? null;
    expect(after).not.toBeNull();
    if (before) expect(Date.parse(after!)).toBeGreaterThanOrEqual(Date.parse(before));
  });
});
