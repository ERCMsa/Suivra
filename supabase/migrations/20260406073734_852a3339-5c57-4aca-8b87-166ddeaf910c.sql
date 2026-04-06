
-- Create caisses table
CREATE TABLE public.caisses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'complete',
  created_by uuid DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create caisse_items table (items inside each caisse)
CREATE TABLE public.caisse_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caisse_id uuid NOT NULL REFERENCES public.caisses(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create caisse_movements table (full history)
CREATE TABLE public.caisse_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caisse_id uuid NOT NULL REFERENCES public.caisses(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  reason text DEFAULT NULL,
  responsible_person text DEFAULT NULL,
  notes text DEFAULT NULL,
  created_by uuid DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.caisses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caisse_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caisse_movements ENABLE ROW LEVEL SECURITY;

-- RLS policies for caisses
CREATE POLICY "Caisses viewable by authenticated" ON public.caisses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Caisses insertable by authenticated" ON public.caisses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Caisses updatable by authenticated" ON public.caisses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Caisses deletable by authenticated" ON public.caisses FOR DELETE TO authenticated USING (true);

-- RLS policies for caisse_items
CREATE POLICY "Caisse items viewable by authenticated" ON public.caisse_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Caisse items insertable by authenticated" ON public.caisse_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Caisse items updatable by authenticated" ON public.caisse_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Caisse items deletable by authenticated" ON public.caisse_items FOR DELETE TO authenticated USING (true);

-- RLS policies for caisse_movements
CREATE POLICY "Caisse movements viewable by authenticated" ON public.caisse_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Caisse movements insertable by authenticated" ON public.caisse_movements FOR INSERT TO authenticated WITH CHECK (true);
