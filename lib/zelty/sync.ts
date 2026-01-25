import { zeltyClient, ZeltyClient } from './client';
import { createClient } from '@/lib/supabase/server';
import { Tenant } from '@/types/tenant';
import { ZeltyCatalogDish } from '@/types/zelty';

/**
 * Transforme un produit Zelty en format Supabase (SANS tenant_id)
 */
function transformZeltyDish(dish: ZeltyCatalogDish) {
    return {
        zelty_id: dish.id.toString(),  // Convertir number en string
        zelty_type: 'dish' as const,
        name: dish.name,
        description: dish.description || null,
        image_url: dish.image || null,
        price_cents: dish.price,  // Déjà en centimes dans Zelty
        tax_rate: dish.tva / 100,  // Convertir 1000 -> 10.0
        is_available: !dish.disable,  // disable = true → indisponible
        is_active: !dish.disable,  // Utiliser disable pour l'instant
        category_ids: dish.tags?.map(t => t.toString()) || [],
        allergens: [],  // Pas dans l'API, à gérer autrement si nécessaire
        sort_order: dish.o || 0,
        synced_at: new Date().toISOString(),
    };
}

/**
 * Synchronise le catalogue global depuis Zelty (NOUVEAU)
 * Tous les produits sont importés sans tenant_id
 */
export async function syncGlobalCatalog(
    client?: ZeltyClient
): Promise<{ success: boolean; count: number; errors?: string[] }> {
    const zelty = client || zeltyClient;
    const catalogId = process.env.ZELTY_GLOBAL_CATALOG_ID;

    if (!catalogId) {
        console.error('[Sync] ZELTY_GLOBAL_CATALOG_ID not configured');
        return { success: false, count: 0, errors: ['ZELTY_GLOBAL_CATALOG_ID not configured'] };
    }

    console.log(`[Sync] Starting global catalog sync from ${catalogId}...`);

    try {
        // 1. Récupérer le catalogue depuis Zelty
        const catalogData = await zelty.getCatalogDishes(catalogId, 'fr');

        if (!catalogData || !catalogData.dishes) {
            throw new Error('No dishes data received from Zelty');
        }

        console.log(`[Sync] Received ${catalogData.dishes.length} products from Zelty`);

        // 2. Transformer les données (sans tenant_id)
        const products = catalogData.dishes.map((dish: ZeltyCatalogDish) =>
            transformZeltyDish(dish)
        );

        // 3. Upsert dans Supabase
        const supabase = await createClient();
        const { error } = await supabase
            .from('catalog_products')
            .upsert(products, {
                onConflict: 'zelty_id',
                ignoreDuplicates: false,
            });

        if (error) {
            throw error;
        }

        console.log(`[Sync] ✅ Synced ${products.length} products globally`);

        // 4. Créer la visibilité pour TOUS les tenants (nouveaux produits uniquement)
        await syncProductVisibility();

        return {
            success: true,
            count: products.length,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Sync] ❌ Failed:`, errorMessage);
        console.error(`[Sync] Full error details:`, error);

        return {
            success: false,
            count: 0,
            errors: [errorMessage],
        };
    }
}

/**
 * Synchronise la visibilité des produits pour tous les tenants
 * Crée les entrées manquantes dans product_visibility
 */
async function syncProductVisibility(): Promise<void> {
    console.log('[Sync] Syncing product visibility...');

    const supabase = await createClient();

    // 1. Récupérer tous les tenants restaurants
    const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, slug')
        .eq('tenant_type', 'restaurant')
        .eq('is_active', true);

    if (tenantsError || !tenants || tenants.length === 0) {
        console.error('[Sync] No active restaurant tenants found');
        return;
    }

    // 2. Récupérer tous les produits
    const { data: products, error: productsError } = await supabase
        .from('catalog_products')
        .select('id');

    if (productsError || !products || products.length === 0) {
        console.error('[Sync] No products found');
        return;
    }

    console.log(`[Sync] Creating visibility for ${products.length} products × ${tenants.length} tenants`);

    // 3. Créer la visibilité pour chaque combinaison produit × tenant
    const visibilityEntries = products.flatMap(product =>
        tenants.map(tenant => ({
            product_id: product.id,
            tenant_id: tenant.id,
            is_visible: true, // Par défaut, tous les produits visibles partout
        }))
    );

    // 4. Upsert en batch (ignorer les doublons existants)
    const { error: visibilityError } = await supabase
        .from('product_visibility')
        .upsert(visibilityEntries, {
            onConflict: 'product_id,tenant_id',
            ignoreDuplicates: true, // Ne pas écraser les configurations existantes
        });

    if (visibilityError) {
        console.error('[Sync] Error syncing visibility:', visibilityError);
    } else {
        console.log(`[Sync] ✅ Visibility synced: ${visibilityEntries.length} entries`);
    }
}

/**
 * Synchronise le catalogue d'un tenant depuis Zelty vers Supabase
 * @deprecated Utiliser syncGlobalCatalog() à la place
 */
export async function syncTenantCatalog(
    tenant: Tenant,
    client?: ZeltyClient
): Promise<{ success: boolean; count: number; errors?: string[] }> {
    console.warn('[Sync] syncTenantCatalog is deprecated, use syncGlobalCatalog instead');
    
    // Pour la rétrocompatibilité, appeler syncGlobalCatalog
    return syncGlobalCatalog(client);
}

/**
 * Synchronise tous les tenants actifs
 * @deprecated Utiliser syncGlobalCatalog() à la place
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
    console.log('[Sync] Syncing global catalog (syncAllTenants redirected)...');

    try {
        const result = await syncGlobalCatalog(client);

        return {
            success: result.success,
            results: [{
                tenant_slug: 'global',
                success: result.success,
                count: result.count,
                errors: result.errors,
            }],
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
