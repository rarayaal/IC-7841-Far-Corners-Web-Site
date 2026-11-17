--
-- PostgreSQL database dump
--

\restrict 34UBTCfTNdg3lfVyT8SUpETEup7NT0gkaIJWlGtAK66KM9TOdCnF9r9FhWve5EJ

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    opportunity_id uuid NOT NULL,
    user_id uuid,
    full_name character varying(200) NOT NULL,
    email character varying(254) NOT NULL,
    country character varying(2),
    phone character varying(50),
    motivation text,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    review_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT applications_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'interview'::character varying, 'approved'::character varying, 'rejected'::character varying, 'withdrawn'::character varying])::text[])))
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    action character varying(20) NOT NULL,
    table_name character varying(64) NOT NULL,
    record_id uuid NOT NULL,
    old_values jsonb,
    new_values jsonb,
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT audit_logs_action_check CHECK (((action)::text = ANY ((ARRAY['create'::character varying, 'update'::character varying, 'delete'::character varying])::text[])))
);


--
-- Name: contact_channels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_channels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    channel_type character varying(30) NOT NULL,
    label character varying(200) NOT NULL,
    label_en character varying(200),
    value text NOT NULL,
    value_en text,
    link_url text,
    display_order integer DEFAULT 0 NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT contact_channels_channel_type_check CHECK (((channel_type)::text = ANY ((ARRAY['address'::character varying, 'email'::character varying, 'phone'::character varying, 'whatsapp'::character varying, 'office_hours'::character varying, 'performance_hours'::character varying, 'international_location'::character varying, 'sinpe'::character varying, 'donation_url'::character varying, 'social'::character varying])::text[])))
);


--
-- Name: contact_message_replies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_message_replies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contact_message_id uuid NOT NULL,
    admin_user_id uuid,
    response_text text NOT NULL,
    status character varying(20) DEFAULT 'saved'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sent_at timestamp without time zone,
    CONSTRAINT contact_message_replies_response_text_check CHECK (((char_length(TRIM(BOTH FROM response_text)) > 0) AND (char_length(response_text) <= 10000))),
    CONSTRAINT contact_message_replies_status_check CHECK (((status)::text = ANY ((ARRAY['saved'::character varying, 'sent'::character varying, 'failed'::character varying])::text[]))),
    CONSTRAINT reply_sent_at_check CHECK (((((status)::text = 'sent'::text) AND (sent_at IS NOT NULL)) OR (((status)::text <> 'sent'::text) AND (sent_at IS NULL))))
);


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    email character varying(254) NOT NULL,
    subject character varying(255) NOT NULL,
    message text NOT NULL,
    status character varying(30) DEFAULT 'new'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT contact_messages_status_check CHECK (((status)::text = ANY ((ARRAY['new'::character varying, 'read'::character varying, 'replied'::character varying])::text[])))
);


--
-- Name: donations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.donations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    donor_name character varying(200),
    donor_email character varying(254),
    amount double precision NOT NULL,
    payment_provider character varying(50) NOT NULL,
    transaction_id character varying(255),
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    payment_method character varying(30),
    payment_reference character varying(255),
    verified_by uuid,
    verified_at timestamp with time zone,
    CONSTRAINT donations_currency_check CHECK (((currency)::text ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT donations_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['sinpe'::character varying, 'zeffy'::character varying, 'card'::character varying, 'paypal'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT donations_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))
);


--
-- Name: event_cast; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_cast (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    person_id uuid NOT NULL,
    role character varying(255) NOT NULL,
    role_en character varying(255),
    display_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT event_cast_role_check CHECK ((btrim((role)::text) <> ''::text))
);


