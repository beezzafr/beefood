'use client';

import { CatalogProduct } from '@/types/catalog';
import { useTenant } from '@/lib/tenants/context';
import { useCart } from '@/lib/cart/CartContext';
import Image from 'next/image';
import { useState } from 'react';
import ProductModal from './ProductModal';

interface ProductCardProps {
  product: CatalogProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const tenant = useTenant();
  const { getItemQuantity } = useCart();
  const [showModal, setShowModal] = useState(false);
  
  const price = (product.price_cents / 100).toFixed(2);
  const quantity = getItemQuantity(product.id);

  return (
    <>
      <div 
        onClick={() => setShowModal(true)}
        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group relative cursor-pointer"
      >
        {/* Badge quantité */}
        {quantity > 0 && (
          <div 
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full text-white font-bold flex items-center justify-center text-sm shadow-lg"
            style={{ backgroundColor: tenant.branding.primary_color }}
          >
            {quantity}
          </div>
        )}

        {/* Image */}
        <div className="relative h-48 bg-gray-200">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              🍽️
            </div>
          )}
          {!product.is_available && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                Indisponible
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
            {product.name}
          </h3>
          
          {product.description && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-2xl font-bold" style={{ color: tenant.branding.primary_color }}>
              {price} €
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
              className="px-4 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: tenant.branding.primary_color }}
              disabled={!product.is_available}
            >
              {product.is_available ? 'Voir détails' : 'Épuisé'}
            </button>
          </div>
        </div>
      </div>

      <ProductModal 
        product={product}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
