
CREATE TABLE public.damage_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  damage_date timestamp with time zone NOT NULL DEFAULT now(),
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  responsible_person text,
  responsible_team text,
  quantity_damaged numeric NOT NULL DEFAULT 1,
  action_taken text,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.damage_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Damage reports viewable by authenticated" ON public.damage_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Damage reports insertable by authenticated" ON public.damage_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Damage reports deletable by authenticated" ON public.damage_reports FOR DELETE TO authenticated USING (true);
