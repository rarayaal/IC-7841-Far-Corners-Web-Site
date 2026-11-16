-- Migración para bases de datos ya creadas: agrega las secciones editables
-- del pie de página (footer), la junta directiva (board) y el equipo de
-- producción (production) a institutional_content, y corrige los datos de
-- contacto semilla según las observaciones del cliente.
BEGIN;

ALTER TABLE institutional_content
    DROP CONSTRAINT IF EXISTS institutional_content_section_check;

ALTER TABLE institutional_content
    ADD CONSTRAINT institutional_content_section_check CHECK (section IN (
        'history', 'impact', 'future', 'students', 'volunteers',
        'internships', 'communities', 'donations', 'contact',
        'hero', 'intro', 'cta', 'camp', 'values', 'team', 'schedule',
        'payment_instructions', 'footer', 'board', 'production', 'gallery'
    ));

-- Contactos: único teléfono 7131-7013, sin dirección de sede ni WhatsApp.
UPDATE contact_channels
   SET label = 'Coordinación de programas', value = 'Monteverde, Costa Rica'
 WHERE channel_type = 'address' AND value LIKE 'Monteverde, Puntarenas%';

UPDATE contact_channels
   SET value = '+506 7131-7013', link_url = 'tel:+50671317013'
 WHERE channel_type = 'phone' AND value = '+506 2645-5000';

DELETE FROM contact_channels
 WHERE channel_type = 'whatsapp' AND value = '+506 8888-9999';

INSERT INTO contact_channels (channel_type, label, value, display_order, is_published)
SELECT 'sinpe', 'SINPE Móvil', '7131-7013', 4, TRUE
 WHERE NOT EXISTS (SELECT 1 FROM contact_channels WHERE channel_type = 'sinpe');

UPDATE contact_channels
   SET value = 'Programas activos en Costa Rica (Monteverde).'
 WHERE channel_type = 'international_location'
   AND value = 'Programas activos en Costa Rica (Monteverde), China y Mozambique.';

COMMIT;
