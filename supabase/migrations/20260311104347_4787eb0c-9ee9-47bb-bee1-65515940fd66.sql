
CREATE TABLE public.discharge_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discharge_id uuid NOT NULL REFERENCES public.discharges(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity numeric NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discharge_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Discharge items viewable by authenticated" ON public.discharge_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Discharge items insertable by authenticated" ON public.discharge_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Discharge items deletable by authenticated" ON public.discharge_items FOR DELETE TO authenticated USING (true);
