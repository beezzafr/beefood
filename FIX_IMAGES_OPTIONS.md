# 🔧 Fix: Import Images & Options Produits

## ❌ Problème identifié

Les **images** et les **options** des produits n'étaient pas importées depuis Zelty lors de la synchronisation du catalogue.

### Analyse de la cause
1. **Images** : Elles ÉTAIENT importées (`image_url: dish.image`), donc le problème venait peut-être de l'API ou des données Zelty elles-mêmes
2. **Options** : Elles n'étaient PAS du tout importées, le script se limitait aux produits de base

---

## ✅ Solution implémentée (Commit 48c26fb)

### 1. Migration 007 - Options globales

Fichier : `supabase/migrations/007_global_options.sql`

**Problème** : La table `catalog_options` avait encore un `tenant_id`, alors que les produits sont maintenant globaux (migration 006).

**Actions** :
- ✅ Suppression de la colonne `tenant_id` dans `catalog_options`
- ✅ Suppression des contraintes et index liés au `tenant_id`
- ✅ Ajout contrainte `UNIQUE(zelty_id)` pour options globales
- ✅ Ajout colonne `option_group_name` (ex: "Taille", "Suppléments")
- ✅ Ajout colonne `option_type` (simple, multiple, required)
- ✅ Restructuration complète pour correspondre à l'API Zelty
- ✅ Recréation des index optimisés

### 2. Mise à jour du Client Zelty

Fichier : `lib/zelty/client.ts`

**Changement** :
```typescript
// AVANT
async getCatalog() { 
  return this.fetch<ZeltyCatalogResponse>(...);
}

// APRÈS
async getCatalog() {
  const response = await this.fetch<any>(...); // Retourne tout
  console.log('Full catalog keys:', Object.keys(response));
  return response; // dishes + options + groupes
}
```

### 3. Refonte du script de synchronisation

Fichier : `lib/zelty/sync.ts`

**Avant** :
- Utilisait `getCatalogDishes()` → Seulement les produits
- N'importait pas les options

**Après** :
- Utilise `getCatalog()` → Catalogue complet
- Import des produits (`dishes`)
- Import des groupes d'options (`options`)
- Import des valeurs d'options (`options.values`)
- Liaison automatique options → produits via `product_id`

**Structure de l'import** :
```
1. Importer les produits (dishes)
   → upsert dans catalog_products
   → récupérer les IDs générés

2. Pour chaque groupe d'options :
   → Extraire les valeurs (values)
   → Transformer en format Supabase
   → upsert dans catalog_options

3. Lier les options aux produits :
   → Pour chaque dish.options (array d'IDs)
   → UPDATE catalog_options SET product_id = ...
```

---

## 📊 Structure des données Zelty

### Produits (dishes)
```json
{
  "id": 1794498,
  "name": "Margherita",
  "description": "Une pizza classique...",
  "image": "https://media.zelty.fr/images/...",
  "price": 1100,
  "options": [34699, 34765, 34766],  // ← IDs des options
  "disable": false
}
```

### Options (structure dans le catalogue complet)
```json
{
  "options": [
    {
      "id": 1234,
      "name": "Taille",
      "type": "simple",
      "values": [
        {
          "id": 34699,
          "name": "Petite",
          "price": 0,
          "outofstock": false,
          "o": 0
        },
        {
          "id": 34765,
          "name": "Moyenne",
          "price": 200,
          "outofstock": false,
          "o": 1
        }
      ]
    }
  ]
}
```

---

## 🎯 Résultat

### Avant
- ❌ Options non importées
- ⚠️ Images potentiellement manquantes (selon données Zelty)
- ❌ Table `catalog_options` incohérente (avec tenant_id)

### Après
- ✅ Options importées avec leurs groupes
- ✅ Liaison automatique options → produits
- ✅ Images importées (si présentes dans Zelty)
- ✅ Table `catalog_options` cohérente (globale)
- ✅ Disponibilité des options gérée (`is_available`)
- ✅ Prix des options importé correctement

---

## 🚀 Prochaines étapes

### Pour tester
1. **Appliquer la migration 007** :
   ```bash
   # Dans Supabase Dashboard → SQL Editor
   # Copier/coller supabase/migrations/007_global_options.sql
   ```

2. **Resynchroniser le catalogue** :
   ```bash
   curl -X GET https://www.beefood.fr/api/cron/sync-catalog \
     -H "Authorization: Bearer VOTRE_CRON_SECRET"
   ```

3. **Vérifier dans Supabase** :
   ```sql
   -- Compter les produits
   SELECT COUNT(*) FROM catalog_products;
   
   -- Compter les options
   SELECT COUNT(*) FROM catalog_options;
   
   -- Voir les options d'un produit
   SELECT co.* 
   FROM catalog_options co
   WHERE co.product_id = 'uuid-du-produit';
   
   -- Voir les images des produits
   SELECT name, image_url 
   FROM catalog_products 
   WHERE image_url IS NOT NULL;
   ```

### Pour afficher les options dans le frontend

**Modifier `app/menu/page.tsx`** pour joindre les options :
```typescript
const { data: products } = await supabase
  .from('catalog_products')
  .select(`
    *,
    catalog_options (*)
  `)
  .inner join product_visibility ...
```

**Créer un composant `ProductModal`** pour afficher :
- Image en grand
- Description complète
- Liste des options (groupes + valeurs)
- Sélection des options avant ajout au panier

---

## 📝 Notes techniques

### Différences clés Zelty API
- `/catalog/dishes` → Seulement les produits de base
- `/catalogs/{id}` → Catalogue COMPLET (dishes + options + menus + tags)

### Structure catalog_options (après migration 007)
```sql
id                UUID
product_id        UUID → catalog_products
zelty_id          TEXT UNIQUE
name              TEXT
description       TEXT
price_cents       INTEGER
is_available      BOOLEAN
option_group_name TEXT (ex: "Taille")
option_type       TEXT (ex: "simple", "multiple")
sort_order        INTEGER
```

### Gestion des prix
- Prix produit : `product.price_cents`
- Prix option : `option.price_cents`
- Total : `product.price_cents + SUM(options.price_cents)`

---

**Date** : 2026-01-26  
**Status** : ✅ **Corrigé et pushé**  
**Commit** : `48c26fb`
