-- Nino Wash Initial Data
-- Sprint 1: Seed basic services and test data

-- Insert initial services
INSERT INTO services (code, name, description, type, base_price, min_items, max_items, processing_days) VALUES
('classic', 'Service Classique', 'Parfait pour vos besoins ponctuels', 'one_time', 3.00, 1, NULL, 2),
('monthly_sub', 'Abonnement Mensuel', 'Pour un pressing régulier et économique', 'subscription', 49.00, 1, 15, 2),
('quarterly_sub', 'Abonnement Trimestriel', 'La solution la plus avantageuse', 'subscription', 129.00, 1, 50, 2);

-- Insert service options
INSERT INTO service_options (code, name, description, price, category) VALUES
('express', 'Service Express', 'Livraison en 24h', 5.00, 'urgency'),
('ironing', 'Repassage Premium', 'Repassage professionnel inclus', 2.00, 'finishing'),
('stain_treatment', 'Traitement Taches', 'Traitement spécialisé des taches difficiles', 3.00, 'treatment'),
('delicate_care', 'Soin Délicat', 'Traitement spécialisé pour tissus délicats', 4.00, 'treatment'),
('eco_cleaning', 'Nettoyage Écologique', 'Produits 100% écologiques', 1.50, 'eco');

-- Create admin user (password: admin123 - should be changed in production)
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified) VALUES
('admin@ninowash.fr', '$2b$10$rQZ8kHp0rQZ8kHp0rQZ8kOQZ8kHp0rQZ8kHp0rQZ8kHp0rQZ8kHp0r', 'Admin', 'Nino Wash', 'admin', true);

-- Create test customer
INSERT INTO users (email, first_name, last_name, phone, email_verified) VALUES
('test@example.com', 'Marie', 'Dubois', '0123456789', true);

-- Get the test customer ID for address insertion
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    SELECT id INTO test_user_id FROM users WHERE email = 'test@example.com';
    
    -- Insert test address
    INSERT INTO user_addresses (user_id, label, street_address, postal_code, city, is_default, coordinates) VALUES
    (test_user_id, 'Domicile', '123 Rue de la Paix', '75001', 'Paris', true, ST_Point(2.3522, 48.8566));
END $$;

-- Insert system settings
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    category VARCHAR(50),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Basic system configuration
INSERT INTO system_settings (key, value, category, description, is_public) VALUES
('business_hours', '{"monday": {"open": "08:00", "close": "20:00"}, "tuesday": {"open": "08:00", "close": "20:00"}, "wednesday": {"open": "08:00", "close": "20:00"}, "thursday": {"open": "08:00", "close": "20:00"}, "friday": {"open": "08:00", "close": "20:00"}, "saturday": {"open": "09:00", "close": "18:00"}, "sunday": {"closed": true}}', 'operations', 'Business operating hours', true),
('service_zones', '["75001", "75002", "75003", "75004", "75005", "75006", "75007", "75008", "75009", "75010", "75011", "75012", "75013", "75014", "75015", "75016", "75017", "75018", "75019", "75020", "92200", "92100", "92300"]', 'operations', 'Postal codes served', true),
('min_order_free_delivery', '30.00', 'pricing', 'Minimum order amount for free delivery', true),
('delivery_fee', '5.00', 'pricing', 'Standard delivery fee', true);

-- Create booking number sequence
CREATE SEQUENCE IF NOT EXISTS booking_number_seq START 1;

-- Function to generate booking numbers
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'NW-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('booking_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate booking numbers
CREATE OR REPLACE FUNCTION set_booking_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_number IS NULL THEN
        NEW.booking_number := generate_booking_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_number_trigger
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION set_booking_number();
