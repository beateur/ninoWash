#!/bin/bash

# =============================================================================
# Configuration des Clés Stripe PRODUCTION sur Vercel
# =============================================================================
# Ce script configure UNIQUEMENT les 3 variables Stripe nécessaires
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

# Fonction pour ajouter une variable d'environnement
add_env_var() {
    local var_name=$1
    local var_value=$2
    
    if [ -z "$var_value" ]; then
        print_warning "Valeur vide pour $var_name - ignorée"
        return
    fi
    
    print_info "Configuration de $var_name..."
    
    # Supprimer la variable existante si elle existe
    vercel env rm "$var_name" production -y &> /dev/null || true
    
    # Ajouter la nouvelle variable
    echo "$var_value" | vercel env add "$var_name" production &> /dev/null
    
    if [ $? -eq 0 ]; then
        print_success "$var_name configurée avec succès"
    else
        print_error "Erreur lors de la configuration de $var_name"
        return 1
    fi
}

# =============================================================================
# SCRIPT PRINCIPAL
# =============================================================================

clear

print_header "🔐 Configuration Stripe PRODUCTION"

echo -e "${BOLD}Ce script configure les 3 clés Stripe nécessaires pour la production:${NC}"
echo ""
echo -e "  ${CYAN}1.${NC} NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_live_...)"
echo -e "  ${CYAN}2.${NC} STRIPE_SECRET_KEY (sk_live_...)"
echo -e "  ${CYAN}3.${NC} STRIPE_WEBHOOK_SECRET (whsec_...)"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Vérifier la connexion Vercel
if ! vercel whoami &> /dev/null; then
    print_error "Vous devez être connecté à Vercel"
    echo ""
    print_info "Exécutez: vercel login"
    exit 1
fi

user=$(vercel whoami 2>&1)
print_success "Connecté en tant que: $user"

# Vérifier le projet lié
if [ ! -f ".vercel/project.json" ]; then
    print_error "Projet Vercel non lié"
    echo ""
    print_info "Exécutez: vercel link"
    exit 1
fi

print_success "Projet lié détecté"
echo ""

# =============================================================================
# COLLECTE DES CLÉS STRIPE
# =============================================================================

print_header "📝 Étape 1/3: Clé Publique Stripe"

echo -e "${CYAN}Où trouver cette clé:${NC}"
echo -e "  ${BLUE}→ https://dashboard.stripe.com/apikeys${NC}"
echo -e "  ${YELLOW}→ Activez le mode LIVE (bouton en haut à droite)${NC}"
echo -e "  ${YELLOW}→ Section 'Clés API standard'${NC}"
echo -e "  ${YELLOW}→ Copiez la 'Clé publiable' (commence par pk_live_)${NC}"
echo ""
echo -ne "${BOLD}Entrez la clé publique LIVE (pk_live_...)${NC}: "
read STRIPE_PK

# Validation basique
if [[ ! "$STRIPE_PK" =~ ^pk_live_ ]]; then
    print_error "La clé doit commencer par 'pk_live_'"
    echo ""
    print_warning "Vous avez entré: ${STRIPE_PK:0:20}..."
    echo ""
    echo -ne "${YELLOW}Voulez-vous continuer quand même?${NC} (y/n): "
    read continue_pk
    if [ "$continue_pk" != "y" ] && [ "$continue_pk" != "Y" ]; then
        print_error "Configuration annulée"
        exit 1
    fi
fi

print_success "Clé publique enregistrée: ${STRIPE_PK:0:20}..."

# =============================================================================

print_header "📝 Étape 2/3: Clé Secrète Stripe"

echo -e "${CYAN}Où trouver cette clé:${NC}"
echo -e "  ${BLUE}→ https://dashboard.stripe.com/apikeys${NC}"
echo -e "  ${YELLOW}→ Mode LIVE activé${NC}"
echo -e "  ${YELLOW}→ Section 'Clés API standard'${NC}"
echo -e "  ${YELLOW}→ Copiez la 'Clé secrète' (commence par sk_live_)${NC}"
echo ""
echo -ne "${BOLD}Entrez la clé secrète LIVE (sk_live_...)${NC} (saisie masquée): "
read -s STRIPE_SK
echo ""

