-- ============================================
-- MIGRATION 004: Tables Commandes & Livraison
-- ============================================

-- ============================================
-- TABLE: delivery_zones (zones de livraison par tenant)
-- ============================================
CREATE TABLE delivery_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Zone definition
  name TEXT NOT NULL,
  zipcodes TEXT[] NOT NULL DEFAULT '{}',
  cities TEXT[] NOT NULL DEFAULT '{}',
  
  -- Pricing (variables par zone)
  min_order_cents INTEGER NOT NULL,
  delivery_fee_cents INTEGER NOT NULL,
  free_delivery_threshold_cents INTEGER NOT NULL,
  
  -- State
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_delivery_zones_tenant ON delivery_zones(tenant_id);
CREATE INDEX idx_delivery_zones_active ON delivery_zones(tenant_id, is_active) WHERE is_active = true;

-- Trigger updated_at
CREATE TRIGGER update_delivery_zones_updated_at 
  BEFORE UPDATE ON delivery_zones
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: orders
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,  -- NULL si guest
  
  -- Identification
  public_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  order_number TEXT NOT NULL,  -- Format: TACOBEE-20260121-001
  
  -- Customer info (snapshot pour guests)
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  
  -- Type
  order_type TEXT NOT NULL CHECK (order_type IN ('delivery', 'pickup')),
  
  -- Delivery info (si delivery)
  delivery_address JSONB,  -- {street, city, zipcode, additional_info}
  delivery_zone_id UUID REFERENCES delivery_zones(id) ON DELETE SET NULL,
  
  -- Items snapshot (JSONB)
  items JSONB NOT NULL,  -- [{zelty_id, name, qty, price_cents, options: [...]}]
  
  -- Pricing
  subtotal_cents INTEGER NOT NULL,
  delivery_fee_cents INTEGER DEFAULT 0,
  discount_cents INTEGER DEFAULT 0,
  total_cents INTEGER NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'preparing', 'ready', 
    'out_for_delivery', 'delivered', 'cancelled'
  )),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'paid', 'failed', 'refunded'
  )),
  payment_method TEXT CHECK (payment_method IN ('stripe', 'cash')),
  
  -- Zelty integration
  zelty_order_id TEXT,
  
  -- Notes
  customer_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint
  UNIQUE(tenant_id, order_number)
);

-- Indexes
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_customer ON orders(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_orders_public_token ON orders(public_token);
CREATE INDEX idx_orders_status ON orders(tenant_id, status);
CREATE INDEX idx_orders_payment_status ON orders(tenant_id, payment_status);
CREATE INDEX idx_orders_created ON orders(tenant_id, created_at DESC);
CREATE INDEX idx_orders_zelty_id ON orders(zelty_order_id) WHERE zelty_order_id IS NOT NULL;

-- Trigger updated_at
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour générer order_number automatique
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  tenant_name TEXT;
  date_part TEXT;
  sequence_num INTEGER;
BEGIN
  -- Récupérer le nom du tenant
  SELECT name INTO tenant_name FROM tenants WHERE id = NEW.tenant_id;
  
  -- Format date YYYYMMDD
  date_part := to_char(NEW.created_at, 'YYYYMMDD');
  
  -- Compter les commandes du jour pour ce tenant
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM orders
  WHERE tenant_id = NEW.tenant_id
    AND created_at::date = NEW.created_at::date;
  
  -- Générer order_number: TACOBEE-20260121-001
  NEW.order_number := tenant_name || '-' || date_part || '-' || lpad(sequence_num::text, 3, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour order_number automatique
CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION generate_order_number();

-- ============================================
-- TABLE: payments
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Provider
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'cash')),
  provider_payment_id TEXT,  -- Stripe Payment Intent ID
  
  -- Amount
  amount_cents INTEGER NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'succeeded', 'failed', 'refunded'
  )),
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_provider_id ON payments(provider, provider_payment_id) WHERE provider_payment_id IS NOT NULL;
CREATE INDEX idx_payments_status ON payments(status);

-- Trigger updated_at
CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON payments
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
