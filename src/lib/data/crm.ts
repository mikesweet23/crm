import {
  demoChangeStage,
  demoCreateAppointment,
  demoCreateContact,
  demoCreateEnquiry,
  demoDashboard,
  demoGetContact,
  demoGetProfile,
  demoListContacts,
  demoAddActivity,
  demoPipelineContacts,
  demoUpdateContact,
  demoMarkDnc,
  isDemoMode,
} from "@/lib/data/demo-store";
import {
  clearDemoUserCookie,
  getDemoUserIdFromCookie,
  setDemoUserCookie,
} from "@/lib/data/demo-auth";
import type {
  Activity,
  Appointment,
  Contact,
  ContactWithRelations,
  DashboardStats,
  Enquiry,
  PipelineStage,
  PreferredContactMethod,
} from "@/lib/types";

export { isDemoMode };

export async function getSession() {
  if (isDemoMode()) {
    const userId = await getDemoUserIdFromCookie();
    if (!userId) return null;
    const profile = demoGetProfile(userId);
    if (!profile) return null;
    return { user: { id: profile.id, email: profile.email }, profile };
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return { user: { id: user.id, email: user.email ?? "" }, profile };
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function loginWithPassword(email: string, password: string) {
  if (isDemoMode()) {
    void password;
    const { demoFindUserByEmail } = await import("@/lib/data/demo-store");
    const profile = demoFindUserByEmail(email);
    if (!profile) {
      return { error: "Unknown demo user. Try paula@paulasweet.co.uk or mike@absolutemind.co.uk" };
    }
    await setDemoUserCookie(profile.id);
    return { profile };
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { profile: null };
}

export async function logout() {
  if (isDemoMode()) {
    await clearDemoUserCookie();
    return;
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function getDashboard(): Promise<DashboardStats> {
  if (isDemoMode()) return demoDashboard();
  // Production path uses Supabase queries via admin-safe authenticated client
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: contacts } = await supabase.from("contacts").select("*");
  const list = contacts ?? [];
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  const tStart = new Date(start);
  tStart.setDate(tStart.getDate() + 1);
  const tEnd = new Date(end);
  tEnd.setDate(tEnd.getDate() + 1);

  const { data: appts } = await supabase
    .from("appointments")
    .select("*, contacts(first_name, last_name)")
    .eq("status", "booked")
    .gte("start_time", start.toISOString())
    .lte("start_time", tEnd.toISOString());

  const mapAppt = (a: Record<string, unknown>) => {
    const c = a.contacts as { first_name: string; last_name: string } | null;
    return {
      ...(a as unknown as import("@/lib/types").Appointment),
      contact_id: a.contact_id as string,
      contact_name: c ? `${c.first_name} ${c.last_name}` : "Unknown",
    };
  };

  const todays = (appts ?? [])
    .filter((a) => new Date(a.start_time as string) <= end)
    .map(mapAppt);
  const tomorrows = (appts ?? [])
    .filter((a) => new Date(a.start_time as string) >= tStart)
    .map(mapAppt);

  return {
    new_enquiries: list.filter((c) => c.current_stage === "new_enquiry" && !c.do_not_contact)
      .length,
    awaiting_contact: list.filter(
      (c) =>
        !c.do_not_contact &&
        (c.current_stage === "new_enquiry" || c.current_stage === "attempted_contact"),
    ).length,
    todays_consultations: todays.length,
    tomorrows_consultations: tomorrows.length,
    current_clients: list.filter((c) => c.current_stage === "client").length,
    recent_enquiries: [...list]
      .sort((a, b) => (b.first_enquiry_at ?? "").localeCompare(a.first_enquiry_at ?? ""))
      .slice(0, 8)
      .map((c) => ({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        first_enquiry_at: c.first_enquiry_at,
        lead_source: c.lead_source,
        current_stage: c.current_stage,
      })),
    todays_appointments: todays,
    tomorrows_appointments: tomorrows,
  };
}

export async function listPipelineContacts(opts?: { stage?: string; dnc?: boolean }) {
  if (isDemoMode()) {
    if (opts?.dnc) return demoListContacts({ dnc: true }).map((c) => ({ ...c, next_appointment: null }));
    if (opts?.stage)
      return demoListContacts({ stage: opts.stage as PipelineStage }).map((c) => ({
        ...c,
        next_appointment: null,
      }));
    return demoPipelineContacts();
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  let query = supabase.from("contacts").select("*, appointments(*)");
  if (opts?.dnc) query = query.eq("do_not_contact", true);
  if (opts?.stage) query = query.eq("current_stage", opts.stage);
  const { data } = await query;
  return (data ?? []).map((c) => {
    const appts = (c.appointments as import("@/lib/types").Appointment[] | undefined) ?? [];
    const next =
      appts.find((a) => a.status === "booked" && new Date(a.start_time) >= new Date()) ?? null;
    const { appointments: _a, ...rest } = c;
    return { ...(rest as Contact), next_appointment: next };
  });
}

export async function searchContacts(q: string) {
  if (isDemoMode()) return demoListContacts({ q });
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const term = q.trim();
  const { data } = await supabase
    .from("contacts")
    .select("*")
    .or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`,
    )
    .limit(25);
  return data ?? [];
}

export async function getContact(id: string): Promise<ContactWithRelations | null> {
  if (isDemoMode()) return demoGetContact(id);
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: contact } = await supabase.from("contacts").select("*").eq("id", id).single();
  if (!contact) return null;
  const [{ data: activities }, { data: enquiries }, { data: appointments }] = await Promise.all([
    supabase
      .from("activities")
      .select("*")
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("enquiries")
      .select("*")
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("*")
      .eq("contact_id", id)
      .order("start_time", { ascending: true }),
  ]);
  const next =
    ((appointments ?? []) as Appointment[]).find(
      (a) => a.status === "booked" && new Date(a.start_time) >= new Date(),
    ) ?? null;
  return {
    ...(contact as Contact),
    activities: (activities ?? []) as Activity[],
    enquiries: (enquiries ?? []) as Enquiry[],
    appointments: (appointments ?? []) as Appointment[],
    next_appointment: next,
  };
}

export async function createContact(input: {
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  lead_source?: string | null;
  user: { id: string; name: string };
}): Promise<Contact> {
  if (isDemoMode()) return demoCreateContact(input);

  const { createClient } = await import("@/lib/supabase/server");
  const { normaliseEmail, normalisePhone } = await import("@/lib/phone");
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      first_name: input.first_name,
      last_name: input.last_name,
      email: normaliseEmail(input.email),
      phone: normalisePhone(input.phone) ?? input.phone ?? null,
      lead_source: input.lead_source ?? "Manual entry",
      current_stage: "new_enquiry",
      // Manual entry never assumes marketing consent.
      marketing_email: false,
      marketing_sms: false,
      first_enquiry_at: now,
      last_activity_at: now,
    })
    .select("*")
    .single();
  if (error) throw error;

  const contact = data as Contact;
  await addActivity({
    contact_id: contact.id,
    activity_type: "note",
    title: "Contact created",
    body: `Added manually by ${input.user.name}.`,
    created_by: input.user.id,
    created_by_name: input.user.name,
    automatic: false,
  });
  return contact;
}

export async function updateContact(id: string, patch: Partial<Contact>) {
  if (isDemoMode()) return demoUpdateContact(id, patch);
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function changeStage(
  id: string,
  stage: PipelineStage,
  user: { id: string; name: string },
) {
  if (isDemoMode()) return demoChangeStage(id, stage, user);
  const contact = await getContact(id);
  if (!contact) return null;
  const from = contact.current_stage;
  if (from === stage) return contact;
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { STAGE_LABELS } = await import("@/lib/types");
  await supabase
    .from("contacts")
    .update({
      current_stage: stage,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  await supabase.from("activities").insert({
    contact_id: id,
    activity_type: "stage_changed",
    title: "Stage changed",
    body: `${STAGE_LABELS[from as PipelineStage]} → ${STAGE_LABELS[stage]}\nChanged by ${user.name}`,
    created_by: user.id,
    created_by_name: user.name,
    automatic: false,
  });
  await supabase.from("audit_events").insert({
    contact_id: id,
    user_id: user.id,
    user_name: user.name,
    action: "stage_changed",
    detail: `${from} → ${stage}`,
  });
  return getContact(id);
}

export async function addActivity(input: {
  contact_id: string;
  activity_type: import("@/lib/types").ActivityType;
  title: string;
  body?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  automatic?: boolean;
}) {
  if (isDemoMode()) return demoAddActivity(input);
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .insert({
      contact_id: input.contact_id,
      activity_type: input.activity_type,
      title: input.title,
      body: input.body ?? null,
      created_by: input.created_by ?? null,
      created_by_name: input.created_by_name ?? null,
      automatic: input.automatic ?? false,
    })
    .select("*")
    .single();
  if (error) throw error;
  await supabase
    .from("contacts")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", input.contact_id);
  return data;
}

export async function markDoNotContact(
  id: string,
  reason: string,
  user: { id: string; name: string },
) {
  if (isDemoMode()) return demoMarkDnc(id, reason, user);
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const now = new Date().toISOString();
  const contact = await getContact(id);
  await supabase
    .from("contacts")
    .update({
      do_not_contact: true,
      do_not_contact_date: now,
      do_not_contact_reason: reason,
      last_activity_at: now,
    })
    .eq("id", id);
  await supabase.from("suppressions").insert({
    contact_id: id,
    email: contact?.email,
    phone: contact?.phone,
    suppression_type: "all_proactive_contact",
    reason,
    created_by: user.id,
  });
  await addActivity({
    contact_id: id,
    activity_type: "do_not_contact_added",
    title: "Do Not Contact",
    body: reason,
    created_by: user.id,
    created_by_name: user.name,
  });
  await supabase.from("audit_events").insert({
    contact_id: id,
    user_id: user.id,
    user_name: user.name,
    action: "dnc_added",
    detail: reason,
  });
  return getContact(id);
}

export async function createAppointment(input: {
  contact_id: string;
  start_time: string;
  end_time: string;
  appointment_type?: string;
  meeting_method?: import("@/lib/types").Appointment["meeting_method"];
  administrative_note?: string;
  user: { id: string; name: string };
}) {
  if (isDemoMode()) return demoCreateAppointment(input);
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      contact_id: input.contact_id,
      appointment_type: input.appointment_type ?? "Consultation",
      start_time: input.start_time,
      end_time: input.end_time,
      status: "booked",
      meeting_method: input.meeting_method ?? "telephone",
      administrative_note: input.administrative_note ?? null,
      created_by: input.user.id,
    })
    .select("*")
    .single();
  if (error) throw error;
  await addActivity({
    contact_id: input.contact_id,
    activity_type: "appointment_booked",
    title: "Appointment booked",
    body: `${data.appointment_type} — ${new Date(data.start_time).toLocaleString("en-GB")}`,
    created_by: input.user.id,
    created_by_name: input.user.name,
  });
  await changeStage(input.contact_id, "consultation_booked", input.user);
  return data;
}

export async function submitEnquiry(input: {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  preferred_contact_method?: PreferredContactMethod;
  help_category?: string;
  message?: string;
  lead_source?: string;
  marketing_email?: boolean;
  landing_page?: string;
  utm?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };
}) {
  if (isDemoMode()) return demoCreateEnquiry(input);

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { normaliseEmail, normalisePhone } = await import("@/lib/phone");
  const admin = createAdminClient();
  const email = normaliseEmail(input.email);
  const phone = normalisePhone(input.phone) ?? input.phone ?? null;

  let contact: Contact | null = null;
  if (email) {
    const { data } = await admin.from("contacts").select("*").ilike("email", email).maybeSingle();
    contact = (data as Contact | null) ?? null;
  }
  if (!contact && phone) {
    const { data } = await admin.from("contacts").select("*").eq("phone", phone).maybeSingle();
    contact = (data as Contact | null) ?? null;
  }

  const now = new Date().toISOString();
  let createdNew = false;

  if (!contact) {
    createdNew = true;
    const { data, error } = await admin
      .from("contacts")
      .insert({
        first_name: input.first_name,
        last_name: input.last_name,
        email,
        phone,
        preferred_contact_method: input.preferred_contact_method ?? null,
        current_stage: "new_enquiry",
        lead_source: input.lead_source ?? "Website",
        marketing_email: Boolean(input.marketing_email),
        first_enquiry_at: now,
        last_activity_at: now,
      })
      .select("*")
      .single();
    if (error) throw error;
    contact = data as Contact;
  } else {
    await admin
      .from("contacts")
      .update({
        last_activity_at: now,
        preferred_contact_method:
          input.preferred_contact_method ?? contact.preferred_contact_method,
        phone: phone ?? contact.phone,
        email: email ?? contact.email,
        current_stage: contact.do_not_contact ? contact.current_stage : "new_enquiry",
        marketing_email: contact.do_not_contact
          ? contact.marketing_email
          : contact.marketing_email || Boolean(input.marketing_email),
      })
      .eq("id", contact.id);
    const { data } = await admin.from("contacts").select("*").eq("id", contact.id).single();
    contact = data as Contact;
  }

  if (!contact) {
    throw new Error("Failed to create or load contact");
  }

  const savedContact: Contact = contact;

  const { data: enquiry, error: enquiryError } = await admin
    .from("enquiries")
    .insert({
      contact_id: savedContact.id,
      help_category: input.help_category ?? null,
      message: input.message ?? null,
      lead_source: input.lead_source ?? "Website",
      landing_page: input.landing_page ?? null,
      utm_source: input.utm?.utm_source ?? null,
      utm_medium: input.utm?.utm_medium ?? null,
      utm_campaign: input.utm?.utm_campaign ?? null,
      utm_content: input.utm?.utm_content ?? null,
      utm_term: input.utm?.utm_term ?? null,
    })
    .select("*")
    .single();
  if (enquiryError) throw enquiryError;

  if (savedContact.do_not_contact) {
    await admin.from("activities").insert({
      contact_id: savedContact.id,
      enquiry_id: enquiry.id,
      activity_type: "inbound_enquiry_dnc",
      title: "New inbound enquiry received",
      body: `Previous Do Not Contact record. A new inbound enquiry has now been received.`,
      automatic: true,
      created_by_name: "System",
    });
  } else {
    await admin.from("activities").insert({
      contact_id: savedContact.id,
      enquiry_id: enquiry.id,
      activity_type: "website_enquiry",
      title: "Website enquiry",
      body: [input.help_category, input.message].filter(Boolean).join(" — "),
      automatic: true,
      created_by_name: "System",
    });
  }

  if (input.marketing_email && !savedContact.do_not_contact) {
    await admin.from("consents").insert({
      contact_id: savedContact.id,
      consent_type: "email_marketing",
      status: "granted",
      consent_text:
        "I'd like to receive occasional emails from Absolute Mind about services, resources and updates.",
      consent_version: "v1.0",
      source: "website_contact_form",
    });
    await admin.from("activities").insert({
      contact_id: savedContact.id,
      enquiry_id: enquiry.id,
      activity_type: "consent_added",
      title: "Marketing consent",
      body: "Email marketing consent granted via website contact form (v1.0).",
      automatic: true,
      created_by_name: "System",
    });
  }

  return {
    contact: savedContact,
    enquiry: enquiry as Enquiry,
    createdNew,
    isDnc: Boolean(savedContact.do_not_contact),
  };
}
