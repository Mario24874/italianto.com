-- ============================================================
-- SECURITY MIGRATION: RLS hardening + system_notifications
-- 2026-04-23
-- ============================================================

-- ─── P0: Revoke anon access to PII-leaking RPC ───────────────
REVOKE EXECUTE ON FUNCTION get_subscription_by_email(TEXT) FROM anon, authenticated;

-- ─── system_notifications table ──────────────────────────────
CREATE TABLE IF NOT EXISTS system_notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type         TEXT NOT NULL,           -- 'supabase_down' | 'supabase_paused' | 'quota_warning' | 'error_spike' | 'keep_alive' | 'info'
  severity     TEXT NOT NULL DEFAULT 'info',  -- 'critical' | 'warning' | 'info'
  title        TEXT NOT NULL,
  message      TEXT NOT NULL,
  source       TEXT DEFAULT 'n8n',      -- who created it
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ,
  resolved_by  TEXT                     -- admin user_id
);

ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON system_notifications FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── Enable RLS: contact_messages ────────────────────────────
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON contact_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
-- Allow anon INSERT (contact form) but NOT SELECT
CREATE POLICY "anon_insert" ON contact_messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_auth" ON contact_messages FOR INSERT TO authenticated WITH CHECK (true);

-- ─── Enable RLS: error_logs ───────────────────────────────────
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON error_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── Enable RLS: lessons (content gating at DB level) ────────
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON lessons FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_published_only" ON lessons FOR SELECT TO anon USING (status = 'published');
CREATE POLICY "auth_published_only" ON lessons FOR SELECT TO authenticated USING (status = 'published');

-- ─── Enable RLS: lesson_progress ─────────────────────────────
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON lesson_progress FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── Enable RLS: tutor_config ────────────────────────────────
ALTER TABLE tutor_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON tutor_config FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── Enable RLS: tutors ──────────────────────────────────────
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON tutors FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_select" ON tutors FOR SELECT TO anon USING (true);
CREATE POLICY "auth_select" ON tutors FOR SELECT TO authenticated USING (true);

-- ─── Enable RLS: songs ───────────────────────────────────────
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON songs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_published" ON songs FOR SELECT TO anon USING (status = 'published');
CREATE POLICY "auth_published" ON songs FOR SELECT TO authenticated USING (status = 'published');

-- ─── Enable RLS: activities ──────────────────────────────────
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON activities FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_published" ON activities FOR SELECT TO anon USING (status = 'published');
CREATE POLICY "auth_published" ON activities FOR SELECT TO authenticated USING (status = 'published');

-- ─── Enable RLS: info_articles ───────────────────────────────
ALTER TABLE info_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON info_articles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_published" ON info_articles FOR SELECT TO anon USING (status = 'published');
CREATE POLICY "auth_published" ON info_articles FOR SELECT TO authenticated USING (status = 'published');

-- ─── Enable RLS: corsi_dal_vivo ──────────────────────────────
ALTER TABLE corsi_dal_vivo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON corsi_dal_vivo FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_select" ON corsi_dal_vivo FOR SELECT TO anon USING (true);
CREATE POLICY "auth_select" ON corsi_dal_vivo FOR SELECT TO authenticated USING (true);

-- ─── Enable RLS: downloads ───────────────────────────────────
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON downloads FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_select" ON downloads FOR SELECT TO anon USING (true);
CREATE POLICY "auth_select" ON downloads FOR SELECT TO authenticated USING (true);

-- ─── Explicit policy: lesson_weekly_access ───────────────────
CREATE POLICY "service_role_all" ON lesson_weekly_access FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── Index for system_notifications queries ──────────────────
CREATE INDEX IF NOT EXISTS idx_sysnotif_created ON system_notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sysnotif_unresolved ON system_notifications (created_at DESC) WHERE resolved_at IS NULL;
