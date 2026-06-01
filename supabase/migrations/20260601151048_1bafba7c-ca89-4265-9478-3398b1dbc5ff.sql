-- Public read API access for external apps
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.suppliers TO anon;
GRANT SELECT ON public.employees TO anon;

DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public read suppliers" ON public.suppliers;
CREATE POLICY "Public read suppliers" ON public.suppliers FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public read employees" ON public.employees;
CREATE POLICY "Public read employees" ON public.employees FOR SELECT TO anon USING (true);