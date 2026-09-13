CREATE TABLE public.lead_rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash text NOT NULL,
  window_start timestamp with time zone NOT NULL,
  window_kind text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 1,
  blocked_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (ip_hash, window_kind, window_start)
);

GRANT ALL ON public.lead_rate_limits TO service_role;

ALTER TABLE public.lead_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX lead_rate_limits_window_idx ON public.lead_rate_limits (window_start DESC);

CREATE TRIGGER lead_rate_limits_set_updated_at
  BEFORE UPDATE ON public.lead_rate_limits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ip_hash text;