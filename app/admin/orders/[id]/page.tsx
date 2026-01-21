import { createClient } from '@/lib/supabase/server';
import { Order } from '@/types/order';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select('*, tenants(name, slug)')
    .eq('id', id)
    .single();

  if (error || !order) {
    redirect('/admin/orders');
  }

  const orderData = order as any;

  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    preparing: 'En préparation',
    ready: 'Prête',
    out_for_delivery: 'En livraison',
    delivered: 'Livrée',
    cancelled: 'Annulée',
  };

  const paymentStatusLabels: Record<string, string> = {
    pending: 'En attente',
    paid: 'Payée',
    failed: 'Échouée',
    refunded: 'Remboursée',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/admin/orders"
            className="text-orange-600 hover:text-orange-900 text-sm mb-2 inline-block"
          >
            ← Retour aux commandes
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            Commande #{orderData.order_number}
          </h2>
          <p className="text-gray-600">{orderData.tenants?.name}</p>
        </div>
      </div>

      {/* Order Info Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Statut commande</div>
          <div className="text-2xl font-bold text-gray-900">
            {statusLabels[orderData.status] || orderData.status}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Statut paiement</div>
          <div className="text-2xl font-bold text-gray-900">
            {paymentStatusLabels[orderData.payment_status] || orderData.payment_status}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Montant total</div>
          <div className="text-2xl font-bold text-green-600">
            {(orderData.total_cents / 100).toFixed(2)} €
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Informations client</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Nom</div>
            <div className="font-semibold">{orderData.customer_name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Email</div>
            <div className="font-semibold">{orderData.customer_email}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Téléphone</div>
            <div className="font-semibold">{orderData.customer_phone}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Type de commande</div>
            <div className="font-semibold">
              {orderData.order_type === 'delivery' ? 'Livraison' : 'À emporter'}
            </div>
          </div>
        </div>

        {orderData.delivery_address && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600 mb-2">Adresse de livraison</div>
            <div className="font-semibold">
              {orderData.delivery_address.street}<br />
              {orderData.delivery_address.zipcode} {orderData.delivery_address.city}
              {orderData.delivery_address.additional_info && (
                <>
                  <br />
                  {orderData.delivery_address.additional_info}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Détails de la commande</h3>
        <div className="space-y-4">
          {orderData.items.map((item: any, index: number) => (
            <div key={index} className="border-b pb-4 last:border-0">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-gray-600">
                    Quantité: {item.quantity}
                  </div>
                  {item.options && item.options.length > 0 && (
                    <div className="text-sm text-gray-500 mt-1">
                      Options: {item.options.map((o: any) => o.name).join(', ')}
                    </div>
                  )}
                </div>
                <div className="font-semibold">
                  {((item.price_cents * item.quantity) / 100).toFixed(2)} €
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span>Sous-total</span>
            <span>{(orderData.subtotal_cents / 100).toFixed(2)} €</span>
          </div>
          {orderData.delivery_fee_cents > 0 && (
            <div className="flex justify-between text-sm">
              <span>Frais de livraison</span>
              <span>{(orderData.delivery_fee_cents / 100).toFixed(2)} €</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span>{(orderData.total_cents / 100).toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {/* Zelty Info */}
      {orderData.zelty_order_id && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Informations Zelty</h3>
          <div className="text-sm">
            <span className="text-gray-600">ID Zelty:</span>{' '}
            <span className="font-mono">{orderData.zelty_order_id}</span>
          </div>
        </div>
      )}

      {/* Customer Notes */}
      {orderData.customer_notes && (
        <div className="bg-yellow-50 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-2">Notes du client</h3>
          <p className="text-gray-700">{orderData.customer_notes}</p>
        </div>
      )}
    </div>
  );
}
