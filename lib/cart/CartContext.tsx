'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string | null;
  price: number; // en centimes
  quantity: number;
  options?: {
    id: string;
    name: string;
    price: number; // en centimes
  }[];
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalCents: number;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'beefood_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Charger le panier depuis localStorage au montage
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setItems(parsed);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
    setIsHydrated(true);
  }, []);

  // Sauvegarder le panier dans localStorage à chaque changement
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isHydrated]);

  const addItem = (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.productId === newItem.productId);

      if (existingItem) {
        // Si le produit existe déjà, on augmente la quantité
        return prevItems.map((item) =>
          item.productId === newItem.productId
            ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
            : item
        );
      } else {
        // Sinon on ajoute le nouveau produit
        return [
          ...prevItems,
          {
            ...newItem,
            quantity: newItem.quantity || 1,
          },
        ];
      }
    });
  };

  const removeItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const isInCart = (productId: string) => {
    return items.some((item) => item.productId === productId);
  };

  const getItemQuantity = (productId: string) => {
    const item = items.find((item) => item.productId === productId);
    return item?.quantity || 0;
  };

  // Calculs dérivés
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  
  const totalCents = items.reduce((total, item) => {
    const itemPrice = item.price;
    const optionsPrice = item.options?.reduce((sum, opt) => sum + opt.price, 0) || 0;
    return total + (itemPrice + optionsPrice) * item.quantity;
  }, 0);

  const value: CartContextType = {
    items,
    itemCount,
    totalCents,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isInCart,
    getItemQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
