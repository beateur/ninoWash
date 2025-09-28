-- Sprint 5: Seed subscription plans data
-- Adding default subscription plans for Nino Wash

INSERT INTO subscription_plans (code, name, description, type, price, discount_percentage, included_services, extra_service_price, features) VALUES
(
  'MONTHLY_BASIC',
  'Mensuel Essentiel',
  'Parfait pour un usage régulier avec des économies immédiates',
  'monthly',
  29.90,
  10,
  4,
  6.50,
  '["Collecte et livraison gratuites", "Nettoyage professionnel", "Support client prioritaire", "Suivi en temps réel"]'
),
(
  'QUARTERLY_PREMIUM',
  'Trimestriel Premium',
  'Le meilleur rapport qualité-prix pour les familles',
  'quarterly',
  79.90,
  25,
  15,
  5.50,
  '["Collecte et livraison gratuites", "Nettoyage professionnel", "Support client prioritaire", "Suivi en temps réel", "Service express gratuit", "Traitement anti-taches inclus", "Créneaux prioritaires"]'
),
(
  'ANNUAL_VIP',
  'Annuel VIP',
  'L''abonnement ultime avec tous les avantages',
  'annual',
  299.90,
  35,
  60,
  4.90,
  '["Collecte et livraison gratuites", "Nettoyage professionnel", "Support client prioritaire", "Suivi en temps réel", "Service express gratuit", "Traitement anti-taches inclus", "Créneaux prioritaires", "Service de repassage inclus", "Stockage gratuit 30 jours", "Conseiller dédié"]'
);

-- Add some sample coupons
INSERT INTO coupons (code, name, description, type, value, minimum_amount, usage_limit, valid_from, valid_until, applicable_to) VALUES
(
  'WELCOME20',
  'Bienvenue 20%',
  'Réduction de 20% pour votre première commande',
  'percentage',
  20.00,
  25.00,
  1000,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '3 months',
  'bookings'
),
(
  'SUBSCRIBE10',
  'Abonnement -10€',
  '10€ de réduction sur votre premier abonnement',
  'fixed_amount',
  10.00,
  50.00,
  500,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '6 months',
  'subscriptions'
),
(
  'SUMMER2024',
  'Été 2024',
  'Offre spéciale été - 15% de réduction',
  'percentage',
  15.00,
  30.00,
  2000,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '2 months',
  'all'
);
