-- Tiempo extra de sala (sincronizado para todos los participantes vía Realtime).
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS session_extra_ms integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS session_free_bonus_used boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.conversations.session_extra_ms IS
  'Milisegundos extra de sesión concedidos por el propietario.';
COMMENT ON COLUMN public.conversations.session_free_bonus_used IS
  'Si el propietario ya usó el bono único de 10 min (plan Free).';
