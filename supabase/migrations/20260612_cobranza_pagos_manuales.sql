-- ─────────────────────────────────────────────────────────────────────────────
-- Sistema de cobranza: fallos de cobro Stripe + pagos manuales (Pago Móvil/Zelle)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Fallos de cobro (Stripe invoice.payment_failed + vencimientos manuales)
CREATE TABLE IF NOT EXISTS public.payment_failures (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source                 text        NOT NULL DEFAULT 'stripe'
                                     CHECK (source IN ('stripe','manual')),
  stripe_invoice_id      text        UNIQUE,
  stripe_subscription_id text,
  stripe_customer_id     text,
  user_id                text,
  email                  text,
  plan_type              text,
  billing_interval       text,
  amount                 integer,             -- centavos USD
  currency               text        DEFAULT 'usd',
  failure_type           text        NOT NULL
                                     CHECK (failure_type IN ('initial','renewal')),
  failure_message        text,
  attempt_count          integer     DEFAULT 1,
  next_retry_at          timestamptz,
  status                 text        NOT NULL DEFAULT 'open'
                                     CHECK (status IN ('open','recovered','abandoned')),
  resolved_at            timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_failures_status_idx
  ON public.payment_failures (status, created_at DESC);

-- 2. Pagos manuales reportados (Pago Móvil / Zelle)
CREATE TABLE IF NOT EXISTS public.manual_payments (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          text        NOT NULL,
  email            text        NOT NULL,
  full_name        text,
  plan_type        text        NOT NULL
                               CHECK (plan_type IN ('essenziale','avanzato','maestro')),
  billing_interval text        NOT NULL CHECK (billing_interval IN ('month','year')),
  method           text        NOT NULL CHECK (method IN ('pago_movil','zelle')),
  reference        text        NOT NULL,    -- nº de referencia/confirmación del pago
  amount_usd       numeric(10,2),
  payer_phone      text,                    -- teléfono emisor (pago móvil)
  payer_bank       text,                    -- banco emisor (pago móvil)
  note             text,
  kind             text        NOT NULL DEFAULT 'initial'
                               CHECK (kind IN ('initial','renewal')),
  status           text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','approved','rejected')),
  admin_note       text,
  reviewed_at      timestamptz,
  reviewed_by      text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS manual_payments_status_idx
  ON public.manual_payments (status, created_at DESC);
CREATE INDEX IF NOT EXISTS manual_payments_user_idx
  ON public.manual_payments (user_id);

-- 3. RLS: acceso solo vía service role (igual que el resto de tablas internas)
ALTER TABLE public.payment_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_payments  ENABLE ROW LEVEL SECURITY;
