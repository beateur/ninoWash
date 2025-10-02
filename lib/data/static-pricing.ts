// Static pricing data for marketing pages
// This data is cached at build time and served from CDN
// No database queries needed for public pricing display

export interface PricingTier {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: string
  features: string[]
  popular?: boolean
  cta: string
}

export const STATIC_PRICING_TIERS: PricingTier[] = [
  {
    id: "basic",
    name: "Essentiel",
    description: "Parfait pour un usage occasionnel",
    price: 29.99,
    currency: "EUR",
    interval: "par commande",
    features: [
      "Collecte et livraison à domicile",
      "Nettoyage professionnel",
      "Délai de 48h",
      "Assurance incluse",
      "Support client 7j/7",
    ],
    cta: "Réserver maintenant",
  },
  {
    id: "premium",
    name: "Premium",
    description: "Pour les besoins réguliers",
    price: 79.99,
    currency: "EUR",
    interval: "par mois",
    popular: true,
    features: [
      "Tout du plan Essentiel",
      "4 collectes par mois",
      "Délai express 24h",
      "Traitement prioritaire",
      "Remise de 15%",
      "Gestionnaire dédié",
    ],
    cta: "Commencer l'essai",
  },
  {
    id: "enterprise",
    name: "Entreprise",
    description: "Solution sur mesure pour les professionnels",
    price: 199.99,
    currency: "EUR",
    interval: "par mois",
    features: [
      "Tout du plan Premium",
      "Collectes illimitées",
      "Délai express 12h",
      "Facturation centralisée",
      "Remise de 25%",
      "API d'intégration",
      "SLA garanti",
    ],
    cta: "Nous contacter",
  },
]

export const STATIC_SERVICE_FEATURES = {
  quality: {
    title: "Qualité Garantie",
    description: "Nos professionnels utilisent des techniques de nettoyage respectueuses de vos vêtements.",
    icon: "shield-check",
  },
  speed: {
    title: "Livraison Rapide",
    description: "Collecte et livraison à domicile sous 48h pour le service classique.",
    icon: "truck",
  },
  insurance: {
    title: "Assurance Incluse",
    description: "Tous nos services incluent une assurance pour votre tranquillité d'esprit.",
    icon: "shield",
  },
  support: {
    title: "Support 7j/7",
    description: "Notre équipe est disponible tous les jours pour répondre à vos questions.",
    icon: "headset",
  },
  eco: {
    title: "Éco-responsable",
    description: "Produits biodégradables et processus respectueux de l'environnement.",
    icon: "leaf",
  },
  satisfaction: {
    title: "Satisfaction Garantie",
    description: "Si vous n'êtes pas satisfait, nous retraitons vos articles gratuitement.",
    icon: "star",
  },
}

// Helper function to get pricing for display
export function getStaticPricing() {
  return STATIC_PRICING_TIERS
}

// Helper function to format price
export function formatPrice(price: number, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(price)
}
