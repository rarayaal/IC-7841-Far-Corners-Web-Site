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
    role VARCHAR(30) NOT NULL DEFAULT 'user'
        CHECK (role IN ('admin', 'manager', 'user')),
    participant_type VARCHAR(40)
        CHECK (participant_type IN ('internship', 'volunteer', 'camp')),
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

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL
);

CREATE TABLE user_permissions (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, permission_id)
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

-- Comunidades: RF-07
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    -- Objeto en Cloudflare R2 (CU-22). NULL en recursos estaticos heredados.
    storage_key TEXT UNIQUE,
    mime_type VARCHAR(100),
    size_bytes BIGINT CHECK (size_bytes > 0),
    -- Retiro logico (CU-24): FALSE oculta el recurso sin borrar el archivo.
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
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


CREATE TABLE contact_message_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    contact_message_id UUID NOT NULL
        REFERENCES contact_messages(id),

    admin_user_id UUID
        REFERENCES users(id) ON DELETE SET NULL,

    response_text TEXT NOT NULL
        CHECK (
            char_length(trim(response_text)) > 0
            AND char_length(response_text) <= 10000
        ),

    status VARCHAR(20) NOT NULL DEFAULT 'saved'
        CHECK (status IN ('saved', 'sent', 'failed')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    sent_at TIMESTAMP,

    CONSTRAINT reply_sent_at_check CHECK (
        (status = 'sent' AND sent_at IS NOT NULL)
        OR
        (status <> 'sent' AND sent_at IS NULL)
    )
);

CREATE INDEX idx_contact_message_replies_message
    ON contact_message_replies(contact_message_id);

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
CREATE INDEX media_content_idx ON media (content_id);
CREATE INDEX media_project_idx ON media (project_id);
CREATE INDEX media_event_idx ON media (event_id);

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
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    university VARCHAR(255),
    start_date DATE,
    end_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_profile UNIQUE (user_id)
);

CREATE TRIGGER update_student_profiles_modtime BEFORE UPDATE ON student_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE volunteer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interests TEXT,
    availability TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_volunteer_profile UNIQUE (user_id)
);

CREATE TRIGGER update_volunteer_profiles_modtime BEFORE UPDATE ON volunteer_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE camp_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school VARCHAR(255),
    grade VARCHAR(100),
    session VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_camp_profile UNIQUE (user_id)
);

CREATE TRIGGER update_camp_profiles_modtime BEFORE UPDATE ON camp_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_modtime BEFORE UPDATE ON opportunities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_communities_modtime BEFORE UPDATE ON communities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_modtime BEFORE UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed de Seguridad: Permisos y Administrador Maestro

-- Catalogo de permisos segun modulos del sistema
INSERT INTO permissions (id, code, description) VALUES
    ('11111111-1111-1111-1111-111111110001', 'users:manage', 'Gestionar usuarios y administradores'),
    ('11111111-1111-1111-1111-111111110002', 'roles:manage', 'Gestionar roles y permisos del sistema'),
    ('11111111-1111-1111-1111-111111110003', 'audit:read', 'Consultar la bitacora de auditoria del sistema'),
    ('11111111-1111-1111-1111-111111110004', 'content:manage', 'Gestionar contenido institucional e impacto'),
    ('11111111-1111-1111-1111-111111110005', 'projects:manage', 'Gestionar catalogo de proyectos teatrales'),
    ('11111111-1111-1111-1111-111111110006', 'events:manage', 'Gestionar eventos y cartelera'),
    ('11111111-1111-1111-1111-111111110007', 'tickets:manage', 'Gestionar inventario y precios de boleteria'),
    ('11111111-1111-1111-1111-111111110008', 'donations:manage', 'Gestionar donaciones e informacion financiera'),
    ('11111111-1111-1111-1111-111111110009', 'community:manage', 'Gestionar programas de voluntarios y estudiantes'),
    ('11111111-1111-1111-1111-111111110010', 'media:manage', 'Gestionar galeria multimedia y almacenamiento'),
    ('11111111-1111-1111-1111-111111110011', 'contact_channels:manage', 'Consultar y editar los medios de contacto'),
    ('11111111-1111-1111-1111-111111110012', 'contact_messages:read', 'Consultar mensajes de contacto'),
    ('11111111-1111-1111-1111-111111110013', 'contact_messages:reply', 'Responder mensajes de contacto')
ON CONFLICT (code) DO NOTHING;

