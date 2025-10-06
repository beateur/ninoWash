-- ============================================
-- CONFIGURATION CRON JOB : RESET CRÉDITS HEBDOMADAIRES
-- ============================================
-- Ce script configure un cron job qui s'exécute chaque lundi à 00:00 UTC
-- pour réinitialiser les crédits hebdomadaires de tous les abonnés actifs.
--
-- Prérequis: Edge Function "reset-weekly-credits" déployée
-- Déploiement: supabase functions deploy reset-weekly-credits
-- ============================================

-- 1. Activer l'extension pg_cron si pas déjà fait
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Activer l'extension pg_net pour les requêtes HTTP
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Supprimer le job existant (si réinstallation)
SELECT cron.unschedule('reset-weekly-credits') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'reset-weekly-credits'
);

-- 4. Créer le cron job
-- Schedule: "0 0 * * 1" = Chaque lundi à 00:00 UTC
-- 
-- ATTENTION: Remplacer les variables suivantes:
-- - YOUR_PROJECT_REF : Votre référence de projet Supabase (ex: abcdefghijklmnop)
-- - YOUR_SERVICE_ROLE_KEY : Votre clé service_role depuis Supabase Dashboard > Settings > API
--
SELECT cron.schedule(
  'reset-weekly-credits',           -- Nom du job
  '0 0 * * 1',                      -- Cron expression: chaque lundi à minuit UTC
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/reset-weekly-credits',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- ============================================
-- COMMANDES UTILES
-- ============================================

-- Vérifier les jobs configurés:
-- SELECT * FROM cron.job;

-- Voir les logs d'exécution (dernières 10 exécutions):
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'reset-weekly-credits')
-- ORDER BY start_time DESC LIMIT 10;

-- Exécuter manuellement le job (pour tester):
-- SELECT cron.schedule('test-reset-credits-now', '* * * * *', $$
--   SELECT net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/reset-weekly-credits',
--     headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'),
--     body := '{}'::jsonb
--   );
-- $$);
-- Puis désactiver après 1 minute:
-- SELECT cron.unschedule('test-reset-credits-now');

-- Désactiver le job:
-- SELECT cron.unschedule('reset-weekly-credits');

-- Supprimer complètement le job:
-- DELETE FROM cron.job WHERE jobname = 'reset-weekly-credits';

-- ============================================
-- MONITORING & ALERTES
-- ============================================

-- Créer une table pour tracker les échecs
CREATE TABLE IF NOT EXISTS credit_reset_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_processed INTEGER NOT NULL,
  success_count INTEGER NOT NULL,
  error_count INTEGER NOT NULL,
  duration_ms INTEGER,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes de monitoring
CREATE INDEX IF NOT EXISTS idx_credit_reset_logs_execution_time 
ON credit_reset_logs(execution_time DESC);

-- Vue pour les statistiques de reset
CREATE OR REPLACE VIEW credit_reset_stats AS
SELECT 
  DATE_TRUNC('week', execution_time) AS week,
  COUNT(*) AS total_executions,
  SUM(total_processed) AS total_subscriptions_processed,
  SUM(success_count) AS total_success,
  SUM(error_count) AS total_errors,
  AVG(duration_ms) AS avg_duration_ms,
  MAX(error_count) AS max_errors_in_single_run
FROM credit_reset_logs
GROUP BY DATE_TRUNC('week', execution_time)
ORDER BY week DESC;

-- Requête pour détecter les anomalies
CREATE OR REPLACE VIEW credit_reset_anomalies AS
SELECT 
  id,
  execution_time,
  total_processed,
  success_count,
  error_count,
  ROUND((error_count::DECIMAL / NULLIF(total_processed, 0)) * 100, 2) AS error_rate_percent,
  error_details
FROM credit_reset_logs
WHERE error_count > 0
  OR total_processed = 0
ORDER BY execution_time DESC;

-- ============================================
-- TESTS
-- ============================================

-- 1. Tester la fonction PostgreSQL directement
-- SELECT initialize_weekly_credits(
--   'USER_ID_HERE'::UUID,
--   'SUBSCRIPTION_ID_HERE'::UUID,
--   2
-- );

-- 2. Vérifier qu'un user a bien ses crédits
-- SELECT * FROM subscription_credits 
-- WHERE user_id = 'USER_ID_HERE'::UUID
-- ORDER BY created_at DESC LIMIT 1;

-- 3. Simuler un lundi (exécuter manuellement)
-- Décommenter et remplacer les variables:
-- SELECT net.http_post(
--   url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/reset-weekly-credits',
--   headers := jsonb_build_object(
--     'Content-Type', 'application/json',
--     'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
--   ),
--   body := '{}'::jsonb
-- );

-- ============================================
-- ROLLBACK (en cas de problème)
-- ============================================

-- Supprimer le cron job:
-- SELECT cron.unschedule('reset-weekly-credits');

-- Supprimer les tables de monitoring:
-- DROP VIEW IF EXISTS credit_reset_anomalies;
-- DROP VIEW IF EXISTS credit_reset_stats;
-- DROP TABLE IF EXISTS credit_reset_logs;

-- ============================================
-- NOTES DE DÉPLOIEMENT
-- ============================================

-- 1. Déployer la fonction Edge:
--    supabase functions deploy reset-weekly-credits
--
-- 2. Récupérer les variables:
--    - PROJECT_REF: Supabase Dashboard > Settings > General > Reference ID
--    - SERVICE_ROLE_KEY: Supabase Dashboard > Settings > API > service_role key
--
-- 3. Exécuter ce script SQL via:
--    - Supabase Dashboard > SQL Editor > New Query
--    - Ou via CLI: supabase db push
--
-- 4. Vérifier que le job est créé:
--    SELECT * FROM cron.job WHERE jobname = 'reset-weekly-credits';
--
-- 5. Tester manuellement (voir section TESTS ci-dessus)
--
-- 6. Monitorer les exécutions:
--    SELECT * FROM credit_reset_logs ORDER BY execution_time DESC LIMIT 10;

-- ============================================
-- TIMEZONE CONFIGURATION
-- ============================================

-- Le cron s'exécute en UTC. Si besoin d'un autre timezone:
-- Exemple pour Paris (UTC+1/+2 selon saison):
-- SELECT cron.schedule(
--   'reset-weekly-credits',
--   '0 0 * * 1',  -- Toujours en UTC
--   $$...$$ 
-- );
-- 
-- Note: PostgreSQL convertit automatiquement les timestamps.
-- Les utilisateurs verront "Reset dans X jours" dans leur timezone locale (frontend).
