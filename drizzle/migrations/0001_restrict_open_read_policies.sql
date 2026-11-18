DO $$
DECLARE t text; p text;
BEGIN
FOR t,p IN SELECT * FROM (VALUES
 ('caisse_items','Caisse items viewable by authenticated'),
 ('caisse_movements','Caisse movements viewable by authenticated'),
 ('caisses','Caisses viewable by authenticated'),
 ('damage_reports','Damage reports viewable by authenticated'),
 ('discharge_items','Discharge items viewable by authenticated'),
 ('purchase_requests','Purchase requests viewable by authenticated'),
 ('stock_movements','Movements viewable by authenticated'),
 ('supplier_categories','Categories readable by signed in users'),
 ('supplier_category_links','Supplier categories readable by signed in users'),
 ('supplier_products','Supplier products viewable by authenticated')) v(a,b)
LOOP
 EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p, t);
 EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY[''admin'',''worker'',''magasinier'',''chef_chantier'',''viewer'']::public.app_role[]))', p, t);
END LOOP;
END $$;

DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_any_role(auth.uid(), ARRAY['admin','worker','magasinier','chef_chantier','viewer']::public.app_role[]));

DROP POLICY IF EXISTS "Public read employees" ON public.employees;
DROP POLICY IF EXISTS "Public read suppliers" ON public.suppliers;

DROP POLICY IF EXISTS "Requests insertable by authenticated" ON public.withdrawal_requests;
CREATE POLICY "Requests insertable by authenticated" ON public.withdrawal_requests FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND public.has_any_role(auth.uid(), ARRAY['admin','worker','magasinier','chef_chantier','viewer']::public.app_role[]));