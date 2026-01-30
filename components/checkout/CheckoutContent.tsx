'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart/CartContext';
import { useTenant } from '@/lib/tenants/context';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function CheckoutContent() {
  const router = useRouter();
  const { items, totalCents } = useCart();
  const tenant = useTenant();
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Rediriger si le panier est vide
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items, router]);

  if (items.length === 0) {
    return null;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Finaliser la commande</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Formulaire */}
        <div className="lg:col-span-2">
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm />
            </Elements>
          ) : (
            <CheckoutForm />
          )}
        </div>

        {/* Récapitulatif */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Récapitulatif
            </h2>

            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.quantity}x {item.productName}
                  </span>
                  <span className="font-semibold">
                    {((item.price * item.quantity) / 100).toFixed(2)} €
                  </span>
                </div>
              ))}
              
              <div className="border-t pt-3 flex justify-between">
                <span className="text-gray-600">Sous-total</span>
                <span className="font-semibold">{(totalCents / 100).toFixed(2)} €</span>
              </div>
              
              <div className="flex justify-between text-gray-600">
                <span>Frais de livraison</span>
                <span className="text-sm">À calculer</span>
              </div>
              
              <div className="border-t pt-3 flex justify-between text-xl font-bold">
                <span>Total</span>
                <span style={{ color: tenant.branding.primary_color }}>
                  {(totalCents / 100).toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
