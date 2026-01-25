import { getAllTenants } from '@/lib/tenants/resolver';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenants = await getAllTenants();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Admin - BEEFOOD
            </h1>
            <nav className="flex space-x-6">
              <Link
                href="/admin"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/orders"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Commandes
              </Link>
              <Link
                href="/admin/products"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Produits
              </Link>
              <Link
                href="/admin/tenants"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Restaurants
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Sidebar + Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Tenant Switcher */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-bold text-gray-900 mb-4">
                Filtrer par restaurant
              </h2>
              <div className="space-y-2">
                <Link
                  href="/admin?tenant=all"
                  className="block px-3 py-2 rounded hover:bg-gray-100 text-sm"
                >
                  📊 Tous les restaurants
                </Link>
                {tenants.map((tenant) => (
                  <Link
                    key={tenant.id}
                    href={`/admin?tenant=${tenant.slug}`}
                    className="block px-3 py-2 rounded hover:bg-gray-100 text-sm"
                  >
                    {tenant.name}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
