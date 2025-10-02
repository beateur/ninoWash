-- Nino Wash - Real Service Offer Update
-- This script cleans up the services table and inserts only the real services offered

-- First, delete all test bookings to avoid foreign key constraint errors
DELETE FROM bookings;

-- Now we can safely delete all old services
DELETE FROM services;

-- Insert only the 4 real services according to the actual business offer
INSERT INTO services (
    id, 
    code, 
    name, 
    description, 
    type, 
    base_price, 
    vat_rate, 
    processing_days,
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
        true,
        '{"weight_kg": 7, "includes": ["washing", "folding"], "delivery_time": "72h", "category": "classic"}'::jsonb
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
        true,
        '{"weight_kg": 7, "includes": ["washing", "ironing", "folding"], "delivery_time": "72h", "category": "classic"}'::jsonb
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
        true,
        '{"weight_kg": 7, "includes": ["washing", "folding"], "delivery_time": "24h", "category": "express"}'::jsonb
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
        true,
        '{"weight_kg": 7, "includes": ["washing", "ironing", "folding"], "delivery_time": "24h", "category": "express"}'::jsonb
    );

-- Clean up service options that are no longer relevant
DELETE FROM service_options;
