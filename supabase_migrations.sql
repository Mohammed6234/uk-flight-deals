-- Supabase SQL notes (documentation only; not executed by build)
-- Copy/paste the statements below into the Supabase SQL Editor to apply.

-- Recommended indexes
-- create index if not exists deals_published_idx on public.deals (is_published);
-- create index if not exists deals_found_at_idx on public.deals (found_at desc);
-- create index if not exists subs_email_idx on public.subscribers (email);

-- Optional columns
-- alter table public.deals add column if not exists last_notified_at timestamptz;

-- Notes:
-- - These are idempotent and safe to re-run.
-- - Run them in your project’s Supabase SQL Editor.
-- - If your schema/table names differ, adjust accordingly.

