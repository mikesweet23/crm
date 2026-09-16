-- Absolute Mind CRM — initial schema
-- Enable required extensions
create extension if not exists "pgcrypto";

-- Profiles (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null default 'administrator'
    check (role in ('owner', 'administrator', 'therapist', 'receptionist')),
  created_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  preferred_contact_method text check (preferred_contact_method in ('phone', 'email', 'whatsapp')),
  current_stage text not null default 'new_enquiry'
    check (current_stage in (
      'new_enquiry', 'attempted_contact', 'contacted', 'consultation_booked',
      'consultation_completed', 'client', 'finished', 'not_proceeding'
    )),
  lead_source text,
  marketing_email boolean not null default false,
  marketing_sms boolean not null default false,
  do_not_contact boolean not null default false,
  do_not_contact_date timestamptz,
  do_not_contact_reason text,
  important_note text,
  first_enquiry_at timestamptz,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contacts_email_idx on public.contacts (lower(email));
create index if not exists contacts_phone_idx on public.contacts (phone);
create index if not exists contacts_stage_idx on public.contacts (current_stage);
create index if not exists contacts_name_idx on public.contacts (lower(first_name), lower(last_name));
create index if not exists contacts_dnc_idx on public.contacts (do_not_contact) where do_not_contact = true;

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  created_at timestamptz not null default now(),
  help_category text,
  message text,
  lead_source text,
  campaign text,
  landing_page text,
  status text not null default 'open' check (status in ('open', 'closed')),
  outcome text check (outcome in ('client', 'finished', 'not_proceeding', 'do_not_contact')),
  assigned_to uuid references public.profiles (id),
  closed_at timestamptz,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text
);

create index if not exists enquiries_contact_idx on public.enquiries (contact_id);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  enquiry_id uuid references public.enquiries (id) on delete set null,
  activity_type text not null,
  title text not null,
  body text,
  created_by uuid references public.profiles (id),
  created_by_name text,
  created_at timestamptz not null default now(),
  automatic boolean not null default false
);

create index if not exists activities_contact_idx on public.activities (contact_id, created_at desc);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  enquiry_id uuid references public.enquiries (id) on delete set null,
  appointment_type text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'booked'
    check (status in ('booked', 'completed', 'cancelled', 'no_show')),
  google_calendar_event_id text,
  meeting_method text check (meeting_method in ('telephone', 'online', 'in_person')),
  administrative_note text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointments_contact_idx on public.appointments (contact_id);
create index if not exists appointments_start_idx on public.appointments (start_time);
create index if not exists appointments_gcal_idx on public.appointments (google_calendar_event_id);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  consent_type text not null,
  status text not null check (status in ('granted', 'withdrawn')),
  consent_text text not null,
  consent_version text not null,
  source text not null,
  created_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

create table if not exists public.suppressions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  email text,
  phone text,
  suppression_type text not null,
  reason text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  removed_at timestamptz
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts (id) on delete set null,
  user_id uuid references public.profiles (id),
  user_name text,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value) values
  ('email', '{"sender_name":"Absolute Mind","sender_address":"paula@absolutemind.co.uk","paula_notify_email":"paula@paulasweet.co.uk"}'::jsonb),
  ('marketing_consent', '{"version":"v1.0","text":"I'\''d like to receive occasional emails from Absolute Mind about services, resources and updates."}'::jsonb),
  ('lead_sources', '["Google","Google Ads","Facebook","Instagram","Referral","Website","Existing client","Other"]'::jsonb)
on conflict (key) do nothing;

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contacts_updated_at on public.contacts;
create trigger contacts_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

drop trigger if exists appointments_updated_at on public.appointments;
create trigger appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup (admin-created users only)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'administrator')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.enquiries enable row level security;
alter table public.activities enable row level security;
alter table public.appointments enable row level security;
alter table public.consents enable row level security;
alter table public.suppressions enable row level security;
alter table public.audit_events enable row level security;
alter table public.settings enable row level security;

-- Authenticated staff can read/write CRM data
create policy "Staff can read profiles"
  on public.profiles for select to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

create policy "Staff can read contacts"
  on public.contacts for select to authenticated using (true);
create policy "Staff can insert contacts"
  on public.contacts for insert to authenticated with check (true);
create policy "Staff can update contacts"
  on public.contacts for update to authenticated using (true);

create policy "Staff can read enquiries"
  on public.enquiries for select to authenticated using (true);
create policy "Staff can insert enquiries"
  on public.enquiries for insert to authenticated with check (true);
create policy "Staff can update enquiries"
  on public.enquiries for update to authenticated using (true);

create policy "Staff can read activities"
  on public.activities for select to authenticated using (true);
create policy "Staff can insert activities"
  on public.activities for insert to authenticated with check (true);

create policy "Staff can read appointments"
  on public.appointments for select to authenticated using (true);
create policy "Staff can insert appointments"
  on public.appointments for insert to authenticated with check (true);
create policy "Staff can update appointments"
  on public.appointments for update to authenticated using (true);

create policy "Staff can read consents"
  on public.consents for select to authenticated using (true);
create policy "Staff can insert consents"
  on public.consents for insert to authenticated with check (true);
create policy "Staff can update consents"
  on public.consents for update to authenticated using (true);

create policy "Staff can read suppressions"
  on public.suppressions for select to authenticated using (true);
create policy "Staff can insert suppressions"
  on public.suppressions for insert to authenticated with check (true);
create policy "Staff can update suppressions"
  on public.suppressions for update to authenticated using (true);

create policy "Staff can read audit"
  on public.audit_events for select to authenticated using (true);
create policy "Staff can insert audit"
  on public.audit_events for insert to authenticated with check (true);

create policy "Staff can read settings"
  on public.settings for select to authenticated using (true);
create policy "Owners can update settings"
  on public.settings for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('owner', 'administrator')
    )
  );

-- Public has NO direct table access. Enquiry intake goes through the server API
-- using the service role key.