# Validation basique
if [[ ! "$STRIPE_SK" =~ ^sk_live_ ]]; then
    print_error "La clé doit commencer par 'sk_live_'"
    echo ""
    print_warning "Vous avez entré: ${STRIPE_SK:0:20}..."
    echo ""
    echo -ne "${YELLOW}Voulez-vous continuer quand même?${NC} (y/n): "
    read continue_sk
    if [ "$continue_sk" != "y" ] && [ "$continue_sk" != "Y" ]; then
        print_error "Configuration annulée"
        exit 1
    fi
fi

print_success "Clé secrète enregistrée: ${STRIPE_SK:0:20}..."

# =============================================================================

print_header "📝 Étape 3/3: Webhook Secret Stripe"

echo -e "${CYAN}IMPORTANT: Vous devez d'abord créer le webhook${NC}"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Création du Webhook:${NC}"
echo ""
echo -e "${CYAN}1.${NC} Allez sur: ${BLUE}https://dashboard.stripe.com/webhooks${NC}"
echo -e "   ${YELLOW}→ Assurez-vous d'être en mode LIVE${NC}"
echo ""
echo -e "${CYAN}2.${NC} Cliquez sur ${BOLD}'+ Ajouter un point de terminaison'${NC}"
echo ""
echo -e "${CYAN}3.${NC} URL du point de terminaison:"
echo -e "   ${GREEN}https://ninowash.fr/api/webhooks/stripe${NC}"
echo ""
echo -e "${CYAN}4.${NC} Description (optionnel):"
echo -e "   ${GREEN}Production Webhook - NinoWash${NC}"
echo ""
echo -e "${CYAN}5.${NC} Sélectionnez ces événements:"
echo -e "   ${YELLOW}☑${NC} checkout.session.completed"
echo -e "   ${YELLOW}☑${NC} checkout.session.async_payment_succeeded"
echo -e "   ${YELLOW}☑${NC} checkout.session.async_payment_failed"
echo -e "   ${YELLOW}☑${NC} payment_intent.succeeded"
echo -e "   ${YELLOW}☑${NC} payment_intent.payment_failed"
echo -e "   ${YELLOW}☑${NC} customer.subscription.created"
echo -e "   ${YELLOW}☑${NC} customer.subscription.updated"
echo -e "   ${YELLOW}☑${NC} customer.subscription.deleted"
echo ""
echo -e "${CYAN}6.${NC} Cliquez sur ${BOLD}'Ajouter un point de terminaison'${NC}"
echo ""
echo -e "${CYAN}7.${NC} Une fois créé, cliquez sur le webhook"
echo -e "   ${YELLOW}→ Section 'Clé de signature'${NC}"
echo -e "   ${YELLOW}→ Cliquez sur 'Révéler' ou 'Afficher'${NC}"
echo -e "   ${YELLOW}→ Copiez la clé (commence par whsec_)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -ne "${CYAN}Avez-vous créé le webhook et copié la clé?${NC} (y/n): "
read webhook_ready

if [ "$webhook_ready" != "y" ] && [ "$webhook_ready" != "Y" ]; then
    print_warning "Configuration du webhook Stripe reportée"
    echo ""
    echo -e "${YELLOW}Vous pourrez le configurer plus tard avec:${NC}"
    echo -e "${BLUE}vercel env add STRIPE_WEBHOOK_SECRET production${NC}"
    echo ""
    STRIPE_WEBHOOK=""
