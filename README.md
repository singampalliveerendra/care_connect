# CareConnect India — MVP

A discovery and lead-generation marketplace for aged care in Indian cities.
Families search by city and service, compare providers and what has actually been
verified about them, and send one structured care request that reaches the provider.

Built as a greenfield implementation of `docs/CareConnect_MVP_Developer_Brief_v1.0.pdf`.
The previous portal is explicitly **not** the baseline (brief §2).

```
City → Service → Provider → Trust → Structured Care Request → Lead → Provider Response
```

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4, tokens in `src/app/globals.css` |
| Database | Supabase Postgres, RLS on every table |
| Auth | **Supabase Auth** — the brief left this open (§15); chosen so RLS policies read `auth.uid()` directly with no second vendor |
| Validation | Zod, shared by API routes and server actions |
| Hosting | Vercel (not yet deployed) |

## Running it

```bash
pnpm install
cp .env.example .env.local     # fill in the Supabase URL and publishable key
pnpm dev
```

`.env.local` needs:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
LEAD_DELIVERY_ADAPTER=log
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

There is no service-role key in the app, and there must not be (brief §16).
Everything the app does runs under RLS as either `anon` or the signed-in user.

## Database

Migrations live in `supabase/migrations/` and are already applied to the linked project.
`supabase/seed.sql` loads demo data: 13 cities (7 active), 12 services, 30 fictional
providers. **All seeded providers are fake** — placeholder names, `example.com` emails,
non-routable phone numbers. Replace before any marketing launch (brief §28, sprint 6).

### Security model

- **Public** can read active cities, active services, and providers that are
  `approved` **and** in an active city. Nothing else.
- **Anonymous families** can insert an enquiry, but cannot read any enquiry back —
  verified: `select * from enquiries` as `anon` returns `[]`.
- **Providers** read only their own enquiries and delivery records.
- **Column-level grants** stop a provider editing its own `status`, `verification`,
  `tier` or `slug`. Paying for a listing can never buy a trust badge (brief §11, §24).
- Enquiry ids are generated server-side rather than via `INSERT ... RETURNING`,
  because returning a row requires a SELECT policy the family deliberately lacks.

### Admin

There is no custom admin UI, by design (brief §6.3). Approvals, verification, city
activation and tier changes are done in Supabase Studio on the service role.

## Lead delivery

`src/lib/lead-delivery.ts` is a service layer with swappable transports (brief §15).

The shipped `log` adapter records every attempt in `lead_deliveries` without sending
anything. A lead still reaches the provider — it lands in their dashboard as an
`in_app` delivery marked `sent`, while `email` and `whatsapp` are recorded as
`skipped`. Tier decides which push channels are attempted: Premium gets email +
WhatsApp, Standard gets email, Free gets neither (brief §12).

To add real email or WhatsApp: implement one `LeadTransport`, add a `case` to
`getTransport()`, set `LEAD_DELIVERY_ADAPTER`. Nothing else changes.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/cities` | Active cities + provider counts |
| GET | `/api/services` | Service and category lookup |
| GET | `/api/providers` | Search, filter, paginate |
| GET | `/api/providers/[slug]` | Public provider profile |
| POST | `/api/enquiries` | Create a structured care request |

Rate limited to 5 enquiries per IP per minute, plus a honeypot field. The limiter is
in-memory, so it holds per server instance — move it to Upstash/Vercel KV before real
traffic (noted in `src/lib/rate-limit.ts`).

## What is built

- Homepage, city selector, service catalogue, search with 5 filters, pagination
- SSR provider profiles with JSON-LD, canonical URLs, OG metadata, sitemap, robots
- City × service landing URLs in the sitemap (the SEO engine, brief §14)
- 18-field structured care request, server-validated, with confirmation page
- Provider signup, multi-step registration, application status, dashboard, lead inbox
- NRI landing page, How It Works, About, Contact, Privacy, Terms

## What is not built

Deliberately out of MVP (brief §20): booking, consumer payments, in-app messaging,
native apps, AI anything, family accounts, medical records, reviews.

Cut from day one and still to do:

- **Stripe subscriptions and checkout** — tier exists in the schema and drives search
  ranking and lead channels, but there is no billing. Sprint 5.
- **Real email / WhatsApp transport** — both need external account approval.
- **Provider self-serve profile editing** — the dashboard is read-only; edits go
  through support for now.
- **Provider analytics** — `provider_analytics` is in the brief but not yet built.
- **Test suite** — verified manually end to end; no automated tests yet.
- **Legal review** of the Privacy and Terms pages, which are marked draft on the page.

## Known setup step

Supabase email confirmation is still **on**, so a new provider signup returns
"check your email" rather than a session. For demos, turn it off in
Studio → Authentication → Sign In / Providers → Email → *Confirm email*.
