-- Inventory snapshots: additive migration.
-- Nothing is dropped, altered or backfilled on existing tables.
-- products keeps its current schema; snapshots store denormalized copies of
-- the reference, designation and unit so history stays readable forever.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.inventory_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  save_order bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  snapshot_type text NOT NULL CHECK (snapshot_type IN ('initial', 'updated')),
  captured_at timestamptz NOT NULL,
  created_by uuid,
  created_by_name text,
  material_count integer NOT NULL DEFAULT 0 CHECK (material_count >= 0),
  total_quantity numeric NOT NULL DEFAULT 0 CHECK (total_quantity >= 0),
  note text,
  request_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_snapshots_request_type_key UNIQUE (request_id, snapshot_type)
);

CREATE INDEX IF NOT EXISTS inventory_snapshots_captured_at_idx
  ON public.inventory_snapshots (captured_at DESC);
CREATE INDEX IF NOT EXISTS inventory_snapshots_type_idx
  ON public.inventory_snapshots (snapshot_type);

CREATE TABLE IF NOT EXISTS public.inventory_snapshot_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES public.inventory_snapshots(id) ON DELETE CASCADE,
  -- Intentionally not a foreign key: deleting or renaming a material must
  -- never mutate or block an immutable historical snapshot.
  product_id uuid,
  reference text NOT NULL,
  designation text NOT NULL,
  unit text NOT NULL DEFAULT '',
  quantity numeric NOT NULL CHECK (quantity >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_snapshot_items_snapshot_idx
  ON public.inventory_snapshot_items (snapshot_id, sort_order);
CREATE INDEX IF NOT EXISTS inventory_snapshot_items_product_idx
  ON public.inventory_snapshot_items (product_id);

-- ---------------------------------------------------------------------------
-- Immutability: snapshots and their lines can never be updated or deleted.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_inventory_snapshot_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Inventory snapshots are immutable and cannot be modified or deleted';
END;
$$;

DROP TRIGGER IF EXISTS inventory_snapshots_immutable ON public.inventory_snapshots;
CREATE TRIGGER inventory_snapshots_immutable
  BEFORE UPDATE OR DELETE ON public.inventory_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.prevent_inventory_snapshot_mutation();

DROP TRIGGER IF EXISTS inventory_snapshot_items_immutable ON public.inventory_snapshot_items;
CREATE TRIGGER inventory_snapshot_items_immutable
  BEFORE UPDATE OR DELETE ON public.inventory_snapshot_items
  FOR EACH ROW EXECUTE FUNCTION public.prevent_inventory_snapshot_mutation();

-- ---------------------------------------------------------------------------
-- Access control
-- ---------------------------------------------------------------------------

GRANT SELECT, INSERT ON public.inventory_snapshots TO authenticated;
GRANT SELECT, INSERT ON public.inventory_snapshot_items TO authenticated;
GRANT ALL ON public.inventory_snapshots TO service_role;
GRANT ALL ON public.inventory_snapshot_items TO service_role;
REVOKE ALL ON public.inventory_snapshots FROM anon;
REVOKE ALL ON public.inventory_snapshot_items FROM anon;

ALTER TABLE public.inventory_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_snapshot_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inventory snapshots readable by inventory managers" ON public.inventory_snapshots;
CREATE POLICY "Inventory snapshots readable by inventory managers"
  ON public.inventory_snapshots FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'magasinier']::public.app_role[]));

DROP POLICY IF EXISTS "Inventory snapshots inserted by inventory managers" ON public.inventory_snapshots;
CREATE POLICY "Inventory snapshots inserted by inventory managers"
  ON public.inventory_snapshots FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'magasinier']::public.app_role[]));

DROP POLICY IF EXISTS "Inventory snapshot items readable by inventory managers" ON public.inventory_snapshot_items;
CREATE POLICY "Inventory snapshot items readable by inventory managers"
  ON public.inventory_snapshot_items FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'magasinier']::public.app_role[]));

