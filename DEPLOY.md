# Guide de Déploiement - Restaurant Multitenant Platform

## 📋 Prérequis

- Compte GitHub
- Compte Vercel (connecté à GitHub)
- Compte Supabase
- Compte Zelty (avec API key et catalog IDs)
- Compte Stripe (mode test/production)
- Compte Resend (pour emails)
- Compte Twilio (pour SMS)

## 🚀 Étape 1 : Configuration Supabase

### 1.1 Créer le projet Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Noter les credentials :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 1.2 Déployer les migrations SQL

**Option A : Via Supabase Dashboard**

1. Aller dans SQL Editor
2. Exécuter les fichiers dans l'ordre :
   - `supabase/migrations/001_tenants.sql`
   - `supabase/migrations/002_customers.sql`
   - `supabase/migrations/003_catalog.sql`
   - `supabase/migrations/004_orders.sql`
   - `supabase/migrations/005_rls.sql`

**Option B : Via Supabase CLI**

```bash
npx supabase init
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

### 1.3 Créer le bucket Storage (pour logos)

1. Aller dans Storage
2. Créer un bucket `tenant-logos`
3. Configurer comme public
4. Policy : Upload admin only, lecture publique

## 🔧 Étape 2 : Configuration GitHub

### 2.1 Créer le repository

```bash
cd /Users/maboughariou/Documents/GitHub/restaurant
git remote add origin https://github.com/VOTRE-USERNAME/restaurant-multitenant.git
git branch -M main
git push -u origin main
```

### 2.2 Vérifier le .gitignore

S'assurer que `.env.local` est bien ignoré.

## ☁️ Étape 3 : Configuration Vercel

### 3.1 Importer le projet

1. Aller sur [vercel.com](https://vercel.com)
2. New Project → Import depuis GitHub
3. Sélectionner le repository `restaurant-multitenant`
4. Framework Preset : Next.js
5. Node Version : 20.x
6. **NE PAS DÉPLOYER TOUT DE SUITE** → Aller dans Settings

### 3.2 Configurer les variables d'environnement

Aller dans Settings → Environment Variables, ajouter :

**Supabase**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

**Zelty**
```
ZELTY_API_KEY=votre_api_key
ZELTY_WEBHOOK_SECRET=votre_webhook_secret
ZELTY_DELIVERY_FEE_PRODUCT_ID=id_produit_frais_livraison
```

**Stripe**
```
STRIPE_SECRET_KEY=sk_test_xxx ou sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx (à récupérer après config webhook)
```

**Notifications**
```
RESEND_API_KEY=re_xxx
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM_NUMBER=+33xxxxxxx
```

**Cron**
```
CRON_SECRET=générer_un_secret_aléatoire_fort
```

**Dev**
```
DEV_TENANT_SLUG=tacobee
```

### 3.3 Configurer les domaines personnalisés

1. Aller dans Settings → Domains
2. Ajouter les 4 domaines :
   - `www.beefood.fr`
   - `www.tacobee.fr`
   - `www.beellissimo.fr`
   - `www.beerger.fr`

3. Configurer le DNS chez votre registrar :

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Attention** : Attendre la propagation DNS (peut prendre jusqu'à 48h)

### 3.4 Déployer

Cliquer sur "Deploy" ou faire un push sur `main` :

```bash
git push origin main
```

Vercel déploiera automatiquement.

## 🔗 Étape 4 : Configuration Webhooks

### 4.1 Webhook Zelty

1. Dans le dashboard Zelty, aller dans Settings → Webhooks
2. Créer un nouveau webhook :
   - **URL** : `https://www.beefood.fr/api/webhooks/zelty`
   - **Events** : 
     - `dish.availability_update`
     - `option_value.availability_update`
     - `order.status.update`
   - **Secret** : Générer et noter dans `ZELTY_WEBHOOK_SECRET`

### 4.2 Webhook Stripe

1. Dans Stripe Dashboard, aller dans Developers → Webhooks
2. Add endpoint :
   - **URL** : `https://www.beefood.fr/api/webhooks/stripe`
   - **Events** :
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`
   - **API version** : Latest
3. Copier le Signing secret dans `STRIPE_WEBHOOK_SECRET`

## ⏰ Étape 5 : Vérifier le Cron Vercel

Le fichier `vercel.json` configure déjà le cron pour la sync catalogue (toutes les 15 min).

**Vérifier que ça fonctionne** :

```bash
curl -H "Authorization: Bearer VOTRE_CRON_SECRET" \
  https://www.beefood.fr/api/cron/sync-catalog
```

Devrait retourner un JSON avec les résultats de sync.

## 🧪 Étape 6 : Tests Multitenant

### 6.1 Tester chaque domaine

1. **www.beefood.fr** → Landing page avec 3 marques
2. **www.tacobee.fr** → Menu TACOBEE
3. **www.beellissimo.fr** → Menu BEELLISSIMO
4. **www.beerger.fr** → Menu BEERGER

### 6.2 Tester le branding dynamique

Vérifier que chaque site a ses propres couleurs (CSS variables).

### 6.3 Tester les commandes

1. Ajouter des produits au panier
2. Aller au checkout
3. Remplir le formulaire
4. Tester paiement Stripe (mode test)
5. Vérifier :
   - Commande créée dans Supabase
   - Commande envoyée à Zelty
   - Email de confirmation reçu
   - SMS de confirmation reçu

### 6.4 Tester le backoffice

1. Aller sur `www.beefood.fr/admin`
2. Vérifier dashboard
3. Voir les commandes
4. Filtrer par tenant
5. Voir le détail d'une commande

## 🔍 Étape 7 : Monitoring & Logs

### 7.1 Vercel Logs

- Aller dans votre projet Vercel
- Logs → Functions
- Filtrer par route pour debug

### 7.2 Supabase Logs

- Aller dans Supabase Dashboard
- Database → Logs
- Vérifier les queries lentes

### 7.3 Stripe Dashboard

- Vérifier les paiements test
- Vérifier les webhooks reçus

## ✅ Checklist Finale

- [ ] Supabase configuré et migrations déployées
- [ ] Vercel déployé avec toutes les variables ENV
- [ ] 4 domaines configurés et DNS propagés
- [ ] Webhook Zelty configuré et testé
- [ ] Webhook Stripe configuré et testé
- [ ] Cron sync catalogue fonctionne
- [ ] Test commande complète réussie
- [ ] Email et SMS de confirmation reçus
- [ ] Admin backoffice accessible

## 🚨 Troubleshooting

### Problème : Tenant not found

- Vérifier que le middleware résout bien le domaine
- Vérifier les données dans `tenants` table
- Check les logs Vercel

### Problème : Catalogue vide

- Vérifier `ZELTY_API_KEY`
- Lancer manuellement le sync : `POST /api/cron/sync-catalog`
- Vérifier les logs Vercel
- Vérifier les `catalog_id` dans la table `tenants`

### Problème : Paiement Stripe ne fonctionne pas

- Vérifier `STRIPE_SECRET_KEY`
- Utiliser une carte de test Stripe (4242 4242 4242 4242)
- Vérifier les webhooks Stripe reçus

### Problème : Emails/SMS non reçus

- Vérifier les credentials Resend/Twilio
- Check les logs des providers
- Vérifier le numéro From Twilio vérifié

## 📞 Support

En cas de problème, vérifier :
1. Logs Vercel (Functions)
2. Logs Supabase
3. Network tab navigateur (DevTools)
4. Console navigateur

## 🎉 Félicitations !

Votre plateforme multitenant est maintenant déployée et opérationnelle !
