#!/bin/bash

# =============================================================================
# Configuration Automatique des Variables d'Environnement Vercel
# =============================================================================
# Ce script configure toutes les variables d'environnement nécessaires
# pour le déploiement en production sur Vercel
# =============================================================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Fonction pour afficher des messages formatés
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

print_question() {
    echo -e "${CYAN}❓ $1${NC}"
}

# Fonction pour demander une valeur
ask_value() {
    local var_name=$1
    local description=$2
    local is_secret=$3
    local current_value=$4
    
    echo ""
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}Variable:${NC} ${BOLD}$var_name${NC}"
    echo -e "${CYAN}Description:${NC} $description"
    
    if [ ! -z "$current_value" ]; then
        if [ "$is_secret" = "true" ]; then
            # Masquer les secrets (montrer seulement les premiers/derniers caractères)
            local masked_value="${current_value:0:10}...${current_value: -4}"
            echo -e "${CYAN}Valeur actuelle (dev):${NC} $masked_value"
        else
            echo -e "${CYAN}Valeur actuelle (dev):${NC} $current_value"
        fi
    fi
    
    echo ""
    
    if [ "$is_secret" = "true" ]; then
        echo -ne "${YELLOW}Entrez la valeur PRODUCTION (la saisie sera masquée)${NC}: "
        read -s value
        echo ""
    else
        echo -ne "${YELLOW}Entrez la valeur PRODUCTION${NC}: "
        read value
    fi
    
    echo "$value"
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

# Fonction pour vérifier si Vercel CLI est installé
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI n'est pas installé"
        echo ""
        print_info "Installation de Vercel CLI..."
        npm i -g vercel
        print_success "Vercel CLI installé avec succès"
    else
        print_success "Vercel CLI est déjà installé"
    fi
}

# Fonction pour se connecter à Vercel
vercel_login() {
    print_info "Vérification de la connexion Vercel..."
    
    if vercel whoami &> /dev/null; then
        local user=$(vercel whoami 2>&1)
        print_success "Déjà connecté en tant que: $user"
    else
        print_warning "Vous devez vous connecter à Vercel"
        vercel login
        print_success "Connexion réussie"
    fi
}

# Fonction pour lier le projet
vercel_link() {
    print_info "Liaison du projet Vercel..."
    
    if [ -f ".vercel/project.json" ]; then
        print_success "Projet déjà lié"
    else
        print_warning "Liaison du projet nécessaire"
        vercel link
        print_success "Projet lié avec succès"
    fi
}

# Fonction pour ajouter une variable d'environnement
add_env_var() {
    local var_name=$1
    local var_value=$2
    local environment=${3:-production}
    
    if [ -z "$var_value" ]; then
        print_warning "Valeur vide pour $var_name - ignorée"
        return
    fi
    
    print_info "Configuration de $var_name..."
    
    # Supprimer la variable existante si elle existe (pour éviter les doublons)
    vercel env rm "$var_name" "$environment" -y &> /dev/null || true
    
    # Ajouter la nouvelle variable
    echo "$var_value" | vercel env add "$var_name" "$environment" &> /dev/null
    
    if [ $? -eq 0 ]; then
        print_success "$var_name configurée"
    else
        print_error "Erreur lors de la configuration de $var_name"
    fi
}

# =============================================================================
# SCRIPT PRINCIPAL
# =============================================================================

clear

print_header "🚀 Configuration des Variables d'Environnement Vercel"

echo -e "${BOLD}Ce script va configurer toutes les variables d'environnement${NC}"
echo -e "${BOLD}nécessaires pour le déploiement en PRODUCTION sur Vercel.${NC}"
echo ""
echo -e "${YELLOW}Les valeurs de développement seront détectées automatiquement.${NC}"
echo -e "${YELLOW}Vous devrez fournir les valeurs de PRODUCTION manquantes.${NC}"
echo ""
echo -ne "${CYAN}Appuyez sur ENTRÉE pour continuer...${NC}"
read dummy

# Étape 1: Vérifications préliminaires
print_header "📋 Étape 1/5: Vérifications Préliminaires"

check_vercel_cli
vercel_login
vercel_link

# Étape 2: Lecture des valeurs de développement
print_header "📖 Étape 2/5: Lecture des Valeurs de Développement"

