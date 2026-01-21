# 🚀 Démarrage Rapide

## Pour commencer immédiatement

### 1️⃣ Installation

```bash
npm install
```

### 2️⃣ Configuration

Copier `.env.local.example` vers `.env.local` et remplir les variables :

```bash
cp .env.local.example .env.local
```

Variables minimales requises pour le développement local :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEV_TENANT_SLUG=tacobee`

### 3️⃣ Déployer les migrations Supabase

Via SQL Editor dans Supabase Dashboard, exécuter dans l'ordre :
1. `supabase/migrations/001_tenants.sql`
2. `supabase/migrations/002_customers.sql`
3. `supabase/migrations/003_catalog.sql`
4. `supabase/migrations/004_orders.sql`
5. `supabase/migrations/005_rls.sql`

### 4️⃣ Lancer le dev server

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## 📚 Documentation Complète

- **[README.md](./README.md)** - Documentation technique du projet
- **[DEPLOY.md](./DEPLOY.md)** - Guide de déploiement en production
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Récapitulatif complet
- **[ZELTY_WEBHOOKS_SETUP.md](./ZELTY_WEBHOOKS_SETUP.md)** - Configuration webhooks Zelty

---

## 🏗️ Architecture

**4 domaines configurés :**
- `www.beefood.fr` → Landing page
- `www.tacobee.fr` → Restaurant (tacos)
- `www.beellissimo.fr` → Restaurant (pizza)
- `www.beerger.fr` → Restaurant (burgers)

**En développement local :**
- `http://localhost:3000` → Utilise le tenant défini dans `DEV_TENANT_SLUG`

---

## ✅ Checklist Déploiement Production

### Avant de déployer sur Vercel

- [ ] Code pushé sur GitHub
- [ ] Migrations Supabase déployées
- [ ] `.env.local.example` rempli avec vos vraies valeurs

### Après déploiement Vercel

- [ ] Variables ENV configurées dans Vercel
- [ ] 4 domaines configurés (DNS)
- [ ] Webhooks Zelty configurés (voir [ZELTY_WEBHOOKS_SETUP.md](./ZELTY_WEBHOOKS_SETUP.md))
- [ ] Webhook Stripe configuré
- [ ] Test commande complète effectué

---

## 🧪 Tester le Multitenant en Local

Modifier `/etc/hosts` :

```
127.0.0.1 tacobee.local
127.0.0.1 beellissimo.local
127.0.0.1 beerger.local
127.0.0.1 beefood.local
```

Puis accéder à :
- `http://tacobee.local:3000` → TACOBEE
- `http://beellissimo.local:3000` → BEELLISSIMO
- `http://beerger.local:3000` → BEERGER
- `http://beefood.local:3000` → Landing BEEFOOD

---

## 🎯 Accès Rapides

### Frontend
- `/` → Landing ou Menu (selon tenant)
- `/menu` → Liste produits
- `/cart` → Panier
- `/account` → Compte client
- `/order/[token]` → Suivi commande

### Admin
- `/admin` → Dashboard
- `/admin/orders` → Liste commandes
- `/admin/orders/[id]` → Détail commande

### API
- `/api/orders/create` → Créer commande
- `/api/webhooks/zelty` → Webhooks Zelty
- `/api/webhooks/stripe` → Webhooks Stripe
- `/api/cron/sync-catalog` → Sync Zelty (cron)
- `/api/admin/setup-webhooks` → Setup webhooks Zelty

---

## 💡 Aide

**Problème de build ?**
```bash
npm run build
```

**Problème TypeScript ?**
```bash
npx tsc --noEmit
```

**Logs Vercel ?**
Aller sur votre projet Vercel → Logs → Functions

**Logs Supabase ?**
Dashboard Supabase → Database → Logs

---

## 🚀 Prêt à déployer ?

Suivez le guide complet : **[DEPLOY.md](./DEPLOY.md)**

---

**Développé avec ❤️ pour BEEFOOD** 🍔🌮🍕
