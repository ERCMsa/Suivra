
-- Suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  is_recommended BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers viewable by authenticated" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Suppliers insertable by role" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'magasinier'::app_role]));
CREATE POLICY "Suppliers updatable by role" ON public.suppliers FOR UPDATE TO authenticated USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'magasinier'::app_role]));
CREATE POLICY "Suppliers deletable by admin" ON public.suppliers FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Supplier-Product link table
CREATE TABLE public.supplier_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, product_id)
);

ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supplier products viewable by authenticated" ON public.supplier_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Supplier products insertable by role" ON public.supplier_products FOR INSERT TO authenticated WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'magasinier'::app_role]));
CREATE POLICY "Supplier products updatable by role" ON public.supplier_products FOR UPDATE TO authenticated USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'magasinier'::app_role]));
CREATE POLICY "Supplier products deletable by role" ON public.supplier_products FOR DELETE TO authenticated USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'magasinier'::app_role]));
