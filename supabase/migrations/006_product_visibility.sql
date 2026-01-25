-- ============================================
-- MIGRATION 006: Product Visibility System
-- ============================================
-- Objectif: Passer d'une architecture 1 tenant = 1 catalogue
--          à une architecture globale avec visibilité par tenant
-- ============================================

-- Étape 1: Supprimer les contraintes et colonnes liées au tenant_id dans catalog_products
-- ============================================

-- Supprimer la contrainte unique sur (tenant_id, zelty_id)
ALTER TABLE catalog_products DROP CONSTRAINT IF EXISTS catalog_products_tenant_id_zelty_id_key;

-- Supprimer tenant_id de catalog_products (produits globaux maintenant)
ALTER TABLE catalog_products DROP COLUMN IF EXISTS tenant_id;

-- Ajouter contrainte unique sur zelty_id seul (un produit Zelty = une entrée)
ALTER TABLE catalog_products ADD CONSTRAINT catalog_products_zelty_id_key UNIQUE (zelty_id);

-- Étape 2: Créer la table product_visibility (Many-to-Many)
-- ============================================

CREATE TABLE product_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES catalog_products(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Contrainte unique: un produit ne peut avoir qu'une seule entrée par tenant
  CONSTRAINT product_visibility_product_tenant_unique UNIQUE(product_id, tenant_id)
);

-- Index pour performances
CREATE INDEX idx_product_visibility_product ON product_visibility(product_id);
CREATE INDEX idx_product_visibility_tenant ON product_visibility(tenant_id);
CREATE INDEX idx_product_visibility_lookup ON product_visibility(product_id, tenant_id, is_visible);

-- Trigger pour updated_at
CREATE TRIGGER update_product_visibility_updated_at 
  BEFORE UPDATE ON product_visibility
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Étape 3: Commenter pour la documentation
-- ============================================

COMMENT ON TABLE product_visibility IS 'Table de visibilité many-to-many: gère quels produits sont visibles sur quels tenants';
COMMENT ON COLUMN product_visibility.product_id IS 'Référence au produit dans catalog_products';
COMMENT ON COLUMN product_visibility.tenant_id IS 'Référence au tenant (restaurant)';
COMMENT ON COLUMN product_visibility.is_visible IS 'true = produit visible sur ce tenant, false = masqué';