# Lecture depuis .env.local
DEV_APP_URL=$(get_env_value "NEXT_PUBLIC_APP_URL")
DEV_SUPABASE_URL=$(get_env_value "NEXT_PUBLIC_SUPABASE_URL")
DEV_SUPABASE_ANON_KEY=$(get_env_value "NEXT_PUBLIC_SUPABASE_ANON_KEY")
DEV_SUPABASE_SERVICE_ROLE=$(get_env_value "SUPABASE_SERVICE_ROLE_KEY")
DEV_STRIPE_PK=$(get_env_value "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")
DEV_STRIPE_SK=$(get_env_value "STRIPE_SECRET_KEY")
DEV_STRIPE_WEBHOOK=$(get_env_value "STRIPE_WEBHOOK_SECRET")
DEV_SUBSCRIPTIONS=$(get_env_value "NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED")
DEV_BOOKINGS=$(get_env_value "NEXT_PUBLIC_BOOKINGS_ENABLED")
DEV_MAINTENANCE=$(get_env_value "MAINTENANCE_MODE")
DEV_RATE_LIMIT_REQUESTS=$(get_env_value "RATE_LIMIT_REQUESTS_PER_MINUTE")
DEV_RATE_LIMIT_WINDOW=$(get_env_value "RATE_LIMIT_WINDOW_MS")
DEV_MAX_FILE_SIZE=$(get_env_value "MAX_FILE_SIZE")
DEV_ALLOWED_FILE_TYPES=$(get_env_value "ALLOWED_FILE_TYPES")
DEV_LOG_LEVEL=$(get_env_value "LOG_LEVEL")
DEV_ENABLE_REQUEST_LOGGING=$(get_env_value "ENABLE_REQUEST_LOGGING")

# Lecture depuis .env.deno
DEV_RESEND_API_KEY=$(get_env_value "RESEND_API_KEY" ".env.deno")

print_success "Valeurs de développement chargées depuis .env.local et .env.deno"

# Étape 3: Collecte des valeurs de production
print_header "🔑 Étape 3/5: Collecte des Valeurs de PRODUCTION"

echo -e "${BOLD}${RED}ATTENTION:${NC} ${BOLD}Les clés Stripe actuelles sont des clés de TEST${NC}"
echo -e "${YELLOW}Clé publique actuelle:${NC} ${DEV_STRIPE_PK:0:20}..."
echo -e "${YELLOW}Clé secrète actuelle:${NC} ${DEV_STRIPE_SK:0:20}..."
echo ""
echo -e "${GREEN}Vous devez fournir les clés de PRODUCTION (pk_live_ et sk_live_)${NC}"
echo ""
echo -ne "${CYAN}Appuyez sur ENTRÉE pour continuer...${NC}"
read dummy

# Variables OBLIGATOIRES à demander
PROD_APP_URL=$(ask_value "NEXT_PUBLIC_APP_URL" "URL de production de l'application" false "https://ninowash.fr")

echo ""
print_info "Les clés Supabase sont les mêmes en dev et prod (OK)"
PROD_SUPABASE_URL=$DEV_SUPABASE_URL
PROD_SUPABASE_ANON_KEY=$DEV_SUPABASE_ANON_KEY
PROD_SUPABASE_SERVICE_ROLE=$DEV_SUPABASE_SERVICE_ROLE

