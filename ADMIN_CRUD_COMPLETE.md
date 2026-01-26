# Phase 2 - Admin CRUD Restaurants - TERMINÉ ✅

## Résumé de l'implémentation

L'interface d'administration complète pour gérer les restaurants (tenants) a été créée avec succès. Les administrateurs peuvent maintenant créer, lister, modifier et désactiver des restaurants directement depuis le backoffice.

## Fichiers créés

### 1. Validation & Types
- `lib/validations/tenant.ts` - Schémas Zod pour validation (création et mise à jour)

### 2. API Routes
- `app/api/admin/tenants/route.ts` - GET (liste) et POST (création)
- `app/api/admin/tenants/[id]/route.ts` - GET (détail), PATCH (mise à jour), DELETE (soft delete)

### 3. Composants réutilisables
- `components/admin/ColorPicker.tsx` - Sélecteur de couleur avec preview
- `components/admin/TenantBrandingPreview.tsx` - Aperçu live du branding
- `components/admin/TenantForm.tsx` - Formulaire partagé création/modification

### 4. Pages Admin
- `app/admin/tenants/page.tsx` - Liste des restaurants avec filtres
- `app/admin/tenants/add/page.tsx` - Formulaire de création
- `app/admin/tenants/[id]/page.tsx` - Formulaire de modification + danger zone

## Fichiers modifiés

### 1. Synchronisation Zelty
- `lib/zelty/sync.ts`
  - Supprimé l'appel automatique à `syncProductVisibility()` (ligne 75)
  - Ajout de commentaires explicatifs sur la gestion manuelle
  - Fonction `syncProductVisibility()` marquée comme `@deprecated`

### 2. Résolution des tenants
- `lib/tenants/resolver.ts`
  - Ajouté `getTenantById(id)` pour récupérer un tenant par ID

## Fonctionnalités implémentées

### Liste des restaurants (/admin/tenants)
- ✅ Tableau avec tous les tenants (logo, nom, domain, type, marque Zelty, statut)
- ✅ Recherche par nom/slug/domain
- ✅ Filtres par type (restaurant/landing) et statut (actif/inactif)
- ✅ Statistiques (X actifs / Y total)
- ✅ Actions : Modifier, Activer/Désactiver
- ✅ Lien vers le site public pour chaque tenant

### Création de restaurant (/admin/tenants/add)
- ✅ Formulaire multi-sections (Infos de base, Config Zelty, Branding, État)
- ✅ Validation Zod côté client et serveur
- ✅ Vérification unicité du slug et du domain
- ✅ Preview live du branding
- ✅ Color pickers pour primary/secondary colors
- ✅ Warning : "Aucun produit visible avant config manuelle"

### Modification de restaurant (/admin/tenants/[id])
- ✅ Formulaire pré-rempli avec données existantes
- ✅ Slug en lecture seule (non modifiable)
- ✅ Affichage des dates created_at / updated_at
- ✅ Liens vers commandes et site public
- ✅ Zone de danger pour désactivation (soft delete)

## Sécurité & Validations

### Validation Zod
- ✅ Slug : alphanumeric + tirets, 3-50 caractères
- ✅ Domain : format URL valide
- ✅ Couleurs : format hex (#RRGGBB)
- ✅ UUID : format UUID valide pour catalog_id
- ✅ Unicité : vérification slug et domain en base

### Protection des données
- ✅ Soft delete : désactivation au lieu de suppression physique
- ✅ Slug non modifiable en édition (évite breaking changes)
- ✅ Préservation des commandes liées lors de la désactivation

## Points importants

### Visibilité des produits
**CRITIQUE** : La création d'un nouveau restaurant ne crée PLUS automatiquement de visibilité pour les produits.

**Workflow recommandé :**
1. Créer le restaurant via `/admin/tenants/add`
2. Aller dans `/admin/products`
3. Cocher manuellement les produits visibles pour le nouveau restaurant

**Raison :** Contrôle total sur la visibilité des produits par restaurant.

### Catalogue global Zelty
- Les nouveaux restaurants utilisent automatiquement le catalogue global (`ZELTY_GLOBAL_CATALOG_ID`)
- Pas besoin de configurer un `zelty_catalog_id` spécifique (optionnel)
- Le champ `zelty_virtual_brand_name` identifie la marque pour les commandes Zelty

## Tests suggérés

### Test 1 : Création d'un nouveau restaurant
```bash
# Aller sur http://localhost:3000/admin/tenants
# Cliquer sur "Ajouter un Restaurant"
# Remplir le formulaire avec :
- Slug: pizzabee
- Nom: PIZZABEE
- Domain: www.pizzabee.fr
- Type: restaurant
- Marque Zelty: PIZZABEE
# Vérifier le preview live du branding
# Sauvegarder et vérifier dans Supabase
```

### Test 2 : Modification du branding
```bash
# Aller sur /admin/tenants
# Cliquer sur "Modifier" pour TACOBEE
# Changer la couleur principale
# Vérifier le preview
# Sauvegarder et visiter www.tacobee.fr (local)
```

### Test 3 : Désactivation d'un restaurant
```bash
# Modifier un restaurant
# Aller dans "Zone de danger"
# Désactiver le restaurant
# Vérifier qu'il n'est plus accessible publiquement
# Vérifier qu'il apparaît comme "Inactif" dans la liste
```

### Test 4 : Visibilité des produits
```bash
# Créer un nouveau restaurant
# Aller sur /admin/products
# Vérifier qu'aucune case n'est cochée pour le nouveau restaurant
# Cocher quelques produits
# Visiter le menu du nouveau restaurant
# Vérifier que seuls les produits cochés sont visibles
```

## Prochaines étapes recommandées

1. **Authentification Admin** : Ajouter Supabase Auth pour sécuriser `/admin`
2. **Upload de logos** : Intégrer Supabase Storage pour uploader les logos
3. **Historique des modifications** : Logger les changements de configuration
4. **Validation des domaines** : Vérifier que le domaine est bien configuré dans Vercel
5. **Tests automatisés** : Créer des tests pour les API routes

## Notes techniques

### Performance
- Les requêtes utilisent les index existants (slug, domain, is_active)
- Le cache React est utilisé pour les résolutions de tenants
- Les previews sont rendus côté client pour fluidité

### UX
- Feedback visuel immédiat (preview branding)
- Messages d'erreur clairs et contextuels
- Confirmations avant actions destructives
- Loading states sur toutes les actions async

---

**Statut** : ✅ Implémentation complète et fonctionnelle
**Date** : 2026-01-26
**Tous les todos** : Complétés (9/9)
