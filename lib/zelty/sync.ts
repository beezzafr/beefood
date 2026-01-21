import { zeltyClient, ZeltyClient } from './client';
import { createClient } from '@/lib/supabase/server';
import { Tenant } from '@/types/tenant';
import { ZeltyCatalogDish } from '@/types/zelty';

/**
 * Transforme un produit Zelty en format Supabase
 */
function transformZeltyDish(dish: ZeltyCatalogDish, tenantId: string) {
    return {
        tenant_id: tenantId,
        zelty_id: dish.id.toString(),
        zelty_type: 'dish' as const,
        name: dish.name,
        description: dish.description || null,
        image_url: dish.image || null,
        price_cents: Math.round(dish.price * 100), // Convertir euros en centimes
        tax_rate: dish.vat_rate || 10.0,
        is_available: !dish.outofstock,
        is_active: dish.active,
        category_ids: dish.category_ids || [],
        allergens: dish.allergens || [],
        sort_order: dish.sort_order || 0,
        synced_at: new Date().toISOString(),
    };
}

/**
 * Synchronise le catalogue d'un tenant depuis Zelty vers Supabase
 */
export async function syncTenantCatalog(
    tenant: Tenant,
    client?: ZeltyClient
): Promise<{ success: boolean; count: number; errors?: string[] }> {
    const zelty = client || zeltyClient;

    // Vérifier que c'est un restaurant avec catalog_id
    if (tenant.tenant_type !== 'restaurant' || !tenant.zelty_catalog_id) {
        console.log(`[Sync] Skipping ${tenant.slug}: not a restaurant or no catalog_id`);
        return { success: true, count: 0 };
    }

    console.log(`[Sync] Starting catalog sync for ${tenant.slug}...`);

    try {
        // 1. Récupérer le catalogue depuis Zelty
        const catalogData = await zelty.getCatalogDishes(
            tenant.zelty_catalog_id,
            'fr'
        );

        if (!catalogData || !catalogData.dishes) {
            throw new Error('No dishes data received from Zelty');
        }

        // 2. Transformer les données
        const products = catalogData.dishes.map((dish: ZeltyCatalogDish) =>
            transformZeltyDish(dish, tenant.id)
        );

        // 3. Upsert dans Supabase
        const supabase = await createClient();
        const { error } = await supabase
            .from('catalog_products')
            .upsert(products, {
                onConflict: 'tenant_id,zelty_id',
                ignoreDuplicates: false,
            });

        if (error) {
            throw error;
        }

        console.log(`[Sync] ✅ Synced ${products.length} products for ${tenant.slug}`);

        return {
            success: true,
            count: products.length,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Sync] ❌ Failed for ${tenant.slug}:`, errorMessage);

        return {
            success: false,
            count: 0,
            errors: [errorMessage],
        };
    }
}

/**
 * Synchronise les catalogues de tous les tenants actifs de type restaurant
 */
export async function syncAllTenants(
    client?: ZeltyClient
): Promise<{
    success: boolean;
    results: Array<{
        tenant_slug: string;
        success: boolean;
        count: number;
        errors?: string[];
    }>;
}> {
    console.log('[Sync] Starting sync for all restaurant tenants...');

    try {
        const supabase = await createClient();

        // Récupérer tous les tenants restaurants actifs
        const { data: tenants, error } = await supabase
            .from('tenants')
            .select('*')
            .eq('is_active', true)
            .eq('tenant_type', 'restaurant')
            .not('zelty_catalog_id', 'is', null);

        if (error) {
            throw error;
        }

        if (!tenants || tenants.length === 0) {
            console.log('[Sync] No restaurant tenants found to sync');
            return { success: true, results: [] };
        }

        // Synchroniser chaque tenant
        const results = await Promise.all(
            tenants.map(async (tenant) => {
                const result = await syncTenantCatalog(tenant as Tenant, client);
                return {
                    tenant_slug: tenant.slug,
                    ...result,
                };
            })
        );

        const allSuccess = results.every((r) => r.success);
        const totalCount = results.reduce((sum, r) => sum + r.count, 0);

        console.log(
            `[Sync] Completed: ${results.length} tenants, ${totalCount} total products`
        );

        return {
            success: allSuccess,
            results,
        };
    } catch (error) {
        console.error('[Sync] ❌ Fatal error during sync:', error);
        return {
            success: false,
            results: [],
        };
    }
}

/**
 * Met à jour la disponibilité d'un produit (appelé par webhook)
 */
export async function updateProductAvailability(
    tenantId: string,
    zeltyDishId: string,
    isAvailable: boolean
): Promise<boolean> {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('catalog_products')
            .update({
                is_available: isAvailable,
                updated_at: new Date().toISOString(),
            })
            .eq('tenant_id', tenantId)
            .eq('zelty_id', zeltyDishId);

        if (error) {
            console.error('[Sync] Error updating product availability:', error);
            return false;
        }

        console.log(
            `[Sync] ✅ Updated availability for product ${zeltyDishId}: ${isAvailable}`
        );
        return true;
    } catch (error) {
        console.error('[Sync] Exception updating product availability:', error);
        return false;
    }
}

/**
 * Met à jour la disponibilité d'une option (appelé par webhook)
 */
export async function updateOptionAvailability(
    tenantId: string,
    zeltyOptionId: string,
    isAvailable: boolean
): Promise<boolean> {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('catalog_options')
            .update({
                is_available: isAvailable,
                updated_at: new Date().toISOString(),
            })
            .eq('tenant_id', tenantId)
            .eq('zelty_id', zeltyOptionId);

        if (error) {
            console.error('[Sync] Error updating option availability:', error);
            return false;
        }

        console.log(
            `[Sync] ✅ Updated availability for option ${zeltyOptionId}: ${isAvailable}`
        );
        return true;
    } catch (error) {
        console.error('[Sync] Exception updating option availability:', error);
        return false;
    }
}
