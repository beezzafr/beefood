# 📊 RÉSUMÉ : Architecture Multi-Visibilité Produits

## ✅ Implémentation Terminée

Tous les composants de la nouvelle architecture de visibilité des produits ont été implémentés avec succès.

## 🎯 Ce Qui a Changé

### Avant (Architecture par Catalogue)
```
Zelty Catalogue TACOBEE → catalog_products (tenant_id = tacobee)
Zelty Catalogue BEELLISSIMO → catalog_products (tenant_id = beellissimo)
Zelty Catalogue BEERGER → catalog_products (tenant_id = beerger)
```
**Problème** : Les catalogues Zelty étaient identiques, donc tous les produits apparaissaient sur tous les sites.

### Après (Architecture Multi-Visibilité)
```
Zelty Catalogue BEEFOOD (global)
    ↓ Sync unique
catalog_products (SANS tenant_id)
    ↓ Many-to-Many
product_visibility (produit ↔ tenant)
    ↓ Filtre par tenant
Menu TACOBEE : Uniquement produits visibles
Menu BEELLISSIMO : Uniquement produits visibles
Menu BEERGER : Uniquement produits visibles
```
**Solution** : Gestion manuelle de la visibilité via interface admin.

## 📦 Fichiers Créés/Modifiés

### Nouveaux Fichiers
1. **`supabase/migrations/006_product_visibility.sql`**
   - Création de la table `product_visibility`
   - Suppression de `tenant_id` dans `catalog_products`
   - Index et contraintes

2. **`app/admin/products/page.tsx`**
   - Interface admin pour gérer la visibilité
   - Toggle par tenant (TACOBEE / BEELLISSIMO / BEERGER)
   - Recherche et filtres
   - Bouton de synchro Zelty

3. **`app/api/admin/products/visibility/route.ts`**
   - API endpoint pour mettre à jour la visibilité
   - POST avec `{ product_id, tenant_id, is_visible }`

4. **`DEPLOY_VISIBILITY.md`**
   - Guide complet de déploiement
   - Diagnostic et dépannage
   - Exemples SQL

### Fichiers Modifiés
1. **`lib/zelty/sync.ts`**
   - Nouvelle fonction `syncGlobalCatalog()`
   - Synchro depuis catalogue global `ZELTY_GLOBAL_CATALOG_ID`
   - Création automatique de la visibilité (tous produits visibles partout par défaut)

2. **`app/menu/page.tsx`**
   - Requête avec `INNER JOIN product_visibility`
   - Filtre par `tenant_id` et `is_visible = true`

3. **`supabase/migrations/005_rls.sql`**
   - RLS policies pour `product_visibility`
   - Mise à jour des policies `catalog_products` (sans tenant_id)

4. **`types/catalog.ts`**
   - Suppression de `tenant_id` dans `CatalogProduct`

5. **`app/admin/layout.tsx`**
   - Ajout du lien "Produits" dans la navigation

6. **`supabase/migrations/001_tenants.sql`**
   - Commentaire sur `zelty_catalog_id` (inutilisé pour restaurants)

## 🔧 Configuration Requise

### Variables d'Environnement
Ajouter dans Vercel :
```bash
ZELTY_GLOBAL_CATALOG_ID=4eefb3cd-35d2-4d3f-b414-de34e6d22312
```

### Migration Base de Données
Exécuter dans Supabase SQL Editor :
```sql
-- Copier-coller le contenu de supabase/migrations/006_product_visibility.sql
```

## 🚀 Prochaines Étapes (À Faire)

### 1. Déploiement
```bash
# Commit et push
git add -A
git commit -m "feat: Architecture multi-visibilité produits

- Catalogue global Zelty (beefood)
- Table product_visibility (many-to-many)
- Interface admin pour gérer visibilité
- Menu filtré par tenant avec JOIN"

git push origin main
```

### 2. Migration Supabase
- Aller dans Supabase SQL Editor
- Copier-coller `supabase/migrations/006_product_visibility.sql`
- Exécuter

### 3. Configuration Vercel
- Ajouter `ZELTY_GLOBAL_CATALOG_ID=4eefb3cd-35d2-4d3f-b414-de34e6d22312`
- Redéployer

### 4. Synchronisation Initiale
```bash
# Via curl
curl -X GET https://www.beefood.fr/api/cron/sync-catalog \
  -H "Authorization: Bearer VOTRE_CRON_SECRET"

# OU via l'interface admin
# Allez sur https://www.beefood.fr/admin/products
# Cliquez sur "🔄 Sync Zelty"
```

### 5. Configuration Visibilité
- Allez sur `/admin/products`
- Pour chaque produit, cochez/décochez les tenants où il doit être visible
- Exemple :
  - **Regina** → ☑ BEELLISSIMO, ☐ TACOBEE, ☐ BEERGER
  - **Taco Poulet** → ☐ BEELLISSIMO, ☑ TACOBEE, ☐ BEERGER
  - **Coca-Cola** → ☑ BEELLISSIMO, ☑ TACOBEE, ☑ BEERGER

