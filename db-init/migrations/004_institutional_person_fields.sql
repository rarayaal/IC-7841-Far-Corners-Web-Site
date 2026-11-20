-- Migración 004: Campos de fotografía y bilingüismo para personas institucionales (Junta Directiva y Equipo de Producción)
ALTER TABLE institutional_content ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE institutional_content ADD COLUMN IF NOT EXISTS content_en TEXT;
ALTER TABLE institutional_content ADD COLUMN IF NOT EXISTS subtitle_en TEXT;
