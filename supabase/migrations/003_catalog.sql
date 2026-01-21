-- ============================================
-- MIGRATION 003: Tables Catalogue (Cache Zelty)
-- ============================================

-- ============================================
-- TABLE: catalog_products
-- ============================================
CREATE TABLE catalog_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Zelty data
  zelty_id TEXT NOT NULL,
  zelty_type TEXT NOT NULL CHECK (zelty_type IN ('dish', 'menu')) DEFAULT 'dish',
  
  -- Content
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  
  -- Pricing
  price_cents INTEGER NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 10.00,
  
  -- Availability
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  category_ids TEXT[] DEFAULT '{}',
  allergens TEXT[] DEFAULT '{}',
  
  -- Sort
  sort_order INTEGER DEFAULT 0,
  
  -- Sync tracking
  synced_at TIMESTAMPTZ DEFAULT now(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  UNIQUE(tenant_id, zelty_id)
);

-- Indexes
CREATE INDEX idx_catalog_products_tenant ON catalog_products(tenant_id);
CREATE INDEX idx_catalog_products_zelty_id ON catalog_products(zelty_id);
CREATE INDEX idx_catalog_products_available ON catalog_products(tenant_id, is_available, is_active) WHERE is_available = true AND is_active = true;
CREATE INDEX idx_catalog_products_type ON catalog_products(tenant_id, zelty_type);

-- Trigger updated_at
CREATE TRIGGER update_catalog_products_updated_at 
  BEFORE UPDATE ON catalog_products
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: catalog_options
-- ============================================
CREATE TABLE catalog_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID REFERENCES catalog_products(id) ON DELETE CASCADE,
  
  -- Zelty data
  zelty_id TEXT NOT NULL,
  zelty_option_group_id TEXT,  -- Pour regrouper les options
  
  -- Content
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pricing
  price_cents INTEGER DEFAULT 0,
  
  -- Availability
  is_available BOOLEAN DEFAULT true,
  
  -- Constraints (min/max selection pour un groupe)
  min_selection INTEGER DEFAULT 0,
  max_selection INTEGER DEFAULT 1,
  
  -- Sort
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  UNIQUE(tenant_id, zelty_id)
);

-- Indexes
CREATE INDEX idx_catalog_options_tenant ON catalog_options(tenant_id);
CREATE INDEX idx_catalog_options_product ON catalog_options(product_id);
CREATE INDEX idx_catalog_options_zelty_id ON catalog_options(zelty_id);
CREATE INDEX idx_catalog_options_available ON catalog_options(tenant_id, is_available) WHERE is_available = true;

-- Trigger updated_at
CREATE TRIGGER update_catalog_options_updated_at 
  BEFORE UPDATE ON catalog_options
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: catalog_categories (Optionnel - pour organisation)
-- ============================================
CREATE TABLE catalog_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Zelty data
  zelty_id TEXT NOT NULL,
  
  -- Content
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  
  -- Hierarchie
  parent_id UUID REFERENCES catalog_categories(id) ON DELETE SET NULL,
  
  -- Sort
  sort_order INTEGER DEFAULT 0,
  
  -- State
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  UNIQUE(tenant_id, zelty_id)
);

-- Indexes
CREATE INDEX idx_catalog_categories_tenant ON catalog_categories(tenant_id);
CREATE INDEX idx_catalog_categories_parent ON catalog_categories(parent_id);
CREATE INDEX idx_catalog_categories_active ON catalog_categories(tenant_id, is_active) WHERE is_active = true;

-- Trigger updated_at
CREATE TRIGGER update_catalog_categories_updated_at 
  BEFORE UPDATE ON catalog_categories
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
