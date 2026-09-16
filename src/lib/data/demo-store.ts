import { randomUUID } from "crypto";
import type {
  Activity,
  Appointment,
  Contact,
  DashboardStats,
  Enquiry,
  PipelineStage,
  Profile,
} from "@/lib/types";
import { STAGE_LABELS } from "@/lib/types";
import { addDays, endOfDay, startOfDay } from "@/lib/utils";
import { fullName, normaliseEmail, normalisePhone } from "@/lib/phone";

function daysFromNow(days: number, hour = 10, minute = 0): string {
  const d = addDays(new Date(), days);
  d.setHours(Math.floor(hour), minute, 0, 0);
  return d.toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

const PAULA: Profile = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "paula@absolutemind.co.uk",
  full_name: "Paula",
  role: "owner",
  created_at: hoursAgo(24 * 30),
};

const MIKE: Profile = {
  id: "00000000-0000-4000-8000-000000000002",
  email: "mike@absolutemind.co.uk",
  full_name: "Mike",
  role: "administrator",
  created_at: hoursAgo(24 * 30),
};

function seedContacts(): Contact[] {
  return [
    {
      id: "c1",
      first_name: "Sarah",
      last_name: "Smith",
      email: "sarah.smith@example.com",
      phone: "+447555123456",
      preferred_contact_method: "phone",
      current_stage: "new_enquiry",
      lead_source: "Google",
      marketing_email: true,
      marketing_sms: false,
      do_not_contact: false,
      do_not_contact_date: null,
      do_not_contact_reason: null,
      important_note: "Can only take calls after 4pm.",
      first_enquiry_at: hoursAgo(2),
      last_activity_at: hoursAgo(2),
      created_at: hoursAgo(2),
      updated_at: hoursAgo(2),
    },
    {
      id: "c2",
      first_name: "James",
      last_name: "Wilson",
      email: "james.wilson@example.com",
      phone: "+447700900123",
      preferred_contact_method: "email",
      current_stage: "attempted_contact",
      lead_source: "Website",
      marketing_email: false,
      marketing_sms: false,
      do_not_contact: false,
      do_not_contact_date: null,
      do_not_contact_reason: null,
      important_note: null,
      first_enquiry_at: hoursAgo(28),
      last_activity_at: hoursAgo(20),
      created_at: hoursAgo(28),
      updated_at: hoursAgo(20),
    },
    {
      id: "c3",
      first_name: "Emily",
      last_name: "Brown",
      email: "emily.brown@example.com",
      phone: "+447912345678",
      preferred_contact_method: "whatsapp",
      current_stage: "consultation_booked",
      lead_source: "Referral",
      marketing_email: true,
      marketing_sms: false,
      do_not_contact: false,
      do_not_contact_date: null,
      do_not_contact_reason: null,
      important_note: null,
      first_enquiry_at: hoursAgo(72),
      last_activity_at: hoursAgo(6),
      created_at: hoursAgo(72),
      updated_at: hoursAgo(6),
    },
    {
      id: "c4",
      first_name: "David",
      last_name: "Taylor",
      email: "david.taylor@example.com",
      phone: "+447800111222",
      preferred_contact_method: "phone",
      current_stage: "client",
      lead_source: "Google Ads",
      marketing_email: false,
      marketing_sms: false,
      do_not_contact: false,
      do_not_contact_date: null,
      do_not_contact_reason: null,
      important_note: null,
      first_enquiry_at: hoursAgo(24 * 40),
      last_activity_at: hoursAgo(24 * 3),
      created_at: hoursAgo(24 * 40),
      updated_at: hoursAgo(24 * 3),
    },
    {
      id: "c5",
      first_name: "Sophie",
      last_name: "Clarke",
      email: "sophie.clarke@example.com",
      phone: null,
      preferred_contact_method: "email",
      current_stage: "contacted",
      lead_source: "Instagram",
      marketing_email: true,
      marketing_sms: false,
      do_not_contact: false,
      do_not_contact_date: null,
      do_not_contact_reason: null,
      important_note: null,
      first_enquiry_at: hoursAgo(48),
      last_activity_at: hoursAgo(12),
      created_at: hoursAgo(48),
      updated_at: hoursAgo(12),
    },
    {
      id: "c6",
      first_name: "Mark",
      last_name: "Evans",
      email: "mark.evans@example.com",
      phone: "+447771234567",
      preferred_contact_method: "phone",
      current_stage: "not_proceeding",
      lead_source: "Facebook",
      marketing_email: false,
      marketing_sms: false,
      do_not_contact: true,
      do_not_contact_date: hoursAgo(24 * 14),
      do_not_contact_reason: "Asked not to receive further contact.",
      important_note: null,
      first_enquiry_at: hoursAgo(24 * 60),
      last_activity_at: hoursAgo(24 * 14),
      created_at: hoursAgo(24 * 60),
      updated_at: hoursAgo(24 * 14),
    },
    {
      id: "c7",
      first_name: "Olivia",
      last_name: "Hughes",
      email: "olivia.hughes@example.com",
      phone: "+447988776655",
      preferred_contact_method: "phone",
      current_stage: "consultation_completed",
      lead_source: "Google",
      marketing_email: false,
      marketing_sms: false,
      do_not_contact: false,
      do_not_contact_date: null,
      do_not_contact_reason: null,
      important_note: null,
      first_enquiry_at: hoursAgo(24 * 10),
      last_activity_at: hoursAgo(24),
      created_at: hoursAgo(24 * 10),
      updated_at: hoursAgo(24),
    },
  ];
}

