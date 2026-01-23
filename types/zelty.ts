// Types pour l'API Zelty

// ============================================
// Catalogue
// ============================================

export interface ZeltyCatalogDish {
  id: number;              // INTEGER dans l'API Zelty
  remote_id?: string | null;
  id_restaurant: number;
  sku?: string | null;
  name: string;
  description?: string | null;
  image?: string | null;
  thumb?: string | null;
  price: number;           // En centimes
  price_togo?: number | null;
  price_delivery?: number | null;
  happy_price?: number | null;
  cost_price?: number | null;
  tva: number;             // TVA (ex: 1000 = 10%)
  tvat?: number | null;
  tvad?: number | null;
  tax: number;
  tax_takeaway?: number | null;
  tax_delivery?: number | null;
  tags?: number[];
  options?: number[];
  id_fabrication_place?: number;
  fab_name?: string | null;
  color?: string | null;
  loyalty_points?: number;
  loyalty_points_discount?: number | null;
  earn_loyalty?: number;
  price_to_define?: boolean;
  weight_for_price?: number | null;
  disable: boolean;        // true = désactivé (outofstock)
  disable_takeaway?: boolean;
  disable_delivery?: boolean;
  disable_before?: string | null;
  disable_after?: string | null;
  o?: number;
  zc_only?: boolean;
  meta?: Record<string, any>;
  zc_name?: string | null;
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

// ============================================
// Webhooks - Format Officiel Zelty v2.10
// ============================================

/**
 * Enveloppe générique des webhooks Zelty
 * Tous les webhooks ont cette structure de base
 */
export interface ZeltyWebhookEnvelope<T = unknown> {
  event_id: string;           // UUID de l'événement
  event_name: string;          // Type d'événement (ex: "dish.availability_update")
  created_at: string;          // ISO 8601
  version: string;             // Version du message
  brand_id: number;            // ID de la marque
  restaurant_id: number;       // ID du restaurant (dans l'enveloppe)
  data: T;                     // Données spécifiques à l'événement
}

/**
 * Webhook: Mise à jour disponibilité d'un plat
 */
export interface DishAvailabilityData {
  id_dish: number;             // ID Zelty du plat (INTEGER)
  dish_remote_id?: string | null;
  id_restaurant: number;       // ID du restaurant
  restaurant_remote_id?: string | null;
  outofstock: boolean;         // true = rupture de stock
}

export type DishAvailabilityWebhook = ZeltyWebhookEnvelope<DishAvailabilityData>;

/**
 * Webhook: Mise à jour disponibilité des options
 * Note: Zelty envoie un TABLEAU de mises à jour
 */
export interface OptionAvailabilityData {
  options_values_availabilities: Array<{
    id_dish_option_value: number;  // ID Zelty de l'option (INTEGER)
    dish_option_value_remote_id?: string | null;
    id_restaurant: number;
    restaurant_remote_id?: string | null;
    outofstock: boolean;
  }>;
}

export type OptionAvailabilityWebhook = ZeltyWebhookEnvelope<OptionAvailabilityData>;

/**
 * Webhook: Mise à jour statut commande
 */
export interface OrderStatusData {
  id_order: number;
  order_remote_id?: string | null;
  status: string;
  // Autres champs possibles selon la doc
}

export type OrderStatusWebhook = ZeltyWebhookEnvelope<OrderStatusData>;

/**
 * Union type pour tous les webhooks supportés
 */
export type ZeltyWebhookPayload =
  | DishAvailabilityWebhook
  | OptionAvailabilityWebhook
  | OrderStatusWebhook;

// ============================================
// Création de Commande - Format Officiel
// ============================================

/**
 * Payload pour créer une commande Zelty
 * Basé sur le schéma OrderEntryPost de l'API v2.10
 */
export interface ZeltyOrderPayload {
  id_restaurant?: number;
  restaurant_remote_id?: string;
  due_date?: string;           // ISO 8601
  source: string;              // Ex: "web"
  mode: 'eat_in' | 'takeaway' | 'delivery';  // PAS "order_type" !
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    // Autres champs client selon API
  } | null;
  address?: {
    street?: string;
    city?: string;
    zipcode?: string;
    additional_info?: string;
  } | null;
  id_delivery_address?: number | null;
  id_delivery_zone?: number | null;
  items?: Array<{
    id?: number;               // ID du plat/menu (INTEGER)
    remote_id?: string;
    item_id?: string;          // Alternative à "id"
    type?: 'dish' | 'menu';
    price?: number;            // En centimes
    modifiers?: Array<{        // PAS "options" !
      id_option_value?: number;
      price?: number;
    }>;
  }> | null;
  total?: number | null;       // En centimes
  transactions?: Array<{       // Si commande payée
    type: string;              // Ex: "card", "cash"
    amount: number;
    // Autres champs transaction
  }> | null;
  comment?: string | null;
  first_name?: string | null;
  phone?: string | null;
}

export interface ZeltyOrderResponse {
  order: {
    id: number;
    uuid: string;
    ref: string;
    status: number;
    // Autres champs selon API
  };
  errno: number;
}
