'use client';

import { useCart } from '@/lib/cart/CartContext';
import { useTenant } from '@/lib/tenants/context';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';

export default function CartContent() {
  const { items, itemCount, totalCents, updateQuantity, removeItem, clearCart } = useCart();
  const tenant = useTenant();

  if (items.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
            className="inline-block px-8 py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: tenant.branding.primary_color }}
          >
            Voir le menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Votre panier</h1>
          <p className="text-gray-600 mt-2">
            {itemCount} article{itemCount > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={clearCart}
          className="px-4 py-2 text-red-600 hover:text-red-800 font-medium flex items-center gap-2"
        >
          <Trash2 className="w-5 h-5" />
          Vider le panier
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Liste des produits */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="bg-white rounded-lg shadow-md p-6 flex gap-4"
            >
              {/* Image */}
              <div className="relative w-24 h-24 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    🍽️
                  </div>
                )}
              </div>

              {/* Détails */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {item.productName}
                    </h3>
                    {item.options && item.options.length > 0 && (
                      <div className="text-sm text-gray-600 mt-1">
                        Options: {item.options.map((opt) => opt.name).join(', ')}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-4">
                  {/* Contrôles quantité */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-lg w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors"
                      style={{ backgroundColor: tenant.branding.primary_color }}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Prix */}
                  <div className="text-right">
                    <div
                      className="font-bold text-xl"
                      style={{ color: tenant.branding.primary_color }}
                    >
                      {((item.price + (item.options?.reduce((sum, opt) => sum + opt.price, 0) || 0)) * item.quantity / 100).toFixed(2)} €
                    </div>
                    <div className="text-sm text-gray-500">
                      {(item.price / 100).toFixed(2)} € × {item.quantity}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Récapitulatif */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Récapitulatif
            </h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span>
                <span>{(totalCents / 100).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Frais de livraison</span>
                <span className="text-sm">Calculés au checkout</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-xl font-bold">
                <span>Total</span>
                <span style={{ color: tenant.branding.primary_color }}>
                  {(totalCents / 100).toFixed(2)} €
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="block w-full py-4 rounded-lg font-semibold text-white text-center transition-opacity hover:opacity-90"
              style={{ backgroundColor: tenant.branding.primary_color }}
            >
              Passer commande
            </Link>

            <Link
              href="/menu"
              className="block w-full mt-3 py-3 rounded-lg font-semibold text-center border-2 transition-colors"
              style={{
                borderColor: tenant.branding.primary_color,
                color: tenant.branding.primary_color,
              }}
            >
              Continuer mes achats
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
