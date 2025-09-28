-- Nino Wash Initial Data - Corrected Version
-- Seeds the database with initial data using correct data types

-- Insert service categories
INSERT INTO service_categories (id, name, description, icon, sort_order) VALUES
    (uuid_generate_v4(), 'Pressing', 'Services de pressing traditionnel', 'iron', 1),
    (uuid_generate_v4(), 'Nettoyage à sec', 'Nettoyage professionnel à sec', 'droplet', 2),
    (uuid_generate_v4(), 'Lavage', 'Services de lavage standard', 'washing-machine', 3),
    (uuid_generate_v4(), 'Retouches', 'Services de retouches et réparations', 'scissors', 4)
ON CONFLICT DO NOTHING;

-- Insert services
INSERT INTO services (id, code, name, description, type, base_price, vat_rate, processing_days) VALUES
    (uuid_generate_v4(), 'PRESS_SHIRT', 'Repassage Chemise', 'Repassage professionnel de chemises', 'one_time', 3.50, 20.00, 1),
    (uuid_generate_v4(), 'PRESS_PANTS', 'Repassage Pantalon', 'Repassage professionnel de pantalons', 'one_time', 4.00, 20.00, 1),
    (uuid_generate_v4(), 'DRY_CLEAN_SUIT', 'Nettoyage Costume', 'Nettoyage à sec complet d''un costume', 'one_time', 15.00, 20.00, 3),
    (uuid_generate_v4(), 'DRY_CLEAN_DRESS', 'Nettoyage Robe', 'Nettoyage à sec d''une robe', 'one_time', 12.00, 20.00, 2),
    (uuid_generate_v4(), 'WASH_FOLD', 'Lavage et Pliage', 'Service de lavage et pliage standard', 'one_time', 8.00, 20.00, 2),
    (uuid_generate_v4(), 'EXPRESS_SERVICE', 'Service Express', 'Traitement en 24h', 'one_time', 25.00, 20.00, 1)
ON CONFLICT (code) DO NOTHING;

-- Insert service options
INSERT INTO service_options (id, code, name, description, price, category) VALUES
    (uuid_generate_v4(), 'STARCH_LIGHT', 'Amidon Léger', 'Application d''amidon léger', 1.00, 'finishing'),
    (uuid_generate_v4(), 'STARCH_HEAVY', 'Amidon Fort', 'Application d''amidon fort', 1.50, 'finishing'),
    (uuid_generate_v4(), 'SPOT_TREATMENT', 'Détachage', 'Traitement spécial des taches', 3.00, 'treatment'),
    (uuid_generate_v4(), 'DELICATE_CARE', 'Soin Délicat', 'Traitement spécial pour tissus délicats', 2.50, 'treatment'),
    (uuid_generate_v4(), 'WATERPROOF', 'Imperméabilisation', 'Traitement imperméabilisant', 5.00, 'protection'),
    (uuid_generate_v4(), 'MOTHPROOF', 'Anti-mites', 'Traitement anti-mites', 3.50, 'protection')
ON CONFLICT (code) DO NOTHING;

-- Insert sample user addresses with correct POINT syntax
INSERT INTO user_addresses (id, user_id, label, street_address, postal_code, city, coordinates, is_default) 
SELECT 
    uuid_generate_v4(),
    u.id,
    'Domicile',
    '123 Rue de la Paix',
    '75001',
    'Paris',
    POINT(2.3522, 48.8566), -- Using POINT() function instead of ST_Point()
    true
FROM users u 
WHERE u.email LIKE '%@%' 
LIMIT 5
ON CONFLICT DO NOTHING;

-- Create sample bookings
DO $$
DECLARE
    sample_user_id UUID;
    sample_service_id UUID;
    sample_address_id UUID;
BEGIN
    -- Get a sample user
    SELECT id INTO sample_user_id FROM users WHERE email IS NOT NULL LIMIT 1;
    
    -- Get a sample service
    SELECT id INTO sample_service_id FROM services WHERE code = 'PRESS_SHIRT' LIMIT 1;
    
    -- Get a sample address
    SELECT id INTO sample_address_id FROM user_addresses WHERE user_id = sample_user_id LIMIT 1;
    
    -- Insert sample booking if we have the required data
    IF sample_user_id IS NOT NULL AND sample_service_id IS NOT NULL THEN
        INSERT INTO bookings (
            id, booking_number, user_id, service_id, 
            pickup_address_id, delivery_address_id,
            pickup_date, delivery_date,
            status, subtotal, total_amount, payment_status
        ) VALUES (
            uuid_generate_v4(),
            'NW' || TO_CHAR(NOW(), 'YYYYMMDD') || '001',
            sample_user_id,
            sample_service_id,
            sample_address_id,
            sample_address_id,
            CURRENT_DATE + INTERVAL '1 day',
            CURRENT_DATE + INTERVAL '3 days',
            'pending',
            3.50,
            4.20, -- Including VAT
            'pending'
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;
