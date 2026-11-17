-- User-managed supplier categories: idempotent mirror of
-- drizzle/migrations/0000_user_managed_supplier_categories.sql
-- No category is ever seeded here: the interface starts empty.

CREATE TABLE IF NOT EXISTS public.supplier_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  description text NOT NULL DEFAULT '',
  image_url text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_categories TO authenticated;
GRANT ALL ON public.supplier_categories TO service_role;
ALTER TABLE public.supplier_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories readable by signed in users" ON public.supplier_categories;
CREATE POLICY "Categories readable by signed in users" ON public.supplier_categories FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Categories created by managers" ON public.supplier_categories;
CREATE POLICY "Categories created by managers" ON public.supplier_categories FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','magasinier']::public.app_role[]));
DROP POLICY IF EXISTS "Categories edited by managers" ON public.supplier_categories;
CREATE POLICY "Categories edited by managers" ON public.supplier_categories FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','magasinier']::public.app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','magasinier']::public.app_role[]));
DROP POLICY IF EXISTS "Categories deleted by admins" ON public.supplier_categories;
CREATE POLICY "Categories deleted by admins" ON public.supplier_categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_supplier_categories_updated_at ON public.supplier_categories;
CREATE TRIGGER update_supplier_categories_updated_at BEFORE UPDATE ON public.supplier_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.supplier_category_links (
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.supplier_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (supplier_id, category_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_category_links TO authenticated;
GRANT ALL ON public.supplier_category_links TO service_role;
ALTER TABLE public.supplier_category_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Supplier categories readable by signed in users" ON public.supplier_category_links;
CREATE POLICY "Supplier categories readable by signed in users" ON public.supplier_category_links FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Supplier categories assigned by managers" ON public.supplier_category_links;
CREATE POLICY "Supplier categories assigned by managers" ON public.supplier_category_links FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','magasinier']::public.app_role[]));
DROP POLICY IF EXISTS "Supplier categories edited by managers" ON public.supplier_category_links;
CREATE POLICY "Supplier categories edited by managers" ON public.supplier_category_links FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','magasinier']::public.app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','magasinier']::public.app_role[]));
DROP POLICY IF EXISTS "Supplier categories unassigned by managers" ON public.supplier_category_links;
CREATE POLICY "Supplier categories unassigned by managers" ON public.supplier_category_links FOR DELETE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','magasinier']::public.app_role[]));

CREATE INDEX IF NOT EXISTS supplier_category_links_category_idx ON public.supplier_category_links(category_id);

COMMENT ON COLUMN public.suppliers.category IS 'DEPRECATED: user-managed categories now use supplier_category_links; legacy text preserved without creating categories.';

CREATE OR REPLACE FUNCTION public.save_supplier_with_categories(_id uuid, _data jsonb, _category_ids uuid[]) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE saved_id uuid;
BEGIN
 IF _id IS NULL THEN
  INSERT INTO public.suppliers(name, category, phone, email, address, notes, image_url, is_recommended, created_by)
  VALUES (btrim(_data->>'name'), '', _data->>'phone', _data->>'email', _data->>'address', _data->>'notes', _data->>'image_url', COALESCE((_data->>'is_recommended')::boolean, false), auth.uid()) RETURNING id INTO saved_id;
 ELSE
  UPDATE public.suppliers SET
   name = CASE WHEN _data ? 'name' THEN btrim(_data->>'name') ELSE name END,
   phone = CASE WHEN _data ? 'phone' THEN _data->>'phone' ELSE phone END,
   email = CASE WHEN _data ? 'email' THEN _data->>'email' ELSE email END,
   address = CASE WHEN _data ? 'address' THEN _data->>'address' ELSE address END,
   notes = CASE WHEN _data ? 'notes' THEN _data->>'notes' ELSE notes END,
   image_url = CASE WHEN _data ? 'image_url' THEN _data->>'image_url' ELSE image_url END,
   is_recommended = CASE WHEN _data ? 'is_recommended' THEN (_data->>'is_recommended')::boolean ELSE is_recommended END
  WHERE id = _id RETURNING id INTO saved_id;
  IF saved_id IS NULL THEN RAISE EXCEPTION 'Supplier unavailable or insufficient permission'; END IF;
 END IF;
 IF _category_ids IS NOT NULL THEN
  DELETE FROM public.supplier_category_links WHERE supplier_id = saved_id AND NOT (category_id = ANY(_category_ids));
  INSERT INTO public.supplier_category_links(supplier_id, category_id)
  SELECT saved_id, category_id FROM (SELECT DISTINCT unnest(_category_ids) AS category_id) ids
  ON CONFLICT DO NOTHING;
 END IF;
 RETURN saved_id;
END;
$$;
REVOKE ALL ON FUNCTION public.save_supplier_with_categories(uuid,jsonb,uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_supplier_with_categories(uuid,jsonb,uuid[]) TO authenticated, service_role;
