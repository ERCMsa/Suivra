
-- Convert existing 'worker' roles to 'magasinier'
UPDATE public.user_roles SET role = 'magasinier' WHERE role = 'worker';

-- Create a helper function to check multiple roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;

-- DISCHARGES policies
DROP POLICY IF EXISTS "Discharges viewable by authenticated" ON public.discharges;
CREATE POLICY "Discharges viewable by role"
ON public.discharges FOR SELECT TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['admin', 'magasinier']::app_role[])
  OR created_by = auth.uid()
);

DROP POLICY IF EXISTS "Discharges insertable by authenticated" ON public.discharges;
CREATE POLICY "Discharges insertable by role"
ON public.discharges FOR INSERT TO authenticated
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['admin', 'magasinier']::app_role[])
);

DROP POLICY IF EXISTS "Discharges deletable by authenticated" ON public.discharges;
CREATE POLICY "Discharges deletable by admin"
ON public.discharges FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Discharges updatable by authenticated" ON public.discharges;
CREATE POLICY "Discharges updatable by role"
ON public.discharges FOR UPDATE TO authenticated
USING (has_any_role(auth.uid(), ARRAY['admin', 'magasinier']::app_role[]));

-- STOCK MOVEMENTS policies
DROP POLICY IF EXISTS "Movements insertable by authenticated" ON public.stock_movements;
CREATE POLICY "Movements insertable by role"
ON public.stock_movements FOR INSERT TO authenticated
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'magasinier']::app_role[]));

-- PRODUCTS policies
DROP POLICY IF EXISTS "Products insertable by authenticated" ON public.products;
CREATE POLICY "Products insertable by role"
ON public.products FOR INSERT TO authenticated
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'magasinier']::app_role[]));

DROP POLICY IF EXISTS "Products updatable by authenticated" ON public.products;
CREATE POLICY "Products updatable by role"
ON public.products FOR UPDATE TO authenticated
USING (has_any_role(auth.uid(), ARRAY['admin', 'magasinier']::app_role[]));

DROP POLICY IF EXISTS "Products deletable by authenticated" ON public.products;
CREATE POLICY "Products deletable by admin"
ON public.products FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- WITHDRAWAL REQUESTS: chef_chantier can create, admin can manage
DROP POLICY IF EXISTS "Requests insertable by authenticated" ON public.withdrawal_requests;
CREATE POLICY "Requests insertable by authenticated"
ON public.withdrawal_requests FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Requests updatable by authenticated" ON public.withdrawal_requests;
CREATE POLICY "Requests updatable by role"
ON public.withdrawal_requests FOR UPDATE TO authenticated
USING (has_any_role(auth.uid(), ARRAY['admin', 'magasinier']::app_role[]));

DROP POLICY IF EXISTS "Requests deletable by authenticated" ON public.withdrawal_requests;
CREATE POLICY "Requests deletable by admin"
ON public.withdrawal_requests FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
