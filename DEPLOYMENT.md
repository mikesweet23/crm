# Deployment & go-live checklist

Absolute Mind CRM is a Next.js (App Router) app that runs on **Vercel** and uses
**Supabase** for data/auth. GitHub only stores the code; the running app is the
Vercel deployment. Merges to `main` auto-deploy to production.

## 1. Hosting (Vercel)

1. Import the `mikesweet23/crm` GitHub repo into Vercel (Next.js is auto-detected).
2. Set the environment variables below (Project → Settings → Environment Variables).
3. Deploy. Pushes to `main` redeploy production automatically.

## 2. Database & auth (Supabase)

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial.sql` in the Supabase SQL editor.
3. Create the two users in Supabase → Authentication → Users:
   - Paula — `paula@paulasweet.co.uk` (owner)
   - Mike — `mike@absolutemind.co.uk` (administrator)
   Profiles are created automatically by the DB trigger.

> Without Supabase configured (and `DEMO_MODE` not `false`), the app runs in
> in-memory **demo mode** — sample data that does not persist. Do not run
> production in demo mode.

## 3. Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DEMO_MODE` | yes (prod) | Set to `false` in production. |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | From Supabase project settings. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | From Supabase project settings. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Required for the public/embedded enquiry form to write. Keep secret. |
| `NEXT_PUBLIC_APP_URL` | yes | The live URL, e.g. `https://crm.absolutemind.co.uk`. Used in emails/links. |
| `RESEND_API_KEY` | recommended | Enables acknowledgement + notification emails. |
| `EMAIL_FROM` | recommended | Must be on a Resend-verified domain. |
| `PAULA_NOTIFY_EMAIL` | recommended | Defaults to `paula@paulasweet.co.uk`. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | recommended | Renders the Turnstile widget. Set **with** the secret. |
| `TURNSTILE_SECRET_KEY` | recommended | Verifies the token. Set **with** the site key. |
| `EMBED_FRAME_ANCESTORS` | optional | Restrict who can embed `/embed/*`. Empty = any site. |

## 4. Spam protection (Cloudflare Turnstile)

The public form has honeypot + per-IP rate limiting always on. To add Turnstile:

1. Create a Turnstile widget in the Cloudflare dashboard for your domain(s),
   including the WordPress site that hosts the embed.
2. Set **both** `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` and redeploy.

Setting only the secret (without the site key) rejects all submissions because no
widget/token is produced — always set the pair together.

## 5. Public access & custom domain

The main app is behind login, but these routes **must be publicly reachable**
(no Vercel Authentication / Deployment Protection) or the website form/embed break:

- `/enquiry`
- `/embed/enquiry`
- `/embed.js`

Add the custom domain (`crm.absolutemind.co.uk`) in Vercel, point DNS, and set
`NEXT_PUBLIC_APP_URL` to match. Confirm the three routes above load without a
Vercel auth wall.

## 6. WordPress embed

On the live CRM, open `/forms`, configure a form, and copy the snippet into a
WordPress “Custom HTML” block, e.g.:

```html
<div data-absolute-mind-form data-form="enquiry" data-source="Website"></div>
<script src="https://crm.absolutemind.co.uk/embed.js" async></script>
```

To restrict framing to your sites, set
`EMBED_FRAME_ANCESTORS="'self' https://*.absolutemind.co.uk https://absolutemind.co.uk"`.

## 7. Smoke test after deploy

1. Sign in (Supabase users) at the live URL.
2. Contacts → **Add contact**, open a contact, add a note (dialog overlays correctly), refresh → persists.
3. Submit `/enquiry` (and the WordPress embed) → the enquiry appears in the pipeline.
4. With Turnstile configured, confirm the widget renders and submissions succeed.
