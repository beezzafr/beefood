import { getCurrentTenant } from '@/lib/tenants/server';
import { redirect } from 'next/navigation';
import Header from '@/components/layout/Header';

export default async function AccountPage() {
  const tenant = await getCurrentTenant();

  if (!tenant) {
    redirect('/tenant-not-found');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8">Mon compte</h1>

        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👤</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Authentification requise
            </h2>
            <p className="text-gray-600 mb-8">
              Connectez-vous pour accéder à votre compte et voir vos commandes
            </p>
            <button
              className="px-8 py-3 rounded-lg font-semibold text-white transition-opacity"
              style={{ backgroundColor: tenant.branding.primary_color }}
            >
              Se connecter
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
