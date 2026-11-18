-- Central supplier directory: additive migration.
-- Existing suppliers, categories, links, products and legacy data are preserved.
-- No table is dropped, reset or backfilled from the deprecated category text.

ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS wilaya text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS commune text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS whatsapp text;

CREATE TABLE IF NOT EXISTS public.supplier_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  role text,
  phone text,
  whatsapp text,
  email text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_contacts TO authenticated;
GRANT ALL ON public.supplier_contacts TO service_role;
ALTER TABLE public.supplier_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Supplier contacts readable by signed in users" ON public.supplier_contacts;
CREATE POLICY "Supplier contacts readable by signed in users" ON public.supplier_contacts
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Supplier contacts created by managers" ON public.supplier_contacts;
CREATE POLICY "Supplier contacts created by managers" ON public.supplier_contacts
  FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','magasinier']::public.app_role[]));

DROP POLICY IF EXISTS "Supplier contacts edited by managers" ON public.supplier_contacts;
CREATE POLICY "Supplier contacts edited by managers" ON public.supplier_contacts
  FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','magasinier']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','magasinier']::public.app_role[]));

DROP POLICY IF EXISTS "Supplier contacts deleted by managers" ON public.supplier_contacts;
CREATE POLICY "Supplier contacts deleted by managers" ON public.supplier_contacts
  FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','magasinier']::public.app_role[]));

DROP TRIGGER IF EXISTS update_supplier_contacts_updated_at ON public.supplier_contacts;
CREATE TRIGGER update_supplier_contacts_updated_at
  BEFORE UPDATE ON public.supplier_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS supplier_contacts_supplier_idx ON public.supplier_contacts(supplier_id);

-- The previous three-argument signature is replaced by an extended version.
-- The new arguments are optional, so existing callers keep working.
DROP FUNCTION IF EXISTS public.save_supplier_with_categories(uuid, jsonb, uuid[]);

CREATE OR REPLACE FUNCTION public.save_supplier_with_categories(
  _id uuid,
  _data jsonb,
  _category_ids uuid[] DEFAULT NULL,
  _contacts jsonb DEFAULT NULL,
  _product_ids uuid[] DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE saved_id uuid;
BEGIN
 IF _id IS NULL THEN
  INSERT INTO public.suppliers(name, category, phone, whatsapp, email, address, wilaya, commune, notes, image_url, is_recommended, created_by)
  VALUES (
   btrim(_data->>'name'),
   '',
   NULLIF(btrim(COALESCE(_data->>'phone', '')), ''),
   NULLIF(btrim(COALESCE(_data->>'whatsapp', '')), ''),
   NULLIF(btrim(COALESCE(_data->>'email', '')), ''),
   NULLIF(btrim(COALESCE(_data->>'address', '')), ''),
   NULLIF(btrim(COALESCE(_data->>'wilaya', '')), ''),
   NULLIF(btrim(COALESCE(_data->>'commune', '')), ''),
   NULLIF(btrim(COALESCE(_data->>'notes', '')), ''),
   NULLIF(btrim(COALESCE(_data->>'image_url', '')), ''),
   COALESCE((_data->>'is_recommended')::boolean, false),
   auth.uid()
  ) RETURNING id INTO saved_id;
 ELSE
  UPDATE public.suppliers SET
   name = CASE WHEN _data ? 'name' THEN btrim(_data->>'name') ELSE name END,
   phone = CASE WHEN _data ? 'phone' THEN NULLIF(btrim(COALESCE(_data->>'phone', '')), '') ELSE phone END,
   whatsapp = CASE WHEN _data ? 'whatsapp' THEN NULLIF(btrim(COALESCE(_data->>'whatsapp', '')), '') ELSE whatsapp END,
   email = CASE WHEN _data ? 'email' THEN NULLIF(btrim(COALESCE(_data->>'email', '')), '') ELSE email END,
   address = CASE WHEN _data ? 'address' THEN NULLIF(btrim(COALESCE(_data->>'address', '')), '') ELSE address END,
   wilaya = CASE WHEN _data ? 'wilaya' THEN NULLIF(btrim(COALESCE(_data->>'wilaya', '')), '') ELSE wilaya END,
   commune = CASE WHEN _data ? 'commune' THEN NULLIF(btrim(COALESCE(_data->>'commune', '')), '') ELSE commune END,
   notes = CASE WHEN _data ? 'notes' THEN NULLIF(btrim(COALESCE(_data->>'notes', '')), '') ELSE notes END,
   image_url = CASE WHEN _data ? 'image_url' THEN NULLIF(btrim(COALESCE(_data->>'image_url', '')), '') ELSE image_url END,
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

 IF _contacts IS NOT NULL THEN
  DELETE FROM public.supplier_contacts WHERE supplier_id = saved_id;
  INSERT INTO public.supplier_contacts(supplier_id, name, role, phone, whatsapp, email, is_primary)
  SELECT
   saved_id,
   COALESCE(btrim(c->>'name'), ''),
   NULLIF(btrim(COALESCE(c->>'role', '')), ''),
   NULLIF(btrim(COALESCE(c->>'phone', '')), ''),
   NULLIF(btrim(COALESCE(c->>'whatsapp', '')), ''),
   NULLIF(btrim(COALESCE(c->>'email', '')), ''),
   COALESCE((c->>'is_primary')::boolean, false)
  FROM jsonb_array_elements(_contacts) AS contact(c)
  WHERE COALESCE(btrim(c->>'name'), '') <> ''
     OR COALESCE(btrim(c->>'phone'), '') <> ''
     OR COALESCE(btrim(c->>'whatsapp'), '') <> ''
     OR COALESCE(btrim(c->>'email'), '') <> '';
 END IF;

 IF _product_ids IS NOT NULL THEN
  -- Only removed products lose their link; retained rows keep last_used_at.
  DELETE FROM public.supplier_products
  WHERE supplier_id = saved_id AND NOT (product_id = ANY(_product_ids));
  INSERT INTO public.supplier_products(supplier_id, product_id)
  SELECT saved_id, product_id FROM (SELECT DISTINCT unnest(_product_ids) AS product_id) ids
  ON CONFLICT DO NOTHING;
 END IF;

 RETURN saved_id;
END;
$$;
REVOKE ALL ON FUNCTION public.save_supplier_with_categories(uuid, jsonb, uuid[], jsonb, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_supplier_with_categories(uuid, jsonb, uuid[], jsonb, uuid[]) TO authenticated, service_role;
