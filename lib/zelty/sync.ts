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
 * Import les produits ET leurs options
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
        // 1. Récupérer le catalogue COMPLET depuis Zelty (avec options)
        const catalogData = await zelty.getCatalog(catalogId, 'fr');

        if (!catalogData) {
            throw new Error('No catalog data received from Zelty');
        }

        console.log(`[Sync] Received catalog data with keys:`, Object.keys(catalogData));
        console.log(`[Sync] catalogData structure:`, JSON.stringify(catalogData, null, 2).substring(0, 500));

        // Extraire les dishes et options (gérer plusieurs structures possibles)
        let dishes = catalogData.dishes || catalogData.data?.dishes || [];
        let options = catalogData.options || catalogData.data?.options || [];

        // Si la réponse contient un tableau "catalogs" avec les données dedans
        if (Array.isArray(catalogData.catalogs) && catalogData.catalogs.length > 0) {
            const catalog = catalogData.catalogs[0];
            dishes = catalog.dishes || [];
            options = catalog.options || [];
        }

        console.log(`[Sync] Found ${dishes.length} products and ${options.length} option groups`);

        if (dishes.length === 0) {
            console.error('[Sync] Full catalogData:', JSON.stringify(catalogData, null, 2));
            throw new Error('No dishes data received from Zelty');
        }

        // 2. Transformer les produits (sans tenant_id)
        const products = dishes.map((dish: ZeltyCatalogDish) =>
            transformZeltyDish(dish)
        );

        const supabase = await createClient();

        // 3. Upsert les produits dans Supabase
        const { data: insertedProducts, error: productsError } = await supabase
            .from('catalog_products')
            .upsert(products, {
                onConflict: 'zelty_id',
                ignoreDuplicates: false,
            })
            .select('id, zelty_id');

        if (productsError) {
            throw productsError;
        }

        console.log(`[Sync] ✅ Synced ${products.length} products globally`);

        // 4. Créer un mapping zelty_id -> product_id pour les options
        const productIdMap = new Map(
            insertedProducts?.map(p => [p.zelty_id, p.id]) || []
        );

        // 5. Traiter les options
        let totalOptionsInserted = 0;

        if (options && options.length > 0) {
            for (const optionGroup of options) {
                // Structure Zelty : { id, name, type, values: [...] }
                const groupName = optionGroup.name || 'Options';
                const groupType = optionGroup.type || 'simple';

                if (!optionGroup.values || optionGroup.values.length === 0) {
                    continue;
                }

                // Transformer chaque valeur d'option
                const optionValues = optionGroup.values.map((value: any) => {
                    // Trouver les produits qui utilisent cette option
                    // (on va les lier après insertion)
                    return {
                        zelty_id: value.id.toString(),
                        product_id: null, // Sera lié après
                        name: value.name,
                        description: value.description || null,
                        price_cents: value.price || 0,
                        is_available: !value.outofstock,
                        option_group_name: groupName,
                        option_type: groupType,
                        sort_order: value.o || 0,
                    };
                });

                // Upsert les options
                const { error: optionsError } = await supabase
                    .from('catalog_options')
                    .upsert(optionValues, {
                        onConflict: 'zelty_id',
                        ignoreDuplicates: false,
                    });

                if (optionsError) {
                    console.error(`[Sync] Error inserting options for group ${groupName}:`, optionsError);
                } else {
                    totalOptionsInserted += optionValues.length;
                }
            }

            console.log(`[Sync] ✅ Synced ${totalOptionsInserted} options globally`);
        }

        // 6. Lier les options aux produits (via product_id)
        // Pour chaque produit, mettre à jour les options liées
        for (const dish of dishes) {
            if (!dish.options || dish.options.length === 0) continue;

            const productId = productIdMap.get(dish.id.toString());
            if (!productId) continue;

            // Mettre à jour les options pour ce produit
            const { error: linkError } = await supabase
                .from('catalog_options')
                .update({ product_id: productId })
                .in('zelty_id', dish.options.map((o: number) => o.toString()));

            if (linkError) {
                console.error(`[Sync] Error linking options for product ${dish.name}:`, linkError);
            }
        }

        console.log(`[Sync] ✅ Linked options to products`);

        // NOTE: La visibilité des produits est gérée manuellement depuis /admin/products
        // On ne crée PLUS automatiquement les entrées product_visibility
        // L'admin doit configurer la visibilité pour chaque restaurant manuellement

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
 * @deprecated Non utilisé - La visibilité est gérée manuellement depuis /admin/products
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
