#!/bin/bash

# =============================================================================
# Script de Vérification de l'Usage de Supabase Auth
# =============================================================================

echo "🔍 VÉRIFICATION DE L'ARCHITECTURE SUPABASE AUTH"
echo "=============================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
total_issues=0

# Fonction de vérification
check_pattern() {
    local pattern=$1
    local description=$2
    local severity=$3  # WARNING ou ERROR
    
    echo "📋 Vérification: $description"
    
    matches=$(grep -r "$pattern" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next . 2>/dev/null | grep -v "\.git" || true)
    
    if [ -n "$matches" ]; then
        if [ "$severity" = "ERROR" ]; then
            echo -e "${RED}❌ ERREUR:${NC} Utilisation détectée"
            ((total_issues++))
        else
            echo -e "${YELLOW}⚠️  ATTENTION:${NC} Utilisation détectée"
        fi
        echo "$matches" | while read -r line; do
            echo "   $line"
        done
        echo ""
    else
        echo -e "${GREEN}✅ OK${NC}"
        echo ""
    fi
}

echo "=============================================="
echo "1. Vérification des références à public.users"
echo "=============================================="
echo ""

check_pattern "\.from\(['\"]users['\"]\)" \
    "Usage de .from('users') au lieu de .from('user_profiles')" \
    "WARNING"

check_pattern "REFERENCES users\(" \
    "Contraintes FK vers public.users au lieu de auth.users" \
    "ERROR"

check_pattern "JOIN users " \
    "JOIN sur public.users" \
    "WARNING"

echo "=============================================="
echo "2. Vérification de l'usage de Supabase Auth"
echo "=============================================="
echo ""

# Vérifier que signup utilise bien supabase.auth.signUp
signup_files=$(grep -l "signup" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next app/api/auth/ 2>/dev/null || true)

if [ -n "$signup_files" ]; then
    echo "📁 Fichiers signup trouvés:"
    for file in $signup_files; do
        echo "   - $file"
        
        # Vérifier qu'il utilise auth.signUp
        if grep -q "auth\.signUp" "$file"; then
            echo -e "     ${GREEN}✅ Utilise auth.signUp${NC}"
        else
            echo -e "     ${RED}❌ N'utilise pas auth.signUp${NC}"
            ((total_issues++))
        fi
        
        # Vérifier qu'il n'insère pas dans public.users
        if grep -q "\.from\(['\"]users['\"]\)\.insert" "$file"; then
            echo -e "     ${RED}❌ Insère dans public.users${NC}"
            ((total_issues++))
        fi
    done
    echo ""
fi

echo "=============================================="
echo "3. Vérification du Guest Booking"
echo "=============================================="
echo ""

guest_booking=$(find app/api/bookings/guest -name "*.ts" 2>/dev/null || true)

if [ -n "$guest_booking" ]; then
    echo "📁 Fichier guest booking: $guest_booking"
    
    if grep -q "auth\.admin\.createUser" "$guest_booking"; then
        echo -e "${GREEN}✅ Utilise auth.admin.createUser${NC}"
    else
        echo -e "${RED}❌ N'utilise pas auth.admin.createUser${NC}"
        ((total_issues++))
    fi
    
    if grep -q "\.from\(['\"]users['\"]\)\.insert" "$guest_booking"; then
        echo -e "${RED}❌ Insère dans public.users${NC}"
        ((total_issues++))
    else
        echo -e "${GREEN}✅ N'insère pas dans public.users${NC}"
    fi
    echo ""
fi

echo "=============================================="
echo "4. Vérification du trigger handle_new_user"
echo "=============================================="
echo ""

trigger_file=$(find scripts -name "*user_management*.sql" 2>/dev/null | head -1)

if [ -n "$trigger_file" ]; then
    echo "📁 Fichier trouvé: $trigger_file"
    
    if grep -q "CREATE TRIGGER on_auth_user_created" "$trigger_file"; then
        echo -e "${GREEN}✅ Trigger on_auth_user_created existe${NC}"
    else
        echo -e "${RED}❌ Trigger on_auth_user_created manquant${NC}"
        ((total_issues++))
    fi
    
    if grep -q "AFTER INSERT ON auth\.users" "$trigger_file"; then
        echo -e "${GREEN}✅ Trigger sur auth.users${NC}"
    else
        echo -e "${RED}❌ Trigger pas sur auth.users${NC}"
        ((total_issues++))
    fi
    echo ""
fi

echo "=============================================="
echo "5. Fichiers à Modifier (priorité)"
echo "=============================================="
echo ""

echo "📝 Fichiers utilisant .from('users'):"
files_to_fix=$(grep -l "\.from\(['\"]users['\"]\)" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next app/ components/ lib/ 2>/dev/null || true)

if [ -n "$files_to_fix" ]; then
    echo "$files_to_fix" | while read -r file; do
        echo "   🔧 $file"
    done
else
    echo -e "   ${GREEN}✅ Aucun fichier à modifier${NC}"
fi
echo ""

echo "=============================================="
echo "📊 RÉSUMÉ"
echo "=============================================="
echo ""

if [ $total_issues -eq 0 ]; then
    echo -e "${GREEN}✅ PARFAIT! Architecture Supabase Auth conforme${NC}"
    echo ""
    echo "Votre code utilise correctement:"
    echo "  - auth.users pour l'authentification"
    echo "  - user_profiles pour les données de profil"
    echo "  - auth.signUp() et admin.createUser()"
    echo ""
    exit 0
else
    echo -e "${RED}❌ $total_issues problème(s) détecté(s)${NC}"
    echo ""
    echo "Actions recommandées:"
    echo "  1. Consulter docs/MIGRATION_SUPABASE_AUTH_GUIDE.md"
    echo "  2. Exécuter scripts/MIGRATION_TO_SUPABASE_AUTH.sql"
    echo "  3. Modifier les fichiers identifiés ci-dessus"
    echo ""
    exit 1
fi
