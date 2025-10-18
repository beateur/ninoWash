# Documentation des Services Nino Wash

## Vue d'ensemble

Nino Wash propose deux types de services de pressing pour les clients non abonnés, avec des délais de traitement différents.

## Structure de l'offre

### Service Classique - 72h

Traitement standard avec livraison en 72 heures.

#### 1. Nettoyage et pliage
- **Code**: `CLASSIC_WASH_FOLD`
- **Prix**: 24,99€
- **Poids**: 7 kg
- **Délai**: 72 heures (3 jours)
- **Inclus**: 
  - Nettoyage professionnel
  - Pliage soigné
  - Emballage

#### 2. Nettoyage, repassage et pliage
- **Code**: `CLASSIC_WASH_IRON_FOLD`
- **Prix**: 29,99€
- **Poids**: 7 kg
- **Délai**: 72 heures (3 jours)
- **Inclus**: 
  - Nettoyage professionnel
  - Repassage de qualité
  - Pliage soigné
  - Emballage

### Service Express - 24h

Traitement rapide avec livraison en 24 heures.

#### 1. Nettoyage et pliage
- **Code**: `EXPRESS_WASH_FOLD`
- **Prix**: 34,99€
- **Poids**: 7 kg
- **Délai**: 24 heures (1 jour)
- **Inclus**: 
  - Nettoyage professionnel
  - Pliage soigné
  - Emballage
  - Traitement prioritaire

#### 2. Nettoyage, repassage et pliage
- **Code**: `EXPRESS_WASH_IRON_FOLD`
- **Prix**: 39,99€
- **Poids**: 7 kg
- **Délai**: 24 heures (1 jour)
- **Inclus**: 
  - Nettoyage professionnel
  - Repassage de qualité
  - Pliage soigné
  - Emballage
  - Traitement prioritaire

## Base de données

### Table `services`

Les services sont stockés dans la table `services` avec les champs suivants :

- `id`: UUID unique
- `code`: Code unique du service (ex: `CLASSIC_WASH_FOLD`)
- `name`: Nom du service
- `description`: Description détaillée
- `type`: Type de service (`one_time` pour les services à l'unité)
- `base_price`: Prix de base en euros
- `vat_rate`: Taux de TVA (20%)
- `processing_days`: Nombre de jours de traitement
- `category`: Catégorie du service (`Service Classique` ou `Service Express`)
- `is_active`: Statut actif/inactif
- `metadata`: Métadonnées JSON (poids, inclusions, délai)

### Table `service_categories`

Les catégories de services :

- **Service Classique**: Traitement en 72 heures
- **Service Express**: Traitement en 24 heures

## Interface utilisateur

### Page de réservation

L'interface de sélection des services (`/reservation`) affiche :

1. **Section Service Classique - 72h**
   - Carte "Nettoyage et pliage" (24,99€)
   - Carte "Nettoyage, repassage et pliage" (29,99€)

2. **Section Service Express - 24h**
   - Carte "Nettoyage et pliage" (34,99€)
   - Carte "Nettoyage, repassage et pliage" (39,99€)

### Fonctionnalités

- Sélection simple par catégorie (pas de filtres ou recherche)
- Affichage du nombre d'articles sélectionnés
- Calcul automatique du total
- Récapitulatif des articles sélectionnés

## API

### Endpoint `/api/services`

Retourne la liste des services actifs groupés par catégorie.

**Réponse**:
\`\`\`json
{
  "services": {
    "Service Classique": [
      {
        "id": "uuid",
        "code": "CLASSIC_WASH_FOLD",
        "name": "Nettoyage et pliage",
        "description": "Service classique - Traitement en 72h - 7kg",
        "base_price": 24.99,
        "category": "Service Classique",
        "processing_days": 3
      },
      // ...
    ],
    "Service Express": [
      // ...
    ]
  }
}
\`\`\`

## Migration

Pour mettre à jour la base de données avec les services réels, exécutez le script :

\`\`\`bash
# Via l'interface v0
Exécuter le script: scripts/07-update-services-real-offer.sql
\`\`\`

Ce script :
1. Désactive tous les anciens services
2. Supprime les anciennes catégories
3. Crée les 2 nouvelles catégories (Classique et Express)
4. Insère les 4 services réels
5. Nettoie les options de service obsolètes

## Notes importantes

- Les prix incluent la TVA à 20%
- Le poids de base est de 7 kg pour tous les services
- Les abonnements (mensuel/trimestriel) ne sont pas affectés par ces changements
- L'interface ne propose plus de barre de recherche ni de filtres (simplification)
