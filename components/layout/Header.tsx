'use client';

import { useTenant } from '@/lib/tenants/context';
import Link from 'next/link';
import { ShoppingCart, User } from 'lucide-react';

export default function Header() {
  const tenant = useTenant();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div
              className="text-2xl font-bold"
              style={{ color: tenant.branding.primary_color }}
            >
              {tenant.name}
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/menu"
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              Menu
            </Link>
            <Link
              href="/about"
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              À propos
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Link
              href="/cart"
              className="relative p-2 text-gray-700 hover:text-gray-900"
            >
              <ShoppingCart className="w-6 h-6" />
              {/* Badge pour le nombre d'items - à implémenter avec context panier */}
            </Link>
            <Link
              href="/account"
              className="p-2 text-gray-700 hover:text-gray-900"
            >
              <User className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
