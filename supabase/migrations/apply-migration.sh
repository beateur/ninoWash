#!/bin/bash
# Script pour appliquer la migration manuellement via Supabase CLI

set -e

echo "🚀 Application de la migration Booking Cancellation"
echo ""

# Vérifier si supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI n'est pas installé."
    echo ""
    echo "📦 Installation via Homebrew :"
    echo "   brew install supabase/tap/supabase"
    echo ""
    echo "📦 Ou via NPM :"
    echo "   npm install -g supabase"
    echo ""
    echo "📝 Ensuite, connectez-vous :"
    echo "   supabase login"
    echo "   supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    echo "❌ Script arrêté. Utilisez plutôt Supabase Studio (voir MIGRATION_GUIDE.md)"
    exit 1
fi

# Vérifier si le projet est lié
if [ ! -f ".supabase/config.toml" ]; then
    echo "⚠️  Projet Supabase non lié."
    echo ""
    echo "🔗 Liez votre projet :"
    echo "   supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    exit 1
fi

# Appliquer la migration
echo "📤 Application de la migration..."
supabase db push

echo ""
echo "✅ Migration appliquée avec succès !"
echo ""
echo "🧪 Vérification..."
supabase db --db-url "$(supabase status | grep 'DB URL' | awk '{print $3}')" \
  --command "SELECT column_name FROM information_schema.columns WHERE table_name = 'bookings' AND column_name IN ('cancellation_reason', 'cancelled_at', 'cancelled_by');"

echo ""
echo "✅ Tout est prêt ! Vous pouvez maintenant tester l'annulation de réservations."
