'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart/CartContext';
import { useTenant } from '@/lib/tenants/context';
import { useRouter } from 'next/navigation';

type OrderType = 'delivery' | 'takeaway' | 'dine-in';

export default function CheckoutForm() {
  const router = useRouter();
  const { items, totalCents, clearCart } = useCart();
  const tenant = useTenant();
  
  const [loading, setLoading] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  
  // Formulaire client
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Adresse de livraison
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [instructions, setInstructions] = useState('');
  
  // Paiement
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Préparer les données de commande
      const orderData = {
        customer: {
          firstName,
          lastName,
          email,
          phone,
        },
        orderType,
        deliveryAddress: orderType === 'delivery' ? {
          address,
          city,
          postalCode,
        } : null,
        instructions,
        paymentMethod,
        items: items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          options: item.options || [],
        })),
        totalCents,
      };

      // Appeler l'API de création de commande
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création de la commande');
      }

      // Vider le panier
      clearCart();

      // Rediriger vers la page de confirmation
      router.push(`/order/${result.order.tracking_token}`);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type de commande */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Type de commande
        </h2>
        
        <div className="grid grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setOrderType('delivery')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              orderType === 'delivery'
                ? 'border-current'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            style={orderType === 'delivery' ? { borderColor: tenant.branding.primary_color } : {}}
          >
            <div className="text-2xl mb-2">🚚</div>
            <div className="font-semibold">Livraison</div>
          </button>
          
          <button
            type="button"
            onClick={() => setOrderType('takeaway')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              orderType === 'takeaway'
                ? 'border-current'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            style={orderType === 'takeaway' ? { borderColor: tenant.branding.primary_color } : {}}
          >
            <div className="text-2xl mb-2">🥡</div>
            <div className="font-semibold">À emporter</div>
          </button>
          
          <button
            type="button"
            onClick={() => setOrderType('dine-in')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              orderType === 'dine-in'
                ? 'border-current'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            style={orderType === 'dine-in' ? { borderColor: tenant.branding.primary_color } : {}}
          >
            <div className="text-2xl mb-2">🍽️</div>
            <div className="font-semibold">Sur place</div>
          </button>
        </div>
      </div>

      {/* Informations client */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Vos informations
        </h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prénom *
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom *
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Adresse de livraison */}
      {orderType === 'delivery' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Adresse de livraison
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required={orderType === 'delivery'}
                placeholder="123 Rue de la Paix"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required={orderType === 'delivery'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code postal *
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  required={orderType === 'delivery'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions de livraison (optionnel)
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                placeholder="Digicode, étage, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Méthode de paiement */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Mode de paiement
        </h2>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={(e) => setPaymentMethod(e.target.value as 'card')}
              className="w-5 h-5"
            />
            <div className="flex-1">
              <div className="font-semibold">Carte bancaire</div>
              <div className="text-sm text-gray-600">Paiement sécurisé via Stripe</div>
            </div>
            <div className="text-2xl">💳</div>
          </label>
          
          <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="paymentMethod"
              value="cash"
              checked={paymentMethod === 'cash'}
              onChange={(e) => setPaymentMethod(e.target.value as 'cash')}
              className="w-5 h-5"
            />
            <div className="flex-1">
              <div className="font-semibold">Espèces</div>
              <div className="text-sm text-gray-600">Paiement à la livraison ou au retrait</div>
            </div>
            <div className="text-2xl">💵</div>
          </label>
        </div>
      </div>

      {/* Bouton de soumission */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-lg font-semibold text-white text-lg transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: tenant.branding.primary_color }}
      >
        {loading ? 'Traitement en cours...' : `Payer ${(totalCents / 100).toFixed(2)} €`}
      </button>
    </form>
  );
}