function seedEnquiries(): Enquiry[] {
  return [
    {
      id: "e1",
      contact_id: "c1",
      created_at: hoursAgo(2),
      help_category: "Anxiety and stress",
      message: "I'd like help with work-related anxiety. Prefer evenings.",
      lead_source: "Google",
      campaign: null,
      landing_page: "https://absolutemind.co.uk/contact",
      status: "open",
      outcome: null,
      assigned_to: null,
      closed_at: null,
      utm_source: "google",
      utm_medium: "organic",
      utm_campaign: null,
      utm_content: null,
      utm_term: "hypnotherapy milton keynes",
    },
    {
      id: "e2",
      contact_id: "c2",
      created_at: hoursAgo(28),
      help_category: "Sleep",
      message: "Struggling to switch off at night.",
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
    },
    {
      id: "e3",
      contact_id: "c3",
      created_at: hoursAgo(72),
      help_category: "Confidence",
      message: "Referred by a friend. Looking for a consultation.",
      lead_source: "Referral",
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
    },
  ];
}

function seedAppointments(): Appointment[] {
  return [
    {
      id: "a1",
      contact_id: "c3",
      enquiry_id: "e3",
      appointment_type: "Free consultation",
      start_time: daysFromNow(0, 11, 0),
      end_time: daysFromNow(0, 11, 30),
      status: "booked",
      google_calendar_event_id: "gcal_demo_emily_today",
      meeting_method: "telephone",
      administrative_note: null,
      created_by: PAULA.id,
      created_at: hoursAgo(6),
      updated_at: hoursAgo(6),
    },
    {
      id: "a2",
      contact_id: "c4",
      enquiry_id: null,
      appointment_type: "Therapy session",
      start_time: daysFromNow(0, 15),
      end_time: daysFromNow(0, 16),
      status: "booked",
      google_calendar_event_id: "gcal_demo_david_today",
      meeting_method: "in_person",
      administrative_note: null,
      created_by: PAULA.id,
      created_at: hoursAgo(24 * 3),
      updated_at: hoursAgo(24 * 3),
    },
    {
      id: "a3",
      contact_id: "c7",
      enquiry_id: null,
      appointment_type: "Free consultation",
      start_time: daysFromNow(1, 10),
      end_time: daysFromNow(1, 10.5),
      status: "booked",
      google_calendar_event_id: "gcal_demo_olivia_tomorrow",
      meeting_method: "online",
      administrative_note: null,
      created_by: PAULA.id,
      created_at: hoursAgo(24),
      updated_at: hoursAgo(24),
    },
  ];
}

