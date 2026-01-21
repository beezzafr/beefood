'use client';

import { CatalogProduct } from '@/types/catalog';
import { useTenant } from '@/lib/tenants/context';
import Link from 'next/link';
import Image from 'next/image';

interface ProductCardProps {
  product: CatalogProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const tenant = useTenant();
  const price = (product.price_cents / 100).toFixed(2);

  return (
    <Link href={`/menu/${product.id}`}>
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
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
              className="px-4 py-2 rounded-lg font-semibold text-white transition-opacity"
              style={{ backgroundColor: tenant.branding.primary_color }}
              disabled={!product.is_available}
            >
              {product.is_available ? 'Ajouter' : 'Épuisé'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
