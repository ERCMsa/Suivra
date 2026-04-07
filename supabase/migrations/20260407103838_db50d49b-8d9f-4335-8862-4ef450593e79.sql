
CREATE TABLE public.purchase_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  current_stock NUMERIC NOT NULL DEFAULT 0,
  min_threshold NUMERIC NOT NULL DEFAULT 0,
  suggested_quantity NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT DEFAULT NULL,
  created_by UUID DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Purchase requests viewable by authenticated" ON public.purchase_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Purchase requests insertable by authenticated" ON public.purchase_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Purchase requests updatable by authenticated" ON public.purchase_requests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Purchase requests deletable by authenticated" ON public.purchase_requests FOR DELETE TO authenticated USING (true);
