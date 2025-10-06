# Guide de Déploiement - Reset Weekly Credits (Cron Job)

**Date** : 5 octobre 2025  
**Composant** : Supabase Edge Function + pg_cron  
**Fréquence** : Chaque lundi à 00:00 UTC  
**Estimation** : 30-45 minutes

---

## 📋 Prérequis

- [x] Migration `20251005000000_add_subscription_credits_system.sql` appliquée
- [x] Service `lib/services/subscription-credits.ts` déployé
- [x] Supabase CLI installé : `npm install -g supabase`
- [x] Accès au projet Supabase (Dashboard + CLI)

---

## 🚀 Étape 1 : Déployer l'Edge Function

### 1.1 Vérifier la structure des fichiers

```bash
# Structure attendue :
supabase/
└── functions/
    └── reset-weekly-credits/
        ├── index.ts        # Code de la fonction
        └── deno.json       # Configuration Deno
```

### 1.2 Login Supabase CLI

```bash
# Se connecter à Supabase
supabase login

# Lier le projet local au projet Supabase
supabase link --project-ref YOUR_PROJECT_REF
```

**Trouver PROJECT_REF** :
- Dashboard > Settings > General > Reference ID
- Format : `abcdefghijklmnop` (16 caractères)

### 1.3 Déployer la fonction

```bash
# Déployer l'Edge Function
supabase functions deploy reset-weekly-credits

# Vérifier le déploiement
supabase functions list
```

**Output attendu** :
```
NAME                      VERSION  CREATED AT                
reset-weekly-credits      1        2025-10-05 12:34:56
```

### 1.4 Tester la fonction manuellement

```bash
# Test avec curl (remplacer YOUR_PROJECT_REF et YOUR_ANON_KEY)
curl -i --location --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/reset-weekly-credits' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json'
```

**Trouver ANON_KEY** :
- Dashboard > Settings > API > anon/public key

**Réponse attendue (200 OK)** :
```json
{
  "success": true,
  "totalProcessed": 5,
  "successCount": 5,
  "errorCount": 0,
  "timestamp": "2025-10-05T12:34:56.789Z",
  "results": [
    {
      "success": true,
      "userId": "user-uuid-1",
      "subscriptionId": "sub-uuid-1",
      "credits": 2
    }
  ]
}
```

---

## ⏰ Étape 2 : Configurer le Cron Job

### 2.1 Récupérer la clé SERVICE_ROLE

⚠️ **IMPORTANT** : Ne jamais commit cette clé !

**Trouver SERVICE_ROLE_KEY** :
- Dashboard > Settings > API > service_role key
- Format : `eyJh...` (très long JWT)

### 2.2 Préparer le script SQL

```bash
# Copier le template
cp supabase/migrations/20251005000001_setup_credit_reset_cron.sql /tmp/cron_setup.sql

# Éditer avec vos variables
nano /tmp/cron_setup.sql
```

**Remplacer dans le fichier** :
- `YOUR_PROJECT_REF` → Votre référence projet (ex: `abcdefghijklmnop`)
- `YOUR_SERVICE_ROLE_KEY` → Votre clé service_role complète

### 2.3 Exécuter le script SQL

**Option A : Via Supabase Dashboard** (Recommandé)
1. Dashboard > SQL Editor
2. New Query
3. Coller le contenu de `cron_setup.sql` modifié
4. Run

**Option B : Via CLI**
```bash
supabase db push
```

### 2.4 Vérifier le job créé

```sql
-- Dans SQL Editor
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
WHERE jobname = 'reset-weekly-credits';
```

**Output attendu** :
| jobid | schedule | jobname | active |
|-------|----------|---------|--------|
| 123 | 0 0 * * 1 | reset-weekly-credits | true |

---

## 🧪 Étape 3 : Tester le Système

### 3.1 Test Manuel Immédiat

```sql
-- Exécuter le reset maintenant (test)
SELECT net.http_post(
  url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/reset-weekly-credits',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
  ),
  body := '{}'::jsonb
);
```

### 3.2 Vérifier les Crédits Créés

```sql
-- Voir les crédits créés récemment
SELECT 
  sc.id,
  sc.user_id,
  sc.credits_total,
  sc.credits_remaining,
  sc.week_start_date,
  sc.reset_at,
  u.email
FROM subscription_credits sc
JOIN auth.users u ON u.id = sc.user_id
WHERE sc.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY sc.created_at DESC;
```

### 3.3 Vérifier les Logs du Cron

```sql
-- Voir les 10 dernières exécutions
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time,
  (end_time - start_time) AS duration
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'reset-weekly-credits')
ORDER BY start_time DESC 
LIMIT 10;
```

