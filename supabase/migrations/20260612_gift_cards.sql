-- ─────────────────────────────────────────────────────────────────────────────
-- Gift cards: compra sin registro, código secreto, canje por meses de plan
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.gift_cards (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code              text        UNIQUE NOT NULL,          -- ITAL-XXXX-XXXX-XXXX
  plan_type         text        NOT NULL
                                CHECK (plan_type IN ('essenziale','avanzato','maestro')),
  months            integer     NOT NULL CHECK (months IN (1, 3, 12)),
  amount_usd        numeric(10,2) NOT NULL,
  buyer_email       text        NOT NULL,
  buyer_name        text,
  recipient_email   text,                                  -- si es null, se envía al comprador
  recipient_name    text,
  message           text,                                  -- mensaje personal del comprador
  lang              text        NOT NULL DEFAULT 'es'
                                CHECK (lang IN ('es','it','en')),
  stripe_session_id text        UNIQUE,
  status            text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','active','redeemed','expired')),
  paid_at           timestamptz,
  expires_at        timestamptz,                           -- paid_at + 12 meses
  redeemed_by       text,                                  -- user_id que canjeó
  redeemed_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gift_cards_status_idx
  ON public.gift_cards (status, created_at DESC);

-- RLS: acceso solo vía service role
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
