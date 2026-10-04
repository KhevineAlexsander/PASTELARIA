-- Ki-Delicia: camada do app e politicas administrativas.
-- Execute depois de supabase/migrations/001_initial_schema.sql.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid());
$$;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'mesa';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS table_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_order_type_check
  CHECK (order_type IN ('mesa', 'retirada', 'entrega'));

CREATE SEQUENCE IF NOT EXISTS public.order_code_seq START WITH 10001;

CREATE TABLE IF NOT EXISTS public.dining_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 1 AND 40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Compatibilidade com as chaves da interface do app.
INSERT INTO public.store_config (key, value) VALUES
  ('nome', 'Ki-Delicia Pastelaria'),
  ('wpp', '(99) 98443-6545'),
  ('endereco', 'https://maps.app.goo.gl/23deY4MwVhXyifYx7')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.store_config (key, value)
SELECT 'nome', value FROM public.store_config WHERE key = 'store_name'
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.store_config (key, value)
SELECT 'wpp', value FROM public.store_config WHERE key = 'whatsapp'
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.store_config (key, value)
SELECT 'endereco', value FROM public.store_config WHERE key = 'address' AND value <> ''
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
WHERE public.store_config.value IS NULL OR public.store_config.value = '';

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Remove as politicas permissivas da primeira migracao antes de aplicar as novas.
DROP POLICY IF EXISTS menu_items_select_public ON public.menu_items;
DROP POLICY IF EXISTS menu_items_insert_auth ON public.menu_items;
DROP POLICY IF EXISTS menu_items_update_auth ON public.menu_items;
DROP POLICY IF EXISTS menu_items_delete_auth ON public.menu_items;
DROP POLICY IF EXISTS orders_insert_public ON public.orders;
DROP POLICY IF EXISTS orders_select_auth ON public.orders;
DROP POLICY IF EXISTS orders_update_auth ON public.orders;
DROP POLICY IF EXISTS orders_delete_auth ON public.orders;
DROP POLICY IF EXISTS order_items_insert_public ON public.order_items;
DROP POLICY IF EXISTS order_items_select_auth ON public.order_items;
DROP POLICY IF EXISTS store_config_select_auth ON public.store_config;
DROP POLICY IF EXISTS store_config_update_auth ON public.store_config;

DROP POLICY IF EXISTS admin_users_read_self ON public.admin_users;
DROP POLICY IF EXISTS menu_public_read ON public.menu_items;
DROP POLICY IF EXISTS menu_admin_all ON public.menu_items;
DROP POLICY IF EXISTS orders_admin_all ON public.orders;
DROP POLICY IF EXISTS config_public_read ON public.store_config;
DROP POLICY IF EXISTS config_admin_all ON public.store_config;
DROP POLICY IF EXISTS tables_admin_all ON public.dining_tables;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dining_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_users_read_self ON public.admin_users
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY menu_public_read ON public.menu_items
  FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY menu_admin_all ON public.menu_items
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY orders_admin_all ON public.orders
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY config_public_read ON public.store_config
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY config_admin_all ON public.store_config
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY tables_admin_all ON public.dining_tables
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

REVOKE ALL ON public.order_items FROM anon, authenticated;
GRANT SELECT ON public.menu_items, public.store_config TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.menu_items, public.store_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders, public.dining_tables TO authenticated;
GRANT SELECT ON public.admin_users TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

CREATE OR REPLACE FUNCTION public.create_public_order(
  p_customer TEXT,
  p_notes TEXT,
  p_type TEXT,
  p_table TEXT,
  p_address TEXT,
  p_items JSONB,
  p_total NUMERIC
)
RETURNS TABLE(order_code TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  item JSONB;
  menu_row public.menu_items%ROWTYPE;
  item_qty INTEGER;
  computed_total NUMERIC(10,2) := 0;
  clean_items JSONB := '[]'::jsonb;
  new_code TEXT;
BEGIN
  IF p_type NOT IN ('mesa', 'retirada', 'entrega') THEN
    RAISE EXCEPTION 'Tipo de pedido invalido.';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'O pedido precisa conter itens.';
  END IF;
  IF p_type = 'mesa' AND NOT EXISTS (SELECT 1 FROM public.dining_tables t WHERE t.name = p_table) THEN
    RAISE EXCEPTION 'Mesa nao cadastrada. Leia novamente o QR Code da mesa.';
  END IF;
  IF p_type = 'entrega' AND coalesce(length(trim(p_address)), 0) = 0 THEN
    RAISE EXCEPTION 'Informe o endereco para entrega.';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    SELECT * INTO menu_row FROM public.menu_items
      WHERE id = (item->>'id')::BIGINT AND active = true;
    IF NOT FOUND THEN RAISE EXCEPTION 'Um item do pedido nao esta disponivel.'; END IF;
    item_qty := coalesce((item->>'quantity')::INTEGER, (item->>'qty')::INTEGER, 0);
    IF item_qty < 1 OR item_qty > 50 THEN RAISE EXCEPTION 'Quantidade invalida.'; END IF;
    IF (item->>'price')::NUMERIC <> menu_row.price THEN
      RAISE EXCEPTION 'O preco de % foi atualizado. Atualize o cardapio e tente novamente.', menu_row.name;
    END IF;
    computed_total := computed_total + menu_row.price * item_qty;
    clean_items := clean_items || jsonb_build_array(jsonb_build_object(
      'id', menu_row.id, 'name', menu_row.name, 'price', menu_row.price, 'qty', item_qty
    ));
  END LOOP;
  IF abs(coalesce(p_total, 0) - computed_total) > 0.02 THEN
    RAISE EXCEPTION 'O total do pedido mudou. Atualize o cardapio e tente novamente.';
  END IF;

  new_code := 'KD-' || nextval('public.order_code_seq')::TEXT;
  INSERT INTO public.orders (order_code, customer, notes, total, status, order_type, table_name, delivery_address, items)
  VALUES (new_code, left(coalesce(nullif(trim(p_customer), ''), 'Cliente'), 80), left(coalesce(p_notes, ''), 500),
          computed_total, 'pendente', p_type, nullif(trim(p_table), ''), nullif(trim(p_address), ''), clean_items);
  RETURN QUERY SELECT new_code;
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_order(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_order(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, NUMERIC) TO anon, authenticated;