--
-- Name: event_performances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_performances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone,
    venue character varying(255) NOT NULL,
    max_capacity integer NOT NULL,
    status character varying(20) DEFAULT 'scheduled'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT event_performances_check CHECK (((ends_at IS NULL) OR (ends_at > starts_at))),
    CONSTRAINT event_performances_max_capacity_check CHECK ((max_capacity > 0)),
    CONSTRAINT event_performances_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'cancelled'::character varying, 'completed'::character varying])::text[])))
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    event_date timestamp without time zone NOT NULL,
    venue character varying(255),
    max_capacity integer NOT NULL,
    poster_url text,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    banner_url text,
    director character varying(255),
    season_year smallint,
    status character varying(20) DEFAULT 'upcoming'::character varying NOT NULL,
    dates_label character varying(255),
    display_order integer DEFAULT 0 NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    CONSTRAINT events_season_year_check CHECK (((season_year >= 1900) AND (season_year <= 9999))),
    CONSTRAINT events_status_check CHECK (((status)::text = ANY ((ARRAY['upcoming'::character varying, 'current'::character varying, 'past'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: form_drafts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_drafts (
    form_type character varying(100) NOT NULL,
    user_id uuid NOT NULL,
    data jsonb NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: form_fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_fields (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    form_type character varying(100) NOT NULL,
    section character varying(100) NOT NULL,
    field_key character varying(100) NOT NULL,
    label character varying(500) NOT NULL,
    field_type character varying(20) NOT NULL,
    options jsonb,
    required boolean DEFAULT false NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT form_fields_field_type_check CHECK (((field_type)::text = ANY ((ARRAY['text'::character varying, 'email'::character varying, 'date'::character varying, 'datetime'::character varying, 'textarea'::character varying, 'select'::character varying, 'radio'::character varying, 'checkbox'::character varying])::text[])))
);


--
-- Name: form_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    form_type character varying(100) NOT NULL,
    opportunity_id character varying(100),
    user_id uuid NOT NULL,
    data jsonb NOT NULL,
    form_snapshot jsonb,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    review_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT form_submissions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'reviewed'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: forms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forms (
    slug character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    sections jsonb,
    title_en character varying(255),
    description text,
    description_en text,
    category character varying(20),
    period character varying(255),
    period_en character varying(255),
    requirements jsonb,
    is_published boolean DEFAULT false NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    image_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT forms_category_check CHECK (((category)::text = ANY ((ARRAY['internship'::character varying, 'volunteer'::character varying, 'camp'::character varying])::text[])))
);


--
-- Name: institutional_content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.institutional_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_slug character varying(191) NOT NULL,
    section character varying(40) NOT NULL,
    language character varying(20) DEFAULT 'es'::character varying NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    updated_by uuid NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    subtitle text,
    cta_label character varying(150),
    cta_target text,
    display_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT institutional_content_section_check CHECK (((section)::text = ANY ((ARRAY['history'::character varying, 'impact'::character varying, 'future'::character varying, 'students'::character varying, 'volunteers'::character varying, 'internships'::character varying, 'communities'::character varying, 'donations'::character varying, 'contact'::character varying, 'hero'::character varying, 'intro'::character varying, 'cta'::character varying, 'camp'::character varying, 'values'::character varying, 'team'::character varying, 'schedule'::character varying, 'payment_instructions'::character varying])::text[])))
);


--
-- Name: media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    filename character varying(255) NOT NULL,
    url text NOT NULL,
    alt_text text,
    project_id uuid,
    event_id uuid,
    content_id uuid,
    uploaded_by uuid NOT NULL,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT media_exactly_one_association CHECK ((((
CASE
    WHEN (project_id IS NOT NULL) THEN 1
    ELSE 0
END +
CASE
    WHEN (event_id IS NOT NULL) THEN 1
    ELSE 0
END) +
CASE
    WHEN (content_id IS NOT NULL) THEN 1
    ELSE 0
END) = 1))
);


--
-- Name: newsletter_subscribers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_subscribers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(254) NOT NULL,
    mailchimp_id character varying(255),
    status character varying(30) DEFAULT 'subscribed'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT newsletter_subscribers_status_check CHECK (((status)::text = ANY ((ARRAY['subscribed'::character varying, 'unsubscribed'::character varying])::text[])))
);


--
-- Name: opportunities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opportunities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    type character varying(30) NOT NULL,
    participation_mode character varying(20),
    title character varying(255) NOT NULL,
    title_en character varying(255),
    description text NOT NULL,
    description_en text,
    period_label character varying(200),
    period_label_en character varying(200),
    starts_on date,
    ends_on date,
    application_deadline timestamp with time zone,
    location character varying(255),
    image_url text,
    min_age smallint,
    max_age smallint,
    scholarships_available boolean DEFAULT false NOT NULL,
    scholarship_percentage numeric(5,2),
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT opportunities_check CHECK (((ends_on IS NULL) OR (starts_on IS NULL) OR (ends_on >= starts_on))),
    CONSTRAINT opportunities_check1 CHECK (((min_age IS NULL) OR (max_age IS NULL) OR (max_age >= min_age))),
    CONSTRAINT opportunities_max_age_check CHECK ((max_age >= 0)),
    CONSTRAINT opportunities_min_age_check CHECK ((min_age >= 0)),
    CONSTRAINT opportunities_participation_mode_check CHECK (((participation_mode)::text = ANY ((ARRAY['onsite'::character varying, 'remote'::character varying, 'hybrid'::character varying])::text[]))),
    CONSTRAINT opportunities_scholarship_percentage_check CHECK (((scholarship_percentage >= (0)::numeric) AND (scholarship_percentage <= (100)::numeric))),
    CONSTRAINT opportunities_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'open'::character varying, 'closed'::character varying, 'archived'::character varying])::text[]))),
    CONSTRAINT opportunities_type_check CHECK (((type)::text = ANY ((ARRAY['camp'::character varying, 'internship'::character varying, 'volunteer'::character varying])::text[])))
);


--
-- Name: opportunity_features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opportunity_features (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    opportunity_id uuid NOT NULL,
    description text NOT NULL,
    description_en text,
    display_order integer DEFAULT 0 NOT NULL
);


--
-- Name: opportunity_requirements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opportunity_requirements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    opportunity_id uuid NOT NULL,
    description text NOT NULL,
    description_en text,
    display_order integer DEFAULT 0 NOT NULL
);