function seedActivities(): Activity[] {
  return [
    {
      id: "act1",
      contact_id: "c1",
      enquiry_id: "e1",
      activity_type: "website_enquiry",
      title: "Website enquiry",
      body: "Anxiety and stress — I'd like help with work-related anxiety. Prefer evenings.",
      created_by: null,
      created_by_name: "System",
      created_at: hoursAgo(2),
      automatic: true,
    },
    {
      id: "act2",
      contact_id: "c1",
      enquiry_id: "e1",
      activity_type: "email_sent",
      title: "Acknowledgement email sent",
      body: "Automatic enquiry acknowledgement sent to Sarah.",
      created_by: null,
      created_by_name: "System",
      created_at: hoursAgo(1.95),
      automatic: true,
    },
    {
      id: "act3",
      contact_id: "c2",
      enquiry_id: "e2",
      activity_type: "website_enquiry",
      title: "Website enquiry",
      body: "Sleep — Struggling to switch off at night.",
      created_by: null,
      created_by_name: "System",
      created_at: hoursAgo(28),
      automatic: true,
    },
    {
      id: "act4",
      contact_id: "c2",
      enquiry_id: null,
      activity_type: "call",
      title: "Call logged by Paula",
      body: "No answer — left a voicemail.",
      created_by: PAULA.id,
      created_by_name: "Paula",
      created_at: hoursAgo(20),
      automatic: false,
    },
    {
      id: "act5",
      contact_id: "c2",
      enquiry_id: null,
      activity_type: "stage_changed",
      title: "Stage changed",
      body: "New Enquiry → Attempted Contact\nChanged by Paula",
      created_by: PAULA.id,
      created_by_name: "Paula",
      created_at: hoursAgo(20),
      automatic: false,
    },
    {
      id: "act6",
      contact_id: "c3",
      enquiry_id: "e3",
      activity_type: "appointment_booked",
      title: "Appointment booked",
      body: "Free consultation — telephone.",
      created_by: PAULA.id,
      created_by_name: "Paula",
      created_at: hoursAgo(6),
      automatic: false,
    },
    {
      id: "act7",
      contact_id: "c6",
      enquiry_id: null,
      activity_type: "do_not_contact_added",
      title: "Do Not Contact",
      body: "Asked not to receive further contact.",
      created_by: PAULA.id,
      created_by_name: "Paula",
      created_at: hoursAgo(24 * 14),
      automatic: false,
    },
  ];
}

type DemoDb = {
  profiles: Profile[];
  contacts: Contact[];
  enquiries: Enquiry[];
  activities: Activity[];
  appointments: Appointment[];
  sessionUserId: string | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __amCrmDemoDb: DemoDb | undefined;
}

function db(): DemoDb {
  if (!globalThis.__amCrmDemoDb) {
    globalThis.__amCrmDemoDb = {
      profiles: [PAULA, MIKE],
      contacts: seedContacts(),
      enquiries: seedEnquiries(),
      activities: seedActivities(),
      appointments: seedAppointments(),
      sessionUserId: null,
    };
  }
  return globalThis.__amCrmDemoDb;
}

export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === "true") return true;
  if (process.env.DEMO_MODE === "false") return false;
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function demoGetProfile(id: string) {
  return db().profiles.find((p) => p.id === id) ?? null;
}