PROD_STRIPE_PK=$(ask_value "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "Clé publique Stripe LIVE (pk_live_...)" true "$DEV_STRIPE_PK")
PROD_STRIPE_SK=$(ask_value "STRIPE_SECRET_KEY" "Clé secrète Stripe LIVE (sk_live_...)" true "$DEV_STRIPE_SK")

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Pour le Webhook Secret Stripe:${NC}"
echo ""
echo -e "${CYAN}1.${NC} Créez d'abord le webhook sur Stripe:"
echo -e "   ${BLUE}→ https://dashboard.stripe.com/webhooks${NC} (mode LIVE)"
echo ""
echo -e "${CYAN}2.${NC} Endpoint: ${GREEN}https://ninowash.fr/api/webhooks/stripe${NC}"
echo ""
echo -e "${CYAN}3.${NC} Événements à sélectionner:"
echo -e "   • checkout.session.completed"
echo -e "   • payment_intent.succeeded"
echo -e "   • payment_intent.payment_failed"
echo -e "   • customer.subscription.created"
echo -e "   • customer.subscription.updated"
echo -e "   • customer.subscription.deleted"
echo ""
echo -e "${CYAN}4.${NC} Copiez le signing secret (whsec_...)"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -ne "${CYAN}Avez-vous créé le webhook?${NC} (y/n): "
read webhook_created

if [ "$webhook_created" = "y" ] || [ "$webhook_created" = "Y" ]; then
    PROD_STRIPE_WEBHOOK=$(ask_value "STRIPE_WEBHOOK_SECRET" "Signing secret du webhook Stripe (whsec_...)" true "$DEV_STRIPE_WEBHOOK")
else
    print_warning "Le webhook peut être configuré plus tard avec: vercel env add STRIPE_WEBHOOK_SECRET production"
    # Utiliser le webhook de dev temporairement si disponible
    if [ ! -z "$DEV_STRIPE_WEBHOOK" ]; then
        print_info "Le webhook secret de dev sera utilisé temporairement: ${DEV_STRIPE_WEBHOOK:0:15}..."
        PROD_STRIPE_WEBHOOK=$DEV_STRIPE_WEBHOOK
    else
        PROD_STRIPE_WEBHOOK=""
    fi
fi

# Resend API Key - utiliser automatiquement la clé détectée
echo ""
print_info "Clé Resend API détectée: ${DEV_RESEND_API_KEY:0:10}..."
print_success "Cette clé sera utilisée en production (même clé dev/prod)"
PROD_RESEND_API_KEY=$DEV_RESEND_API_KEY

# Email FROM
PROD_FROM_EMAIL=$(ask_value "FROM_EMAIL" "Adresse email d'expédition" false "noreply@ninowash.fr")

# Feature Flags (valeurs par défaut raisonnables pour prod)
echo ""
print_header "🎚️  Configuration des Feature Flags"
echo -e "${CYAN}Valeurs recommandées pour la production:${NC}"
echo ""

PROD_NODE_ENV="production"
PROD_SUBSCRIPTIONS="false"
PROD_BOOKINGS="true"
PROD_MAINTENANCE="false"

print_success "Feature flags configurés avec les valeurs recommandées"

# Rate Limiting (garder les valeurs de dev)
PROD_RATE_LIMIT_REQUESTS=$DEV_RATE_LIMIT_REQUESTS
PROD_RATE_LIMIT_WINDOW=$DEV_RATE_LIMIT_WINDOW

# File Upload (garder les valeurs de dev)
PROD_MAX_FILE_SIZE=$DEV_MAX_FILE_SIZE
PROD_ALLOWED_FILE_TYPES=$DEV_ALLOWED_FILE_TYPES

# Logging (adapter pour prod)
PROD_LOG_LEVEL="warn"
PROD_ENABLE_REQUEST_LOGGING="false"

# Étape 4: Récapitulatif
print_header "📊 Étape 4/5: Récapitulatif de la Configuration"

echo -e "${BOLD}Variables qui seront configurées sur Vercel (production):${NC}"
echo ""
echo -e "${CYAN}Application:${NC}"
echo -e "  • NEXT_PUBLIC_APP_URL: $PROD_APP_URL"
echo -e "  • NODE_ENV: $PROD_NODE_ENV"
echo ""
echo -e "${CYAN}Supabase:${NC}"
echo -e "  • NEXT_PUBLIC_SUPABASE_URL: $PROD_SUPABASE_URL"
echo -e "  • NEXT_PUBLIC_SUPABASE_ANON_KEY: ${PROD_SUPABASE_ANON_KEY:0:20}..."
echo -e "  • SUPABASE_SERVICE_ROLE_KEY: ${PROD_SUPABASE_SERVICE_ROLE:0:20}..."
echo ""
echo -e "${CYAN}Stripe:${NC}"
echo -e "  • NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${PROD_STRIPE_PK:0:20}..."
echo -e "  • STRIPE_SECRET_KEY: ${PROD_STRIPE_SK:0:20}..."
if [ ! -z "$PROD_STRIPE_WEBHOOK" ]; then
    echo -e "  • STRIPE_WEBHOOK_SECRET: ${PROD_STRIPE_WEBHOOK:0:20}..."
else
    echo -e "  • STRIPE_WEBHOOK_SECRET: ${YELLOW}[À configurer plus tard]${NC}"
fi
echo ""
echo -e "${CYAN}Email:${NC}"
echo -e "  • RESEND_API_KEY: ${PROD_RESEND_API_KEY:0:20}..."
echo -e "  • FROM_EMAIL: $PROD_FROM_EMAIL"
echo ""
echo -e "${CYAN}Feature Flags:${NC}"
echo -e "  • NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED: $PROD_SUBSCRIPTIONS"
echo -e "  • NEXT_PUBLIC_BOOKINGS_ENABLED: $PROD_BOOKINGS"
echo -e "  • MAINTENANCE_MODE: $PROD_MAINTENANCE"
echo ""
echo -e "${CYAN}Rate Limiting:${NC}"
echo -e "  • RATE_LIMIT_REQUESTS_PER_MINUTE: $PROD_RATE_LIMIT_REQUESTS"
echo -e "  • RATE_LIMIT_WINDOW_MS: $PROD_RATE_LIMIT_WINDOW"
echo ""
echo -e "${CYAN}File Upload:${NC}"
echo -e "  • MAX_FILE_SIZE: $PROD_MAX_FILE_SIZE"
echo -e "  • ALLOWED_FILE_TYPES: $PROD_ALLOWED_FILE_TYPES"
echo ""
echo -e "${CYAN}Logging:${NC}"
echo -e "  • LOG_LEVEL: $PROD_LOG_LEVEL"
echo -e "  • ENABLE_REQUEST_LOGGING: $PROD_ENABLE_REQUEST_LOGGING"
echo ""
echo -e "${BOLD}${RED}⚠️  ATTENTION: Cette action va configurer ces variables en PRODUCTION${NC}"
echo ""
echo -ne "${YELLOW}Continuer?${NC} (y/n): "
read confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    print_error "Configuration annulée"
    exit 1
fi

# Étape 5: Configuration sur Vercel
print_header "🚀 Étape 5/5: Configuration sur Vercel"

echo -e "${CYAN}Configuration en cours...${NC}"
echo ""

# Application
add_env_var "NEXT_PUBLIC_APP_URL" "$PROD_APP_URL" "production"
add_env_var "NODE_ENV" "$PROD_NODE_ENV" "production"

# Supabase
add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$PROD_SUPABASE_URL" "production"
add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$PROD_SUPABASE_ANON_KEY" "production"
add_env_var "SUPABASE_SERVICE_ROLE_KEY" "$PROD_SUPABASE_SERVICE_ROLE" "production"

# Stripe
add_env_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$PROD_STRIPE_PK" "production"
add_env_var "STRIPE_SECRET_KEY" "$PROD_STRIPE_SK" "production"
if [ ! -z "$PROD_STRIPE_WEBHOOK" ]; then
    add_env_var "STRIPE_WEBHOOK_SECRET" "$PROD_STRIPE_WEBHOOK" "production"
fi

# Email
add_env_var "RESEND_API_KEY" "$PROD_RESEND_API_KEY" "production"
add_env_var "FROM_EMAIL" "$PROD_FROM_EMAIL" "production"

# Feature Flags
add_env_var "NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED" "$PROD_SUBSCRIPTIONS" "production"
add_env_var "NEXT_PUBLIC_BOOKINGS_ENABLED" "$PROD_BOOKINGS" "production"
add_env_var "MAINTENANCE_MODE" "$PROD_MAINTENANCE" "production"

# Rate Limiting
add_env_var "RATE_LIMIT_REQUESTS_PER_MINUTE" "$PROD_RATE_LIMIT_REQUESTS" "production"
add_env_var "RATE_LIMIT_WINDOW_MS" "$PROD_RATE_LIMIT_WINDOW" "production"

# File Upload
add_env_var "MAX_FILE_SIZE" "$PROD_MAX_FILE_SIZE" "production"
add_env_var "ALLOWED_FILE_TYPES" "$PROD_ALLOWED_FILE_TYPES" "production"

# Logging
add_env_var "LOG_LEVEL" "$PROD_LOG_LEVEL" "production"
add_env_var "ENABLE_REQUEST_LOGGING" "$PROD_ENABLE_REQUEST_LOGGING" "production"

echo ""
print_header "✅ Configuration Terminée avec Succès"

echo -e "${GREEN}Toutes les variables d'environnement ont été configurées sur Vercel.${NC}"
echo ""
echo -e "${CYAN}Prochaines étapes:${NC}"
echo ""
echo -e "${YELLOW}1.${NC} Redéployer l'application pour appliquer les nouvelles variables:"
echo -e "   ${BLUE}vercel --prod${NC}"
echo ""
if [ -z "$PROD_STRIPE_WEBHOOK" ]; then
    echo -e "${YELLOW}2.${NC} ${RED}IMPORTANT:${NC} Créer le webhook Stripe et configurer STRIPE_WEBHOOK_SECRET:"
    echo -e "   ${BLUE}vercel env add STRIPE_WEBHOOK_SECRET production${NC}"
    echo ""
fi
echo -e "${YELLOW}3.${NC} Vérifier le déploiement sur:"
echo -e "   ${BLUE}https://vercel.com/beateur/ninowash${NC}"
echo ""
echo -e "${YELLOW}4.${NC} Tester l'application sur:"
echo -e "   ${BLUE}$PROD_APP_URL${NC}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}Configuration réussie ! 🎉${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