--
-- Name: organization_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(100) NOT NULL,
    display_value character varying(100) NOT NULL,
    label character varying(200) NOT NULL,
    label_en character varying(200),
    reference_year smallint,
    display_order integer DEFAULT 0 NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT organization_metrics_reference_year_check CHECK (((reference_year >= 1900) AND (reference_year <= 9999)))
);


--
-- Name: organization_team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    person_id uuid NOT NULL,
    role character varying(200) NOT NULL,
    role_en character varying(200),
    team_group character varying(100),
    display_order integer DEFAULT 0 NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: organization_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_values (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(150) NOT NULL,
    title_en character varying(150),
    description text NOT NULL,
    description_en text,
    icon_key character varying(50),
    display_order integer DEFAULT 0 NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: people; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.people (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying(200) NOT NULL,
    photo_url text,
    biography text,
    biography_en text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT people_full_name_check CHECK ((btrim((full_name)::text) <> ''::text))
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(100) NOT NULL,
    description text NOT NULL
);


--
-- Name: project_impact_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_impact_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    metric_text text NOT NULL,
    metric_text_en text,
    display_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT project_impact_metrics_metric_text_check CHECK ((btrim(metric_text) <> ''::text))
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    country character varying(2),
    image_url text,
    display_order integer DEFAULT 0 NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    project_year smallint,
    participants_count integer,
    CONSTRAINT projects_participants_count_check CHECK ((participants_count >= 0)),
    CONSTRAINT projects_project_year_check CHECK (((project_year >= 1900) AND (project_year <= 9999)))
);


--
-- Name: purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    event_id uuid NOT NULL,
    total_amount double precision NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    payment_intent_id character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    currency character varying(3) DEFAULT 'CRC'::character varying NOT NULL,
    buyer_name character varying(200),
    buyer_email character varying(254),
    CONSTRAINT purchases_currency_check CHECK (((currency)::text ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT purchases_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'failed'::character varying, 'refunded'::character varying])::text[])))
);


--
-- Name: ticket_inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_inventory (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    ticket_type character varying(100) NOT NULL,
    price double precision NOT NULL,
    quantity_available integer DEFAULT 0 NOT NULL,
    quantity_sold integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    performance_id uuid,
    ticket_type_en character varying(100),
    currency character varying(3) DEFAULT 'CRC'::character varying NOT NULL,
    CONSTRAINT ticket_inventory_currency_check CHECK (((currency)::text ~ '^[A-Z]{3}$'::text))
);


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    purchase_id uuid NOT NULL,
    ticket_inventory_id uuid NOT NULL,
    qr_code character varying(255) NOT NULL,
    status character varying(30) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT tickets_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'used'::character varying, 'refunded'::character varying])::text[])))
);


--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_permissions (
    user_id uuid NOT NULL,
    permission_id uuid NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying(200) NOT NULL,
    email character varying(254) NOT NULL,
    password_hash character varying(255),
    role character varying(30) DEFAULT 'user'::character varying NOT NULL,
    participant_type character varying(40),
    status character varying(30) DEFAULT 'active'::character varying NOT NULL,
    google_id character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT users_authentication_required CHECK (((NULLIF(TRIM(BOTH FROM password_hash), ''::text) IS NOT NULL) OR (NULLIF(TRIM(BOTH FROM google_id), ''::text) IS NOT NULL))),
    CONSTRAINT users_participant_type_check CHECK (((participant_type)::text = ANY ((ARRAY['international_student'::character varying, 'volunteer'::character varying, 'intern'::character varying])::text[]))),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying, 'visitor'::character varying, 'user'::character varying])::text[]))),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.applications (id, opportunity_id, user_id, full_name, email, country, phone, motivation, status, reviewed_by, reviewed_at, review_notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, ip_address, created_at) FROM stdin;
\.


--
-- Data for Name: contact_channels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contact_channels (id, channel_type, label, label_en, value, value_en, link_url, display_order, is_published, created_at, updated_at) FROM stdin;
0e30b947-e2ad-4c2c-b46f-b7ccbaa80e8f	office_hours	Horario de Taquilla y Oficina	\N	Lunes a Viernes: 9:00 AM – 5:00 PM	\N	\N	5	t	2026-10-19 06:31:48.062735	2026-10-19 06:31:48.062735
c2cfc0db-36bc-4fa5-9c04-b6daaee0bbec	performance_hours	Horario durante funciones	\N	Días de función: Abierto hasta el inicio de la obra	\N	\N	6	t	2026-10-19 06:31:48.062735	2026-10-19 06:31:48.062735
4b8f8ea1-dbb2-451c-a45c-c4efba9504cf	international_location	Ubicación Internacional	\N	Programas activos en Costa Rica (Monteverde), China y Mozambique.	\N	\N	7	t	2026-10-19 06:31:48.062735	2026-10-19 06:31:48.062735
8f3a3ae4-1fd6-455e-b6c4-3d444e71dca6	email	Correo Institucional	\N	info@farcornersmusicals.org	\N	mailto:info@farcornersmusicals.org	2	t	2026-10-19 06:31:48.062735	2026-10-19 07:02:49.349788
87885f55-503c-478c-98e9-d48fd0b5e003	address	Sede Central y Teatro	\N	Monteverde, Puntarenas, Costa Rica (Cerca de la Reserva Biológica Monteverde)	\N	\N	1	t	2026-10-19 06:31:48.062735	2026-10-27 00:22:51.297492
19b6dbe9-de3a-4ced-a80a-5e0fea4cd910	whatsapp	WhatsApp	\N	+506 8888-9999 ddddd	\N	https://wa.me/50688889999	4	t	2026-10-19 06:31:48.062735	2026-10-27 00:22:59.04594
606cc69d-fe29-4e34-8c82-ce179225ca0c	phone	Teléfono	\N	+506 2645-5000	\N	tel:+50626455000	3	t	2026-10-19 06:31:48.062735	2026-11-17 00:43:51.154418
\.


