// Types pour l'API Zelty

export interface ZeltyCatalogDish {
  id: string;
  name: string;
  description?: string;
  price: number;  // En euros
  image?: string;
  vat_rate?: number;
  outofstock: boolean;
  active: boolean;
  category_ids?: string[];
  allergens?: string[];
  sort_order?: number;
}

export interface ZeltyOptionValue {
  id: string;
  name: string;
  price: number;
  outofstock: boolean;
}

export interface ZeltyCatalogResponse {
  dishes: ZeltyCatalogDish[];
  // Autres propriétés selon l'API Zelty
}

export interface ZeltyOrderPayload {
  id_restaurant: number;
  virtual_brand_name: string;
  source: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  delivery_address?: {
    street: string;
    city: string;
    zipcode: string;
    additional_info?: string;
  };
  items: {
    id_dish: string;
    quantity: number;
    price?: number;  // Prix en centimes si override
    options?: {
      id_option: string;
      price?: number;
    }[];
  }[];
  order_type: 'delivery' | 'pickup';
  payment_method: 'online' | 'cash';
  total_amount: number;  // En centimes
}

export interface ZeltyOrderResponse {
  id: string;
  order_number: string;
  status: string;
  // Autres propriétés selon l'API Zelty
}

export interface ZeltyWebhookPayload {
  event: string;
  id_restaurant: number;
  id_catalog?: string;
  id_dish?: string;
  id_option_value?: string;
  id_order?: string;
  outofstock?: boolean;
  status?: string;
  timestamp: string;
}

export interface ZeltyAvailabilityUpdatePayload {
  event: 'dish.availability_update' | 'option_value.availability_update';
  id_catalog: string;
  id_dish?: string;
  id_option_value?: string;
  outofstock: boolean;
}

export interface ZeltyOrderStatusUpdatePayload {
  event: 'order.status.update';
  id_order: string;
  status: string;
}
