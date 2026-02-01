'use client';

import { CatalogProduct } from '@/types/catalog';
import { useTenant } from '@/lib/tenants/context';
import { useCart } from '@/lib/cart/CartContext';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ProductOption {
  id: string;
  zelty_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  is_available: boolean;
  option_group_name: string;
  option_type: string;
  sort_order: number;
}

interface ProductModalProps {
  product: CatalogProduct;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const tenant = useTenant();
  const { addItem } = useCart();
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Charger les options du produit
  useEffect(() => {
    if (isOpen && product.id) {
      fetch(`/api/products/${product.id}/options`)
        .then(res => res.json())
        .then(data => {
          if (data.options) {
            setOptions(data.options);
          }
        })
        .catch(err => console.error('Error loading options:', err));
    }
  }, [isOpen, product.id]);

  if (!isOpen) return null;

  // Grouper les options par groupe
  const groupedOptions = options.reduce((acc, option) => {
    const group = option.option_group_name;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(option);
    return acc;
  }, {} as Record<string, ProductOption[]>);

  const toggleOption = (optionId: string) => {
    const newSelected = new Set(selectedOptions);
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId);
    } else {
      newSelected.add(optionId);
    }
    setSelectedOptions(newSelected);
  };

  const calculateTotal = () => {
    const basePrice = product.price_cents * quantity;
    const optionsPrice = Array.from(selectedOptions).reduce((total, optionId) => {
      const option = options.find(o => o.id === optionId);
      return total + (option?.price_cents || 0) * quantity;
    }, 0);
    return basePrice + optionsPrice;
  };

  const handleAddToCart = () => {
    const selectedOptionsList = Array.from(selectedOptions)
      .map(optionId => options.find(o => o.id === optionId))
      .filter(Boolean)
      .map(opt => ({
        id: opt!.id,
        name: opt!.name,
        price: opt!.price_cents,
      }));

    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.image_url,
      price: product.price_cents,
      quantity,
      options: selectedOptionsList,
    });

    onClose();
    setSelectedOptions(new Set());
    setQuantity(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Détails du produit</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Image */}
            <div className="relative aspect-square bg-gray-200 rounded-xl overflow-hidden">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">
                  🍽️
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h3>
                <p className="text-2xl font-bold" style={{ color: tenant.branding.primary_color }}>
                  {(product.price_cents / 100).toFixed(2)} €
                </p>
              </div>

              {product.description && (
                <div>
                  <p className="text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Options */}
              {Object.keys(groupedOptions).length > 0 && (
                <div className="space-y-6">
                  <h4 className="text-xl font-bold text-gray-900">Options disponibles</h4>
                  {Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
                    <div key={groupName} className="space-y-3">
                      <h5 className="font-semibold text-gray-700">{groupName}</h5>
                      <div className="space-y-2">
                        {groupOptions
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((option) => (
                            <label
                              key={option.id}
                              className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                selectedOptions.has(option.id)
                                  ? 'border-current bg-opacity-10'
                                  : 'border-gray-200 hover:border-gray-300'
                              } ${!option.is_available ? 'opacity-50 cursor-not-allowed' : ''}`}
                              style={
                                selectedOptions.has(option.id)
                                  ? {
                                      borderColor: tenant.branding.primary_color,
                                      backgroundColor: tenant.branding.primary_color + '10',
                                    }
                                  : {}
                              }
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={selectedOptions.has(option.id)}
                                  onChange={() => toggleOption(option.id)}
                                  disabled={!option.is_available}
                                  className="w-5 h-5"
                                />
                                <div>
                                  <div className="font-medium">{option.name}</div>
                                  {option.description && (
                                    <div className="text-sm text-gray-500">{option.description}</div>
                                  )}
                                </div>
                              </div>
                              <div className="font-semibold">
                                {option.price_cents > 0
                                  ? `+${(option.price_cents / 100).toFixed(2)} €`
                                  : 'Gratuit'}
                              </div>
                            </label>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4">
                <span className="font-semibold">Quantité :</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border-2 border-gray-300 font-bold hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold text-xl">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg text-white font-bold"
                    style={{ backgroundColor: tenant.branding.primary_color }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold text-gray-700">Total</span>
            <span className="text-3xl font-bold" style={{ color: tenant.branding.primary_color }}>
              {(calculateTotal() / 100).toFixed(2)} €
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!product.is_available}
            className="w-full py-4 rounded-lg font-semibold text-white text-lg transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: tenant.branding.primary_color }}
          >
            {product.is_available ? 'Ajouter au panier' : 'Produit indisponible'}
          </button>
        </div>
      </div>
    </div>
  );
}