--
-- Data for Name: contact_message_replies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contact_message_replies (id, contact_message_id, admin_user_id, response_text, status, created_at, sent_at) FROM stdin;
75955ec1-8261-427a-8069-1ff83cdd5623	fcfefcf5-09ac-4106-b380-a96f744fce1c	6cae0d90-7aed-4e71-a8ad-dfb3b1338054	Hola.	saved	2026-10-19 04:49:25.639695	\N
bccf1e74-8090-4a9f-bc72-0b3aa1a63b03	aa2a025e-0182-43a0-a295-8e91443b7271	6cae0d90-7aed-4e71-a8ad-dfb3b1338054	Adiós	saved	2026-10-19 05:03:48.031382	\N
ac85a546-9368-4368-902c-e0c123f180c9	d03e4ddb-a46d-4f2f-9923-22ff5655b80f	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	Prueba	sent	2026-10-29 05:32:40.142218	2026-10-29 05:32:42.002718
8d70dbfe-c324-4d6c-b4c7-c218f12f8ea4	d03e4ddb-a46d-4f2f-9923-22ff5655b80f	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	asad	sent	2026-10-29 05:34:00.620265	2026-10-29 05:34:02.176481
501bfccd-7dbb-4e5f-9bcb-c24b36d0da42	d03e4ddb-a46d-4f2f-9923-22ff5655b80f	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	JDSAODJASO	sent	2026-10-29 05:35:03.188616	2026-10-29 05:35:04.944658
81350454-ebfb-482a-a882-6988d12acd6c	d03e4ddb-a46d-4f2f-9923-22ff5655b80f	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	aaaaaaaaa	sent	2026-10-29 05:39:09.951458	2026-10-29 05:39:11.707358
60818a81-56eb-451c-be5e-d851d938ba1f	d03e4ddb-a46d-4f2f-9923-22ff5655b80f	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	lolololo	sent	2026-10-29 05:41:17.741383	2026-10-29 05:41:19.238692
0aab8d6f-3534-41f0-8f10-89d5abddaee5	ae52664a-c91d-4a15-8615-2b3e09f68eb6	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	Adios	sent	2026-10-30 05:06:25.221725	2026-10-30 05:06:26.964965
acaeca98-1e7f-42ad-9bb6-fc2899644f07	ae52664a-c91d-4a15-8615-2b3e09f68eb6	6cae0d90-7aed-4e71-a8ad-dfb3b1338054	Pruebas	sent	2026-11-17 00:42:21.797459	2026-11-17 00:42:23.078706
\.


--
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contact_messages (id, name, email, subject, message, status, created_at) FROM stdin;
aa2a025e-0182-43a0-a295-8e91443b7271	Marcelo Gómez Cordero	gomez.marcelo00@hotmail.com	Hola	Adiós	new	2026-10-19 03:53:57.085658
fcfefcf5-09ac-4106-b380-a96f744fce1c	Marcelo Gómez	gomez.marcelo00@hotmail.com	Hola	Adiós	new	2026-10-19 03:57:09.148591
d364d4f8-0716-4cf5-94fd-5768dfda17b9	sads	marcelo20074@gmail.com	dsadasd	dasdasda	new	2026-10-19 07:15:13.029164
74c087b4-44d4-454c-b850-2b7b155e6aa6	ahsdasd	marceloysebastian0@gmail.com	asdsa	dasdasdasd	new	2026-10-20 23:50:10.894531
b1f90e0c-9003-48f4-89c0-5d2494f81888	Mariano	mariano@gmail.com	HOLA	HOLA	new	2026-10-27 00:29:28.429151
d03e4ddb-a46d-4f2f-9923-22ff5655b80f	Marcelo GC	marcelo20074@gmail.com	Prueba	Prueba	replied	2026-10-29 05:31:52.943748
ae52664a-c91d-4a15-8615-2b3e09f68eb6	hoal	marcelo20074@gmail.com	asjdasjd	Hola	replied	2026-10-30 05:05:47.09162
\.


--
-- Data for Name: donations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.donations (id, donor_name, donor_email, amount, payment_provider, transaction_id, status, message, created_at, currency, payment_method, payment_reference, verified_by, verified_at) FROM stdin;
\.


