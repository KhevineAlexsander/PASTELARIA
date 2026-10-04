-- ═══════════════════════════════════════════════════════════════
-- Ki-Delícia Pastelaria — Migração inicial do banco de dados
-- Execute este SQL no Supabase SQL Editor:
-- https://app.supabase.com → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════

-- ── Extensões ──
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ════════════════════════════════════════
-- TABELA: menu_items (Cardápio)
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS menu_items (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT        NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  description TEXT        NOT NULL CHECK (char_length(description) > 3),
  category    TEXT        NOT NULL CHECK (category IN ('tradicional', 'especial')),
  price       NUMERIC(8,2) NOT NULL CHECK (price > 0),
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items (category);
CREATE INDEX IF NOT EXISTS idx_menu_items_active   ON menu_items (active);

COMMENT ON TABLE menu_items IS 'Itens do cardápio da pastelaria';

-- ════════════════════════════════════════
-- TABELA: orders (Pedidos)
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS orders (
  id           BIGSERIAL PRIMARY KEY,
  order_code   TEXT        NOT NULL UNIQUE DEFAULT ('#' || nextval('orders_id_seq')::TEXT),
  customer     TEXT        NOT NULL DEFAULT 'Cliente' CHECK (char_length(customer) BETWEEN 1 AND 80),
  notes        TEXT,
  total        NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  status       TEXT        NOT NULL DEFAULT 'pendente'
                CHECK (status IN ('pendente', 'preparando', 'pronto', 'entregue')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

COMMENT ON TABLE orders IS 'Pedidos recebidos na pastelaria';

-- ════════════════════════════════════════
-- TABELA: order_items (Itens de cada pedido)
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS order_items (
  id           BIGSERIAL PRIMARY KEY,
  order_id     BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id BIGINT REFERENCES menu_items(id) ON DELETE SET NULL,
  name         TEXT        NOT NULL,   -- snapshot do nome no momento do pedido
  price        NUMERIC(8,2) NOT NULL CHECK (price >= 0),
  quantity     INT         NOT NULL CHECK (quantity > 0),
  subtotal     NUMERIC(10,2) GENERATED ALWAYS AS (price * quantity) STORED
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

COMMENT ON TABLE order_items IS 'Itens individuais de cada pedido';

-- ════════════════════════════════════════
-- TABELA: store_config (Configurações da loja)
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS store_config (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE store_config IS 'Configurações gerais da loja (nome, whatsapp, endereço)';

-- Valores iniciais
INSERT INTO store_config (key, value) VALUES
  ('store_name', 'Ki-Delícia Pastelaria'),
  ('whatsapp',   '(99) 98443-6545'),
  ('address',    '')
ON CONFLICT (key) DO NOTHING;

-- ════════════════════════════════════════
-- FUNÇÃO: atualizar updated_at automaticamente
-- ════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers de updated_at
CREATE TRIGGER trg_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_store_config_updated_at
  BEFORE UPDATE ON store_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ════════════════════════════════════════

-- Habilita RLS em todas as tabelas
ALTER TABLE menu_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_config ENABLE ROW LEVEL SECURITY;

-- menu_items: leitura pública, escrita apenas para autenticados
CREATE POLICY "menu_items_select_public"
  ON menu_items FOR SELECT USING (active = TRUE);

CREATE POLICY "menu_items_insert_auth"
  ON menu_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "menu_items_update_auth"
  ON menu_items FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "menu_items_delete_auth"
  ON menu_items FOR DELETE
  USING (auth.role() = 'authenticated');

-- orders: qualquer um pode inserir; apenas autenticados veem todos
CREATE POLICY "orders_insert_public"
  ON orders FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "orders_select_auth"
  ON orders FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "orders_update_auth"
  ON orders FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "orders_delete_auth"
  ON orders FOR DELETE
  USING (auth.role() = 'authenticated');

-- order_items: segue as permissões de orders
CREATE POLICY "order_items_insert_public"
  ON order_items FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "order_items_select_auth"
  ON order_items FOR SELECT
  USING (auth.role() = 'authenticated');

-- store_config: apenas autenticados
CREATE POLICY "store_config_select_auth"
  ON store_config FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "store_config_update_auth"
  ON store_config FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ════════════════════════════════════════
-- DADOS INICIAIS do cardápio
-- ════════════════════════════════════════
INSERT INTO menu_items (name, description, category, price) VALUES
  ('Quatro Queijos',     'Mussarela, parmesão, catupiry, provolone, cheddar, orégano e tomate.',           'tradicional', 13.00),
  ('Baiano',             'Calabresa, mussarela, ovo, tomate, catupiry, cebola, pimenta muito forte.',       'tradicional', 12.00),
  ('Português',          'Presunto, mussarela, ovo, calabresa, catupiry e cebola.',                         'tradicional', 12.00),
  ('Carne Tradicional',  'Carne moída, catupiry, tomate, milho, mussarela e cebola.',                       'tradicional', 15.00),
  ('Frango Tradicional', 'Frango desfiado, catupiry, mussarela, tomate e milho.',                           'tradicional', 12.00),
  ('Bauru',              'Presunto, catupiry, tomate, orégano e mussarela.',                                'tradicional', 10.00),
  ('Calabresa',          'Calabresa, catupiry, tomate, mussarela e cebola.',                                'tradicional', 12.00),
  ('Queijo Tradicional', 'Queijo, mussarela, tomate e orégano.',                                            'tradicional', 12.00),
  ('Nordestino',         'Mussarela, carne seca desfiada, catupiry, milho, tomate e cebola.',               'especial',    15.00),
  ('Frango CheeseBacon', 'Frango desfiado, mussarela, catupiry, bacon, cream cheese, milho e tomate.',      'especial',    18.00),
  ('Moda Pasteleiro',    'Frango desfiado, presunto, calabresa, mussarela, catupiry, bacon, milho verde e tomate.', 'especial', 20.00),
  ('Camarão',            'Camarões inteiros, catupiry, mussarela, cream cheese, milho, cebola e tomate.',   'especial',    25.00),
  ('Catubresa',          'Calabresa, mussarela, catupiry, bacon, cream cheese, milho e tomate.',             'especial',    16.00),
  ('Caipirão',           'Frango desfiado, mussarela, ovo, pimentão, milho e tomate.',                      'especial',    13.00),
  ('Mexicano',           'Mussarela, calabresa, catupiry, bacon, ovo, cebola, pimenta moderada e tomate.',  'especial',    13.00)
ON CONFLICT DO NOTHING;
