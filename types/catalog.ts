// Types pour le Catalogue Produits (Cache Zelty)

export type ProductType = 'dish' | 'menu';

export interface CatalogProduct {
  id: string;
  // tenant_id: retiré - produits globaux maintenant
  zelty_id: string;
  zelty_type: ProductType;
  name: string;
  description: string | null;
  image_url: string | null;
  price_cents: number;
  tax_rate: number;
  is_available: boolean;
  is_active: boolean;
  category_ids: string[];
  allergens: string[];
  sort_order: number;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface CatalogOption {
  id: string;
  tenant_id: string;
  product_id: string | null;
  zelty_id: string;
  zelty_option_group_id: string | null;
  name: string;
  description: string | null;
  price_cents: number;
  is_available: boolean;
  min_selection: number;
  max_selection: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CatalogCategory {
  id: string;
  tenant_id: string;
  zelty_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Types pour le panier (client-side)
export interface CartItem {
  product: CatalogProduct;
  quantity: number;
  selected_options: CatalogOption[];
  notes?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal_cents: number;
  delivery_fee_cents: number;
  total_cents: number;
}
