import {
  ZeltyCatalogResponse,
  ZeltyOrderPayload,
  ZeltyOrderResponse,
} from '@/types/zelty';

const ZELTY_API_BASE = process.env.ZELTY_API_BASE_URL || 'https://api.zelty.fr/2.7';
const ZELTY_API_KEY = process.env.ZELTY_API_KEY || '';

export class ZeltyClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || ZELTY_API_KEY;
    this.baseUrl = baseUrl || ZELTY_API_BASE;

    if (!this.apiKey) {
      console.warn('[Zelty Client] No API key provided');
    }
  }

  /**
   * Méthode fetch privée avec gestion des headers et erreurs
   */
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Zelty API error [${response.status}]: ${errorText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('[Zelty Client] Request failed:', {
        url,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Récupère le catalogue complet d'un restaurant
   * @param catalogId UUID du catalogue Zelty
   * @param lang Langue (fr, en, etc.)
   */
  async getCatalog(
    catalogId: string,
    lang: string = 'fr'
  ): Promise<ZeltyCatalogResponse> {
    return this.fetch<ZeltyCatalogResponse>(
      `/catalogs/${catalogId}?lang=${lang}`
    );
  }

  /**
   * Récupère uniquement les plats d'un catalogue
   * @param catalogId UUID du catalogue Zelty
   * @param lang Langue
   */
  async getCatalogDishes(
    catalogId: string,
    lang: string = 'fr'
  ): Promise<ZeltyCatalogResponse> {
    return this.fetch<ZeltyCatalogResponse>(
      `/catalog/dishes?id_catalog=${catalogId}&lang=${lang}`
    );
  }

  /**
   * Vérifie la disponibilité d'un produit spécifique
   * @param dishId ID du produit Zelty
   */
  async getDishAvailability(dishId: string) {
    return this.fetch(`/catalog/dishes/${dishId}`);
  }

  /**
   * Crée une commande dans Zelty
   * @param orderPayload Données de la commande
   */
  async createOrder(
    orderPayload: ZeltyOrderPayload
  ): Promise<ZeltyOrderResponse> {
    return this.fetch<ZeltyOrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    });
  }

  /**
   * Récupère l'état d'une commande
   * @param zeltyOrderId ID de la commande Zelty
   */
  async getOrder(zeltyOrderId: string): Promise<ZeltyOrderResponse> {
    return this.fetch<ZeltyOrderResponse>(`/orders/${zeltyOrderId}`);
  }

  /**
   * Récupère les informations d'un restaurant
   * @param restaurantId ID du restaurant Zelty
   */
  async getRestaurant(restaurantId: number) {
    return this.fetch(`/restaurants/${restaurantId}`);
  }

  /**
   * Vérifie la validité d'un code promo
   * @param code Code promo
   */
  async validateCoupon(code: string) {
    return this.fetch(`/coupon?code=${code}`);
  }
}

// Export singleton pour utilisation simple
export const zeltyClient = new ZeltyClient();