-- Usuario Administrador Maestro Inicial (password: Admin123*!)
-- Hash bcrypt con factor de coste 12
INSERT INTO users (
    id,
    full_name,
    email,
    password_hash,
    role,
    status
) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Administrador General Far Corners',
    'admin@farcornerscr.org',
    '$2b$12$tCIZuiLE8m5WKsu39TJdmeLliZmMWnPDsuQXo8aevwtW98XgtOFOW',
    'admin',
    'active'
) ON CONFLICT (email) DO NOTHING;


INSERT INTO contact_channels (
    channel_type,
    label,
    value,
    link_url,
    display_order,
    is_published
) VALUES
(
    'address',
    'Sede Central y Teatro',
    'Monteverde, Puntarenas, Costa Rica',
    NULL,
    1,
    TRUE
),
(
    'email',
    'Correo Institucional',
    'info@farcornersmusicals.org',
    'mailto:info@farcornersmusicals.org',
    2,
    TRUE
),
(
    'phone',
    'Teléfono',
    '+506 2645-5000',
    'tel:+50626455000',
    3,
    TRUE
),
(
    'whatsapp',
    'WhatsApp',
    '+506 8888-9999',
    'https://wa.me/50688889999',
    4,
    TRUE
),
(
    'office_hours',
    'Horario de Taquilla y Oficina',
    'Lunes a Viernes: 9:00 AM – 5:00 PM',
    NULL,
    5,
    TRUE
),
(
    'performance_hours',
    'Horario durante funciones',
    'Días de función: Abierto hasta el inicio de la obra',
    NULL,
    6,
    TRUE
),
(
    'international_location',
    'Ubicación Internacional',
    'Programas activos en Costa Rica (Monteverde), China y Mozambique.',
    NULL,
    7,
    TRUE
);

-- Asignar todos los permisos al Administrador Maestro Inicial
INSERT INTO user_permissions (user_id, permission_id)
SELECT 
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
    p.id 
FROM permissions p
ON CONFLICT (user_id, permission_id) DO NOTHING;

-- Indices de optimizacion para modulos de seguridad y auditoria
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

COMMIT;


