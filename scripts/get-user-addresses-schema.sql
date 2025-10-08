-- Obtenir le schéma réel de user_addresses depuis la base de données
SELECT 
  table_schema,
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_addresses'
ORDER BY ordinal_position;
