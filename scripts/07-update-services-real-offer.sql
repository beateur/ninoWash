-- Nino Wash - Real Service Offer Update
-- This script cleans up the services table and inserts only the real services offered

-- First, deactivate all existing services
UPDATE services SET is_active = false WHERE is_active = true;

-- Delete old service categories that don't match the real business
DELETE FROM service_categories;

-- Insert the real service categories
INSERT INTO service_categories (id, name, description, icon, sort_order) VALUES
    (uuid_generate_v4(), 'Service Classique', 'Traitement en 72 heures', 'clock', 1),
    (uuid_generate_v4(), 'Service Express', 'Traitement en 24 heures', 'zap', 2)
ON CONFLICT DO NOTHING;

-- Delete all old services
DELETE FROM services WHERE code NOT IN ('classic', 'monthly_sub', 'quarterly_sub');

-- Insert the 4 real services
INSERT INTO services (
    id, 
    code, 
    name, 
    description, 
    type, 
    base_price, 
    vat_rate, 
    processing_days,
    category,
    is_active,
    metadata
) VALUES
    -- Service Classique - 72h
    (
        uuid_generate_v4(),
        'CLASSIC_WASH_FOLD',
        'Nettoyage et pliage',
        'Service classique - Traitement en 72h - 7kg',
        'one_time',
        24.99,
        20.00,
        3,
        'Service Classique',
        true,
        '{"weight_kg": 7, "includes": ["washing", "folding"], "delivery_time": "72h"}'::jsonb
    ),
    (
        uuid_generate_v4(),
        'CLASSIC_WASH_IRON_FOLD',
        'Nettoyage, repassage et pliage',
        'Service classique - Traitement en 72h - 7kg',
        'one_time',
        29.99,
        20.00,
        3,
        'Service Classique',
        true,
        '{"weight_kg": 7, "includes": ["washing", "ironing", "folding"], "delivery_time": "72h"}'::jsonb
    ),
    
    -- Service Express - 24h
    (
        uuid_generate_v4(),
        'EXPRESS_WASH_FOLD',
        'Nettoyage et pliage',
        'Service express - Traitement en 24h - 7kg',
        'one_time',
        34.99,
        20.00,
        1,
        'Service Express',
        true,
        '{"weight_kg": 7, "includes": ["washing", "folding"], "delivery_time": "24h"}'::jsonb
    ),
    (
        uuid_generate_v4(),
        'EXPRESS_WASH_IRON_FOLD',
        'Nettoyage, repassage et pliage',
        'Service express - Traitement en 24h - 7kg',
        'one_time',
        39.99,
        20.00,
        1,
        'Service Express',
        true,
        '{"weight_kg": 7, "includes": ["washing", "ironing", "folding"], "delivery_time": "24h"}'::jsonb
    )
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    base_price = EXCLUDED.base_price,
    processing_days = EXCLUDED.processing_days,
    category = EXCLUDED.category,
    is_active = EXCLUDED.is_active,
    metadata = EXCLUDED.metadata;

-- Clean up service options that are no longer relevant
DELETE FROM service_options;

-- Update any existing bookings to use the new service structure
-- (This is a safety measure - adjust based on your needs)
UPDATE bookings 
SET status = 'pending' 
WHERE status = 'pending' 
AND service_id NOT IN (SELECT id FROM services WHERE is_active = true);
