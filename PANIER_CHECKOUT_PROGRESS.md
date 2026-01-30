# Phase 3 - Panier & Checkout - EN COURS

## ✅ Déjà implémenté (Commit 58ade64)

### Panier fonctionnel
- ✅ CartContext avec localStorage (persiste entre les sessions)
- ✅ Hook useCart avec toutes les fonctions nécessaires
- ✅ Badge quantité sur Header (affiche le nombre d'articles)
- ✅ ProductCard avec bouton "Ajouter au panier"
- ✅ Animation de confirmation lors de l'ajout
- ✅ Page `/cart` complète :
  - Liste des produits avec image
  - Gestion quantités (+/- ou suppression)
  - Calcul du sous-total
  - Bouton "Passer commande"
  - Bouton "Continuer mes achats"
  - Message si panier vide

### Checkout
- ✅ Page `/checkout` avec formulaire complet
- ✅ Choix type de commande (🚚 Livraison / 🥡 À emporter / 🍽️ Sur place)
- ✅ Formulaire informations client (prénom, nom, email, téléphone)
- ✅ Adresse de livraison (conditionnelle si livraison sélectionnée)
- ✅ Choix mode de paiement (carte bancaire / espèces)
- ✅ Récapitulatif de la commande
- ✅ Packages Stripe installés (@stripe/stripe-js + @stripe/react-stripe-js)

---

## ❌ Ce qu'il reste à faire pour un MVP fonctionnel

### 1. Finaliser l'intégration paiement (PRIORITÉ 1)
- [ ] Créer Payment Intent Stripe côté serveur
- [ ] Intégrer le Stripe Payment Element dans CheckoutForm
- [ ] Gérer la confirmation de paiement
- [ ] Variables d'environnement Stripe (clés publique/secrète)

### 2. Finaliser la création de commande (PRIORITÉ 1)
- [ ] Mettre à jour `/api/orders/create` :
  - Créer customer dans Supabase (ou récupérer si auth)
  - Créer l'adresse de livraison
  - Calculer les frais de livraison (zones)
  - Créer la commande
  - Créer le paiement
  - Envoyer à Zelty API v2.10
  - Retourner le tracking_token
- [ ] Tester le flow complet de bout en bout

### 3. Authentification client (PRIORITÉ 2)
- [ ] Composant Login/Signup avec Supabase Auth
- [ ] Modal d'authentification
- [ ] Session management
- [ ] Pré-remplissage du formulaire si authentifié
- [ ] Page `/account` fonctionnelle avec historique

### 4. Notifications (PRIORITÉ 2)
- [ ] Template email confirmation commande
- [ ] Template SMS confirmation
- [ ] Envoi automatique après création commande
- [ ] Webhooks Zelty pour changements de statut
- [ ] Configuration Resend + Twilio

### 5. Calcul frais de livraison (PRIORITÉ 2)
- [ ] API pour vérifier la zone de livraison (code postal)
- [ ] Calcul automatique des frais selon la zone
- [ ] Affichage en temps réel dans le checkout
- [ ] Gestion du minimum de commande par zone
- [ ] Livraison gratuite au-dessus d'un seuil

### 6. Améliorations UX (PRIORITÉ 3)
- [ ] Loading states sur tous les boutons
- [ ] Toast notifications (succès/erreur)
- [ ] Validation des champs en temps réel
- [ ] Messages d'erreur clairs
- [ ] Animations de transition
- [ ] Responsive design mobile

---

## 🚀 Prochaines étapes immédiates

**Pour avoir un site où on peut vraiment commander** :

1. **Finaliser Payment Intent Stripe** (1-2h)
2. **Compléter l'API `/api/orders/create`** (2-3h)
3. **Tester le flow complet** (1h)
4. **Configurer les notifications email** (1h)

**Total estimé** : 5-7h pour un MVP fonctionnel où les clients peuvent commander et payer !

---

## 📝 Notes techniques

### Variables d'environnement requises
```bash
# Stripe (à ajouter)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (déjà configuré dans .env.local.example)
RESEND_API_KEY=re_...

# Twilio (déjà configuré dans .env.local.example)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+33...
```

### Structure des commandes
- Customer global (partagé entre tenants)
- Commande liée au tenant actuel
- Adresse de livraison sauvegardée
- Tracking token unique pour suivi
- Statut synchronisé avec Zelty via webhooks

---

**Statut** : ⏳ En cours - Panier et Checkout UI terminés, reste l'intégration backend
**Date** : 2026-01-26
**Prochaine étape** : Finaliser l'API de création de commande
