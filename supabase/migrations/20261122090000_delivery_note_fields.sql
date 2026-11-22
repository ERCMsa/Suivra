
ALTER TABLE public.discharges
  ADD COLUMN IF NOT EXISTS has_delivery_note boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_destination text,
  ADD COLUMN IF NOT EXISTS delivery_driver text,
  ADD COLUMN IF NOT EXISTS delivery_vehicle_plate text;
