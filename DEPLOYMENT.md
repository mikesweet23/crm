# Deployment — Absolute Mind CRM

Practical go-live checklist for Vercel + Supabase + `crm.absolutemind.co.uk`.
Work through it top to bottom; each section ends with how to confirm it worked.

## 1. Vercel environment variables

Project → **Settings → Environment Variables**. Copy every key from `.env.example`
into the **Production** environment (and Preview if you want previews to hit real
services). Keys marked `NEXT_PUBLIC_*` and `EMBED_FRAME_ANCESTORS` are baked in at
build time — **redeploy after changing them**.

| Variable | Production value |
| --- | --- |
| `DEMO_MODE` | `false` (anything else, or unset with Supabase missing, serves the sample data) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → `service_role` key (server only, never `NEXT_PUBLIC_`) |
| `NEXT_PUBLIC_APP_URL` | `https://crm.absolutemind.co.uk` (used for links in emails) |
| `RESEND_API_KEY` | Resend → API Keys. The `EMAIL_FROM` domain must be verified in Resend |
| `EMAIL_FROM` | `Absolute Mind <paula@absolutemind.co.uk>` |
| `PAULA_NOTIFY_EMAIL` | `paula@paulasweet.co.uk` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare → Turnstile → widget **Site Key** |
| `TURNSTILE_SECRET_KEY` | Cloudflare → Turnstile → widget **Secret Key** |
| `EMBED_FRAME_ANCESTORS` | Optional — only if the default domain allowlist needs changing (see §5) |

Never commit real values; `.env.local` is git-ignored and `.env.example` must stay
placeholder-only.

**Confirm:** after deploy, `/settings` shows Resend as "configured" and `/login`
no longer shows the demo-account hint.

## 2. Supabase

1. Create a project (London region is closest for UK users).
2. **SQL Editor** → paste and run `supabase/migrations/001_initial.sql`. It creates
   the tables, RLS policies and the trigger that turns each new Auth user into a
   `profiles` row.
3. **Authentication → Users → Add user** (create the user directly, not via invite
   email unless SMTP is configured):
   - `paula@paulasweet.co.uk` — tick *Auto Confirm User*. Add user metadata
     `{"full_name": "Paula Sweet", "role": "owner"}` so the trigger assigns the
     owner role.
   - `mike@absolutemind.co.uk` — `{"full_name": "Mike Sweet", "role": "administrator"}`.
   - Without metadata the trigger defaults to role `administrator` and derives the
     name from the email. Roles can also be fixed afterwards in the `profiles` table.
4. **Authentication → URL Configuration**: set Site URL to
   `https://crm.absolutemind.co.uk` and add `https://crm.absolutemind.co.uk/**` to
   the redirect allowlist (needed by `/api/auth/callback`).

**Confirm:** log in at `/login` with Paula's account; the dashboard renders with an
empty pipeline instead of the demo contacts.

## 3. Custom domain

1. Vercel → Project → **Settings → Domains** → add `crm.absolutemind.co.uk`.
2. At the DNS provider for `absolutemind.co.uk` add the record Vercel shows
   (normally `CNAME crm → cname.vercel-dns.com`). If DNS is proxied through
   Cloudflare, set that record to **DNS only** (grey cloud) so Vercel can issue the
   certificate.
3. Wait for Vercel to show the domain as valid; HTTPS is automatic.

**Confirm:** `https://crm.absolutemind.co.uk/login` loads over HTTPS with the
Absolute Mind branding.

## 4. Vercel Deployment Protection — public routes MUST stay public

> **Critical.** Production currently returns `302 → vercel.com/login` for `/login`
> **and** for the public routes `/enquiry`, `/embed/*` and `/embed.js`. In that state
> WordPress visitors cannot see the form and the embed script cannot load. The app
> also cannot tell the difference — Vercel intercepts the request before Next.js runs.

Vercel Authentication (Project → **Settings → Deployment Protection**) has three
scopes:

| Scope | Protects | Effect on the CRM |
| --- | --- | --- |
| **Standard Protection** (recommended) | Preview deployments and every generated `*.vercel.app` URL. The **custom production domain stays public**. | `crm.absolutemind.co.uk` works for visitors; `<project>.vercel.app` still asks for a Vercel login. Available on all plans. |
| **Only Preview Deployments** | Previews only. | Production domain and production `*.vercel.app` URL are both public. |
| **All Deployments** | Everything, including custom production domains. | Breaks `/enquiry`, `/embed/*`, `/embed.js` for the public. Pro/Enterprise add-on. |

Vercel has **no per-path exception**; protection is all-or-nothing per deployment.
Choose one of the following:

### Option A (recommended) — Standard Protection + custom domain

1. Set Vercel Authentication to **Standard Protection** (or **Disabled** if you don't
   need previews gated).
2. Make sure `crm.absolutemind.co.uk` is attached to the project (§3) and that every
   public URL you hand out uses it — the `/forms` snippets, `NEXT_PUBLIC_APP_URL`,
   the WordPress embed. Never publish a `*.vercel.app` URL.
3. The CRM itself stays protected by its own login (`src/proxy.ts` redirects
   unauthenticated users to `/login`; only `/login`, `/enquiry`, `/embed/*`,
   `/embed.js` and `/api/enquiries` are public).

### Option B — keep "All Deployments" and use Protection Bypass for Automation

Only if the production domain must stay behind Vercel login. **Settings →
Deployment Protection → Protection Bypass for Automation** issues a secret that can
be appended to a URL as `?x-vercel-protection-bypass=<secret>`. The embed snippet
would then need that query string on the `/embed.js` `src`. This publishes the
bypass secret in the page source of the WordPress site and unlocks *every* route,
so it is not suitable for a public form. Prefer Option A.

