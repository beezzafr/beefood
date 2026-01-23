-- ============================================
-- MIGRATION 005: Row Level Security (RLS)
-- ============================================

-- ============================================
-- RLS: tenants
-- ============================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour les tenants actifs
CREATE POLICY "Tenants actifs lisibles par tous" 
  ON tenants FOR SELECT 
  USING (is_active = true);

-- Admin seulement pour écriture (à implémenter avec auth)
-- CREATE POLICY "Admin can manage tenants" 
--   ON tenants FOR ALL 
--   USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- RLS: customers
-- ============================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Client voit uniquement son profil
CREATE POLICY "Clients voient leur profil" 
  ON customers FOR SELECT 
  USING (auth.uid() = id);

-- Client peut mettre à jour son profil
CREATE POLICY "Clients mettent à jour leur profil" 
  ON customers FOR UPDATE 
  USING (auth.uid() = id);

-- Création de profil lors de l'inscription
CREATE POLICY "Création profil lors inscription" 
  ON customers FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ============================================
-- RLS: customer_addresses
-- ============================================
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- Client voit uniquement ses adresses
CREATE POLICY "Clients voient leurs adresses" 
  ON customer_addresses FOR SELECT 
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth.uid() = id
    )
  );

-- Client peut créer ses adresses
CREATE POLICY "Clients créent leurs adresses" 
  ON customer_addresses FOR INSERT 
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE auth.uid() = id
    )
  );

-- Client peut modifier ses adresses
CREATE POLICY "Clients modifient leurs adresses" 
  ON customer_addresses FOR UPDATE 
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth.uid() = id
    )
  );

-- Client peut supprimer ses adresses
CREATE POLICY "Clients suppriment leurs adresses" 
  ON customer_addresses FOR DELETE 
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth.uid() = id
    )
  );

-- ============================================
-- RLS: catalog_products
-- ============================================
ALTER TABLE catalog_products ENABLE ROW LEVEL SECURITY;

-- Lecture publique (filtrage par tenant_id géré par l'application)
CREATE POLICY "Produits lisibles par tous" 
  ON catalog_products FOR SELECT 
  USING (is_active = true);

-- Insertion/Update/Delete : Service role uniquement (pour la synchro Zelty)
CREATE POLICY "Service role peut gérer les produits" 
  ON catalog_products FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- RLS: catalog_options
-- ============================================
ALTER TABLE catalog_options ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "Options lisibles par tous" 
  ON catalog_options FOR SELECT 
  USING (is_available = true);

-- Insertion/Update/Delete : Service role uniquement
CREATE POLICY "Service role peut gérer les options" 
  ON catalog_options FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- RLS: catalog_categories
-- ============================================
ALTER TABLE catalog_categories ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "Catégories lisibles par tous" 
  ON catalog_categories FOR SELECT 
  USING (is_active = true);

-- ============================================
-- RLS: delivery_zones
-- ============================================
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour zones actives
CREATE POLICY "Zones de livraison lisibles par tous" 
  ON delivery_zones FOR SELECT 
  USING (is_active = true);

-- ============================================
-- RLS: orders
-- ============================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Clients connectés voient leurs commandes (filtrées par tenant via app logic)
CREATE POLICY "Clients voient leurs commandes" 
  ON orders FOR SELECT 
  USING (
    customer_id IS NOT NULL 
    AND customer_id IN (
      SELECT id FROM customers WHERE auth.uid() = id
    )
  );

-- Accès public via token pour tracking (guests et clients)
CREATE POLICY "Accès public via token" 
  ON orders FOR SELECT 
  USING (true);  -- Le filtrage par public_token est fait par l'application

-- Clients peuvent créer des commandes
CREATE POLICY "Clients créent des commandes" 
  ON orders FOR INSERT 
  WITH CHECK (
    customer_id IS NULL  -- Guest
    OR customer_id IN (
      SELECT id FROM customers WHERE auth.uid() = id
    )
  );

-- ============================================
-- RLS: payments
-- ============================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Lecture via order (hérité des policies orders)
CREATE POLICY "Paiements visibles via commande" 
  ON payments FOR SELECT 
  USING (
    order_id IN (
      SELECT id FROM orders WHERE true  -- Les policies orders s'appliquent
    )
  );

-- ============================================
-- Fonctions utilitaires pour RLS
-- ============================================

-- Fonction pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() ->> 'role') = 'admin',
      false
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le tenant_id depuis le context (pour filtrage)
-- Cette fonction sera appelée par l'application qui set le context
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN COALESCE(
    current_setting('app.current_tenant_id', true)::uuid,
    NULL
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- Grants pour tables publiques
-- ============================================

-- Permettre l'accès anonyme en lecture pour les catalogues
GRANT SELECT ON catalog_products TO anon;
GRANT SELECT ON catalog_options TO anon;
GRANT SELECT ON catalog_categories TO anon;
GRANT SELECT ON delivery_zones TO anon;
GRANT SELECT ON tenants TO anon;

-- Permettre l'accès anonyme pour les commandes (via policies)
GRANT SELECT, INSERT ON orders TO anon;
GRANT SELECT ON payments TO anon;
