// Types pour les Commandes

export type OrderType = 'delivery' | 'pickup';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type PaymentMethod = 'stripe' | 'cash';

export interface DeliveryAddress {
  street: string;
  city: string;
  zipcode: string;
  additional_info?: string;
}

export interface OrderItem {
  zelty_id: string;
  name: string;
  quantity: number;
  price_cents: number;
  options: {
    zelty_id: string;
    name: string;
    price_cents: number;
  }[];
}

export interface Order {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  public_token: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_type: OrderType;
  delivery_address: DeliveryAddress | null;
  delivery_zone_id: string | null;
  items: OrderItem[];
  subtotal_cents: number;
  delivery_fee_cents: number;
  discount_cents: number;
  total_cents: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  zelty_order_id: string | null;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryZone {
  id: string;
  tenant_id: string;
  name: string;
  zipcodes: string[];
  cities: string[];
  min_order_cents: number;
  delivery_fee_cents: number;
  free_delivery_threshold_cents: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  provider: 'stripe' | 'cash';
  provider_payment_id: string | null;
  amount_cents: number;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

// Type pour la création de commande
export interface CreateOrderPayload {
  tenant_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_type: OrderType;
  delivery_address?: DeliveryAddress;
  items: OrderItem[];
  payment_method: PaymentMethod;
  customer_notes?: string;
}