**Confirm (from a private/incognito window, not logged in to Vercel):**

```bash
curl -sI https://crm.absolutemind.co.uk/enquiry | head -1        # HTTP/2 200
curl -sI https://crm.absolutemind.co.uk/embed/enquiry | head -1  # HTTP/2 200
curl -sI https://crm.absolutemind.co.uk/embed.js | head -1       # HTTP/2 200
curl -sI https://crm.absolutemind.co.uk/dashboard | head -1      # 307 → /login (app login, not Vercel)
```

Any `302` to `vercel.com/login` means Deployment Protection is still gating the
domain.

## 5. Cloudflare Turnstile (spam protection)

1. Cloudflare dashboard → **Turnstile → Add widget**. Mode *Managed*.
2. **Hostnames:** add `crm.absolutemind.co.uk`. The widget renders inside the CRM's
   iframe, so it is the CRM hostname that must be listed — not the WordPress domain.
   Add the `*.vercel.app` preview hostname too if you want previews to pass.
3. Copy the **Site Key** into `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and the **Secret Key**
   into `TURNSTILE_SECRET_KEY` on Vercel, then redeploy (the site key is baked into
   the client bundle).
4. Behaviour:
   - Both keys set → widget shows on `/enquiry` and `/embed/enquiry`; the API verifies
     every token with Cloudflare Siteverify and rejects missing/invalid tokens with a
     clear message.
   - Both unset → no widget, verification skipped (demo mode / local dev).
   - Only the secret set → every submission is rejected as "Please complete the spam
     check" because the client never receives a token. Set both or neither.
5. Local testing without a Cloudflare account: use Cloudflare's test keys
   (site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`,
   always pass; site `2x00000000000000000000AB` always fails).

**Confirm:** submit the form once from the live WordPress page; Cloudflare →
Turnstile → widget analytics should show one solve and one Siteverify validation.

## 6. Embed allowlist (who may iframe the form)

`/embed/*` responses carry `Content-Security-Policy: frame-ancestors …`. The default
allowlist is:

```
'self'
https://absolutemind.co.uk  https://www.absolutemind.co.uk
https://paulasweet.co.uk    https://www.paulasweet.co.uk
https://crm.absolutemind.co.uk
http://localhost:3000
```

To change it (new site, staging WordPress, etc.) set `EMBED_FRAME_ANCESTORS` on
Vercel to a comma- or space-separated list of origins and **redeploy** — it is read
by `next.config.ts` at build time. `'self'` is always included so the `/forms`
preview works on any deployment URL.

**Confirm:** `curl -sI https://crm.absolutemind.co.uk/embed/enquiry | grep -i
content-security-policy` shows the expected origins. Framing from an unlisted site
renders an empty frame with a CSP error in the browser console.

## 7. WordPress embed

1. Log in to the CRM → **/forms**. Pick the template, fields, accent colour, lead
   source and (optionally) the booking redirect.
2. Copy the **Recommended embed** snippet — it looks like:

   ```html
   <div data-absolute-mind-form data-form="enquiry" data-source="Website"></div>
   <script src="https://crm.absolutemind.co.uk/embed.js" async></script>
   ```

3. In WordPress, edit the page → add a **Custom HTML** block → paste → Update.
4. The iframe auto-resizes to its content. For a fixed-height fallback use the
   "Plain iframe" snippet from the same page.

Make sure the snippet was copied while viewing `/forms` on
`https://crm.absolutemind.co.uk` — the script derives the API origin from its own
`src`, so a snippet copied from a preview URL would point WordPress at that preview.

## 8. Post-deploy smoke checks

Run these on production after every release:

- [ ] `/login` shows the branded sign-in with no "Demo:" hint; Paula can sign in.
- [ ] Dashboard → open a contact → **Add note** opens as a centred dialog with a dimmed
      overlay and saves to the timeline.
- [ ] Contacts → **Add contact** creates a contact that appears in the list and the
      pipeline's *New enquiry* column.
- [ ] Incognito window: `/enquiry` loads **without** a Vercel login prompt;
      `/embed/enquiry` and `/embed.js` return 200 (§4).
- [ ] With Turnstile keys set: the widget appears on `/enquiry`, a real submission
      succeeds, the contact lands in *New enquiry*, Paula's notification email and the
      acknowledgement email arrive, and the timeline records **both** outcomes
      separately (each shows sent / not sent / failed).
- [ ] Submit the same form with a stale/tampered token (e.g. from DevTools replay) →
      "Spam check failed" and no contact is created.
- [ ] The live WordPress page renders the form inside the iframe and it resizes on
      mobile widths.
- [ ] `/embed/enquiry` shows the correct `frame-ancestors` header (§6).

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Public form 302s to `vercel.com/login` | Deployment Protection scope is *All Deployments*, or you are on a `*.vercel.app` URL. See §4. |
| Form renders but submissions fail with "Please complete the spam check" | `TURNSTILE_SECRET_KEY` set but `NEXT_PUBLIC_TURNSTILE_SITE_KEY` missing at build time. Set both, redeploy. |
| Widget shows an error / "could not load" | CRM hostname not in the Turnstile widget's hostname list, or a content blocker on the visitor's browser. |
| Empty iframe on WordPress | Host origin not in `EMBED_FRAME_ANCESTORS`; check the browser console for a `frame-ancestors` violation. |
| Emails not arriving | `RESEND_API_KEY` missing or the `EMAIL_FROM` domain is not verified in Resend. Each enquiry sends two independent emails (acknowledgement + Paula notification); the contact timeline records, per email, why it was skipped or failed. |
| Sample data on production | `DEMO_MODE` is `true` or Supabase keys are missing. |
