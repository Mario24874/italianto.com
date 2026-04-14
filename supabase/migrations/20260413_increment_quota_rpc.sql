-- Función RPC centralizada para incrementar cuotas de uso
-- Usada por: italianto.com, dialoghi-studio, italiantoapp-next
-- Columnas soportadas: tutor_minutes_used, dialogues_used, audio_used

CREATE OR REPLACE FUNCTION increment_quota(
  p_user_id TEXT,
  p_column  TEXT,
  p_amount  NUMERIC DEFAULT 1
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validar que la columna sea una de las permitidas para evitar SQL injection
  IF p_column NOT IN ('tutor_minutes_used', 'dialogues_used', 'audio_used') THEN
    RAISE EXCEPTION 'Columna no permitida: %', p_column;
  END IF;

  EXECUTE format(
    'UPDATE subscriptions SET %I = COALESCE(%I, 0) + $1, updated_at = NOW() WHERE user_id = $2',
    p_column, p_column
  ) USING p_amount, p_user_id;
END;
$$;

-- Dar acceso a service_role (usado por las APIs server-side)
GRANT EXECUTE ON FUNCTION increment_quota(TEXT, TEXT, NUMERIC) TO service_role;
