
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  employee_id text,
  department text NOT NULL,
  position text,
  phone text,
  email text,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees viewable by authenticated" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Employees insertable by authenticated" ON public.employees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Employees updatable by authenticated" ON public.employees FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Employees deletable by authenticated" ON public.employees FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
