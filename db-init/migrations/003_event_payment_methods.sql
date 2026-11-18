-- Migración 003: Campos de métodos de pago y URLs de compra por obra/evento
ALTER TABLE events ADD COLUMN IF NOT EXISTS zeffy_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS paypal_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS sinpe_phone VARCHAR(50) DEFAULT '7131-7013';
ALTER TABLE events ADD COLUMN IF NOT EXISTS payment_methods VARCHAR(255) DEFAULT 'sinpe,zeffy,paypal';
