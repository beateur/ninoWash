#!/bin/bash

# =============================================================================
# Démarrage Rapide - Environnement de Développement avec Stripe
# =============================================================================

set -e

# Couleurs
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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

clear

print_header "🚀 NinoWash - Environnement de Développement"

echo -e "${BOLD}Ce script démarre:${NC}"
echo ""
echo -e "  ${CYAN}1.${NC} Stripe Webhook Listener (Terminal 1)"
echo -e "  ${CYAN}2.${NC} Application Next.js (Terminal 2)"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Vérifier Stripe CLI
if ! command -v stripe &> /dev/null; then
    echo -e "${YELLOW}⚠️  Stripe CLI n'est pas installé${NC}"
    echo ""
    echo -e "${CYAN}Installation:${NC}"
    echo -e "  ${BLUE}brew install stripe/stripe-cli/stripe${NC}"
    echo ""
    echo -ne "Installer maintenant? (y/n): "
    read install_stripe
    
    if [ "$install_stripe" = "y" ] || [ "$install_stripe" = "Y" ]; then
        brew install stripe/stripe-cli/stripe
        print_success "Stripe CLI installé"
    else
        echo ""
        print_info "Vous pouvez démarrer sans Stripe CLI, mais les webhooks ne fonctionneront pas"
        echo ""
        echo -ne "Continuer sans Stripe CLI? (y/n): "
        read continue_without
        
        if [ "$continue_without" != "y" ] && [ "$continue_without" != "Y" ]; then
            echo "Installation annulée"
            exit 1
        fi
    fi
fi

# Vérifier la connexion Stripe
if command -v stripe &> /dev/null; then
    if ! stripe config --list &> /dev/null; then
        echo ""
        echo -e "${YELLOW}⚠️  Vous devez vous connecter à Stripe${NC}"
        echo ""
        stripe login
        print_success "Connecté à Stripe"
    else
        print_success "Stripe CLI configuré"
    fi
fi

# Vérifier les dépendances npm
if [ ! -d "node_modules" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Dépendances npm non installées${NC}"
    echo ""
    echo -e "${BLUE}Installation des dépendances...${NC}"
    npm install
    print_success "Dépendances installées"
fi

print_success "Prérequis vérifiés"

# Choix du mode de développement
echo ""
echo -e "${BOLD}Mode de développement:${NC}"
echo ""
echo -e "  ${CYAN}1.${NC} Next.js Dev (npm run dev) ${GREEN}[Recommandé pour debug]${NC}"
echo -e "  ${CYAN}2.${NC} Vercel Dev (vercel dev) ${YELLOW}[Plus proche de la prod]${NC}"
echo ""
echo -ne "Votre choix (1 ou 2): "
read dev_mode

if [ "$dev_mode" = "2" ]; then
    DEV_COMMAND="vercel dev"
    print_info "Mode Vercel Dev sélectionné"
else
    DEV_COMMAND="npm run dev"
    print_info "Mode Next.js Dev sélectionné"
fi

# Créer un script de démarrage
cat > /tmp/start-ninowash-dev.sh << 'SCRIPT_END'
#!/bin/bash

# Fonction pour tuer les processus en arrière-plan
cleanup() {
    echo ""
    echo "🛑 Arrêt des services..."
    kill 0
    exit 0
}

trap cleanup SIGINT SIGTERM

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

clear

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC} ${BOLD}🚀 NinoWash Dev Environment${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Démarrer Stripe Listen
if command -v stripe &> /dev/null; then
    echo -e "${YELLOW}📡 Démarrage de Stripe Webhook Listener...${NC}"
    echo ""
    
    stripe listen --forward-to localhost:3000/api/webhooks/stripe > /tmp/stripe-listen.log 2>&1 &
    STRIPE_PID=$!
    
    # Attendre que stripe listen démarre
    sleep 3
    
    # Récupérer le webhook secret
    WEBHOOK_SECRET=$(grep "webhook signing secret is" /tmp/stripe-listen.log | awk '{print $NF}')
    
    if [ ! -z "$WEBHOOK_SECRET" ]; then
        echo -e "${GREEN}✅ Stripe Webhook Listener démarré${NC}"
        echo -e "${CYAN}Webhook Secret:${NC} ${WEBHOOK_SECRET}"
        echo ""
        echo -e "${YELLOW}⚠️  Copiez ce secret dans .env.local:${NC}"
        echo -e "${BLUE}STRIPE_WEBHOOK_SECRET=${WEBHOOK_SECRET}${NC}"
        echo ""
    else
        echo -e "${YELLOW}⚠️  Impossible de récupérer le webhook secret${NC}"
        echo -e "${BLUE}Vérifiez les logs: tail -f /tmp/stripe-listen.log${NC}"
        echo ""
    fi
else
    echo -e "${YELLOW}⚠️  Stripe CLI non installé - webhooks désactivés${NC}"
    echo ""
fi

# Démarrer Next.js
echo -e "${YELLOW}🚀 Démarrage de l'application...${NC}"
echo ""

DEV_CMD_PLACEHOLDER

# Garder le script en vie
wait
SCRIPT_END

# Remplacer le placeholder par la commande choisie
sed -i '' "s|DEV_CMD_PLACEHOLDER|$DEV_COMMAND|g" /tmp/start-ninowash-dev.sh

chmod +x /tmp/start-ninowash-dev.sh

# Instructions finales
echo ""
print_header "✅ Prêt à Démarrer"

echo -e "${BOLD}Pour démarrer l'environnement de développement:${NC}"
echo ""
echo -e "  ${BLUE}/tmp/start-ninowash-dev.sh${NC}"
echo ""
echo -e "${YELLOW}OU${NC}"
echo ""
echo -e "  ${BLUE}Terminal 1:${NC} stripe listen --forward-to localhost:3000/api/webhooks/stripe"
echo -e "  ${BLUE}Terminal 2:${NC} $DEV_COMMAND"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BOLD}URLs:${NC}"
echo -e "  ${GREEN}Application:${NC} http://localhost:3000"
echo -e "  ${GREEN}Stripe Dashboard:${NC} https://dashboard.stripe.com/test/payments"
echo -e "  ${GREEN}Supabase:${NC} https://supabase.com/dashboard/project/slmhuhfunssmwhzajccm"
echo ""
echo -e "${BOLD}Cartes de test:${NC}"
echo -e "  ${GREEN}Succès:${NC} 4242 4242 4242 4242"
echo -e "  ${GREEN}Échec:${NC} 4000 0000 0000 0002"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -ne "${YELLOW}Démarrer maintenant?${NC} (y/n): "
read start_now

if [ "$start_now" = "y" ] || [ "$start_now" = "Y" ]; then
    exec /tmp/start-ninowash-dev.sh
else
    echo ""
    print_info "Vous pouvez démarrer plus tard avec: /tmp/start-ninowash-dev.sh"
    echo ""
fi