DROP POLICY IF EXISTS "Inventory snapshot items inserted by inventory managers" ON public.inventory_snapshot_items;
CREATE POLICY "Inventory snapshot items inserted by inventory managers"
  ON public.inventory_snapshot_items FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'magasinier']::public.app_role[]));

-- No UPDATE or DELETE policy is created on purpose: history is append-only.

-- ---------------------------------------------------------------------------
-- Atomic save
--
-- _items is a JSON array of { "product_id": uuid, "quantity": numeric }.
-- Materials omitted from the payload keep their current quantity, but every
-- snapshot still contains the complete list of materials.
--
-- The whole save runs in a single transaction: either both snapshots (first
-- save), the stock movements and the updated product quantities are written,
-- or nothing is.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.save_inventory_snapshot(
  _request_id uuid,
  _items jsonb,
  _note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz;
  v_updated_id uuid;
  v_initial_id uuid;
  v_name text;
  v_item_count integer;
  v_distinct_count integer;
  v_product_count integer;
  v_has_history boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _request_id IS NULL THEN
    RAISE EXCEPTION 'A request identifier is required';
  END IF;

  IF NOT public.has_any_role(auth.uid(), ARRAY['admin', 'magasinier']::public.app_role[]) THEN
    RAISE EXCEPTION 'Insufficient permission to save an inventory';
  END IF;

  -- Serialize concurrent saves so two tabs cannot both create a baseline.
  PERFORM pg_advisory_xact_lock(hashtext('inventory_snapshot_save'));
  v_now := clock_timestamp();

  -- Idempotent replay: the same request never creates a second snapshot.
  SELECT s.id INTO v_updated_id
  FROM public.inventory_snapshots s
  WHERE s.request_id = _request_id
    AND s.snapshot_type = 'updated'
  LIMIT 1;
  IF v_updated_id IS NOT NULL THEN
    RETURN v_updated_id;
  END IF;

  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' THEN
    RAISE EXCEPTION 'Inventory items must be a JSON array';
  END IF;

  SELECT count(*), count(DISTINCT item ->> 'product_id')
  INTO v_item_count, v_distinct_count
  FROM jsonb_array_elements(_items) AS item;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'No quantity was provided';
  END IF;
  IF v_item_count <> v_distinct_count THEN
    RAISE EXCEPTION 'Duplicate material in inventory payload';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(_items) AS item
    WHERE CASE
            WHEN COALESCE(item ->> 'product_id', '') !~*
                 '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN true
            WHEN item ->> 'quantity' IS NULL THEN true
            WHEN (item ->> 'quantity') !~ '^[0-9]+([.][0-9]+)?$' THEN true
            ELSE (item ->> 'quantity')::numeric < 0
          END
  ) THEN
    RAISE EXCEPTION 'Invalid quantity or material identifier';
  END IF;

  SELECT count(*) INTO v_product_count FROM public.products;
  IF v_product_count = 0 THEN
    RAISE EXCEPTION 'No material to inventory';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(_items) AS item
    WHERE NOT EXISTS (
      SELECT 1 FROM public.products p WHERE p.id = (item ->> 'product_id')::uuid
    )
  ) THEN
    RAISE EXCEPTION 'Unknown material in inventory payload';
  END IF;

  SELECT NULLIF(btrim(display_name), '') INTO v_name
  FROM public.profiles
  WHERE user_id = auth.uid();

  -- Lock the stock rows: quantities read below are the exact ones we snapshot.
  PERFORM 1 FROM public.products FOR UPDATE;

  SELECT EXISTS (SELECT 1 FROM public.inventory_snapshots) INTO v_has_history;

  -- First save: preserve the original quantities as an immutable baseline.
  IF NOT v_has_history THEN
    INSERT INTO public.inventory_snapshots (
      snapshot_type, captured_at, created_by, created_by_name,
      material_count, total_quantity, note, request_id
    )
    SELECT 'initial', v_now, auth.uid(), v_name,
           count(*), COALESCE(sum(p.quantity), 0), NULL, _request_id
    FROM public.products p
    RETURNING id INTO v_initial_id;

    INSERT INTO public.inventory_snapshot_items (
      snapshot_id, product_id, reference, designation, unit, quantity, sort_order
    )
    SELECT v_initial_id,
           p.id,
           COALESCE(
             NULLIF(p.thickness, 0)::text,
             'MAT-' || upper(left(replace(p.id::text, '-', ''), 8))
           ),
           p.designation,
           p.unit,
           p.quantity,
           row_number() OVER (ORDER BY p.designation, p.id)
    FROM public.products p;
  END IF;

  -- Updated snapshot: complete list, submitted quantity when provided.
  WITH submitted AS (
    SELECT (item ->> 'product_id')::uuid AS product_id,
           (item ->> 'quantity')::numeric AS quantity
    FROM jsonb_array_elements(_items) AS item
  )
  INSERT INTO public.inventory_snapshots (
    snapshot_type, captured_at, created_by, created_by_name,
    material_count, total_quantity, note, request_id
  )
  SELECT 'updated', v_now, auth.uid(), v_name,
         count(*),
         COALESCE(sum(COALESCE(s.quantity, p.quantity)), 0),
         NULLIF(btrim(COALESCE(_note, '')), ''),
         _request_id
  FROM public.products p
  LEFT JOIN submitted s ON s.product_id = p.id
  RETURNING id INTO v_updated_id;

  WITH submitted AS (
    SELECT (item ->> 'product_id')::uuid AS product_id,
           (item ->> 'quantity')::numeric AS quantity
    FROM jsonb_array_elements(_items) AS item
  )
  INSERT INTO public.inventory_snapshot_items (
    snapshot_id, product_id, reference, designation, unit, quantity, sort_order
  )
  SELECT v_updated_id,
         p.id,
         COALESCE(
           NULLIF(p.thickness, 0)::text,
           'MAT-' || upper(left(replace(p.id::text, '-', ''), 8))
         ),
         p.designation,
         p.unit,
         COALESCE(s.quantity, p.quantity),
         row_number() OVER (ORDER BY p.designation, p.id)
  FROM public.products p
  LEFT JOIN submitted s ON s.product_id = p.id;

  -- Audit trail: record the delta before applying the new quantities.
  WITH submitted AS (
    SELECT (item ->> 'product_id')::uuid AS product_id,
           (item ->> 'quantity')::numeric AS quantity
    FROM jsonb_array_elements(_items) AS item
  )
  INSERT INTO public.stock_movements (
    product_id, type, quantity, length, width, surface, notes, created_by
  )
  SELECT p.id,
         CASE WHEN s.quantity > p.quantity THEN 'in' ELSE 'out' END,
         abs(s.quantity - p.quantity),
         p.length,
         p.width,
         round(abs(s.quantity - p.quantity) * p.length * p.width, 2),
         'Inventaire — ajustement',
         auth.uid()
  FROM public.products p
  JOIN submitted s ON s.product_id = p.id
  WHERE s.quantity <> p.quantity;

  -- Apply the counted quantities.
  WITH submitted AS (
    SELECT (item ->> 'product_id')::uuid AS product_id,
           (item ->> 'quantity')::numeric AS quantity
    FROM jsonb_array_elements(_items) AS item
  )
  UPDATE public.products p
  SET quantity = s.quantity,
      surface = round(s.quantity * p.length * p.width, 2)
  FROM submitted s
  WHERE p.id = s.product_id
    AND p.quantity IS DISTINCT FROM s.quantity;

  RETURN v_updated_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_inventory_snapshot(uuid, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_inventory_snapshot(uuid, jsonb, text) TO authenticated, service_role;
