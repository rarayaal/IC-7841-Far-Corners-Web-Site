-- FAR CORNERS - CREACION DESDE CERO - PostgreSQL 16
-- Version: 2026-10-15. Basado en init.sql original y siete vistas React.
--
-- PASO 1 (otra consulta, conectado a postgres; ejecutar fuera de BEGIN):
--     CREATE DATABASE farcorners_nueva;
-- PASO 2: abrir Query Tool sobre farcorners_nueva y ejecutar TODO este archivo.
-- Para Docker se puede llamar farcorners: POSTGRES_DB crea la BD y este archivo
-- crea sus objetos cuando el volumen es nuevo. Ajustar DATABASE_URL en la API.
-- No contiene ALTER TABLE, DROP TABLE, migraciones ni datos de ejemplo.
-- Requiere una BD VACIA. No ejecutar sobre la BD existente ni borrar su volumen.
--
-- Se conservan las 14 tablas iniciales, sus PK UUID, autenticacion, permisos,
-- relaciones, media, boletos, mensajes, newsletter y auditoria original.
-- Se agregan obras sin traducciones, elenco, proyectos sin traducciones,
-- institucion, participacion, contacto y datos de donaciones.
-- Las tablas institucionales/programas pueden contener textos es/en; no se
-- agregan traducciones a events ni projects. No existe bitacora nueva.

BEGIN;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- TABLAS

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(30) NOT NULL DEFAULT 'visitor'
        CHECK (role IN ('admin', 'visitor')),
    participant_type VARCHAR(40)
        CHECK (participant_type IN ('international_student', 'volunteer', 'intern')),
    status VARCHAR(30) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_authentication_required CHECK (
        NULLIF(TRIM(password_hash), '') IS NOT NULL
        OR NULLIF(TRIM(google_id), '') IS NOT NULL
    )
);


-- Obras: title/description siguen siendo el contenido unico; no se agregan traducciones.
-- event_date/venue son la fecha y sede principales heredadas; event_performances
-- almacena cada funcion. dates_label es solo un resumen editorial de las fechas.
-- status (cartelera) e is_published (visibilidad) son independientes.
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    venue VARCHAR(255),
    max_capacity INTEGER NOT NULL,
    poster_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    banner_url TEXT,
    director VARCHAR(255),
    season_year SMALLINT CHECK (season_year BETWEEN 1900 AND 9999),
    status VARCHAR(20) NOT NULL DEFAULT 'upcoming'
        CHECK (status IN ('upcoming', 'current', 'past', 'cancelled')),
    dates_label VARCHAR(255),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE
);

-- Funciones de una misma obra: insertar starts_at con zona horaria explicita,
-- por ejemplo 2026-11-20 19:00:00-06. La API administra cupos por funcion.
CREATE TABLE event_performances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    venue VARCHAR(255) NOT NULL,
    max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'cancelled', 'completed')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id, event_id),
    CHECK (ends_at IS NULL OR ends_at > starts_at)
);

-- Se conserva quantity_available como boletos RESTANTES y quantity_sold como vendidos.
-- No restar vendidos nuevamente. Para una obra con multiples funciones, usar
-- performance_id. NULL conserva la posibilidad de inventario agregado por obra.
-- La FK compuesta impide asociar el inventario a una funcion de otra obra.
-- La API debe evitar mezclar ambos modos y controlar aforos/sobreventa en transacciones.
CREATE TABLE ticket_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id),
    ticket_type VARCHAR(100) NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    quantity_available INTEGER NOT NULL DEFAULT 0,
    quantity_sold INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    performance_id UUID,
    ticket_type_en VARCHAR(100),
    currency VARCHAR(3) NOT NULL DEFAULT 'CRC'
        CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT inventory_performance_same_event_fk
        FOREIGN KEY (performance_id, event_id)
        REFERENCES event_performances(id, event_id)
);

-- Se conservan compras e identificador del pago. Se agrega moneda (CRC segun
-- boleteria actual) y datos del comprador sin cuenta. No es conversion de divisas.
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    event_id UUID NOT NULL REFERENCES events(id),
    total_amount DOUBLE PRECISION NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_intent_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    currency VARCHAR(3) NOT NULL DEFAULT 'CRC'
        CHECK (currency ~ '^[A-Z]{3}$'),
    buyer_name VARCHAR(200),
    buyer_email VARCHAR(254)
);

CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES purchases(id),
    ticket_inventory_id UUID NOT NULL REFERENCES ticket_inventory(id),
    qr_code VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'used', 'refunded')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Proyectos: title/description/image_url conservados, sin traducciones.
-- country guarda CR/CN/MZ: el frontend traduce el codigo al nombre del pais.
-- participants_count es una cifra editorial; NULL significa desconocida.
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    country VARCHAR(2),
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    project_year SMALLINT CHECK (project_year BETWEEN 1900 AND 9999),
    participants_count INTEGER CHECK (participants_count >= 0)
);

CREATE TABLE project_impact_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    metric_text TEXT NOT NULL CHECK (BTRIM(metric_text) <> ''),
    metric_text_en TEXT,
    display_order INTEGER NOT NULL DEFAULT 0
);

-- Textos de cabeceras, historia, instrucciones, campamento y CTA por idioma.
-- Se permite una seccion por pagina/idioma, con varias secciones por pagina.
-- Galeria/imagen institucional: reutilizar media.content_id.
-- Si la API sirve HTML, sanitizarlo antes de renderizarlo.
CREATE TABLE institutional_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_slug VARCHAR(191) NOT NULL,
    section VARCHAR(40) NOT NULL CHECK (section IN (
        'history', 'impact', 'future', 'students', 'volunteers',
        'internships', 'communities', 'donations', 'contact',
        'hero', 'intro', 'cta', 'camp', 'values', 'team', 'schedule',
        'payment_instructions'
    )),
    language VARCHAR(20) NOT NULL DEFAULT 'es',
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT institutional_content_page_section_language_unique UNIQUE (page_slug, section, language),
    subtitle TEXT,
    cta_label VARCHAR(150),
    cta_target TEXT,
    display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    alt_text TEXT,
    project_id UUID REFERENCES projects(id),
    event_id UUID REFERENCES events(id),
    content_id UUID REFERENCES institutional_content(id),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT media_exactly_one_association CHECK (
        (CASE WHEN project_id IS NOT NULL THEN 1 ELSE 0 END)
        + (CASE WHEN event_id IS NOT NULL THEN 1 ELSE 0 END)
        + (CASE WHEN content_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

-- Personas publicas: actores/equipo no necesitan cuentas de usuario.
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(200) NOT NULL CHECK (BTRIM(full_name) <> ''),
    photo_url TEXT,
    biography TEXT,
    biography_en TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Elenco: JOIN people.full_name como name y event_cast.role como role.
-- Una persona puede participar en varias obras y tener distintos papeles.
CREATE TABLE event_cast (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES people(id),
    role VARCHAR(255) NOT NULL CHECK (BTRIM(role) <> ''),
    role_en VARCHAR(255),
    display_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE (event_id, person_id, role)
);

-- Valores institucionales de AboutView. icon_key se resuelve mediante un mapa
-- permitido de iconos en React; no almacenar componentes ni codigo ejecutable.
CREATE TABLE organization_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    title_en VARCHAR(150),
    description TEXT NOT NULL,
    description_en TEXT,
    icon_key VARCHAR(50),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Junta directiva/equipo. Nombre, foto y biografia mediante JOIN people.
-- No confundir rol publico del equipo con users.role (autorizacion).
CREATE TABLE organization_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES people(id),
    role VARCHAR(200) NOT NULL,
    role_en VARCHAR(200),
    team_group VARCHAR(100),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (person_id, role)
);

-- Cifras editoriales/historicas de Home/About, como becas o jovenes beneficiados.
-- Ventas y recaudacion reales se calculan desde transacciones, no de esta tabla.
CREATE TABLE organization_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    display_value VARCHAR(100) NOT NULL,
    label VARCHAR(200) NOT NULL,
    label_en VARCHAR(200),
    reference_year SMALLINT CHECK (reference_year BETWEEN 1900 AND 9999),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Convocatorias y tarjeta destacada de campamento. Requisitos y caracteristicas
-- son listas ordenadas en sus tablas relacionadas. Publicado no significa abierto.
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    type VARCHAR(30) NOT NULL CHECK (type IN ('camp', 'internship', 'volunteer')),
    participation_mode VARCHAR(20) CHECK (participation_mode IN ('onsite', 'remote', 'hybrid')),
    title VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    description TEXT NOT NULL,
    description_en TEXT,
    period_label VARCHAR(200),
    period_label_en VARCHAR(200),
    starts_on DATE,
    ends_on DATE,
    application_deadline TIMESTAMPTZ,
    location VARCHAR(255),
    image_url TEXT,
    min_age SMALLINT CHECK (min_age >= 0),
    max_age SMALLINT CHECK (max_age >= 0),
    scholarships_available BOOLEAN NOT NULL DEFAULT FALSE,
    scholarship_percentage NUMERIC(5,2) CHECK (scholarship_percentage BETWEEN 0 AND 100),
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'open', 'closed', 'archived')),
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on),
    CHECK (min_age IS NULL OR max_age IS NULL OR max_age >= min_age)
);

