import { describe, expect, it } from "vitest";
import {
  CHANNEL_ACTIVITY_TITLES,
  gmailComposeHref,
  mailtoHref,
  smsHref,
  telHref,
  toE164,
  whatsappHref,
  whatsappNumber,
} from "@/lib/contact-actions";

describe("phone normalisation", () => {
  it("converts a UK national mobile to E.164", () => {
    expect(toE164("07700 900000")).toBe("+447700900000");
  });
  it("keeps an already international number", () => {
    expect(toE164("+447700900000")).toBe("+447700900000");
  });
  it("adds the leading + to a bare international number", () => {
    expect(toE164("447700900000")).toBe("+447700900000");
  });
  it("assumes UK for a national landline", () => {
    expect(toE164("01604 123456")).toBe("+441604123456");
  });
  it("returns null for empty input", () => {
    expect(toE164("")).toBeNull();
    expect(toE164(null)).toBeNull();
    expect(toE164(undefined)).toBeNull();
  });
});

describe("action URLs", () => {
  it("builds a tel: link", () => {
    expect(telHref("07700900000")).toBe("tel:+447700900000");
  });
  it("builds an sms: link", () => {
    expect(smsHref("07700900000")).toBe("sms:+447700900000");
  });
  it("builds a wa.me number without the plus sign", () => {
    expect(whatsappNumber("07700900000")).toBe("447700900000");
    expect(whatsappNumber("+447700900000")).toBe("447700900000");
  });
  it("builds a wa.me link with a normalised international number", () => {
    expect(whatsappHref("07700900000")).toBe("https://wa.me/447700900000");
    expect(whatsappHref("+44 7700 900000")).toBe("https://wa.me/447700900000");
  });
  it("returns null phone links when there is no number", () => {
    expect(telHref(null)).toBeNull();
    expect(smsHref("")).toBeNull();
    expect(whatsappHref(undefined)).toBeNull();
  });
  it("builds a Gmail compose link addressed to the contact", () => {
    expect(gmailComposeHref("sam@example.com")).toBe(
      "https://mail.google.com/mail/?view=cm&fs=1&to=sam%40example.com",
    );
  });
  it("builds a mailto fallback", () => {
    expect(mailtoHref("sam@example.com")).toBe("mailto:sam@example.com");
  });
  it("returns null email links when there is no address", () => {
    expect(gmailComposeHref(null)).toBeNull();
    expect(mailtoHref("")).toBeNull();
  });
});

describe("channel activity labels", () => {
  it("uses opened/initiated wording and never implies delivery", () => {
    expect(CHANNEL_ACTIVITY_TITLES).toEqual({
      call_opened: "Call opened",
      sms_opened: "Text message opened",
      whatsapp_opened: "WhatsApp opened",
      email_opened: "Email compose opened",
    });
    for (const title of Object.values(CHANNEL_ACTIVITY_TITLES)) {
      expect(title).toMatch(/opened/i);
      expect(title).not.toMatch(/sent|delivered|replied/i);
    }
  });
});
