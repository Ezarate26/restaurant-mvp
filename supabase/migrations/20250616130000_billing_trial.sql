-- Trial único por usuario (email / user_id / stripe_customer_id vía user_billing)
ALTER TABLE public.user_billing
  ADD COLUMN IF NOT EXISTS trial_used_at timestamptz;

COMMENT ON COLUMN public.user_billing.trial_used_at IS
  'Marca cuándo el usuario consumió su prueba gratis de Pro (una sola vez)';