CREATE TABLE opportunity_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    description_en TEXT,
    display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE opportunity_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    description_en TEXT,
    display_order INTEGER NOT NULL DEFAULT 0
);

-- Postulaciones: no se requiere cuenta (user_id opcional).
-- Admin: name=full_name; role=opportunities.title. Traducir estados en frontend:
-- pending=Pendiente, interview=Entrevista, approved=Aprobado, rejected=Rechazado,
-- withdrawn=Retirado. El email se deduplica por convocatoria, ignorando mayusculas.
-- El formulario/modal no fue adjuntado: revisar sus campos antes de ampliarlos.
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id),
    user_id UUID REFERENCES users(id),
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(254) NOT NULL,
    country VARCHAR(2),
    phone VARCHAR(50),
    motivation TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'interview', 'approved', 'rejected', 'withdrawn')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Datos publicos: correo, telefono, WhatsApp, direccion, horarios, SINPE y enlaces.
-- No guardar aqui claves de pasarelas ni credenciales.
CREATE TABLE contact_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_type VARCHAR(30) NOT NULL CHECK (channel_type IN (
        'address', 'email', 'phone', 'whatsapp', 'office_hours',
        'performance_hours', 'international_location', 'sinpe', 'donation_url', 'social'
    )),
    label VARCHAR(200) NOT NULL,
    label_en VARCHAR(200),
    value TEXT NOT NULL,
    value_en TEXT,
    link_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Formulario DonateView: metodo, referencia declarada, moneda y verificacion.
-- transaction_id es el ID del proveedor; payment_reference no confirma un pago.
-- completed exige confirmacion del proveedor o verificacion autorizada de SINPE.
-- No guardar numeros de tarjeta ni CVV. DEFAULT USD no convierte importes.
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_name VARCHAR(200),
    donor_email VARCHAR(254),
    amount DOUBLE PRECISION NOT NULL,
    payment_provider VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255) UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'failed')),
    message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD'
        CHECK (currency ~ '^[A-Z]{3}$'),
    payment_method VARCHAR(30)
        CHECK (payment_method IN ('sinpe', 'zeffy', 'card', 'paypal', 'other')),
    payment_reference VARCHAR(255),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ
);

CREATE TABLE newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(254) NOT NULL UNIQUE,
    mailchimp_id VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'subscribed'
        CHECK (status IN ('subscribed', 'unsubscribed')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(254) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'read', 'replied')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'delete')),
    table_name VARCHAR(64) NOT NULL,
    record_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- INDICES PARA RELACIONES Y CONSULTAS PUBLICAS
CREATE UNIQUE INDEX applications_opportunity_email_unique
    ON applications (opportunity_id, LOWER(BTRIM(email)));