-- Formularios dinamicos y editables (CU-05/06/07). Un formulario es una fila
-- en `forms` (titulo + slug); su estructura editable vive en form_fields y se
-- administra desde el panel (crear, renombrar y eliminar formularios; agregar,
-- editar, reordenar y quitar campos; marcar obligatorio), imitando Google
-- Forms. Las respuestas se guardan como JSONB en form_submissions, ligadas al
-- usuario autenticado que las envia.
CREATE TABLE IF NOT EXISTS forms (
    slug VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    sections JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE forms ADD COLUMN IF NOT EXISTS sections JSONB;

-- Ficha pública del formulario: es lo que ve cualquier visitante en la página
-- "Programas y Comunidad". Un formulario publicado aparece como una tarjeta
-- con su propia convocatoria y su botón "Postular a este puesto".
ALTER TABLE forms ADD COLUMN IF NOT EXISTS title_en VARCHAR(255);
ALTER TABLE forms ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS category VARCHAR(20)
    CHECK (category IN ('internship', 'volunteer', 'camp'));
ALTER TABLE forms ADD COLUMN IF NOT EXISTS period VARCHAR(255);
ALTER TABLE forms ADD COLUMN IF NOT EXISTS period_en VARCHAR(255);
ALTER TABLE forms ADD COLUMN IF NOT EXISTS requirements JSONB;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE;
-- Solo un formulario puede ser el destacado: aparece en la tarjeta grande de
-- "Programas y Comunidad". El endpoint de publicación desmarca los demás.
ALTER TABLE forms ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;
-- Foto opcional de la tarjeta grande. Puede ser una URL de la galería
-- multimedia o una ruta local (p. ej. /recursos/IMG_2916.PNG).
ALTER TABLE forms ADD COLUMN IF NOT EXISTS image_url TEXT;

INSERT INTO forms (
    slug, title, title_en, description, description_en,
    category, period, period_en, requirements, is_published, is_featured, image_url
) VALUES
    (
        'internship',
        'Pasantía Internacional: Stage Manager / Dirección',
        'International Internship: Stage Management & Directing',
        'Buscamos estudiantes universitarios y jóvenes profesionales internacionales apasionados por la gestión escénica, dirección de escena y logística de producción teatral.',
        'We are seeking international university students and young professionals for stage management and production.',
        'internship',
        'Temporada Verano 2026 (7 semanas)',
        'Summer 2026 Season (7 weeks)',
        '{"es":["Estudiante o graduado en Teatro, Gestión Cultural o áreas afines","Nivel de inglés intermedio/avanzado","Capacidad de trabajo colaborativo multicultural"],"en":["Theatre or Cultural Management background","Intermediate/Advanced English proficiency","Cross-cultural teamwork skills"]}'::jsonb,
        TRUE,
        FALSE,
        NULL
    ),
    (
        'volunteer',
        'Voluntariado Cyber: Redes y Medios Digitales',
        'Cyber Volunteer: Social Media & Digital Content',
        'Apoya a nuestra organización desde cualquier lugar del mundo diseñando afiches, editando videos, creando piezas de comunicación y gestionando redes sociales.',
        'Support our organization remotely by creating social graphics, editing video footage, and writing newsletter updates.',
        'volunteer',
        'Continuo / Flexibilidad de horarios',
        'Ongoing / Flexible schedule',
        '{"es":["Conocimientos de diseño gráfico (Canva, Photoshop) o edición de video","Disponibilidad de 3-5 horas semanales","Compromiso con la misión social del teatro"],"en":["Graphic design or video editing skills","Availability of 3-5 hours per week","Commitment to social theatre mission"]}'::jsonb,
        TRUE,
        FALSE,
        NULL
    ),
    (
        'camp',
        'Costa Rica Theatre Camp (Estudiantes)',
        'Costa Rica Theatre Camp (Students)',
        'Campamento intensivo de teatro musical para jóvenes de 8 a 18 años. Clases diarias de canto, actuación, danza y montaje de la obra principal con profesores internacionales.',
        'Intensive summer musical theatre camp for youth ages 8 to 18. Daily classes in singing, acting, and dance.',
        'camp',
        'Junio - Agosto 2026',
        'June - August 2026',
        '{"es":["Edades entre 8 y 18 años","Interés en artes escénicas (no se requiere experiencia previa)","Compromiso de asistencia a todos los ensayos"],"en":["Ages 8 to 18","Interest in performing arts","Commitment to all rehearsals"]}'::jsonb,
        TRUE,
        TRUE,
        '/recursos/IMG_2916.PNG'
    )
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    title_en = EXCLUDED.title_en,
    description = EXCLUDED.description,
    description_en = EXCLUDED.description_en,
    category = EXCLUDED.category,
    period = EXCLUDED.period,
    period_en = EXCLUDED.period_en,
    requirements = EXCLUDED.requirements,
    is_published = EXCLUDED.is_published,
    is_featured = EXCLUDED.is_featured,
    image_url = EXCLUDED.image_url,
    updated_at = CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_type VARCHAR(100) NOT NULL REFERENCES forms(slug) ON DELETE CASCADE,
    section VARCHAR(100) NOT NULL,
    field_key VARCHAR(100) NOT NULL,
    label VARCHAR(500) NOT NULL,
    field_type VARCHAR(20) NOT NULL CHECK (field_type IN ('text', 'email', 'date', 'datetime', 'textarea', 'select', 'radio', 'checkbox')),
    options JSONB,
    required BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (form_type, field_key)
);

CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_type VARCHAR(100) NOT NULL REFERENCES forms(slug) ON DELETE CASCADE,
    opportunity_id VARCHAR(100),
    user_id UUID NOT NULL REFERENCES users(id),
    data JSONB NOT NULL,
    -- Copia de la estructura del formulario al momento del envío (título, secciones
    -- y campos). Permite mostrar cada envío con el formato con el que fue completado
    -- aunque después se edite o elimine la estructura actual.
    form_snapshot JSONB,
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS form_snapshot JSONB;

-- Borrador de un formulario por usuario: permite guardar respuestas automáticamente
-- mientras se rellena un formulario extenso, sin llegar a enviarlo oficialmente.
CREATE TABLE IF NOT EXISTS form_drafts (
    form_type VARCHAR(100) NOT NULL REFERENCES forms(slug) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (form_type, user_id)
);

CREATE INDEX IF NOT EXISTS idx_form_drafts_user ON form_drafts(user_id);

CREATE INDEX IF NOT EXISTS idx_form_fields_type ON form_fields(form_type);
CREATE INDEX IF NOT EXISTS idx_form_submissions_type ON form_submissions(form_type);
CREATE INDEX IF NOT EXISTS idx_form_submissions_user ON form_submissions(user_id);


