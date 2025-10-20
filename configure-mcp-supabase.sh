#!/bin/bash

# Script de configuration MCP Supabase avec Personal Access Token
# Date: 2025-10-19

set -e

echo "🔧 Configuration MCP Supabase"
echo "=============================="
echo ""

# Demander le PAT
read -sp "Entrez votre Personal Access Token Supabase: " PAT
echo ""

if [ -z "$PAT" ]; then
  echo "❌ Erreur: Le token ne peut pas être vide"
  exit 1
fi

MCP_CONFIG_FILE="$HOME/Library/Application Support/Code/User/mcp.json"

# Créer la nouvelle configuration
cat > "$MCP_CONFIG_FILE" << EOF
{
  "servers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=slmhuhfunssmwhzajccm"
    }
  },
  "inputs": {
    "supabase": {
      "personal_access_token": "$PAT"
    }
  }
}
EOF

echo ""
echo "✅ Configuration MCP mise à jour avec succès!"
echo ""
echo "📝 Fichier configuré: $MCP_CONFIG_FILE"
echo ""
echo "⚠️  IMPORTANT: Vous devez maintenant:"
echo "   1. Redémarrer VS Code pour que les changements prennent effet"
echo "   2. Ou recharger la fenêtre (Cmd+Shift+P → 'Developer: Reload Window')"
echo ""
echo "🔒 Note: Votre token est stocké localement et sécurisé"
echo ""
