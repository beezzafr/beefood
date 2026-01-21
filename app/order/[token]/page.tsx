import { createClient } from '@/lib/supabase/server';
import { getCurrentTenant } from '@/lib/tenants/server';
import { redirect } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Order } from '@/types/order';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function OrderTrackingPage({ params }: PageProps) {
  const { token } = await params;
  const tenant = await getCurrentTenant();

  if (!tenant) {
    redirect('/tenant-not-found');
  }

  // Récupérer la commande via le public_token
  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('public_token', token)
    .single();

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Commande non trouvée
            </h1>
            <p className="text-gray-600">
              Le lien de suivi que vous avez utilisé est invalide ou expiré.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const orderData = order as Order;
  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    preparing: 'En préparation',
    ready: 'Prête',
    out_for_delivery: 'En livraison',
    delivered: 'Livrée',
    cancelled: 'Annulée',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">
              Commande #{orderData.order_number}
            </h1>
            <div
              className="inline-block px-4 py-2 rounded-full text-white font-semibold text-lg"
              style={{ backgroundColor: tenant.branding.primary_color }}
            >
              {statusLabels[orderData.status] || orderData.status}
            </div>
          </div>

          {/* Détails commande */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Articles commandés</h2>
              <div className="space-y-3">
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex justify-between border-b pb-2">
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        Quantité: {item.quantity}
                      </div>
                      {item.options.length > 0 && (
                        <div className="text-sm text-gray-500">
                          Options: {item.options.map((o) => o.name).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="font-semibold">
                      {((item.price_cents * item.quantity) / 100).toFixed(2)} €
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totaux */}
            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span>Sous-total</span>
                <span>{(orderData.subtotal_cents / 100).toFixed(2)} €</span>
              </div>
              {orderData.delivery_fee_cents > 0 && (
                <div className="flex justify-between mb-2">
                  <span>Frais de livraison</span>
                  <span>{(orderData.delivery_fee_cents / 100).toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xl border-t pt-2">
                <span>Total</span>
                <span>{(orderData.total_cents / 100).toFixed(2)} €</span>
              </div>
            </div>

            {/* Adresse de livraison */}
            {orderData.delivery_address && (
              <div className="border-t pt-4">
                <h3 className="font-bold mb-2">Adresse de livraison</h3>
                <p className="text-gray-600">
                  {orderData.delivery_address.street}<br />
                  {orderData.delivery_address.zipcode} {orderData.delivery_address.city}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
