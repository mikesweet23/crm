export const PIPELINE_STAGES = [
  "new_enquiry",
  "attempted_contact",
  "contacted",
  "consultation_booked",
  "consultation_completed",
  "client",
  "finished",
  "not_proceeding",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  new_enquiry: "New Enquiry",
  attempted_contact: "Attempted Contact",
  contacted: "Contacted",
  consultation_booked: "Consultation Booked",
  consultation_completed: "Consultation Completed",
  client: "Client",
  finished: "Finished",
  not_proceeding: "Not Proceeding",
};

export const LEAD_SOURCES = [
  "Google",
  "Google Ads",
  "Facebook",
  "Instagram",
  "Referral",
  "Website",
  "Existing client",
  "Other",
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];

export const HELP_CATEGORIES = [
  "Anxiety and stress",
  "Confidence",
  "Fears and phobias",
  "Habits",
  "Sleep",
  "Smoking",
  "Weight and eating",
  "Other",
] as const;

export type HelpCategory = (typeof HELP_CATEGORIES)[number];

export const PREFERRED_CONTACT_METHODS = ["phone", "email", "whatsapp"] as const;
export type PreferredContactMethod = (typeof PREFERRED_CONTACT_METHODS)[number];

export const ACTIVITY_TYPES = [
  "website_enquiry",
  "note",
  "call",
  "email_sent",
  "email_received",
  "whatsapp",
  "appointment_booked",
  "appointment_changed",
  "appointment_cancelled",
  "stage_changed",
  "consent_added",
  "consent_removed",
  "do_not_contact_added",
  "do_not_contact_removed",
  "client_finished",
  "inbound_enquiry_dnc",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export type UserRole = "owner" | "administrator" | "therapist" | "receptionist";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  preferred_contact_method: PreferredContactMethod | null;
  current_stage: PipelineStage;
  lead_source: string | null;
  marketing_email: boolean;
  marketing_sms: boolean;
  do_not_contact: boolean;
  do_not_contact_date: string | null;
  do_not_contact_reason: string | null;
  important_note: string | null;
  first_enquiry_at: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Enquiry {
  id: string;
  contact_id: string;
  created_at: string;
  help_category: string | null;
  message: string | null;
  lead_source: string | null;
  campaign: string | null;
  landing_page: string | null;
  status: "open" | "closed";
  outcome: "client" | "finished" | "not_proceeding" | "do_not_contact" | null;
  assigned_to: string | null;
  closed_at: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

export interface Activity {
  id: string;
  contact_id: string;
  enquiry_id: string | null;
  activity_type: ActivityType;
  title: string;
  body: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  automatic: boolean;
}

export interface Appointment {
  id: string;
  contact_id: string;
  enquiry_id: string | null;
  appointment_type: string | null;
  start_time: string;
  end_time: string;
  status: "booked" | "completed" | "cancelled" | "no_show";
  google_calendar_event_id: string | null;
  meeting_method: "telephone" | "online" | "in_person" | null;
  administrative_note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Consent {
  id: string;
  contact_id: string;
  consent_type: string;
  status: "granted" | "withdrawn";
  consent_text: string;
  consent_version: string;
  source: string;
  created_at: string;
  withdrawn_at: string | null;
}

export interface Suppression {
  id: string;
  contact_id: string;
  email: string | null;
  phone: string | null;
  suppression_type: string;
  reason: string | null;
  created_by: string | null;
  created_at: string;
  removed_at: string | null;
}

export interface AuditEvent {
  id: string;
  contact_id: string | null;
  user_id: string | null;
  user_name: string | null;
  action: string;
  detail: string | null;
  created_at: string;
}

export interface ContactWithRelations extends Contact {
  next_appointment?: Appointment | null;
  enquiries?: Enquiry[];
  activities?: Activity[];
  appointments?: Appointment[];
}

export interface DashboardStats {
  new_enquiries: number;
  awaiting_contact: number;
  todays_consultations: number;
  tomorrows_consultations: number;
  current_clients: number;
  recent_enquiries: Array<{
    id: string;
    first_name: string;
    last_name: string;
    first_enquiry_at: string | null;
    lead_source: string | null;
    current_stage: PipelineStage;
  }>;
  todays_appointments: Array<Appointment & { contact_name: string; contact_id: string }>;
  tomorrows_appointments: Array<Appointment & { contact_name: string; contact_id: string }>;
}
