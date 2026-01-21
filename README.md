# Restaurant Multitenant Platform

Plateforme Next.js 16 multitenant pour gérer plusieurs restaurants/dark kitchens avec intégration Zelty.

## 🏗️ Architecture

- **Frontend & Backend**: Next.js 16.1.4 (App Router, Turbopack)
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security)
- **POS Integration**: Zelty API (catalogue, commandes, webhooks)
- **Payments**: Stripe
- **Hosting**: Vercel (déploiement continu)

## 📦 Stack Technique

- Next.js 16.1.4 avec React 19
- TypeScript strict
- Tailwind CSS
- Supabase (SSR)
- Stripe
- Zod (validation)

## 🚀 Installation

### Prérequis

- Node.js 20.9+ (requis pour Next.js 16)
- npm ou yarn
- Compte Supabase
- Compte Zelty (API Key + Catalog IDs)
- Compte Vercel (optionnel, pour déploiement)

### Setup Local

1. **Installer les dépendances**

```bash
npm install
```

2. **Configuration environnement**

Copier `.env.local.example` vers `.env.local` et remplir les variables :

```bash
cp .env.local.example .env.local
```

Variables requises :
- `NEXT_PUBLIC_SUPABASE_URL` : URL de votre projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Clé anonyme Supabase
- `SUPABASE_SERVICE_ROLE_KEY` : Clé service role Supabase
- `ZELTY_API_KEY` : API Key Zelty
- `ZELTY_DELIVERY_FEE_PRODUCT_ID` : ID du produit "Frais de livraison" dans Zelty

3. **Setup Supabase**

Initialiser Supabase CLI (optionnel pour dev local) :

```bash
npx supabase init
npx supabase link --project-ref YOUR_PROJECT_REF
```

Déployer les migrations :

```bash
npx supabase db push
```

Ou exécuter manuellement les migrations dans l'ordre :
- `supabase/migrations/001_tenants.sql`
- `supabase/migrations/002_customers.sql`
- `supabase/migrations/003_catalog.sql`
- `supabase/migrations/004_orders.sql`
- `supabase/migrations/005_rls.sql`

4. **Lancer le serveur de développement**

```bash
npm run dev
```

Le site sera accessible sur `http://localhost:3000`

### Test Multitenant en Local

Pour tester les différents domaines en local, modifier `/etc/hosts` :

```
127.0.0.1 beefood.local
127.0.0.1 tacobee.local
127.0.0.1 beellissimo.local
127.0.0.1 beerger.local
```

Puis accéder à : `http://tacobee.local:3000`

## 🏢 Tenants Configurés

Le projet inclut 4 tenants par défaut :

| Tenant | Domain | Type | Catalog ID |
|--------|--------|------|------------|
| BEEFOOD | www.beefood.fr | Landing | - |
| TACOBEE | www.tacobee.fr | Restaurant | f3b5891e-6e10-40c9-864d-8bce4440e454 |
| BEELLISSIMO | www.beellissimo.fr | Restaurant | 823eeaa2-3815-4215-bc38-ce5893196730 |
| BEERGER | www.beerger.fr | Restaurant | 1b9d7180-7f6e-4374-82ab-a7b6a2dbf24a |

## 📂 Structure du Projet

```
├── app/                      # Routes Next.js (App Router)
│   ├── (frontend)/          # Routes publiques
│   ├── admin/               # Backoffice
│   └── api/                 # API Routes
├── components/              # Composants React
├── lib/                     # Librairies & utilitaires
│   ├── supabase/           # Clients Supabase
│   ├── zelty/              # Client & sync Zelty
│   ├── tenants/            # Résolution tenant
│   ├── payments/           # Stripe
│   └── notifications/      # Email/SMS
├── types/                   # Types TypeScript
├── supabase/
│   └── migrations/         # Migrations SQL
└── middleware.ts           # Middleware multitenant
```

## 🔧 Configuration Vercel

### Variables d'Environnement

Configurer dans Vercel Dashboard > Settings > Environment Variables :

- Toutes les variables de `.env.local.example`
- `CRON_SECRET` : Secret pour protéger les endpoints cron

### Domaines Personnalisés

Ajouter les 4 domaines dans Vercel :
- www.beefood.fr
- www.tacobee.fr
- www.beellissimo.fr
- www.beerger.fr

### Cron Jobs

Configuré dans `vercel.json` :
- Sync catalogue Zelty : toutes les 15 minutes

## 🔐 Sécurité

- Row Level Security (RLS) activé sur toutes les tables
- Validation Zod sur tous les endpoints API
- Webhooks sécurisés (HMAC signature)
- Variables sensibles jamais exposées au client

## 📖 Documentation

- [Plan Complet](https://github.com/...)
- [API Zelty](https://api.zelty.fr/docs)
- [Supabase Docs](https://supabase.com/docs)

## 🤝 Contribution

Projet privé - Pas de contributions externes pour le moment.

## 📝 License

Propriétaire - Tous droits réservés
