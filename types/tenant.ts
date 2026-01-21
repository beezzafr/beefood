// Types pour les Tenants (Restaurants/Landing)

export interface TenantBranding {
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
}

export interface TenantSettings {
  [key: string]: any;
}

export type TenantType = 'landing' | 'restaurant';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  domain: string;
  tenant_type: TenantType;
  zelty_restaurant_id: number;
  zelty_catalog_id: string | null;
  zelty_virtual_brand_name: string | null;
  branding: TenantBranding;
  settings: TenantSettings;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantFormData {
  slug: string;
  name: string;
  domain: string;
  tenant_type: TenantType;
  zelty_catalog_id?: string;
  zelty_virtual_brand_name?: string;
  branding: TenantBranding;
  settings?: TenantSettings;
}
