'use client';

import { useTenant } from '@/lib/tenants/context';
import Link from 'next/link';

const brands = [
  {
    slug: 'tacobee',
    name: 'TACOBEE',
    domain: 'www.tacobee.fr',
    description: 'Tacos authentiques et généreux',
    emoji: '🌮',
    color: 'from-orange-500 to-yellow-500',
  },
  {
    slug: 'beellissimo',
    name: 'BEELLISSIMO',
    domain: 'www.beellissimo.fr',
    description: 'Pizza à l\'italienne',
    emoji: '🍕',
    color: 'from-red-500 to-pink-500',
  },
  {
    slug: 'beerger',
    name: 'BEERGER',
    domain: 'www.beerger.fr',
    description: 'Burgers gourmets maison',
    emoji: '🍔',
    color: 'from-yellow-500 to-orange-500',
  },
];

export default function LandingPage() {
  const tenant = useTenant();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold" style={{ color: tenant.branding.primary_color }}>
            {tenant.name}
          </h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="space-y-8">
          <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900">
            Nos concepts gourmands 🍽️
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Découvrez nos 3 dark kitchens spécialisées.
            <br />
            Commandez en ligne et faites-vous livrer rapidement !
          </p>
        </div>
      </section>

      {/* Brands Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {brands.map((brand) => (
            <div
              key={brand.slug}
              className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden group"
            >
              <div className={`h-48 bg-gradient-to-br ${brand.color} flex items-center justify-center text-8xl group-hover:scale-110 transition-transform duration-300`}>
                {brand.emoji}
              </div>
              <div className="p-8 space-y-4">
                <h3 className="text-3xl font-bold text-gray-900">
                  {brand.name}
                </h3>
                <p className="text-lg text-gray-600">
                  {brand.description}
                </p>
                <a
                  href={`https://${brand.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full text-center py-3 px-6 rounded-lg font-semibold text-white bg-gradient-to-r ${brand.color} hover:opacity-90 transition-opacity`}
                >
                  Commander maintenant
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Pourquoi nous choisir ?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="text-5xl">⚡</div>
              <h4 className="text-xl font-bold text-gray-900">Livraison rapide</h4>
              <p className="text-gray-600">
                Vos plats préférés livrés en moins de 30 minutes
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="text-5xl">🍳</div>
              <h4 className="text-xl font-bold text-gray-900">Fraîcheur garantie</h4>
              <p className="text-gray-600">
                Tous nos plats sont préparés à la commande
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="text-5xl">💳</div>
              <h4 className="text-xl font-bold text-gray-900">Paiement sécurisé</h4>
              <p className="text-gray-600">
                CB, PayPal ou espèces à la livraison
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg">
            © 2026 {tenant.name} - Tous droits réservés
          </p>
          <p className="text-gray-400 mt-4">
            Une initiative gourmande par passion 🧡
          </p>
        </div>
      </footer>
    </div>
  );
}
