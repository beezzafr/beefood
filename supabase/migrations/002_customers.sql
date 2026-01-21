-- ============================================
-- MIGRATION 002: Tables Clients Globaux (Cross-Tenant)
-- ============================================

-- ============================================
-- TABLE: customers (GLOBAL - sans tenant_id)
-- ============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identification
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  phone_verified_at TIMESTAMPTZ,
  
  -- Info personnelle
  first_name TEXT,
  last_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone) WHERE phone IS NOT NULL;

-- Trigger updated_at
CREATE TRIGGER update_customers_updated_at 
  BEFORE UPDATE ON customers
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: customer_addresses (GLOBAL - sans tenant_id)
-- ============================================
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Adresse
  label TEXT,  -- "Domicile", "Travail", etc.
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  zipcode TEXT NOT NULL,
  additional_info TEXT,  -- Complément d'adresse
  
  -- Coordonnées GPS (optionnel)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- État
  is_default BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_customer_addresses_customer ON customer_addresses(customer_id);
CREATE INDEX idx_customer_addresses_zipcode ON customer_addresses(zipcode);

-- Trigger updated_at
CREATE TRIGGER update_customer_addresses_updated_at 
  BEFORE UPDATE ON customer_addresses
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour s'assurer qu'une seule adresse est default par client
CREATE OR REPLACE FUNCTION ensure_one_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE customer_addresses 
    SET is_default = false 
    WHERE customer_id = NEW.customer_id 
      AND id != NEW.id 
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour adresse par défaut unique
CREATE TRIGGER ensure_one_default_address_trigger
  BEFORE INSERT OR UPDATE ON customer_addresses
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_one_default_address();