INSERT INTO form_fields (form_type, section, field_key, label, field_type, options, required, display_order)
VALUES
('internship', 'Internship Selection', 'which_internship', 'Which internship are you interested in applying for?', 'radio', '["Full Internship: June 6th - August 5th, 2026 (8 weeks)","Flexible Internship: Dates for the flexible internship can be negotiated, but interns must be available between June 6th/June 15th - August 5th, 2026 for a minimum 4 week commitment."]'::jsonb, TRUE, 1),
('internship', 'Personal Information', 'full_legal_name', 'Full Legal Name (as it appears in your passport)', 'text', NULL, TRUE, 2),
('internship', 'Personal Information', 'preferred_name', 'Name we should call you', 'text', NULL, TRUE, 3),
('internship', 'Personal Information', 'date_of_birth', 'Date of Birth', 'date', NULL, TRUE, 4),
('internship', 'Personal Information', 'pronouns', 'Preferred Gender Pronouns', 'text', NULL, TRUE, 5),
('internship', 'Personal Information', 'school_or_employer', 'Current college/university, high school (if not yet in college/university) OR employer and position', 'text', NULL, TRUE, 6),
('internship', 'Personal Information', 'current_year', 'Current year in college/university', 'select', '["First Year","Sophomore","Junior","Senior"]'::jsonb, TRUE, 7),
('internship', 'Personal Information', 'major_minor', 'Major(s) & Minor(s) / Specialization', 'text', NULL, TRUE, 8),
('internship', 'Personal Information', 'mailing_address', 'Current mailing address', 'text', NULL, TRUE, 9),
('internship', 'Personal Information', 'permanent_address', 'Permanent mailing address', 'text', NULL, TRUE, 10),
('internship', 'Personal Information', 'primary_phone', 'Primary phone number (add country ID)', 'text', NULL, TRUE, 11),
('internship', 'Personal Information', 'primary_phone_type', 'Primary phone number type', 'select', '["Home phone","Mobile phone","Work phone","Other"]'::jsonb, TRUE, 12),
('internship', 'Personal Information', 'additional_phone', 'Additional phone number', 'text', NULL, FALSE, 13),
('internship', 'Personal Information', 'additional_phone_type', 'Additional phone number type', 'select', '["Home phone","Mobile phone","Work phone","Other"]'::jsonb, FALSE, 14),
('internship', 'Personal Information', 'school_email', 'School Email Address', 'email', NULL, TRUE, 15),
('internship', 'Personal Information', 'personal_email', 'Personal Email Address', 'email', NULL, TRUE, 16),
('internship', 'Personal Information', 'citizenship', 'Country of citizenship', 'text', NULL, TRUE, 17),
('internship', 'Personal Information', 'has_passport', 'Do you have a passport?', 'radio', '["Yes","No"]'::jsonb, TRUE, 18),
('internship', 'Personal Information', 'passport_expiration', 'Expiration date of passport', 'date', NULL, FALSE, 19),
('internship', 'Personal Information', 'other_citizenships', 'Other countries in which you have citizenship or permanent residency', 'text', NULL, FALSE, 20),
('internship', 'Personal Information', 'health_insurance_provider', 'Health insurance provider', 'text', NULL, TRUE, 21),
('internship', 'Personal Information', 'health_insurance_policy_number', 'Health insurance policy number', 'text', NULL, TRUE, 22),
('internship', 'Personal Information', 'health_insurance_policy_name', 'Name on health insurance policy', 'text', NULL, TRUE, 23),
('internship', 'Internship Program Questions', 'availability_arrival', 'Please tell us about your availability (when you would be able to arrive)', 'text', NULL, TRUE, 24),
('internship', 'Internship Program Questions', 'first_choice_position', 'What is your first choice position?', 'text', NULL, TRUE, 25),
('internship', 'Internship Program Questions', 'first_choice_qualifications', 'Please describe your qualifications for and interest in your first choice position.', 'textarea', NULL, TRUE, 26),
('internship', 'Internship Program Questions', 'second_choice_position', 'What is your second choice position?', 'text', NULL, TRUE, 27),
('internship', 'Internship Program Questions', 'second_choice_qualifications', 'Please describe your qualifications for and interest in your second choice position.', 'textarea', NULL, FALSE, 28),
('internship', 'Internship Program Questions', 'third_choice_position', 'What is your third choice position?', 'text', NULL, FALSE, 29),
('internship', 'Internship Program Questions', 'third_choice_qualifications', 'Please describe your qualifications for and interest in your third choice position.', 'textarea', NULL, FALSE, 30),
('internship', 'Spanish Language Proficiency', 'spanish_spoken', 'Spanish Language Ability - Spoken', 'radio', '["None","Beginner","Advanced Beginner","Intermediate","Advanced","Fluent","Native Speaker"]'::jsonb, TRUE, 31),
('internship', 'Spanish Language Proficiency', 'spanish_written', 'Spanish Language Ability - Written', 'radio', '["None","Beginner","Advanced Beginner","Intermediate","Advanced","Fluent, excellent writer in Spanish"]'::jsonb, TRUE, 32),
('internship', 'Spanish Language Proficiency', 'spanish_classroom_experience', 'Describe your experience studying Spanish formally in a classroom setting (if any).', 'textarea', NULL, TRUE, 33),
('internship', 'Spanish Language Proficiency', 'spanish_real_life_experience', 'Describe your experience using Spanish in real life situations, with native speakers (if any).', 'textarea', NULL, TRUE, 34),
('internship', 'Spanish Language Proficiency', 'other_languages', 'Do you speak any languages other than English or Spanish?', 'text', NULL, FALSE, 35),
('internship', 'Spanish Language Proficiency', 'intensive_spanish_interest', 'Would you be interested in taking an intensive Spanish class?', 'radio', '["Yes","No","Maybe"]'::jsonb, FALSE, 36),
('internship', 'Costs and Financial Aid', 'will_apply_funding', 'I will apply for funding from my college/university', 'radio', '["Yes","Maybe","No"]'::jsonb, TRUE, 37),
('internship', 'Costs and Financial Aid', 'funding_deadline', 'If yes, what is the deadline to apply for this funding?', 'date', NULL, FALSE, 38),
('internship', 'Costs and Financial Aid', 'need_based_aid', 'Are you requesting need-based financial aid from our organization?', 'radio', '["No","Yes; funding is not available from my college/university","Yes; I am applying for funding from my college/university but it will not cover all of my costs (fee + airfare)","Maybe; if I do not receive funding from my college/university I will require financial aid to participate"]'::jsonb, FALSE, 39),
('internship', 'References', 'ref1_name', 'Reference #1 Name', 'text', NULL, TRUE, 40),
('internship', 'References', 'ref1_position', 'Reference #1 Position & Institution', 'text', NULL, TRUE, 41),
('internship', 'References', 'ref1_relationship', 'Reference #1 Relationship to You', 'text', NULL, TRUE, 42),
('internship', 'References', 'ref1_phone', 'Reference #1 Phone Number', 'text', NULL, TRUE, 43),
('internship', 'References', 'ref1_email', 'Reference #1 Email Address', 'email', NULL, TRUE, 44),
('internship', 'References', 'ref1_timezone', 'Reference #1 Time Zone', 'text', NULL, TRUE, 45),
('internship', 'References', 'ref2_name', 'Reference #2 Name', 'text', NULL, TRUE, 46),
('internship', 'References', 'ref2_position', 'Reference #2 Position & Institution', 'text', NULL, TRUE, 47),
('internship', 'References', 'ref2_relationship', 'Reference #2 Relationship to You', 'text', NULL, TRUE, 48),
('internship', 'References', 'ref2_phone', 'Reference #2 Phone Number', 'text', NULL, TRUE, 49),
('internship', 'References', 'ref2_email', 'Reference #2 Email Address', 'email', NULL, TRUE, 50),
('internship', 'References', 'ref2_timezone', 'Reference #2 Time Zone', 'text', NULL, TRUE, 51),
('internship', 'Applicant Acknowledgement', 'declaration', 'I hereby declare that the information provided is true and correct. I also understand that any willful dishonesty may render for refusal of this application.', 'radio', '["YES","No"]'::jsonb, TRUE, 52),
('internship', 'Applicant Acknowledgement', 'signed_digitally', 'Signed Digitally (enter full legal name)', 'text', NULL, TRUE, 53),
('internship', 'Applicant Acknowledgement', 'date_signed', 'Date Signed', 'datetime', NULL, TRUE, 54),
('internship', 'Applicant Acknowledgement', 'send_copy', 'Send me a copy of my responses.', 'checkbox', NULL, FALSE, 55),
('volunteer', 'Basic Information', 'name', 'Name', 'text', NULL, TRUE, 56),
('volunteer', 'Basic Information', 'pronouns', 'PGPs (Preferred Gendered Pronouns)', 'text', NULL, TRUE, 57),
('volunteer', 'Basic Information', 'mailing_address', 'Mailing Address', 'text', NULL, TRUE, 58),
('volunteer', 'Basic Information', 'mobile_phone', 'Mobile Phone Number', 'text', NULL, TRUE, 59),
('volunteer', 'Basic Information', 'home_phone', 'Home Phone Number', 'text', NULL, TRUE, 60),
('volunteer', 'Volunteer Positions/Areas of Expertise', 'posted_position', 'Are you responding to a specific posted volunteer position? Which?', 'text', NULL, TRUE, 61),
('volunteer', 'Volunteer Positions/Areas of Expertise', 'other_areas_interest', 'Are you interested in cyber-volunteer projects in other areas?', 'radio', '["Yes","No"]'::jsonb, TRUE, 62),
('volunteer', 'Volunteer Positions/Areas of Expertise', 'areas_interested', 'Which areas are you interested in?', 'checkbox', '["Video editing/Production","Translation - general","Translation - dramatic writing","Writing","Foreign language transcription (from video footage)","Editing/Proofreading","Internet research","Graphic design/layout","Simple web design","Advanced web design","Curriculum development (arts education)","Music (especially transposition and/or keyboard skills, and ability to use music notation software)","Other"]'::jsonb, TRUE, 63),
('volunteer', 'Volunteer Positions/Areas of Expertise', 'onsite_interest', 'Are you interested in on-site (usually international) volunteering in addition to cyber-volunteering?', 'radio', '["Yes","No"]'::jsonb, TRUE, 64),
('volunteer', 'Availability', 'time_commitment', 'Approximately how much time would you like to spend volunteering? (Please specify how many hours per week or month)', 'text', NULL, TRUE, 65),
('volunteer', 'Availability', 'begin_date', 'When are you available to begin volunteering?', 'date', NULL, TRUE, 66),
('volunteer', 'Availability', 'duration', 'For how long are you available to volunteer?', 'radio', '["3 months","6 months","9 months","1 year","Indefinite/Flexible","Other"]'::jsonb, TRUE, 67),
('volunteer', 'Skills and Interests', 'skills', 'Please describe your skills, experience and training related to your position(s) of interest (not necessary if your resume covers it).', 'textarea', NULL, FALSE, 68),
('volunteer', 'Language Information', 'spoken_languages', 'Please list ALL languages that you speak, and at what level (indicate if you are a native speaker).', 'text', NULL, TRUE, 69),
('volunteer', 'Language Information', 'written_languages', 'Please list ALL languages in which you can write, and at what level.', 'text', NULL, TRUE, 70),
('camp', 'Participant Information', 'name', 'Name', 'text', NULL, TRUE, 71),
('camp', 'Participant Information', 'pronouns', 'PGPs (Preferred Gendered Pronouns)', 'text', NULL, TRUE, 72),
('camp', 'Participant Information', 'age', 'Age', 'text', NULL, TRUE, 73),
('camp', 'Participant Information', 'date_of_birth', 'Date of Birth', 'date', NULL, TRUE, 74),
('camp', 'Participant Information', 'street_address', 'Street Address', 'text', NULL, TRUE, 75),
('camp', 'Participant Information', 'city', 'City', 'text', NULL, TRUE, 76),
('camp', 'Participant Information', 'state_province', 'State/Province', 'text', NULL, TRUE, 77),
('camp', 'Participant Information', 'country', 'Country', 'text', NULL, TRUE, 78),
('camp', 'Participant Information', 'zip', 'Zip code/Postal code', 'text', NULL, TRUE, 79),
('camp', 'Participant Information', 'primary_phone', 'Primary phone number', 'text', NULL, TRUE, 80),
('camp', 'Participant Information', 'primary_phone_type', 'Primary phone type', 'radio', '["Home phone","Mobile phone","Other"]'::jsonb, TRUE, 81),
('camp', 'Participant Information', 'additional_phone', 'Additional phone number', 'text', NULL, TRUE, 82),
('camp', 'Participant Information', 'additional_phone_type', 'Additional phone type', 'radio', '["Home phone","Mobile phone","Other"]'::jsonb, TRUE, 83),
('camp', 'Participant Information', 'school', 'School', 'text', NULL, TRUE, 84),
('camp', 'Participant Information', 'grade', 'Year/Grade in school are you in during the current Academic School Year?', 'select', '["7th","8th","9th","10th","11th","12th"]'::jsonb, TRUE, 85),
('camp', 'Participant Information', 'citizenship', 'Country or countries of citizenship', 'text', NULL, TRUE, 86),
('camp', 'Participant Information', 'has_passport', 'Do you have a passport?', 'radio', '["Yes","No"]'::jsonb, TRUE, 87),
('camp', 'Participant Information', 'passport_expiration', 'Expiration date of passport', 'date', NULL, FALSE, 88),
('camp', 'Participant Information', 'passport_number', 'Passport number', 'text', NULL, FALSE, 89),
('camp', 'Participant Information', 'health_insurance_carrier', 'Health insurance carrier', 'text', NULL, TRUE, 90),
('camp', 'Participant Information', 'policy_number', 'Policy number', 'text', NULL, TRUE, 91),
('camp', 'Participant Information', 'policy_name', 'Name on policy', 'text', NULL, TRUE, 92),
('camp', 'Parent/Guardian Information (#1)', 'guardian1_name', 'Parent/Guardian #1 Name', 'text', NULL, TRUE, 93),
('camp', 'Parent/Guardian Information (#1)', 'guardian1_phone', 'Parent/Guardian #1 Primary phone number', 'text', NULL, TRUE, 94),
('camp', 'Parent/Guardian Information (#1)', 'guardian1_phone_type', 'Parent/Guardian #1 Primary phone number type', 'radio', '["Home phone","Mobile phone","Work phone","Other"]'::jsonb, TRUE, 95),
('camp', 'Parent/Guardian Information (#1)', 'guardian1_add_phone1', 'Parent/Guardian #1 Additional phone number #1', 'text', NULL, FALSE, 96),
('camp', 'Parent/Guardian Information (#1)', 'guardian1_add_phone1_type', 'Parent/Guardian #1 Additional phone number #1 type', 'radio', '["Home phone","Mobile phone","Work phone","Other"]'::jsonb, FALSE, 97),
('camp', 'Parent/Guardian Information (#1)', 'guardian1_add_phone2', 'Parent/Guardian #1 Additional phone number #2', 'text', NULL, FALSE, 98),
('camp', 'Parent/Guardian Information (#1)', 'guardian1_add_phone2_type', 'Parent/Guardian #1 Additional phone number #2 type', 'radio', '["Home phone","Mobile phone","Work phone","Other"]'::jsonb, FALSE, 99),
('camp', 'Parent/Guardian Information (#1)', 'guardian1_email', 'Parent/Guardian #1 Email address', 'email', NULL, TRUE, 100),
('camp', 'Parent/Guardian Information (#1)', 'guardian1_address', 'Parent/Guardian #1 Home address (if different than participant''s)', 'text', NULL, FALSE, 101),
('camp', 'Parent/Guardian Information (#2)', 'guardian2_name', 'Parent/Guardian #2 Name', 'text', NULL, FALSE, 102),
('camp', 'Parent/Guardian Information (#2)', 'guardian2_phone', 'Parent/Guardian #2 Primary phone number', 'text', NULL, FALSE, 103),
('camp', 'Parent/Guardian Information (#2)', 'guardian2_phone_type', 'Parent/Guardian #2 Primary phone number type', 'radio', '["Home phone","Mobile phone","Work phone","Other"]'::jsonb, FALSE, 104),
('camp', 'Parent/Guardian Information (#2)', 'guardian2_add_phone1', 'Parent/Guardian #2 Additional phone number #1', 'text', NULL, FALSE, 105),
('camp', 'Parent/Guardian Information (#2)', 'guardian2_add_phone1_type', 'Parent/Guardian #2 Additional phone number #1 type', 'radio', '["Home phone","Mobile phone","Work phone","Other"]'::jsonb, FALSE, 106),
('camp', 'Parent/Guardian Information (#2)', 'guardian2_add_phone2', 'Parent/Guardian #2 Additional phone number #2', 'text', NULL, FALSE, 107),
('camp', 'Parent/Guardian Information (#2)', 'guardian2_add_phone2_type', 'Parent/Guardian #2 Additional phone number #2 type', 'radio', '["Home phone","Mobile phone","Work phone","Other"]'::jsonb, FALSE, 108),
('camp', 'Parent/Guardian Information (#2)', 'guardian2_email', 'Parent/Guardian #2 Email address', 'email', NULL, FALSE, 109),
('camp', 'Program Options', 'program_length', '2026 Program Length/Dates', 'radio', '["CRTC1: June 29 - August 5 (6 weeks)","Other"]'::jsonb, TRUE, 110),
('camp', 'Program Options', 'program_focus', 'Program Focus', 'radio', '["Performance","Technical Theatre & Production"]'::jsonb, FALSE, 111),
('camp', 'Language information', 'spanish_level', 'How would you describe your Spanish level?', 'radio', '["No knowledge of Spanish","Beginner (0-1 years Spanish class)","Advanced beginner (1-2 years Spanish class)","Intermediate (2-4 years Spanish class)","Advanced (4+ years of Spanish class)","Fluent","Native speaker"]'::jsonb, TRUE, 112),
('camp', 'Language information', 'spanish_learning', 'Briefly describe any previous Spanish learning experiences (in or outside of school)', 'text', NULL, FALSE, 113),
('camp', 'Language information', 'spanish_outside', 'Have you ever used Spanish outside of the classroom?', 'text', NULL, FALSE, 114),
('camp', 'Language information', 'other_languages', 'Have you studied any languages other than English or Spanish? If yes, describe your ability level.', 'text', NULL, FALSE, 115),
('camp', 'Additional Questions', 'q_why_participate', '1. Why do you want to participate in this program? What do you hope to gain from the experience?', 'textarea', NULL, TRUE, 116),
('camp', 'Additional Questions', 'q_interests', '2. What are your major interests, favorite activities, and hobbies?', 'textarea', NULL, TRUE, 117),
('camp', 'Additional Questions', 'q_experience', '3. Describe any experience you have in music, theatre (including technical theatre), and dance.', 'textarea', NULL, TRUE, 118),
('camp', 'Additional Questions', 'q_group_living', '4. Have you ever lived and worked closely with a group of people (other than your family) for an extended period of time? Briefly describe the experience.', 'textarea', NULL, TRUE, 119),
('camp', 'Additional Questions', 'q_away_from_home', '5. What do you think will be most difficult about spending several weeks away from your family, friends and home? What will be most exciting or rewarding?', 'textarea', NULL, TRUE, 120),
('camp', 'Additional Questions', 'q_diverse_backgrounds', '6. What do you enjoy (or look forward to) about working with people from backgrounds different from your own? What do you find most difficult?', 'textarea', NULL, TRUE, 121),
('camp', 'Participant and Parent/Guardian Agreement', 'participant_signature', 'Participant signature (typed)', 'text', NULL, TRUE, 122),
('camp', 'Participant and Parent/Guardian Agreement', 'guardian_signature', 'Parent/Guardian signature (typed)', 'text', NULL, TRUE, 123),
('camp', 'Participant and Parent/Guardian Agreement', 'date_signed', 'Date', 'datetime', NULL, TRUE, 124),
('camp', 'Participant and Parent/Guardian Agreement', 'send_copy', 'Send me a copy of my responses.', 'checkbox', NULL, FALSE, 125)
ON CONFLICT (form_type, field_key) DO UPDATE SET
    section = EXCLUDED.section,
    label = EXCLUDED.label,
    field_type = EXCLUDED.field_type,
    options = EXCLUDED.options,
    required = EXCLUDED.required,
    display_order = EXCLUDED.display_order,
    updated_at = CURRENT_TIMESTAMP;

