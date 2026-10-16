-- CivilMath Supabase fixes — run once in the Supabase Dashboard → SQL Editor
-- (https://supabase.com/dashboard → your project → SQL Editor → New query → paste → Run)
--
-- Part 1: Lock down the inquiries table (contact-form submissions).
--   All legitimate access goes through server-side API routes (/api/contact,
--   /api/inquiries) which use the SERVICE ROLE key and bypass RLS.
--   After this, the anon key gets NOTHING on this table.
--
-- Part 2: Create the newsletter_subscribers table for email capture.
--   Writes go through /api/newsletter (service role). No anon access.

-- ============ Part 1: inquiries lockdown ============
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'inquiries' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON inquiries', r.policyname);
  END LOOP;
END $$;

-- ============ Part 2: newsletter table ============
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- No policies = anon/authenticated roles get nothing.
-- The /api/newsletter route uses the service role key (bypasses RLS).

-- ============ Verify (optional) ============
-- SELECT tablename, policyname, roles, cmd FROM pg_policies
-- WHERE tablename IN ('inquiries', 'newsletter_subscribers');
-- Expected: zero rows (no policies = fully locked for anon).