CREATE INDEX events_public_status_idx ON events (status, display_order) WHERE is_published;
CREATE INDEX projects_public_order_idx ON projects (display_order) WHERE is_published;
CREATE INDEX performances_event_date_idx ON event_performances (event_id, starts_at);
CREATE INDEX cast_event_order_idx ON event_cast (event_id, display_order);
CREATE INDEX cast_person_idx ON event_cast (person_id);
CREATE INDEX inventory_event_performance_idx ON ticket_inventory (event_id, performance_id);
CREATE INDEX impact_project_order_idx ON project_impact_metrics (project_id, display_order);
CREATE INDEX team_person_idx ON organization_team_members (person_id);
CREATE INDEX opportunities_project_idx ON opportunities (project_id);
CREATE INDEX requirements_opportunity_idx ON opportunity_requirements (opportunity_id, display_order);
CREATE INDEX features_opportunity_idx ON opportunity_features (opportunity_id, display_order);
CREATE INDEX applications_status_idx ON applications (status, created_at);
CREATE INDEX applications_user_idx ON applications (user_id);
CREATE INDEX donations_status_date_idx ON donations (status, created_at);
CREATE INDEX purchases_event_status_idx ON purchases (event_id, status);
CREATE INDEX tickets_inventory_idx ON tickets (ticket_inventory_id);
CREATE INDEX tickets_purchase_idx ON tickets (purchase_id);
CREATE INDEX audit_date_idx ON audit_logs (created_at);

-- TRIGGERS DE UPDATED_AT
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_modtime BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchases_modtime BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_institutional_content_modtime BEFORE UPDATE ON institutional_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_newsletter_subscribers_modtime BEFORE UPDATE ON newsletter_subscribers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performances_modtime BEFORE UPDATE ON event_performances
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_people_modtime BEFORE UPDATE ON people
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_values_modtime BEFORE UPDATE ON organization_values
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_modtime BEFORE UPDATE ON organization_team_members
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_metrics_modtime BEFORE UPDATE ON organization_metrics
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_channels_modtime BEFORE UPDATE ON contact_channels
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_opportunities_modtime BEFORE UPDATE ON opportunities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_modtime BEFORE UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- INTEGRACION CON LOS VIEWS (no son datos de ejemplo):
-- Shows/Home/Admin: year=season_year, poster=poster_url, banner=banner_url,
-- synopsis=description, dates=dates_label o fechas formateadas de funciones,
-- location=venue. cast se obtiene de event_cast JOIN people, en display_order.
-- No hay synopsisEn/titleEn para obras ni proyectos; adaptar React para usar
-- el contenido unico al cambiar idioma. Las etiquetas UI siguen traducibles.
-- Proyectos: image=image_url, summary=description, year=project_year,
-- participants=participants_count; impactMetrics proviene de project_impact_metrics.
-- Participate: period=period_label, requirements de opportunity_requirements,
-- destacados y edad/becas/foto de opportunities, beneficios de opportunity_features.
-- About: valores de organization_values y equipo de organization_team_members
-- JOIN people. Home/About: cifras editoriales de organization_metrics.
-- Contact: el formulario ya corresponde a contact_messages; informacion publica
-- en contact_channels. No duplicar tablas para el mismo mensaje.
-- Institucion: usar institutional_content (page_slug,section,language).
-- Admin: conservar audit_logs original; user por JOIN users, timestamp=created_at,
-- module se deriva de table_name y details de action/old_values/new_values.
-- La escritura de auditoria es responsabilidad del backend en la transaccion.
--
-- DATOS DERIVADOS, NO NUEVAS TABLAS:
-- Recaudacion: SUM(amount) de donations completadas, separado por moneda.
-- Ventas por obra: tickets activos/usados con purchases.status='paid'.
-- Agregar ventas/capacidades por separado antes de unirlas para no multiplicar filas.
-- Postulantes activos: applications en pending/interview segun regla acordada.
-- Usuarios simultaneos: monitoreo/sesiones con vencimiento, no COUNT(users).
-- Precios y disponibilidad: ticket_inventory, filtrando funcion/tarifa/moneda.
-- Reemplazar precios '10000' y anos '2026' fijos en React por datos de la API.
--
-- DECISIONES CONSERVADAS DEL ORIGINAL:
-- Los importes permanecen DOUBLE PRECISION por compatibilidad con el script
-- inicial. Antes de cobros reales conviene NUMERIC(14,2), revisando redondeo y
-- el contrato de pg (NUMERIC normalmente llega a Node como texto).
-- Se conservan TIMESTAMP y autenticacion del original. Nuevas fechas de
-- funciones/revision usan TIMESTAMPTZ; la aplicacion debe fijar su zona horaria.
-- No se agregan personas, telefonos, porcentajes ni cifras de los mocks:
-- se deben validar con el cliente y cargar mediante INSERT/API posteriormente.
-- Cambiar el script NO cambia automaticamente las consultas existentes ni React.