--
-- Data for Name: event_cast; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_cast (id, event_id, person_id, role, role_en, display_order) FROM stdin;
\.


--
-- Data for Name: event_performances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_performances (id, event_id, starts_at, ends_at, venue, max_capacity, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.events (id, title, description, event_date, venue, max_capacity, poster_url, is_published, created_at, updated_at, banner_url, director, season_year, status, dates_label, display_order, is_featured) FROM stdin;
\.


--
-- Data for Name: form_drafts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.form_drafts (form_type, user_id, data, updated_at) FROM stdin;
\.


--
-- Data for Name: form_fields; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.form_fields (id, form_type, section, field_key, label, field_type, options, required, display_order, created_at, updated_at) FROM stdin;
25a9d79e-e4bb-4057-bd8a-24569346cf11	prueba-idioma-voluntariado	Personal information	full_name	What is your full name?	text	\N	t	1	2026-11-15 23:27:59.197017	2026-11-15 23:27:59.197017
ce59412b-6d79-48b2-8394-ff5bc19f1d6e	prueba-idioma-voluntariado	Personal information	email	What is your email address?	email	\N	t	2	2026-11-15 23:27:59.197017	2026-11-15 23:27:59.197017
6e8fb376-f329-46d0-bf70-b960fbd7c2f1	prueba-idioma-voluntariado	Participation	availability	When are you available?	select	["Weekdays", "Weekends"]	t	3	2026-11-15 23:27:59.197017	2026-11-15 23:27:59.197017
823594b7-431b-4bee-9438-4de40a9f71ab	prueba-idioma-voluntariado	Participation	motivation	Why would you like to volunteer with our community theatre?	textarea	\N	f	4	2026-11-15 23:27:59.197017	2026-11-15 23:27:59.197017
\.


--
-- Data for Name: form_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.form_submissions (id, form_type, opportunity_id, user_id, data, form_snapshot, status, reviewed_by, reviewed_at, review_notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: forms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.forms (slug, title, sections, title_en, description, description_en, category, period, period_en, requirements, is_published, is_featured, image_url, created_at, updated_at) FROM stdin;
prueba-idioma-voluntariado	[PRUEBA] Voluntariado de teatro comunitario	\N	\N	Buscamos personas que deseen colaborar con actividades de teatro para nuestra comunidad.	\N	volunteer	Horario flexible durante la semana	\N	{"es": ["Interes en el teatro y el trabajo en equipo"]}	t	f	\N	2026-11-15 23:27:59.197017	2026-11-15 23:27:59.197017
\.


--
-- Data for Name: institutional_content; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.institutional_content (id, page_slug, section, language, title, content, is_published, updated_by, updated_at, subtitle, cta_label, cta_target, display_order) FROM stdin;
\.


--
-- Data for Name: media; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.media (id, filename, url, alt_text, project_id, event_id, content_id, uploaded_by, uploaded_at) FROM stdin;
\.


--
-- Data for Name: newsletter_subscribers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.newsletter_subscribers (id, email, mailchimp_id, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: opportunities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.opportunities (id, project_id, type, participation_mode, title, title_en, description, description_en, period_label, period_label_en, starts_on, ends_on, application_deadline, location, image_url, min_age, max_age, scholarships_available, scholarship_percentage, status, is_published, is_featured, display_order, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: opportunity_features; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.opportunity_features (id, opportunity_id, description, description_en, display_order) FROM stdin;
\.


--
-- Data for Name: opportunity_requirements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.opportunity_requirements (id, opportunity_id, description, description_en, display_order) FROM stdin;
\.


--
-- Data for Name: organization_metrics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organization_metrics (id, code, display_value, label, label_en, reference_year, display_order, is_published, updated_at) FROM stdin;
\.


--
-- Data for Name: organization_team_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organization_team_members (id, person_id, role, role_en, team_group, display_order, is_published, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: organization_values; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organization_values (id, title, title_en, description, description_en, icon_key, display_order, is_published, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: people; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.people (id, full_name, photo_url, biography, biography_en, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, code, description) FROM stdin;
11111111-1111-1111-1111-111111110001	users:manage	Gestionar usuarios y administradores
11111111-1111-1111-1111-111111110002	roles:manage	Gestionar roles y permisos del sistema
11111111-1111-1111-1111-111111110003	audit:read	Consultar la bitacora de auditoria del sistema
11111111-1111-1111-1111-111111110004	content:manage	Gestionar contenido institucional e impacto
11111111-1111-1111-1111-111111110005	projects:manage	Gestionar catalogo de proyectos teatrales
11111111-1111-1111-1111-111111110006	events:manage	Gestionar eventos y cartelera
11111111-1111-1111-1111-111111110007	tickets:manage	Gestionar inventario y precios de boleteria
11111111-1111-1111-1111-111111110008	donations:manage	Gestionar donaciones e informacion financiera
11111111-1111-1111-1111-111111110009	community:manage	Gestionar programas de voluntarios y estudiantes
11111111-1111-1111-1111-111111110010	media:manage	Gestionar galeria multimedia y almacenamiento
11111111-1111-1111-1111-111111110011	contact_channels:manage	Consultar y editar los medios de contacto
11111111-1111-1111-1111-111111110012	contact_messages:read	Consultar mensajes de contacto
11111111-1111-1111-1111-111111110013	contact_messages:reply	Responder mensajes de contacto
11111111-1111-1111-1111-111111110014	newsletter:read	Consultar contactos y suscripciones del boletín
\.


--
-- Data for Name: project_impact_metrics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project_impact_metrics (id, project_id, metric_text, metric_text_en, display_order) FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (id, title, description, country, image_url, display_order, is_published, created_at, updated_at, project_year, participants_count) FROM stdin;
1a2ec430-5549-4ba7-a2cc-c2b3bfacb177	Proyecto de Prueba	Essto es un proyecto de prueba.	CR	\N	0	t	2026-11-16 01:31:21.832546	2026-11-16 01:31:21.832546	2026	12
\.


--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchases (id, user_id, event_id, total_amount, status, payment_intent_id, created_at, updated_at, currency, buyer_name, buyer_email) FROM stdin;
\.


--
-- Data for Name: ticket_inventory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ticket_inventory (id, event_id, ticket_type, price, quantity_available, quantity_sold, created_at, performance_id, ticket_type_en, currency) FROM stdin;
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tickets (id, purchase_id, ticket_inventory_id, qr_code, status, created_at) FROM stdin;
\.


--
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_permissions (user_id, permission_id) FROM stdin;
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	11111111-1111-1111-1111-111111110001
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	11111111-1111-1111-1111-111111110002
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	11111111-1111-1111-1111-111111110003
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	11111111-1111-1111-1111-111111110004
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	11111111-1111-1111-1111-111111110005
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	11111111-1111-1111-1111-111111110006
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	11111111-1111-1111-1111-111111110007
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	11111111-1111-1111-1111-111111110008
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	11111111-1111-1111-1111-111111110009
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	11111111-1111-1111-1111-111111110010
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	11111111-1111-1111-1111-111111110011
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	11111111-1111-1111-1111-111111110012
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	11111111-1111-1111-1111-111111110013
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, full_name, email, password_hash, role, participant_type, status, google_id, created_at, updated_at) FROM stdin;
6cae0d90-7aed-4e71-a8ad-dfb3b1338054	Marcelo Gómez Cordero	marcelo20074@gmail.com	$argon2id$v=19$m=65536,p=4,t=3$ITWnnYsfB4vCqpUBue34Pg$EMqnsKUy8LtOfZDbe4ezkvlenO0XfEUg4q23QVeC47s	admin	\N	active	\N	2026-10-16 06:44:09.556141	2026-10-16 07:34:31.348673
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	Administrador General Far Cornersdd	admin@farcornerscr.org	$2b$12$tCIZuiLE8m5WKsu39TJdmeLliZmMWnPDsuQXo8aevwtW98XgtOFOW	admin	\N	active	\N	2026-10-21 06:09:06.532988	2026-10-26 05:41:04.637048
515cf4be-3b51-4988-9090-114c61b04a81	Hdasjo	dajsdaosj@gmail.com	$2b$12$dnTNtr13QmP3aXqo/ATQJuA1bUEPiKyCtivmgQ1xHR3KL9j/32G9m	visitor	\N	active	\N	2026-11-05 04:48:55.960262	2026-11-05 04:48:55.960262
3b864493-94e4-487f-9da6-d6a5e69082da	Marcelo	mar_gomez@estudiantec.cr	$argon2id$v=19$m=65536,t=3,p=4$1sHkkadXttcWRR74GEywgg$h1Nib1HLEQeNuXdYpuA6xZsT5dWTexUC3ho/tn4ThgQ	visitor	\N	active	\N	2026-10-26 05:32:14.675413	2026-11-10 05:52:49.50239
95c6f6ea-bbf7-4e2e-8b39-4e68d6993ad9	Marcelo Gómez Cordero	gomez.marcelo00@hotmail.com	$argon2id$v=19$m=65536,t=3,p=4$dxnJLxYuTtEyjaJaYPyo4Q$mJqUWvrw468l8lnmb0q+a7tzrdNvqxFaSfoP87bwjW8	user	\N	active	\N	2026-11-10 05:53:16.779236	2026-11-10 05:53:16.779236
\.


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: contact_channels contact_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_channels
    ADD CONSTRAINT contact_channels_pkey PRIMARY KEY (id);


--
-- Name: contact_message_replies contact_message_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_message_replies
    ADD CONSTRAINT contact_message_replies_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: donations donations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_pkey PRIMARY KEY (id);


--
-- Name: donations donations_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_transaction_id_key UNIQUE (transaction_id);


--
-- Name: event_cast event_cast_event_id_person_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_cast
    ADD CONSTRAINT event_cast_event_id_person_id_role_key UNIQUE (event_id, person_id, role);


--
-- Name: event_cast event_cast_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_cast
    ADD CONSTRAINT event_cast_pkey PRIMARY KEY (id);


--
-- Name: event_performances event_performances_id_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_performances
    ADD CONSTRAINT event_performances_id_event_id_key UNIQUE (id, event_id);


--
-- Name: event_performances event_performances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_performances
    ADD CONSTRAINT event_performances_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: form_drafts form_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_drafts
    ADD CONSTRAINT form_drafts_pkey PRIMARY KEY (form_type, user_id);


--
-- Name: form_fields form_fields_form_type_field_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_fields
    ADD CONSTRAINT form_fields_form_type_field_key_key UNIQUE (form_type, field_key);


--
-- Name: form_fields form_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_fields
    ADD CONSTRAINT form_fields_pkey PRIMARY KEY (id);


--
-- Name: form_submissions form_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submissions
    ADD CONSTRAINT form_submissions_pkey PRIMARY KEY (id);


--
-- Name: forms forms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forms
    ADD CONSTRAINT forms_pkey PRIMARY KEY (slug);


--
-- Name: institutional_content institutional_content_page_section_language_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institutional_content
    ADD CONSTRAINT institutional_content_page_section_language_unique UNIQUE (page_slug, section, language);


--
-- Name: institutional_content institutional_content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institutional_content
    ADD CONSTRAINT institutional_content_pkey PRIMARY KEY (id);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);


--
-- Name: newsletter_subscribers newsletter_subscribers_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_email_key UNIQUE (email);


--
-- Name: newsletter_subscribers newsletter_subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id);


--
-- Name: opportunities opportunities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_pkey PRIMARY KEY (id);


--
-- Name: opportunity_features opportunity_features_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_features
    ADD CONSTRAINT opportunity_features_pkey PRIMARY KEY (id);


--
-- Name: opportunity_requirements opportunity_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_requirements
    ADD CONSTRAINT opportunity_requirements_pkey PRIMARY KEY (id);


--
-- Name: organization_metrics organization_metrics_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_metrics
    ADD CONSTRAINT organization_metrics_code_key UNIQUE (code);


--
-- Name: organization_metrics organization_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_metrics
    ADD CONSTRAINT organization_metrics_pkey PRIMARY KEY (id);


--
-- Name: organization_team_members organization_team_members_person_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_team_members
    ADD CONSTRAINT organization_team_members_person_id_role_key UNIQUE (person_id, role);


--
-- Name: organization_team_members organization_team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_team_members
    ADD CONSTRAINT organization_team_members_pkey PRIMARY KEY (id);


--
-- Name: organization_values organization_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_values
    ADD CONSTRAINT organization_values_pkey PRIMARY KEY (id);


--
-- Name: people people_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.people
    ADD CONSTRAINT people_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_code_key UNIQUE (code);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: project_impact_metrics project_impact_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_impact_metrics
    ADD CONSTRAINT project_impact_metrics_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: purchases purchases_payment_intent_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_payment_intent_id_key UNIQUE (payment_intent_id);


--
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);


--
-- Name: ticket_inventory ticket_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_inventory
    ADD CONSTRAINT ticket_inventory_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_qr_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_qr_code_key UNIQUE (qr_code);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (user_id, permission_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: applications_opportunity_email_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX applications_opportunity_email_unique ON public.applications USING btree (opportunity_id, lower(btrim((email)::text)));


--
-- Name: applications_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX applications_status_idx ON public.applications USING btree (status, created_at);


--
-- Name: applications_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX applications_user_idx ON public.applications USING btree (user_id);


--
-- Name: audit_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_date_idx ON public.audit_logs USING btree (created_at);


--
-- Name: cast_event_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cast_event_order_idx ON public.event_cast USING btree (event_id, display_order);


--
-- Name: cast_person_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cast_person_idx ON public.event_cast USING btree (person_id);


--
-- Name: donations_status_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX donations_status_date_idx ON public.donations USING btree (status, created_at);


--
-- Name: events_public_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX events_public_status_idx ON public.events USING btree (status, display_order) WHERE is_published;


--
-- Name: features_opportunity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX features_opportunity_idx ON public.opportunity_features USING btree (opportunity_id, display_order);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_contact_message_replies_message; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_message_replies_message ON public.contact_message_replies USING btree (contact_message_id);


--
-- Name: idx_form_drafts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_drafts_user ON public.form_drafts USING btree (user_id);


--
-- Name: idx_form_fields_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_fields_type ON public.form_fields USING btree (form_type);


--
-- Name: idx_form_submissions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_submissions_type ON public.form_submissions USING btree (form_type);


--
-- Name: idx_form_submissions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_submissions_user ON public.form_submissions USING btree (user_id);


--
-- Name: idx_user_permissions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_permissions_user_id ON public.user_permissions USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: impact_project_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX impact_project_order_idx ON public.project_impact_metrics USING btree (project_id, display_order);


--
-- Name: inventory_event_performance_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX inventory_event_performance_idx ON public.ticket_inventory USING btree (event_id, performance_id);


--
-- Name: opportunities_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX opportunities_project_idx ON public.opportunities USING btree (project_id);


--
-- Name: performances_event_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX performances_event_date_idx ON public.event_performances USING btree (event_id, starts_at);


--
-- Name: projects_public_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX projects_public_order_idx ON public.projects USING btree (display_order) WHERE is_published;


--
-- Name: purchases_event_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX purchases_event_status_idx ON public.purchases USING btree (event_id, status);


--
-- Name: requirements_opportunity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX requirements_opportunity_idx ON public.opportunity_requirements USING btree (opportunity_id, display_order);


--
-- Name: team_person_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX team_person_idx ON public.organization_team_members USING btree (person_id);


--
-- Name: tickets_inventory_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_inventory_idx ON public.tickets USING btree (ticket_inventory_id);


--
-- Name: tickets_purchase_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_purchase_idx ON public.tickets USING btree (purchase_id);


--
-- Name: applications update_applications_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_applications_modtime BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contact_channels update_channels_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_channels_modtime BEFORE UPDATE ON public.contact_channels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: events update_events_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_events_modtime BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: institutional_content update_institutional_content_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_institutional_content_modtime BEFORE UPDATE ON public.institutional_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: organization_metrics update_metrics_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_metrics_modtime BEFORE UPDATE ON public.organization_metrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: newsletter_subscribers update_newsletter_subscribers_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_newsletter_subscribers_modtime BEFORE UPDATE ON public.newsletter_subscribers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: opportunities update_opportunities_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_opportunities_modtime BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: people update_people_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_people_modtime BEFORE UPDATE ON public.people FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: event_performances update_performances_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_performances_modtime BEFORE UPDATE ON public.event_performances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projects update_projects_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: purchases update_purchases_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_purchases_modtime BEFORE UPDATE ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: organization_team_members update_team_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_team_modtime BEFORE UPDATE ON public.organization_team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: organization_values update_values_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_values_modtime BEFORE UPDATE ON public.organization_values FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: applications applications_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id);


--
-- Name: applications applications_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: applications applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: contact_message_replies contact_message_replies_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_message_replies
    ADD CONSTRAINT contact_message_replies_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: contact_message_replies contact_message_replies_contact_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_message_replies
    ADD CONSTRAINT contact_message_replies_contact_message_id_fkey FOREIGN KEY (contact_message_id) REFERENCES public.contact_messages(id);


--
-- Name: donations donations_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- Name: event_cast event_cast_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_cast
    ADD CONSTRAINT event_cast_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_cast event_cast_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_cast
    ADD CONSTRAINT event_cast_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(id);


--
-- Name: event_performances event_performances_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_performances
    ADD CONSTRAINT event_performances_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: form_drafts form_drafts_form_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_drafts
    ADD CONSTRAINT form_drafts_form_type_fkey FOREIGN KEY (form_type) REFERENCES public.forms(slug) ON DELETE CASCADE;


--
-- Name: form_drafts form_drafts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_drafts
    ADD CONSTRAINT form_drafts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: form_fields form_fields_form_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_fields
    ADD CONSTRAINT form_fields_form_type_fkey FOREIGN KEY (form_type) REFERENCES public.forms(slug) ON DELETE CASCADE;


--
-- Name: form_submissions form_submissions_form_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submissions
    ADD CONSTRAINT form_submissions_form_type_fkey FOREIGN KEY (form_type) REFERENCES public.forms(slug) ON DELETE CASCADE;


--
-- Name: form_submissions form_submissions_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submissions
    ADD CONSTRAINT form_submissions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: form_submissions form_submissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submissions
    ADD CONSTRAINT form_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: institutional_content institutional_content_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institutional_content
    ADD CONSTRAINT institutional_content_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: ticket_inventory inventory_performance_same_event_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_inventory
    ADD CONSTRAINT inventory_performance_same_event_fk FOREIGN KEY (performance_id, event_id) REFERENCES public.event_performances(id, event_id);


--
-- Name: media media_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.institutional_content(id);


--
-- Name: media media_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: media media_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: media media_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: opportunities opportunities_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: opportunity_features opportunity_features_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_features
    ADD CONSTRAINT opportunity_features_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE CASCADE;


--
-- Name: opportunity_requirements opportunity_requirements_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_requirements
    ADD CONSTRAINT opportunity_requirements_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE CASCADE;


--
-- Name: organization_team_members organization_team_members_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_team_members
    ADD CONSTRAINT organization_team_members_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(id);


--
-- Name: project_impact_metrics project_impact_metrics_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_impact_metrics
    ADD CONSTRAINT project_impact_metrics_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: purchases purchases_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: purchases purchases_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: ticket_inventory ticket_inventory_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_inventory
    ADD CONSTRAINT ticket_inventory_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: tickets tickets_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id);


--
-- Name: tickets tickets_ticket_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_ticket_inventory_id_fkey FOREIGN KEY (ticket_inventory_id) REFERENCES public.ticket_inventory(id);


--
-- Name: user_permissions user_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: user_permissions user_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 34UBTCfTNdg3lfVyT8SUpETEup7NT0gkaIJWlGtAK66KM9TOdCnF9r9FhWve5EJ

