
CREATE TABLE public.discharges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  date_out timestamp with time zone NOT NULL DEFAULT now(),
  date_returned timestamp with time zone,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.discharges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Discharges viewable by authenticated" ON public.discharges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Discharges insertable by authenticated" ON public.discharges FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Discharges updatable by authenticated" ON public.discharges FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Discharges deletable by authenticated" ON public.discharges FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_discharges_updated_at BEFORE UPDATE ON public.discharges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
