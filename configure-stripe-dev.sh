#!/bin/bash

# =============================================================================
# Configuration des Clés Stripe PREVIEW/DEVELOPMENT sur Vercel
# =============================================================================
# Ce script configure les clés Stripe de TEST pour les environnements dev/preview
# =============================================================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

print_header() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} ${BOLD}$1${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Fonction pour lire une valeur depuis .env.local
get_env_value() {
    local var_name=$1
    local file="${2:-.env.local}"
    
    if [ -f "$file" ]; then
        grep "^${var_name}=" "$file" | cut -d '=' -f2- | tr -d '"' | tr -d "'"
    else
        echo ""
    fi
}

# Fonction pour ajouter une variable d'environnement
add_env_var() {
    local var_name=$1
    local var_value=$2
    local environment=$3
    
    if [ -z "$var_value" ]; then
        print_warning "Valeur vide pour $var_name - ignorée"
        return
    fi
    
    print_info "Configuration de $var_name pour $environment..."
    
    # Supprimer la variable existante si elle existe
    vercel env rm "$var_name" "$environment" -y &> /dev/null || true
    
    # Ajouter la nouvelle variable
    echo "$var_value" | vercel env add "$var_name" "$environment" &> /dev/null
    
    if [ $? -eq 0 ]; then
        print_success "$var_name configurée pour $environment"
    else
        print_error "Erreur lors de la configuration de $var_name pour $environment"
        return 1
    fi
}

# =============================================================================
# SCRIPT PRINCIPAL
# =============================================================================

clear

print_header "🧪 Configuration Stripe TEST (Dev/Preview)"

echo -e "${BOLD}Ce script configure les clés Stripe de TEST pour:${NC}"
echo ""
echo -e "  ${CYAN}•${NC} Environnement ${YELLOW}Development${NC} (vercel dev)"
echo -e "  ${CYAN}•${NC} Environnement ${YELLOW}Preview${NC} (branches git)"
echo ""
echo -e "${GREEN}Les clés de PRODUCTION (LIVE) resteront inchangées${NC}"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Vérifier la connexion Vercel
if ! vercel whoami &> /dev/null; then
    print_error "Vous devez être connecté à Vercel"
    exit 1
fi

user=$(vercel whoami 2>&1)
print_success "Connecté en tant que: $user"

# Vérifier le projet lié
if [ ! -f ".vercel/project.json" ]; then
    print_error "Projet Vercel non lié"
    exit 1
fi

print_success "Projet lié détecté"

# =============================================================================
# LECTURE DES CLÉS DE TEST DEPUIS .env.local
# =============================================================================

print_header "📖 Lecture des Clés TEST depuis .env.local"

STRIPE_PK_TEST=$(get_env_value "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")
STRIPE_SK_TEST=$(get_env_value "STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_TEST=$(get_env_value "STRIPE_WEBHOOK_SECRET")

if [[ "$STRIPE_PK_TEST" =~ ^pk_test_ ]]; then
    print_success "Clé publique TEST détectée: ${STRIPE_PK_TEST:0:20}..."
else
    print_error "Clé publique TEST non trouvée ou invalide dans .env.local"
    exit 1
fi

if [[ "$STRIPE_SK_TEST" =~ ^sk_test_ ]]; then
    print_success "Clé secrète TEST détectée: ${STRIPE_SK_TEST:0:20}..."
else
    print_error "Clé secrète TEST non trouvée ou invalide dans .env.local"
    exit 1
fi

if [ ! -z "$STRIPE_WEBHOOK_TEST" ]; then
    print_success "Webhook secret TEST détecté: ${STRIPE_WEBHOOK_TEST:0:20}..."
else
    print_warning "Webhook secret TEST non trouvé (sera configuré plus tard)"
fi

# =============================================================================
# RÉCAPITULATIF
# =============================================================================

print_header "📊 Récapitulatif"

echo -e "${BOLD}Variables qui seront configurées:${NC}"
echo ""
echo -e "${CYAN}NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:${NC}"
echo -e "  ${STRIPE_PK_TEST:0:30}...${STRIPE_PK_TEST: -4}"
echo ""
echo -e "${CYAN}STRIPE_SECRET_KEY:${NC}"
echo -e "  ${STRIPE_SK_TEST:0:30}...${STRIPE_SK_TEST: -4}"
echo ""
if [ ! -z "$STRIPE_WEBHOOK_TEST" ]; then
    echo -e "${CYAN}STRIPE_WEBHOOK_SECRET:${NC}"
    echo -e "  ${STRIPE_WEBHOOK_TEST:0:30}...${STRIPE_WEBHOOK_TEST: -4}"
else
    echo -e "${CYAN}STRIPE_WEBHOOK_SECRET:${NC}"
    echo -e "  ${YELLOW}[Non configuré - utilisez 'stripe listen' localement]${NC}"
fi
echo ""
echo -e "${BOLD}Environnements ciblés:${NC}"
echo -e "  ${YELLOW}• Development${NC} (vercel dev, localhost)"
echo -e "  ${YELLOW}• Preview${NC} (branches git, PRs)"
echo ""
echo -e "${GREEN}L'environnement Production restera avec les clés LIVE${NC}"
echo ""
echo -ne "${YELLOW}Confirmer la configuration?${NC} (y/n): "
read final_confirm

if [ "$final_confirm" != "y" ] && [ "$final_confirm" != "Y" ]; then
    print_error "Configuration annulée"
    exit 1
fi

# =============================================================================
# CONFIGURATION SUR VERCEL
# =============================================================================

print_header "🚀 Configuration sur Vercel"

echo -e "${CYAN}Configuration des variables TEST...${NC}"
echo ""

# Configurer pour Development
echo -e "${BOLD}Environnement: ${YELLOW}Development${NC}"
add_env_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$STRIPE_PK_TEST" "development"
add_env_var "STRIPE_SECRET_KEY" "$STRIPE_SK_TEST" "development"
if [ ! -z "$STRIPE_WEBHOOK_TEST" ]; then
    add_env_var "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_TEST" "development"
fi

echo ""

# Configurer pour Preview
echo -e "${BOLD}Environnement: ${YELLOW}Preview${NC}"
add_env_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$STRIPE_PK_TEST" "preview"
add_env_var "STRIPE_SECRET_KEY" "$STRIPE_SK_TEST" "preview"
if [ ! -z "$STRIPE_WEBHOOK_TEST" ]; then
    add_env_var "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_TEST" "preview"
fi

# =============================================================================
# SUCCÈS
# =============================================================================

echo ""
print_header "✅ Configuration Terminée"

echo -e "${GREEN}${BOLD}Les clés Stripe TEST ont été configurées avec succès !${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Environnements configurés:${NC}"
echo ""
echo -e "${YELLOW}Development:${NC}"
echo -e "  • Stripe Publishable Key: ${STRIPE_PK_TEST:0:20}..."
echo -e "  • Stripe Secret Key: ${STRIPE_SK_TEST:0:20}..."
if [ ! -z "$STRIPE_WEBHOOK_TEST" ]; then
    echo -e "  • Webhook Secret: ${STRIPE_WEBHOOK_TEST:0:20}..."
fi
echo ""
echo -e "${YELLOW}Preview:${NC}"
echo -e "  • Stripe Publishable Key: ${STRIPE_PK_TEST:0:20}..."
echo -e "  • Stripe Secret Key: ${STRIPE_SK_TEST:0:20}..."
if [ ! -z "$STRIPE_WEBHOOK_TEST" ]; then
    echo -e "  • Webhook Secret: ${STRIPE_WEBHOOK_TEST:0:20}..."
fi
echo ""
echo -e "${GREEN}Production:${NC}"
echo -e "  • Clés LIVE inchangées ✅"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BOLD}Comment tester:${NC}"
echo ""
echo -e "${YELLOW}1. Localement (avec stripe listen):${NC}"
echo -e "   ${BLUE}npm run dev${NC}"
echo -e "   ${GRAY}→ Utilisera les clés TEST de .env.local${NC}"
echo ""
echo -e "${YELLOW}2. Avec Vercel Dev:${NC}"
echo -e "   ${BLUE}vercel dev${NC}"
echo -e "   ${GRAY}→ Utilisera les clés TEST de l'environnement Development${NC}"
echo ""
echo -e "${YELLOW}3. Sur une branche Preview:${NC}"
echo -e "   ${BLUE}git checkout -b test/stripe-flow${NC}"
echo -e "   ${BLUE}git push origin test/stripe-flow${NC}"
echo -e "   ${GRAY}→ Vercel créera un déploiement Preview avec les clés TEST${NC}"
echo ""
echo -e "${YELLOW}4. Cartes de test à utiliser:${NC}"
echo -e "   ${GREEN}Succès:${NC} 4242 4242 4242 4242"
echo -e "   ${RED}Échec:${NC} 4000 0000 0000 0002"
echo -e "   ${BLUE}3D Secure:${NC} 4000 0025 0000 3155"
echo ""
echo -e "${YELLOW}5. Pour les webhooks en local:${NC}"
echo -e "   ${BLUE}stripe listen --forward-to localhost:3000/api/webhooks/stripe${NC}"
echo -e "   ${GRAY}→ Stripe CLI vous donnera un webhook secret temporaire${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}${BOLD}🎉 Configuration réussie ! Vous pouvez maintenant tester en dev.${NC}"
echo ""
