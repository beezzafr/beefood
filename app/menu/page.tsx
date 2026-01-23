import { createClient } from '@/lib/supabase/server';
import { getCurrentTenant } from '@/lib/tenants/server';
import { CatalogProduct } from '@/types/catalog';
import Header from '@/components/layout/Header';
import ProductCard from '@/components/product/ProductCard';
import { redirect } from 'next/navigation';

export default async function MenuPage() {
  const tenant = await getCurrentTenant();

  if (!tenant) {
    redirect('/tenant-not-found');
  }

  console.log('[Menu] Current tenant:', tenant.slug, tenant.id);

  // Récupérer les produits depuis Supabase (cache)
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from('catalog_products')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  console.log('[Menu] Products fetched:', products?.length, 'Error:', error);
  console.log('[Menu] Sample product tenant_ids:', products?.slice(0, 3).map(p => p.tenant_id));

  if (error) {
    console.error('[Menu] Error fetching products:', error);
  }

  const catalogProducts = (products as CatalogProduct[]) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1
            className="text-5xl font-bold mb-4"
            style={{ color: tenant.branding.primary_color }}
          >
            Notre Menu
          </h1>
          <p className="text-xl text-gray-600">
            Découvrez nos délicieux plats préparés avec passion
          </p>
        </div>

        {/* Products Grid */}
        {catalogProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-500">
              🍽️ Notre menu arrive bientôt !
            </p>
            <p className="text-gray-400 mt-4">
              Revenez plus tard pour découvrir nos délicieux plats.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {catalogProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="mt-20 py-8 text-center text-gray-600"
        style={{ backgroundColor: tenant.branding.secondary_color + '20' }}
      >
        <p>© 2026 {tenant.name} - Tous droits réservés</p>
      </footer>
    </div>
  );
}