### 6. Tests
Vérifier que chaque site affiche uniquement ses produits :
- `tacobee.fr/menu`
- `beellissimo.fr/menu`
- `beerger.fr/menu`

## 📊 Validation SQL

Une fois la synchro lancée, vérifier :

```sql
-- 1. Nombre de produits importés
SELECT COUNT(*) FROM catalog_products;
-- Attendu: ~103 produits

-- 2. Nombre d'entrées de visibilité
SELECT COUNT(*) FROM product_visibility;
-- Attendu: ~309 (103 × 3 tenants)

-- 3. Répartition par tenant
SELECT 
  t.slug,
  COUNT(pv.id) as visible_products
FROM product_visibility pv
JOIN tenants t ON t.id = pv.tenant_id
WHERE pv.is_visible = true
GROUP BY t.slug;
-- Attendu: 103 pour chaque tenant (avant ajustements manuels)

-- 4. Vérifier qu'un produit spécifique est bien visible
SELECT 
  cp.name,
  t.slug,
  pv.is_visible
FROM catalog_products cp
JOIN product_visibility pv ON pv.product_id = cp.id
JOIN tenants t ON t.id = pv.tenant_id
WHERE cp.name LIKE '%Coca%'
ORDER BY t.slug;
```

## 💡 Comment Utiliser l'Interface Admin

1. **Accéder** : `https://www.beefood.fr/admin/products`

2. **Rechercher** : Tapez un nom de produit dans la barre de recherche

3. **Toggle Visibilité** :
   - ☑ = Produit visible sur ce restaurant
   - ☐ = Produit masqué sur ce restaurant
   - Cliquez sur la checkbox pour toggle

4. **Synchroniser** : Cliquez sur "🔄 Sync Zelty" pour importer les nouveaux produits depuis Zelty

5. **Vérifier** : Allez sur les sites frontend pour voir les changements en temps réel

## 🎨 Interface Admin

```
┌─────────────────────────────────────────────────────────────┐
│ Gestion Visibilité Produits          103 produits    [Sync] │
├─────────────────────────────────────────────────────────────┤
│ [Rechercher un produit...]                                   │
├────────┬──────────────────┬──────┬──────┬──────┬────────────┤
│ Produit│ Prix             │ TACO │ BEEL │ BEER │            │
├────────┼──────────────────┼──────┼──────┼──────┼────────────┤
│ 🍕 Regina                 │ 14€  │  ☐   │  ☑   │  ☐         │
│ 🌮 Taco Poulet            │ 8€   │  ☑   │  ☐   │  ☐         │
│ 🥤 Coca-Cola              │ 3€   │  ☑   │  ☑   │  ☑         │
│ 🍔 Cheeseburger           │ 12€  │  ☐   │  ☐   │  ☑         │
└────────┴──────────────────┴──────┴──────┴──────┴────────────┘
```

## ⚠️ Points d'Attention

1. **Migration Destructive** : La migration 006 supprime `tenant_id` de `catalog_products`. Les données existantes seront perdues. C'est normal car les catalogues étaient mal configurés.

2. **Visibilité Par Défaut** : Les nouveaux produits sont automatiquement visibles sur TOUS les restaurants. Ajustez manuellement si nécessaire.

3. **Pas de Réversion Automatique** : Si vous désactivez un produit dans Zelty (`disable = true`), il sera désactivé partout. Pour désactiver sur un seul tenant, utilisez l'interface admin.

4. **Performance** : Les index sont optimisés pour les JOINs. Pas de problème de performance attendu jusqu'à plusieurs milliers de produits.

## 📚 Documentation Complète

- **Guide de Déploiement** : `DEPLOY_VISIBILITY.md`
- **Architecture Technique** : Ce fichier
- **API Zelty** : `ZELTY_API_CORRECTIONS.md`
- **Webhooks Zelty** : `ZELTY_WEBHOOKS_SETUP.md`

## ✅ Tests de Validation

Après déploiement, effectuer ces tests :

### Test 1 : Synchro Initiale
```bash
curl -X GET https://www.beefood.fr/api/cron/sync-catalog \
  -H "Authorization: Bearer VOTRE_CRON_SECRET"
```
**Attendu** : `{ success: true, count: 103 }`

### Test 2 : Affichage Menu (Avant Ajustements)
- Visiter `tacobee.fr/menu` → Doit afficher 103 produits
- Visiter `beellissimo.fr/menu` → Doit afficher 103 produits
- Visiter `beerger.fr/menu` → Doit afficher 103 produits

### Test 3 : Interface Admin
- Aller sur `/admin/products`
- Rechercher "Regina"
- Décocher TACOBEE et BEERGER
- Vérifier que Regina disparaît de `tacobee.fr/menu` et `beerger.fr/menu`

### Test 4 : Produit Partagé
- Rechercher "Coca"
- Vérifier que les 3 cases sont cochées
- Tous les sites doivent afficher Coca-Cola

## 🎉 Prêt à Déployer !

Tout le code est prêt. Il ne reste plus qu'à :
1. Commit + Push
2. Appliquer la migration Supabase
3. Ajouter la variable d'environnement Vercel
4. Lancer la synchro
5. Configurer la visibilité

Bonne chance ! 🚀
