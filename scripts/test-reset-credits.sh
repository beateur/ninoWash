#!/bin/bash

# ============================================
# Script de Test Local - Reset Weekly Credits
# ============================================
# Ce script permet de tester la fonction Edge Function localement
# avant le déploiement en production.
#
# Usage: ./test-reset-credits.sh
# ============================================

set -e  # Exit on error

echo "🧪 Test Local - Reset Weekly Credits"
echo "===================================="
echo ""

# Couleurs pour l'output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_REF="${SUPABASE_PROJECT_REF:-YOUR_PROJECT_REF}"
ANON_KEY="${SUPABASE_ANON_KEY:-YOUR_ANON_KEY}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-YOUR_SERVICE_ROLE_KEY}"

# Vérifier les variables d'environnement
if [ "$PROJECT_REF" = "YOUR_PROJECT_REF" ]; then
  echo -e "${RED}❌ Erreur: SUPABASE_PROJECT_REF non défini${NC}"
  echo "   Définir avec: export SUPABASE_PROJECT_REF=abcdefghijklmnop"
  exit 1
fi

if [ "$ANON_KEY" = "YOUR_ANON_KEY" ]; then
  echo -e "${RED}❌ Erreur: SUPABASE_ANON_KEY non défini${NC}"
  echo "   Définir avec: export SUPABASE_ANON_KEY=eyJh..."
  exit 1
fi

# URL de la fonction
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/reset-weekly-credits"

echo -e "${YELLOW}📍 URL de la fonction:${NC}"
echo "   $FUNCTION_URL"
echo ""

# Test 1: Vérifier que la fonction est déployée
echo "Test 1: Vérifier le déploiement de la fonction..."
echo "------------------------------------------------"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  --location --request POST "$FUNCTION_URL" \
  --header "Authorization: Bearer $ANON_KEY" \
  --header "Content-Type: application/json")

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}✅ Fonction déployée et accessible (HTTP $HTTP_STATUS)${NC}"
else
  echo -e "${RED}❌ Fonction non accessible (HTTP $HTTP_STATUS)${NC}"
  exit 1
fi
echo ""

# Test 2: Exécuter le reset et capturer la réponse
echo "Test 2: Exécuter le reset..."
echo "-----------------------------"
RESPONSE=$(curl -s --location --request POST "$FUNCTION_URL" \
  --header "Authorization: Bearer $ANON_KEY" \
  --header "Content-Type: application/json")

echo "Réponse brute:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Parser la réponse JSON
SUCCESS=$(echo "$RESPONSE" | jq -r '.success' 2>/dev/null || echo "false")
TOTAL=$(echo "$RESPONSE" | jq -r '.totalProcessed' 2>/dev/null || echo "0")
SUCCESS_COUNT=$(echo "$RESPONSE" | jq -r '.successCount' 2>/dev/null || echo "0")
ERROR_COUNT=$(echo "$RESPONSE" | jq -r '.errorCount' 2>/dev/null || echo "0")

if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ Reset réussi !${NC}"
  echo "   • Total traité: $TOTAL abonnements"
  echo "   • Succès: $SUCCESS_COUNT"
  echo "   • Erreurs: $ERROR_COUNT"
else
  echo -e "${RED}❌ Reset échoué${NC}"
  ERROR_MESSAGE=$(echo "$RESPONSE" | jq -r '.error' 2>/dev/null || echo "Erreur inconnue")
  echo "   Erreur: $ERROR_MESSAGE"
  exit 1
fi
echo ""

# Test 3: Vérifier les crédits créés dans la base
echo "Test 3: Vérifier les crédits dans la base..."
echo "----------------------------------------------"
echo -e "${YELLOW}💡 Exécuter dans SQL Editor:${NC}"
echo ""
cat << 'SQL'
SELECT 
  sc.user_id,
  sc.credits_total,
  sc.credits_remaining,
  sc.week_start_date,
  sc.reset_at,
  sc.created_at,
  s.plan_id
FROM subscription_credits sc
JOIN subscriptions s ON s.id = sc.subscription_id
WHERE sc.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY sc.created_at DESC;
SQL
echo ""

# Test 4: Résumé
echo "Test 4: Résumé des tests"
echo "-------------------------"
if [ "$ERROR_COUNT" -eq 0 ] && [ "$SUCCESS_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ Tous les tests réussis !${NC}"
  echo ""
  echo "Prochaines étapes:"
  echo "1. Vérifier les logs: supabase functions logs reset-weekly-credits"
  echo "2. Configurer le cron job (voir docs/CRON_JOB_DEPLOYMENT_GUIDE.md)"
  echo "3. Monitorer les exécutions quotidiennes"
  exit 0
elif [ "$TOTAL" -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Aucun abonnement actif trouvé${NC}"
  echo "   C'est normal si vous testez sur un environnement vide."
  echo "   Créez un abonnement test pour valider le flux complet."
  exit 0
else
  echo -e "${RED}❌ Des erreurs ont été détectées${NC}"
  echo "   Vérifier les logs: supabase functions logs reset-weekly-credits"
  exit 1
fi
