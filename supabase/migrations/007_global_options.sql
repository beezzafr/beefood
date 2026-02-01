-- ============================================
-- MIGRATION 007: Options globales + Import depuis Zelty
-- ============================================
-- Objectif: Aligner catalog_options avec catalog_products (global)
--          et importer les options depuis l'API Zelty
-- ============================================

-- Étape 1: Nettoyer les données existantes
-- ============================================
DELETE FROM catalog_options;

-- Étape 2: Supprimer les contraintes liées au tenant_id
-- ============================================

-- Supprimer la contrainte unique sur (tenant_id, zelty_id)
ALTER TABLE catalog_options DROP CONSTRAINT IF EXISTS catalog_options_tenant_id_zelty_id_key;

-- Supprimer les index liés au tenant_id
DROP INDEX IF EXISTS idx_catalog_options_tenant;
DROP INDEX IF EXISTS idx_catalog_options_available;

-- Supprimer la foreign key vers tenants et la colonne tenant_id
ALTER TABLE catalog_options DROP CONSTRAINT IF EXISTS catalog_options_tenant_id_fkey;
ALTER TABLE catalog_options DROP COLUMN IF EXISTS tenant_id;

-- Étape 3: Ajouter contrainte unique sur zelty_id seul
-- ============================================
ALTER TABLE catalog_options ADD CONSTRAINT catalog_options_zelty_id_key UNIQUE (zelty_id);

-- Étape 4: Restructurer la table pour correspondre à l'API Zelty
-- ============================================

-- Supprimer zelty_option_group_id (non utilisé actuellement)
ALTER TABLE catalog_options DROP COLUMN IF EXISTS zelty_option_group_id;

-- Supprimer les colonnes min/max_selection (gérées au niveau du groupe)
ALTER TABLE catalog_options DROP COLUMN IF EXISTS min_selection;
ALTER TABLE catalog_options DROP COLUMN IF EXISTS max_selection;

-- Ajouter une colonne pour le nom du groupe d'options
ALTER TABLE catalog_options ADD COLUMN IF NOT EXISTS option_group_name TEXT;

-- Ajouter une colonne pour le type (simple, multiple, etc.)
ALTER TABLE catalog_options ADD COLUMN IF NOT EXISTS option_type TEXT DEFAULT 'simple';

-- Étape 5: Recréer les index adaptés
-- ============================================
CREATE INDEX idx_catalog_options_product ON catalog_options(product_id);
CREATE INDEX idx_catalog_options_zelty_id ON catalog_options(zelty_id);
CREATE INDEX idx_catalog_options_available ON catalog_options(is_available) WHERE is_available = true;
CREATE INDEX idx_catalog_options_group ON catalog_options(product_id, option_group_name);

-- Étape 6: Commentaires pour documentation
-- ============================================
COMMENT ON TABLE catalog_options IS 'Options globales des produits, importées depuis Zelty';
COMMENT ON COLUMN catalog_options.product_id IS 'Référence au produit parent dans catalog_products';
COMMENT ON COLUMN catalog_options.zelty_id IS 'ID unique de l''option dans Zelty';
COMMENT ON COLUMN catalog_options.option_group_name IS 'Nom du groupe d''options (ex: "Taille", "Suppléments")';
COMMENT ON COLUMN catalog_options.option_type IS 'Type d''option: simple, multiple, required, etc.';
