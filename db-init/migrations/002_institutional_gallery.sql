-- Agrega la sección 'gallery' a institutional_content: cada fila representa
-- la galería de una obra o proyecto (page_slug = id de la obra/proyecto) y sus
-- fotos se suben a R2 asociadas a esa fila desde la galería multimedia.
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

COMMIT;