else
    echo ""
    echo -ne "${BOLD}Entrez le signing secret du webhook (whsec_...)${NC} (saisie masquée): "
    read -s STRIPE_WEBHOOK
    echo ""
    
    # Validation basique
    if [[ ! "$STRIPE_WEBHOOK" =~ ^whsec_ ]]; then
        print_error "La clé doit commencer par 'whsec_'"
        echo ""
        print_warning "Vous avez entré: ${STRIPE_WEBHOOK:0:20}..."
        echo ""
        echo -ne "${YELLOW}Voulez-vous continuer quand même?${NC} (y/n): "
        read continue_wh
        if [ "$continue_wh" != "y" ] && [ "$continue_wh" != "Y" ]; then
            print_error "Configuration annulée"
            exit 1
        fi
    fi
    
    print_success "Webhook secret enregistré: ${STRIPE_WEBHOOK:0:20}..."
fi

# =============================================================================
# RÉCAPITULATIF
# =============================================================================

print_header "📊 Récapitulatif"

echo -e "${BOLD}Variables qui seront configurées sur Vercel (production):${NC}"
echo ""
echo -e "${CYAN}NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:${NC}"
echo -e "  ${STRIPE_PK:0:30}...${STRIPE_PK: -4}"
echo ""
echo -e "${CYAN}STRIPE_SECRET_KEY:${NC}"
echo -e "  ${STRIPE_SK:0:30}...${STRIPE_SK: -4}"
echo ""
if [ ! -z "$STRIPE_WEBHOOK" ]; then
    echo -e "${CYAN}STRIPE_WEBHOOK_SECRET:${NC}"
    echo -e "  ${STRIPE_WEBHOOK:0:30}...${STRIPE_WEBHOOK: -4}"
else
    echo -e "${CYAN}STRIPE_WEBHOOK_SECRET:${NC}"
    echo -e "  ${YELLOW}[À configurer plus tard]${NC}"
fi
echo ""
echo -e "${BOLD}${RED}⚠️  Ces valeurs vont REMPLACER les clés TEST actuelles${NC}"
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

echo -e "${CYAN}Configuration en cours...${NC}"
echo ""

# Clé publique
add_env_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$STRIPE_PK"

# Clé secrète
add_env_var "STRIPE_SECRET_KEY" "$STRIPE_SK"

# Webhook secret (si fourni)
if [ ! -z "$STRIPE_WEBHOOK" ]; then
    add_env_var "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK"
fi

# =============================================================================
# SUCCÈS
# =============================================================================

echo ""
print_header "✅ Configuration Terminée"

echo -e "${GREEN}${BOLD}Les clés Stripe PRODUCTION ont été configurées avec succès !${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Prochaines étapes:${NC}"
echo ""
echo -e "${YELLOW}1.${NC} Redéployer l'application pour appliquer les nouvelles clés:"
echo -e "   ${BLUE}vercel --prod${NC}"
echo -e "   ${GRAY}ou attendez le prochain push sur main (CI/CD automatique)${NC}"
echo ""
if [ -z "$STRIPE_WEBHOOK" ]; then
    echo -e "${YELLOW}2.${NC} ${RED}IMPORTANT:${NC} Configurer le webhook secret plus tard:"
    echo -e "   ${BLUE}vercel env add STRIPE_WEBHOOK_SECRET production${NC}"
    echo ""
fi
echo -e "${YELLOW}3.${NC} Vérifier les variables configurées:"
echo -e "   ${BLUE}vercel env ls production | grep STRIPE${NC}"
echo ""
echo -e "${YELLOW}4.${NC} Tester un paiement sur:"
echo -e "   ${BLUE}https://ninowash.fr${NC}"
echo ""
echo -e "${YELLOW}5.${NC} Vérifier les webhooks reçus sur Stripe:"
echo -e "   ${BLUE}https://dashboard.stripe.com/webhooks${NC}"
echo -e "   ${GRAY}(après avoir fait un test de paiement)${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}${BOLD}🎉 Configuration réussie ! Votre application est prête pour la production.${NC}"
echo ""
