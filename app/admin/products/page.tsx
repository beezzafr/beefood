'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  price_cents: number;
  zelty_id: string;
  category_ids: string[];
}

interface Tenant {
  id: string;
  slug: string;
  name: string;
}

interface ProductVisibility {
  product_id: string;
  tenant_id: string;
  is_visible: boolean;
}

export default function ProductsVisibilityPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [visibility, setVisibility] = useState<Map<string, Set<string>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Charger les tenants
      const { data: tenantsData } = await supabase
        .from('tenants')
        .select('id, slug, name')
        .eq('tenant_type', 'restaurant')
        .eq('is_active', true)
        .order('name');

      // Charger les produits
      const { data: productsData } = await supabase
        .from('catalog_products')
        .select('id, name, image_url, price_cents, zelty_id, category_ids')
        .eq('is_active', true)
        .order('name');

      // Charger la visibilité
      const { data: visibilityData } = await supabase
        .from('product_visibility')
        .select('product_id, tenant_id, is_visible');

      if (tenantsData) setTenants(tenantsData);
      if (productsData) setProducts(productsData);

      // Construire la map de visibilité
      const visMap = new Map<string, Set<string>>();
      if (visibilityData) {
        visibilityData.forEach((v: ProductVisibility) => {
          if (v.is_visible) {
            const key = v.product_id;
            if (!visMap.has(key)) {
              visMap.set(key, new Set());
            }
            visMap.get(key)!.add(v.tenant_id);
          }
        });
      }
      setVisibility(visMap);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (productId: string, tenantId: string) => {
    const supabase = createClient();
    const currentVis = visibility.get(productId) || new Set();
    const isCurrentlyVisible = currentVis.has(tenantId);
    const newVisibility = !isCurrentlyVisible;

    // Mise à jour optimiste
    const newVis = new Map(visibility);
    const productVis = new Set(newVis.get(productId) || []);
    if (newVisibility) {
      productVis.add(tenantId);
    } else {
      productVis.delete(tenantId);
    }
    newVis.set(productId, productVis);
    setVisibility(newVis);

    // Mise à jour en base
    try {
      const { error } = await supabase
        .from('product_visibility')
        .upsert({
          product_id: productId,
          tenant_id: tenantId,
          is_visible: newVisibility,
        }, {
          onConflict: 'product_id,tenant_id',
        });

      if (error) {
        console.error('Error updating visibility:', error);
        // Rollback optimiste
        setVisibility(visibility);
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
      setVisibility(visibility);
    }
  };

  const syncCatalog = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/cron/sync-catalog', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ''}`,
        },
      });

      if (response.ok) {
        alert('Synchronisation réussie ! Rechargement...');
        await loadData();
      } else {
        alert('Erreur lors de la synchronisation');
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion Visibilité Produits
          </h1>
          <p className="mt-2 text-gray-600">
            {products.length} produits • {tenants.length} restaurants
          </p>
        </div>
        <button
          onClick={syncCatalog}
          disabled={syncing}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {syncing ? 'Synchro...' : '🔄 Sync Zelty'}
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix
                </th>
                {tenants.map(tenant => (
                  <th key={tenant.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {tenant.slug}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover mr-3"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-gray-200 mr-3 flex items-center justify-center text-gray-400">
                          🍽️
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {product.zelty_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(product.price_cents / 100).toFixed(2)} €
                  </td>
                  {tenants.map(tenant => {
                    const isVisible = visibility.get(product.id)?.has(tenant.id) || false;
                    return (
                      <td key={tenant.id} className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => toggleVisibility(product.id, tenant.id)}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucun produit trouvé
        </div>
      )}
    </div>
  );
}
