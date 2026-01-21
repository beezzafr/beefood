import { getCurrentTenant } from '@/lib/tenants/server';
import { redirect } from 'next/navigation';
import Header from '@/components/layout/Header';
import Link from 'next/link';

export default async function CartPage() {
  const tenant = await getCurrentTenant();

  if (!tenant) {
    redirect('/tenant-not-found');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8">Votre panier</h1>

        {/* Panier vide pour l'instant */}
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Votre panier est vide
          </h2>
          <p className="text-gray-600 mb-8">
            Ajoutez des produits depuis notre menu pour commencer votre commande
          </p>
          <Link
            href="/menu"
            className="inline-block px-8 py-3 rounded-lg font-semibold text-white transition-opacity"
            style={{ backgroundColor: tenant.branding.primary_color }}
          >
            Voir le menu
          </Link>
        </div>
      </main>
    </div>
  );
}
