# Absolute Mind CRM

Simple, secure enquiry and client manager for Absolute Mind — designed to replace the small part of Pipedrive Paula currently uses.

Suggested production URL: `crm.absolutemind.co.uk`

## Stack

- Next.js (App Router) on Vercel
- Supabase PostgreSQL + Auth + Row Level Security
- Resend for transactional email
- Cloudflare Turnstile on the public enquiry form
- Google Calendar event IDs stored against appointments (booking app remains the diary)

## Design

Visual style matches [booking.absolutemind.co.uk](https://booking.absolutemind.co.uk): Absolute Mind logo, brand orange (`#e5772a`), soft peach/teal atmosphere, Geist typography, rounded cards and calm spacing.

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

With `DEMO_MODE=true` (default when Supabase is not configured), you can sign in as:

- `paula@paulasweet.co.uk` (any password)
- `mike@absolutemind.co.uk` (any password)

Open [http://localhost:3000](http://localhost:3000).

## Main screens

| Route | Purpose |
| --- | --- |
| `/login` | Secure sign-in |
| `/dashboard` | New enquiries, awaiting contact, today’s/tomorrow’s consultations, recent enquiries |
| `/pipeline` | Kanban board with drag-and-drop stage changes |
| `/contacts` | Contact list |
| `/contacts/[id]` | Contact detail, important note, actions, full timeline |
| `/search` | Global name / email / phone search |
| `/settings` | Small settings surface |
| `/enquiry` | Public Absolute Mind enquiry form |

## Database

Run `supabase/migrations/001_initial.sql` in your Supabase SQL editor. Then create users for Paula (owner) and Mike (administrator) in Supabase Auth — profiles are created automatically via trigger.

Set Vercel environment variables from `.env.example`, deploy, and add the custom domain `crm.absolutemind.co.uk`.

## Version one success criteria

Paula can log in, see new enquiries, search, open a contact, view history, add notes, log calls, move pipeline stages, mark Not Proceeding / Do Not Contact, see upcoming appointments, and receive website enquiries with acknowledgement emails.

## Deliberately out of scope for v1

Invoicing, marketing campaigns, clinical records, SMS/WhatsApp APIs, complex permissions, AI features.
