
-- Tighten RLS policies to use role-based access where missing

-- EMPLOYEES: restrict to admin/magasinier
DROP POLICY IF EXISTS "Employees viewable by authenticated" ON public.employees;
DROP POLICY IF EXISTS "Employees insertable by authenticated" ON public.employees;
DROP POLICY IF EXISTS "Employees updatable by authenticated" ON public.employees;
DROP POLICY IF EXISTS "Employees deletable by authenticated" ON public.employees;
CREATE POLICY "Employees viewable by role" ON public.employees FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'magasinier'::app_role, 'chef_chantier'::app_role]));
CREATE POLICY "Employees insertable by role" ON public.employees FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'magasinier'::app_role]));
CREATE POLICY "Employees updatable by role" ON public.employees FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'magasinier'::app_role]));
CREATE POLICY "Employees deletable by admin" ON public.employees FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- DAMAGE REPORTS
DROP POLICY IF EXISTS "Damage reports insertable by authenticated" ON public.damage_reports;
DROP POLICY IF EXISTS "Damage reports deletable by authenticated" ON public.damage_reports;
CREATE POLICY "Damage reports insertable by role" ON public.damage_reports FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'magasinier'::app_role]));
CREATE POLICY "Damage reports deletable by admin" ON public.damage_reports FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- PURCHASE REQUESTS
DROP POLICY IF EXISTS "Purchase requests insertable by authenticated" ON public.purchase_requests;
DROP POLICY IF EXISTS "Purchase requests updatable by authenticated" ON public.purchase_requests;
DROP POLICY IF EXISTS "Purchase requests deletable by authenticated" ON public.purchase_requests;
CREATE POLICY "Purchase requests insertable by role" ON public.purchase_requests FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'magasinier'::app_role]));
CREATE POLICY "Purchase requests updatable by role" ON public.purchase_requests FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'magasinier'::app_role]));
CREATE POLICY "Purchase requests deletable by admin" ON public.purchase_requests FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- CAISSES
DROP POLICY IF EXISTS "Caisses insertable by authenticated" ON public.caisses;
DROP POLICY IF EXISTS "Caisses updatable by authenticated" ON public.caisses;
DROP POLICY IF EXISTS "Caisses deletable by authenticated" ON public.caisses;
CREATE POLICY "Caisses insertable by role" ON public.caisses FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'magasinier'::app_role]));
CREATE POLICY "Caisses updatable by role" ON public.caisses FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'magasinier'::app_role]));
CREATE POLICY "Caisses deletable by admin" ON public.caisses FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- CAISSE ITEMS
DROP POLICY IF EXISTS "Caisse items insertable by authenticated" ON public.caisse_items;
DROP POLICY IF EXISTS "Caisse items updatable by authenticated" ON public.caisse_items;
DROP POLICY IF EXISTS "Caisse items deletable by authenticated" ON public.caisse_items;
CREATE POLICY "Caisse items insertable by role" ON public.caisse_items FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'magasinier'::app_role]));
CREATE POLICY "Caisse items updatable by role" ON public.caisse_items FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'magasinier'::app_role]));
CREATE POLICY "Caisse items deletable by role" ON public.caisse_items FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'magasinier'::app_role]));

-- CAISSE MOVEMENTS
DROP POLICY IF EXISTS "Caisse movements insertable by authenticated" ON public.caisse_movements;
CREATE POLICY "Caisse movements insertable by role" ON public.caisse_movements FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'magasinier'::app_role]));

-- DISCHARGE ITEMS
DROP POLICY IF EXISTS "Discharge items insertable by authenticated" ON public.discharge_items;
DROP POLICY IF EXISTS "Discharge items updatable by authenticated" ON public.discharge_items;
DROP POLICY IF EXISTS "Discharge items deletable by authenticated" ON public.discharge_items;
CREATE POLICY "Discharge items insertable by role" ON public.discharge_items FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'magasinier'::app_role]));
CREATE POLICY "Discharge items updatable by role" ON public.discharge_items FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'magasinier'::app_role]));
CREATE POLICY "Discharge items deletable by admin" ON public.discharge_items FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- USER ROLES: restrict SELECT so users see only their own; admins see all
DROP POLICY IF EXISTS "Roles viewable by authenticated" ON public.user_roles;
CREATE POLICY "Users view own role; admins view all" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- SECURITY DEFINER functions: lock down execution to authenticated only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO authenticated, service_role;

-- ATTACHMENTS bucket: restrict DELETE/INSERT to staff roles; keep public read for image display
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Staff can upload attachments" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attachments' AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'magasinier'::app_role]));
CREATE POLICY "Staff can delete attachments" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'attachments' AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'magasinier'::app_role]));
