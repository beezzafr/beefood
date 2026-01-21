-- ============================================
-- MIGRATION 001: Table Tenants
-- ============================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: tenants
-- ============================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identification
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  
  -- Type de tenant
  tenant_type TEXT NOT NULL CHECK (tenant_type IN ('landing', 'restaurant')) DEFAULT 'restaurant',
  
  -- Zelty config
  zelty_restaurant_id INTEGER NOT NULL DEFAULT 3355,
  zelty_catalog_id UUID,  -- NULL pour landing pages
  zelty_virtual_brand_name TEXT,  -- NULL pour landing pages
  
  -- Branding
  branding JSONB NOT NULL DEFAULT '{
    "logo_url": "",
    "primary_color": "#FF6B35",
    "secondary_color": "#4ECDC4",
    "font_family": "Inter"
  }'::jsonb,
  
  -- Settings
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- State
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tenants_domain ON tenants(domain);
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_active ON tenants(is_active) WHERE is_active = true;
CREATE INDEX idx_tenants_type ON tenants(tenant_type);

-- Fonction: mise à jour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger updated_at pour tenants
CREATE TRIGGER update_tenants_updated_at 
  BEFORE UPDATE ON tenants
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: 4 Tenants initiaux
-- ============================================

-- BEEFOOD - Landing page vitrine
INSERT INTO tenants (
  slug, 
  name, 
  domain, 
  tenant_type,
  zelty_restaurant_id,
  zelty_catalog_id,
  zelty_virtual_brand_name,
  branding,
  is_active
) VALUES (
  'beefood',
  'BEEFOOD',
  'www.beefood.fr',
  'landing',
  3355,
  NULL,
  NULL,
  '{"logo_url": "/logos/beefood.svg", "primary_color": "#FF6B35", "secondary_color": "#4ECDC4", "font_family": "Inter"}'::jsonb,
  true
);

-- TACOBEE - Dark kitchen
INSERT INTO tenants (
  slug, 
  name, 
  domain, 
  tenant_type,
  zelty_restaurant_id,
  zelty_catalog_id,
  zelty_virtual_brand_name,
  branding,
  is_active
) VALUES (
  'tacobee',
  'TACOBEE',
  'www.tacobee.fr',
  'restaurant',
  3355,
  'f3b5891e-6e10-40c9-864d-8bce4440e454'::uuid,
  'TACOBEE',
  '{"logo_url": "/logos/tacobee.svg", "primary_color": "#FFA500", "secondary_color": "#FFD700", "font_family": "Inter"}'::jsonb,
  true
);

-- BEELLISSIMO - Dark kitchen
INSERT INTO tenants (
  slug, 
  name, 
  domain, 
  tenant_type,
  zelty_restaurant_id,
  zelty_catalog_id,
  zelty_virtual_brand_name,
  branding,
  is_active
) VALUES (
  'beellissimo',
  'BEELLISSIMO',
  'www.beellissimo.fr',
  'restaurant',
  3355,
  '823eeaa2-3815-4215-bc38-ce5893196730'::uuid,
  'BEELLISSIMO',
  '{"logo_url": "/logos/beellissimo.svg", "primary_color": "#E63946", "secondary_color": "#F1FAEE", "font_family": "Inter"}'::jsonb,
  true
);

-- BEERGER - Dark kitchen
INSERT INTO tenants (
  slug, 
  name, 
  domain, 
  tenant_type,
  zelty_restaurant_id,
  zelty_catalog_id,
  zelty_virtual_brand_name,
  branding,
  is_active
) VALUES (
  'beerger',
  'BEERGER',
  'www.beerger.fr',
  'restaurant',
  3355,
  '1b9d7180-7f6e-4374-82ab-a7b6a2dbf24a'::uuid,
  'BEERGER',
  '{"logo_url": "/logos/beerger.svg", "primary_color": "#FFD700", "secondary_color": "#FFC107", "font_family": "Inter"}'::jsonb,
  true
);
