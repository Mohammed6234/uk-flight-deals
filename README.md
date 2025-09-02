This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Supabase: indexes and optional columns

Run the following SQL in your project’s Supabase SQL Editor to add helpful indexes and an optional column used by the app. These statements are idempotent (safe to re-run).

```sql
-- Recommended indexes
create index if not exists deals_published_idx on public.deals (is_published);
create index if not exists deals_found_at_idx on public.deals (found_at desc);
create index if not exists subs_email_idx on public.subscribers (email);

-- Optional column
alter table public.deals add column if not exists last_notified_at timestamptz;
```

Reference copy lives in `supabase_migrations.sql` (comment-only) at the project root.

## Ingestion + Cron (Daily Deals)

- API route: `src/app/api/ingest/route.ts:1`
  - POST only. Fetches 2 public UK deal pages, asks OpenAI to extract structured deals, and upserts to `public.deals` with `is_published=true`.
  - Returns `{ ok: true, inserted: N }`.
- Cron: `vercel.json:1`
  - Schedules `POST /api/ingest` at `5 8 * * *` (08:05 daily, London time via Vercel’s region handling).
- Local test:

```bash
curl -X POST http://localhost:3000/api/ingest
```

### Required env vars

Set these in Vercel Project → Settings → Environment Variables (and in `.env.local` for local dev):

- `OPENAI_API_KEY` — for ingestion extraction (server-only)
- `NEXT_PUBLIC_BASE_URL` — e.g. `http://localhost:3000` or your site URL
- Supabase (already used): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- SMTP (already used for emails): `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

## Airports Drilldown UI

- Airports list: `src/app/airports/page.tsx`
- Months by origin: `src/app/airports/[origin]/page.tsx`
- Deals by month: `src/app/airports/[origin]/[month]/page.tsx`

Browse:

- `/airports` → unique UK origin airports with published deals
- `/airports/MAN` → month chips derived from `outbound_dates`
- `/airports/MAN/Nov` → deals with hero images + destination blurbs
