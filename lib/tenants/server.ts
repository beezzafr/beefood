import { headers } from 'next/headers';
import { resolveTenantBySlug } from './resolver';
import { Tenant } from '@/types/tenant';

/**
 * Récupère le tenant actuel depuis les headers injectés par le middleware
 * À utiliser dans les Server Components et API Routes
 */
export async function getCurrentTenant(): Promise<Tenant | null> {
  const headersList = await headers();
  const tenantSlug = headersList.get('x-tenant-slug');
  
  if (!tenantSlug) {
    console.warn('[Tenant Server] No tenant slug found in headers');
    return null;
  }
  
  return await resolveTenantBySlug(tenantSlug);
}

/**
 * Récupère le slug du tenant actuel depuis les headers
 * Version légère sans requête DB
 */
export async function getCurrentTenantSlug(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get('x-tenant-slug');
}

/**
 * Récupère le domaine actuel depuis les headers
 */
export async function getCurrentDomain(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get('x-tenant-domain');
}

/**
 * Vérifie si le tenant actuel est de type restaurant
 */
export async function isRestaurantTenant(): Promise<boolean> {
  const tenant = await getCurrentTenant();
  return tenant?.tenant_type === 'restaurant';
}

/**
 * Vérifie si le tenant actuel est de type landing
 */
export async function isLandingTenant(): Promise<boolean> {
  const tenant = await getCurrentTenant();
  return tenant?.tenant_type === 'landing';
}

/**
 * Helper pour obtenir le catalog_id Zelty du tenant actuel
 * Retourne null si pas de catalog_id (landing page)
 */
export async function getCurrentCatalogId(): Promise<string | null> {
  const tenant = await getCurrentTenant();
  return tenant?.zelty_catalog_id || null;
}
