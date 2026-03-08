
-- Add min_quantity to products for low stock alerts
ALTER TABLE public.products ADD COLUMN min_quantity numeric NOT NULL DEFAULT 0;

-- Add image_url to products and damage_reports
ALTER TABLE public.products ADD COLUMN image_url text;
ALTER TABLE public.damage_reports ADD COLUMN image_url text;

-- Create withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  requested_by text NOT NULL,
  department text,
  quantity numeric NOT NULL DEFAULT 1,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamp with time zone,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requests viewable by authenticated" ON public.withdrawal_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Requests insertable by authenticated" ON public.withdrawal_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Requests updatable by authenticated" ON public.withdrawal_requests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Requests deletable by authenticated" ON public.withdrawal_requests FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON public.withdrawal_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
