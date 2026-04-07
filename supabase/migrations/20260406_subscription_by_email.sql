-- RPC: get_subscription_by_email
-- Used by ItaliantoApp (native) to look up a subscription by user email.
-- The native app has its own Clerk instance with different user IDs,
-- so we bridge by email to find the italianto.com subscription.

CREATE OR REPLACE FUNCTION get_subscription_by_email(p_email TEXT)
RETURNS TABLE(
  user_id       TEXT,
  plan_type     TEXT,
  status        TEXT,
  tutor_minutes_used    INTEGER,
  tutor_minutes_reset_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    s.user_id,
    s.plan_type,
    s.status,
    s.tutor_minutes_used,
    s.tutor_minutes_reset_at
  FROM subscriptions s
  JOIN users u ON u.id = s.user_id
  WHERE u.email = p_email
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;
$$;

-- Allow anon key to call this function (read-only, no sensitive data exposed)
GRANT EXECUTE ON FUNCTION get_subscription_by_email(TEXT) TO anon, authenticated;
