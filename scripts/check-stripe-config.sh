#!/bin/bash

# Script de vérification de l'intégration Stripe pour Payment Methods
# Usage: ./scripts/check-stripe-config.sh

echo "🔍 Vérification de la configuration Stripe..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ Fichier .env.local introuvable${NC}"
    echo "   Créez un fichier .env.local à la racine du projet"
    exit 1
fi

echo -e "${GREEN}✅ Fichier .env.local trouvé${NC}"
echo ""

# Check Stripe keys
echo "📋 Variables d'environnement Stripe :"
echo ""

# Publishable Key
if grep -q "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=" .env.local; then
    PUBLISHABLE_KEY=$(grep "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=" .env.local | cut -d '=' -f 2 | tr -d '"' | tr -d "'")
    if [[ $PUBLISHABLE_KEY == pk_test_* ]]; then
        echo -e "${GREEN}✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY${NC} (Test Mode)"
        echo "   ${PUBLISHABLE_KEY:0:20}..."
    elif [[ $PUBLISHABLE_KEY == pk_live_* ]]; then
        echo -e "${YELLOW}⚠️  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY${NC} (Live Mode - Attention!)"
        echo "   ${PUBLISHABLE_KEY:0:20}..."
    else
        echo -e "${RED}❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY invalide${NC}"
        echo "   Doit commencer par pk_test_ ou pk_live_"
    fi
else
    echo -e "${RED}❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY manquant${NC}"
fi
echo ""

# Secret Key
if grep -q "STRIPE_SECRET_KEY=" .env.local; then
    SECRET_KEY=$(grep "STRIPE_SECRET_KEY=" .env.local | cut -d '=' -f 2 | tr -d '"' | tr -d "'")
    if [[ $SECRET_KEY == sk_test_* ]]; then
        echo -e "${GREEN}✅ STRIPE_SECRET_KEY${NC} (Test Mode)"
        echo "   ${SECRET_KEY:0:20}..."
    elif [[ $SECRET_KEY == sk_live_* ]]; then
        echo -e "${YELLOW}⚠️  STRIPE_SECRET_KEY${NC} (Live Mode - Attention!)"
        echo "   ${SECRET_KEY:0:20}..."
    else
        echo -e "${RED}❌ STRIPE_SECRET_KEY invalide${NC}"
        echo "   Doit commencer par sk_test_ ou sk_live_"
    fi
else
    echo -e "${RED}❌ STRIPE_SECRET_KEY manquant${NC}"
fi
echo ""

# Webhook Secret (optionnel)
if grep -q "STRIPE_WEBHOOK_SECRET=" .env.local; then
    WEBHOOK_SECRET=$(grep "STRIPE_WEBHOOK_SECRET=" .env.local | cut -d '=' -f 2 | tr -d '"' | tr -d "'")
    if [[ $WEBHOOK_SECRET == whsec_* ]]; then
        echo -e "${GREEN}✅ STRIPE_WEBHOOK_SECRET${NC} (configuré)"
        echo "   ${WEBHOOK_SECRET:0:20}..."
    else
        echo -e "${YELLOW}⚠️  STRIPE_WEBHOOK_SECRET invalide${NC}"
        echo "   Doit commencer par whsec_"
    fi
else
    echo -e "${YELLOW}⚠️  STRIPE_WEBHOOK_SECRET manquant${NC} (optionnel pour payment methods)"
    echo "   Nécessaire uniquement pour les webhooks de souscriptions"
fi
echo ""

# Check Stripe CLI
echo "🛠️  Outils :"
echo ""
if command -v stripe &> /dev/null; then
    STRIPE_VERSION=$(stripe --version)
    echo -e "${GREEN}✅ Stripe CLI installé${NC} ($STRIPE_VERSION)"
    echo ""
    echo "💡 Pour tester les webhooks localement :"
    echo "   stripe listen --forward-to localhost:3000/api/webhooks/stripe"
else
    echo -e "${YELLOW}⚠️  Stripe CLI non installé${NC} (optionnel)"
    echo ""
    echo "💡 Pour installer (macOS) :"
    echo "   brew install stripe/stripe-cli/stripe"
    echo ""
    echo "   Plus d'infos : https://stripe.com/docs/stripe-cli"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Prochaines étapes :"
echo ""
echo "1. Lancer le serveur de dev :"
echo "   pnpm dev"
echo ""
echo "2. Se connecter à l'application"
echo ""
echo "3. Accéder à /payment-methods"
echo ""
echo "4. Cliquer sur 'Ajouter une carte'"
echo ""
echo "5. Utiliser une carte de test Stripe :"
echo "   - Numéro : 4242 4242 4242 4242"
echo "   - Expiration : 12/25"
echo "   - CVC : 123"
echo ""
echo "📚 Documentation complète :"
echo "   docs/TESTING_PAYMENT_METHODS_STRIPE.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