---

## 📊 Étape 4 : Monitoring

### 4.1 Dashboard de Monitoring

**Créer une vue personnalisée** :
```sql
CREATE OR REPLACE VIEW credit_reset_dashboard AS
SELECT 
  DATE_TRUNC('day', start_time) AS execution_date,
  COUNT(*) AS total_runs,
  COUNT(*) FILTER (WHERE status = 'succeeded') AS successful_runs,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_runs,
  AVG(EXTRACT(EPOCH FROM (end_time - start_time))) AS avg_duration_seconds
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'reset-weekly-credits')
GROUP BY DATE_TRUNC('day', start_time)
ORDER BY execution_date DESC;
```

### 4.2 Alertes (Optionnel)

**Créer une notification si échec** :
```sql
-- Fonction pour envoyer un email en cas d'échec
CREATE OR REPLACE FUNCTION notify_credit_reset_failure()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'failed' THEN
    -- Envoyer notification (Slack, email, etc.)
    RAISE WARNING 'Credit reset failed at %', NEW.start_time;
    
    -- TODO: Intégrer avec service de notification
    -- Exemple: appeler API Slack/Discord/Email
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur les échecs
CREATE TRIGGER credit_reset_failure_alert
AFTER INSERT ON cron.job_run_details
FOR EACH ROW
WHEN (NEW.status = 'failed' AND NEW.jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'reset-weekly-credits'
))
EXECUTE FUNCTION notify_credit_reset_failure();
```

### 4.3 Logs dans l'Application

**Voir les logs Edge Function** :
```bash
# Via CLI
supabase functions logs reset-weekly-credits

# Ou dans Dashboard > Functions > reset-weekly-credits > Logs
```

---

## 🔧 Étape 5 : Maintenance

### 5.1 Modifier le Schedule

```sql
-- Changer pour chaque jour à 02:00 UTC (exemple)
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'reset-weekly-credits'),
  schedule := '0 2 * * *'
);
```

### 5.2 Désactiver Temporairement

```sql
-- Pause
UPDATE cron.job 
SET active = false 
WHERE jobname = 'reset-weekly-credits';

-- Reprendre
UPDATE cron.job 
SET active = true 
WHERE jobname = 'reset-weekly-credits';
```

### 5.3 Mettre à Jour la Fonction

```bash
# Modifier le code dans index.ts
nano supabase/functions/reset-weekly-credits/index.ts

# Re-déployer
supabase functions deploy reset-weekly-credits

# Vérifier la nouvelle version
supabase functions list
```

---

## ❌ Étape 6 : Rollback (si problème)

### 6.1 Désactiver le Cron

```sql
SELECT cron.unschedule('reset-weekly-credits');
```

### 6.2 Supprimer l'Edge Function

```bash
supabase functions delete reset-weekly-credits
```

### 6.3 Revenir en Arrière (Migration)

```sql
-- Rollback SQL
DROP TRIGGER IF EXISTS credit_reset_failure_alert ON cron.job_run_details;
DROP FUNCTION IF EXISTS notify_credit_reset_failure();
DROP VIEW IF EXISTS credit_reset_dashboard;
DROP VIEW IF EXISTS credit_reset_anomalies;
DROP VIEW IF EXISTS credit_reset_stats;
DROP TABLE IF EXISTS credit_reset_logs;
```

---

## 🎯 Checklist Finale

- [ ] Edge Function déployée (`supabase functions list`)
- [ ] Test manuel réussi (HTTP 200)
- [ ] Cron job créé (`SELECT * FROM cron.job`)
- [ ] Crédits créés pour users actifs
- [ ] Logs visibles dans Dashboard
- [ ] Monitoring configuré
- [ ] Documentation équipe mise à jour
- [ ] Variables d'environnement sécurisées

---

## 📞 Support

**En cas de problème** :

1. **Logs Edge Function** :
   ```bash
   supabase functions logs reset-weekly-credits --tail
   ```

2. **Logs PostgreSQL** :
   ```sql
   SELECT * FROM pg_stat_statements 
   WHERE query LIKE '%initialize_weekly_credits%'
   ORDER BY calls DESC;
   ```

3. **Status Cron** :
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'reset-weekly-credits';
   ```

---

## 📚 Ressources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [pg_cron Documentation](https://github.com/citusdata/pg_cron)
- [Deno Deploy Guide](https://deno.com/deploy/docs)

---

**Auteur** : GitHub Copilot  
**Date** : 5 octobre 2025  
**Status** : ✅ Prêt pour déploiement
