ALTER TABLE public.discharge_items
ADD COLUMN IF NOT EXISTS returned_quantity numeric NOT NULL DEFAULT 0;

-- Allow updating discharge_items so we can track partial returns
DROP POLICY IF EXISTS "Discharge items updatable by authenticated" ON public.discharge_items;
CREATE POLICY "Discharge items updatable by authenticated"
ON public.discharge_items
FOR UPDATE
TO authenticated
USING (true);