export function demoFindUserByEmail(email: string) {
  return db().profiles.find((p) => p.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function demoGetSession() {
  const store = db();
  if (!store.sessionUserId) return null;
  const profile = store.profiles.find((p) => p.id === store.sessionUserId) ?? null;
  if (!profile) return null;
  return { user: { id: profile.id, email: profile.email }, profile };
}

export function demoLogin(email: string) {
  const store = db();
  const profile = store.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
  if (!profile) return null;
  store.sessionUserId = profile.id;
  return profile;
}

export function demoLogout() {
  db().sessionUserId = null;
}

export function demoListContacts(opts?: {
  stage?: PipelineStage;
  dnc?: boolean;
  q?: string;
}): Contact[] {
  let list = [...db().contacts];
  if (opts?.dnc) list = list.filter((c) => c.do_not_contact);
  if (opts?.stage) list = list.filter((c) => c.current_stage === opts.stage);
  if (opts?.q) {
    const q = opts.q.toLowerCase().trim();
    const phoneQ = normalisePhone(opts.q);
    list = list.filter((c) => {
      const name = fullName(c.first_name, c.last_name).toLowerCase();
      return (
        name.includes(q) ||
        c.first_name.toLowerCase().includes(q) ||
        c.last_name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (phoneQ && normalisePhone(c.phone) === phoneQ) ||
        (c.phone && c.phone.includes(opts.q!))
      );
    });
  }
  return list.sort((a, b) => (b.last_activity_at ?? "").localeCompare(a.last_activity_at ?? ""));
}

export function demoGetContact(id: string) {
  const contact = db().contacts.find((c) => c.id === id);
  if (!contact) return null;
  const activities = db()
    .activities.filter((a) => a.contact_id === id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const enquiries = db()
    .enquiries.filter((e) => e.contact_id === id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const appointments = db()
    .appointments.filter((a) => a.contact_id === id)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  const next = appointments.find((a) => a.status === "booked" && new Date(a.start_time) >= new Date()) ?? null;
  return { ...contact, activities, enquiries, appointments, next_appointment: next };
}

export function demoFindDuplicate(email?: string | null, phone?: string | null) {
  const e = normaliseEmail(email);
  const p = normalisePhone(phone);
  return (
    db().contacts.find((c) => {
      if (e && normaliseEmail(c.email) === e) return true;
      if (p && normalisePhone(c.phone) === p) return true;
      return false;
    }) ?? null
  );
}

export function demoUpdateContact(id: string, patch: Partial<Contact>) {
  const store = db();
  const idx = store.contacts.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  store.contacts[idx] = {
    ...store.contacts[idx],
    ...patch,
    updated_at: new Date().toISOString(),
  };
  return store.contacts[idx];
}

export function demoChangeStage(
  id: string,
  stage: PipelineStage,
  user: { id: string; name: string },
) {
  const contact = demoGetContact(id);
  if (!contact) return null;
  const from = contact.current_stage;
  if (from === stage) return contact;
  demoUpdateContact(id, {
    current_stage: stage,
    last_activity_at: new Date().toISOString(),
  });
  demoAddActivity({
    contact_id: id,
    activity_type: "stage_changed",
    title: "Stage changed",
    body: `${STAGE_LABELS[from]} → ${STAGE_LABELS[stage]}\nChanged by ${user.name}`,
    created_by: user.id,
    created_by_name: user.name,
    automatic: false,
  });
  return demoGetContact(id);
}

export function demoAddActivity(input: {
  contact_id: string;
  enquiry_id?: string | null;
  activity_type: Activity["activity_type"];
  title: string;
  body?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  automatic?: boolean;
}) {
  const activity: Activity = {
    id: randomUUID(),
    contact_id: input.contact_id,
    enquiry_id: input.enquiry_id ?? null,
    activity_type: input.activity_type,
    title: input.title,
    body: input.body ?? null,
    created_by: input.created_by ?? null,
    created_by_name: input.created_by_name ?? null,
    created_at: new Date().toISOString(),
    automatic: input.automatic ?? false,
  };
  db().activities.unshift(activity);
  demoUpdateContact(input.contact_id, { last_activity_at: activity.created_at });
  return activity;
}

export function demoMarkDnc(
  id: string,
  reason: string,
  user: { id: string; name: string },
) {
  const now = new Date().toISOString();
  demoUpdateContact(id, {
    do_not_contact: true,
    do_not_contact_date: now,
    do_not_contact_reason: reason,
    last_activity_at: now,
  });
  demoAddActivity({
    contact_id: id,
    activity_type: "do_not_contact_added",
    title: "Do Not Contact",
    body: reason,
    created_by: user.id,
    created_by_name: user.name,
  });
  return demoGetContact(id);
}

export function demoCreateAppointment(input: {
  contact_id: string;
  start_time: string;
  end_time: string;
  appointment_type?: string;
  meeting_method?: Appointment["meeting_method"];
  administrative_note?: string;
  user: { id: string; name: string };
}) {
  const appt: Appointment = {
    id: randomUUID(),
    contact_id: input.contact_id,
    enquiry_id: null,
    appointment_type: input.appointment_type ?? "Consultation",
    start_time: input.start_time,
    end_time: input.end_time,
    status: "booked",
    google_calendar_event_id: `demo_${randomUUID().slice(0, 8)}`,
    meeting_method: input.meeting_method ?? "telephone",
    administrative_note: input.administrative_note ?? null,
    created_by: input.user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db().appointments.push(appt);
  demoAddActivity({
    contact_id: input.contact_id,
    activity_type: "appointment_booked",
    title: "Appointment booked",
    body: `${appt.appointment_type} — ${new Date(appt.start_time).toLocaleString("en-GB")}`,
    created_by: input.user.id,
    created_by_name: input.user.name,
  });
  demoChangeStage(input.contact_id, "consultation_booked", input.user);
  return appt;
}

export function demoCreateEnquiry(input: {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  preferred_contact_method?: Contact["preferred_contact_method"];
  help_category?: string;
  message?: string;
  lead_source?: string;
  marketing_email?: boolean;
  landing_page?: string;
  utm?: Partial<Pick<Enquiry, "utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term">>;
}) {
  const existing = demoFindDuplicate(input.email, input.phone);
  const now = new Date().toISOString();
  let contact = existing;
  let createdNew = false;

  if (!contact) {
    createdNew = true;
    contact = {
      id: randomUUID(),
      first_name: input.first_name,
      last_name: input.last_name,
      email: normaliseEmail(input.email),
      phone: normalisePhone(input.phone) ?? input.phone ?? null,
      preferred_contact_method: input.preferred_contact_method ?? null,
      current_stage: "new_enquiry",
      lead_source: input.lead_source ?? "Website",
      marketing_email: Boolean(input.marketing_email),
      marketing_sms: false,
      do_not_contact: false,
      do_not_contact_date: null,
      do_not_contact_reason: null,
      important_note: null,
      first_enquiry_at: now,
      last_activity_at: now,
      created_at: now,
      updated_at: now,
    };
    db().contacts.unshift(contact);
  } else {
    demoUpdateContact(contact.id, {
      last_activity_at: now,
      preferred_contact_method:
        input.preferred_contact_method ?? contact.preferred_contact_method,
      phone: normalisePhone(input.phone) ?? contact.phone,
      email: normaliseEmail(input.email) ?? contact.email,
      current_stage: contact.do_not_contact ? contact.current_stage : "new_enquiry",
    });
    contact = demoGetContact(contact.id)!;
  }

  const enquiry: Enquiry = {
    id: randomUUID(),
    contact_id: contact.id,
    created_at: now,
    help_category: input.help_category ?? null,
    message: input.message ?? null,
    lead_source: input.lead_source ?? "Website",
    campaign: null,
    landing_page: input.landing_page ?? null,
    status: "open",
    outcome: null,
    assigned_to: null,
    closed_at: null,
    utm_source: input.utm?.utm_source ?? null,
    utm_medium: input.utm?.utm_medium ?? null,
    utm_campaign: input.utm?.utm_campaign ?? null,
    utm_content: input.utm?.utm_content ?? null,
    utm_term: input.utm?.utm_term ?? null,
  };
  db().enquiries.unshift(enquiry);

  if (contact.do_not_contact) {
    demoAddActivity({
      contact_id: contact.id,
      enquiry_id: enquiry.id,
      activity_type: "inbound_enquiry_dnc",
      title: "New inbound enquiry received",
      body: `Previous Do Not Contact record. This person requested no further proactive contact on ${contact.do_not_contact_date ? new Date(contact.do_not_contact_date).toLocaleDateString("en-GB") : "an earlier date"}. A new inbound enquiry has now been received.`,
      automatic: true,
      created_by_name: "System",
    });
  } else {
    demoAddActivity({
      contact_id: contact.id,
      enquiry_id: enquiry.id,
      activity_type: "website_enquiry",
      title: "Website enquiry",
      body: [input.help_category, input.message].filter(Boolean).join(" — "),
      automatic: true,
      created_by_name: "System",
    });
  }

  if (input.marketing_email && !contact.do_not_contact) {
    demoAddActivity({
      contact_id: contact.id,
      enquiry_id: enquiry.id,
      activity_type: "consent_added",
      title: "Marketing consent",
      body: "Email marketing consent granted via website contact form (v1.0).",
      automatic: true,
      created_by_name: "System",
    });
    demoUpdateContact(contact.id, { marketing_email: true });
  }

  return {
    contact: demoGetContact(contact.id)!,
    enquiry,
    createdNew,
    isDnc: Boolean(contact.do_not_contact),
  };
}

export function demoDashboard(): DashboardStats {
  const contacts = db().contacts;
  const appointments = db().appointments;
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const tomorrowStart = startOfDay(addDays(new Date(), 1));
  const tomorrowEnd = endOfDay(addDays(new Date(), 1));

  const withName = (a: Appointment) => {
    const c = contacts.find((x) => x.id === a.contact_id);
    return {
      ...a,
      contact_id: a.contact_id,
      contact_name: c ? fullName(c.first_name, c.last_name) : "Unknown",
    };
  };

  const todays = appointments
    .filter(
      (a) =>
        a.status === "booked" &&
        new Date(a.start_time) >= todayStart &&
        new Date(a.start_time) <= todayEnd,
    )
    .map(withName)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const tomorrows = appointments
    .filter(
      (a) =>
        a.status === "booked" &&
        new Date(a.start_time) >= tomorrowStart &&
        new Date(a.start_time) <= tomorrowEnd,
    )
    .map(withName)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const recent = [...contacts]
    .filter((c) => c.first_enquiry_at)
    .sort((a, b) => (b.first_enquiry_at ?? "").localeCompare(a.first_enquiry_at ?? ""))
    .slice(0, 8)
    .map((c) => ({
      id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      first_enquiry_at: c.first_enquiry_at,
      lead_source: c.lead_source,
      current_stage: c.current_stage,
    }));

  return {
    new_enquiries: contacts.filter((c) => c.current_stage === "new_enquiry" && !c.do_not_contact)
      .length,
    awaiting_contact: contacts.filter(
      (c) =>
        !c.do_not_contact &&
        (c.current_stage === "new_enquiry" || c.current_stage === "attempted_contact"),
    ).length,
    todays_consultations: todays.length,
    tomorrows_consultations: tomorrows.length,
    current_clients: contacts.filter((c) => c.current_stage === "client").length,
    recent_enquiries: recent,
    todays_appointments: todays,
    tomorrows_appointments: tomorrows,
  };
}

export function demoPipelineContacts() {
  const contacts = demoListContacts();
  return contacts.map((c) => {
    const next =
      db().appointments.find(
        (a) =>
          a.contact_id === c.id &&
          a.status === "booked" &&
          new Date(a.start_time) >= new Date(),
      ) ?? null;
    return { ...c, next_appointment: next };
  });
}