-- Segunda pasantía internacional: la página pública muestra dos convocatorias
-- de pasantía (Stage Manager y Coach Vocal). Cada una necesita su propio
-- formulario para que su tarjeta tenga un "Postular a este puesto" propio.
-- Nace como copia del formulario de pasantía; el admin puede editarla después.
INSERT INTO forms (
    slug, title, title_en, description, description_en,
    category, period, period_en, requirements, sections, is_published
)
SELECT
    'internship-vocal',
    'Pasantía: Coach Vocal y Dirección Musical',
    'Internship: Vocal Coach & Musical Direction',
    'Liderar el entrenamiento vocal de niños y jóvenes del campamento, ensayar coros y preparar los solos para el musical principal.',
    'Lead vocal training for youth campers, rehearse choruses, and prepare solo numbers.',
    'internship',
    'Verano 2026',
    'Summer 2026',
    '{"es":["Formación en música, canto o piano","Experiencia previa en dirección de coros o paridad vocal","Deseo de enseñar a jóvenes en entorno bilingüe"],"en":["Background in music, singing, or piano","Experience directing choirs or vocal ensembles","Desire to teach youth in a bilingual setting"]}'::jsonb,
    sections,
    TRUE
FROM forms
WHERE slug = 'internship'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO form_fields (form_type, section, field_key, label, field_type, options, required, display_order)
SELECT 'internship-vocal', section, field_key, label, field_type, options, required, display_order
FROM form_fields
WHERE form_type = 'internship'
ON CONFLICT (form_type, field_key) DO NOTHING;


-- Completar la instantanea de los envios existentes con la estructura vigente.
-- Los envios nuevos ya la guardan al crearse; esto solo cubre filas anteriores.
UPDATE form_submissions fs
SET form_snapshot = jsonb_build_object(
    'title', f.title,
    'sections', COALESCE(f.sections, '[]'::jsonb),
    'fields', COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
                    'field_key', ff.field_key,
                    'label', ff.label,
                    'field_type', ff.field_type,
                    'section', ff.section,
                    'options', ff.options,
                    'required', ff.required
                ) ORDER BY ff.display_order ASC, ff.field_key ASC)
           FROM form_fields ff
          WHERE ff.form_type = fs.form_type),
        '[]'::jsonb)
)
FROM forms f
WHERE fs.form_type = f.slug
  AND fs.form_snapshot IS NULL;
