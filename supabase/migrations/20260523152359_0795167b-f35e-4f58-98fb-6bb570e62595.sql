
ALTER TABLE public.discharge_items
  ADD COLUMN IF NOT EXISTS return_condition text,
  ADD COLUMN IF NOT EXISTS return_observation text,
  ADD COLUMN IF NOT EXISTS returned_at timestamp with time zone;

ALTER TABLE public.discharges
  ADD COLUMN IF NOT EXISTS return_reference text;
