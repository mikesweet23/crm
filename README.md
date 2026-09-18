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
| `/forms` | Form builder — configure and copy embeddable contact forms for WordPress |
| `/settings` | Small settings surface |
| `/enquiry` | Public Absolute Mind enquiry form |
| `/embed/enquiry` | Framed, self-resizing enquiry form for embedding on other sites |

## Embeddable forms (WordPress)

Paula's website is WordPress. The CRM can generate contact forms that live on any
WordPress page and send enquiries straight into the pipeline.

- Build and preview forms at `/forms`. Choose a template (full enquiry, quick
  callback, booking funnel), pick fields, set the accent colour and lead source,
  optionally send people to the booking diary after submitting, then copy the code.
- **Recommended embed** — auto-resizes on mobile and desktop. Paste into a
  WordPress “Custom HTML” block:

  ```html
  <div data-absolute-mind-form data-form="enquiry" data-source="Website"></div>
  <script src="https://crm.absolutemind.co.uk/embed.js" async></script>
  ```

- **Plain iframe** — for a fixed height without the script:

  ```html
  <iframe src="https://crm.absolutemind.co.uk/embed/enquiry" title="Absolute Mind enquiry form"
    width="100%" height="720" loading="lazy" style="border:0;max-width:640px"></iframe>
  ```

The embed route (`/embed/enquiry`) accepts query parameters: `source`, `heading`,
`intro`, `accent`, `submit`, `fields` (comma list of `phone,preferred,category,message,marketing,source`),
`bg` (`transparent`/`white`), `compact`, and `redirect` (booking URL shown after submit).

Framing of `/embed/*` is restricted by a `Content-Security-Policy: frame-ancestors`
header to Absolute Mind domains (`absolutemind.co.uk`, `paulasweet.co.uk`, the CRM
itself and `localhost:3000`). Override the allowlist with `EMBED_FRAME_ANCESTORS`
(see `.env.example`); it is read at build time, so redeploy after changing it.

## Spam protection

The public form uses Cloudflare Turnstile plus a honeypot field. Set
`NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` to enable it; with both
unset (demo / local) no widget is rendered and the API skips verification.

## Database

Run `supabase/migrations/001_initial.sql` in your Supabase SQL editor. Then create users for Paula (owner) and Mike (administrator) in Supabase Auth — profiles are created automatically via trigger.

Set Vercel environment variables from `.env.example`, deploy, and add the custom domain `crm.absolutemind.co.uk`.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full go-live checklist, including the
Vercel Deployment Protection settings needed to keep `/enquiry` and `/embed.js` public.

## Version one success criteria

Paula can log in, see new enquiries, search, open a contact, view history, add notes, log calls, move pipeline stages, mark Not Proceeding / Do Not Contact, see upcoming appointments, and receive website enquiries with acknowledgement emails.

## Deliberately out of scope for v1

Invoicing, marketing campaigns, clinical records, SMS/WhatsApp APIs, complex permissions, AI features.
