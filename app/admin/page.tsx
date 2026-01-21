import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Statistiques globales
  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  const { count: pendingOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  // Revenus totaux (approximatif, basé sur les commandes payées)
  const { data: paidOrders } = await supabase
    .from('orders')
    .select('total_cents')
    .eq('payment_status', 'paid');

  const totalRevenue = paidOrders
    ? paidOrders.reduce((sum, order) => sum + order.total_cents, 0)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600">Vue d'ensemble de la plateforme</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Commandes totales</div>
          <div className="text-3xl font-bold text-gray-900">{totalOrders || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">En attente</div>
          <div className="text-3xl font-bold text-orange-600">{pendingOrders || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Clients</div>
          <div className="text-3xl font-bold text-gray-900">{totalCustomers || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Revenus</div>
          <div className="text-3xl font-bold text-green-600">
            {(totalRevenue / 100).toFixed(2)} €
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Actions rapides</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <a
            href="/admin/orders"
            className="block p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 transition-colors"
          >
            <div className="text-2xl mb-2">📦</div>
            <div className="font-semibold">Voir les commandes</div>
            <div className="text-sm text-gray-600">Gérer toutes les commandes</div>
          </a>

          <a
            href="/admin/tenants"
            className="block p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 transition-colors"
          >
            <div className="text-2xl mb-2">🏢</div>
            <div className="font-semibold">Gérer les restaurants</div>
            <div className="text-sm text-gray-600">CRUD tenants</div>
          </a>

          <a
            href="/api/cron/sync-catalog"
            className="block p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 transition-colors"
          >
            <div className="text-2xl mb-2">🔄</div>
            <div className="font-semibold">Sync catalogue</div>
            <div className="text-sm text-gray-600">Forcer la synchronisation</div>
          </a>
        </div>
      </div>
    </div>
  );
}
