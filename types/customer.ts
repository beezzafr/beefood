// Types pour les Clients (Globaux cross-tenant)

export interface Customer {
  id: string;
  email: string;
  phone: string | null;
  phone_verified_at: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string | null;
  street: string;
  city: string;
  zipcode: string;
  additional_info: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerPayload {
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
}

export interface CreateAddressPayload {
  customer_id: string;
  label?: string;
  street: string;
  city: string;
  zipcode: string;
  additional_info?: string;
  is_default?: boolean;
}
