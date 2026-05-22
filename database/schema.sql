--
-- PostgreSQL database dump
--

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

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
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: enum_dispositivos_zona_radiologica; Type: TYPE; Schema: public; Owner: tfg_user
--

CREATE TYPE public.enum_dispositivos_zona_radiologica AS ENUM (
    'LIBRE_PASO',
    'VIGILADA',
    'CONTROLADA',
    'CONTROLADA_LIMITADA',
    'CONTROLADA_REGLAMENTADA',
    'ACCESO_PROHIBIDO'
);


ALTER TYPE public.enum_dispositivos_zona_radiologica OWNER TO tfg_user;

--
-- Name: enum_instalaciones_tipo_instalacion; Type: TYPE; Schema: public; Owner: tfg_user
--

CREATE TYPE public.enum_instalaciones_tipo_instalacion AS ENUM (
    'IRA',
    'IRD'
);


ALTER TYPE public.enum_instalaciones_tipo_instalacion OWNER TO tfg_user;

--
-- Name: enum_usuarios_role; Type: TYPE; Schema: public; Owner: tfg_user
--

CREATE TYPE public.enum_usuarios_role AS ENUM (
    'ADMIN',
    'RESPONSABLE',
    'TITULAR'
);


ALTER TYPE public.enum_usuarios_role OWNER TO tfg_user;

--
-- Name: actualizar_updated_at(); Type: FUNCTION; Schema: public; Owner: tfg_user
--

CREATE FUNCTION public.actualizar_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_updated_at() OWNER TO tfg_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alertas_config; Type: TABLE; Schema: public; Owner: tfg_user
--

CREATE TABLE public.alertas_config (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    instalacion_id uuid,
    tipo character varying(50) NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    campo character varying(50) NOT NULL,
    operador character varying(10) NOT NULL,
    umbral double precision,
    emails_destino text[],
    mensaje_personalizado text,
    activa boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.alertas_config OWNER TO tfg_user;

COMMENT ON TABLE public.alertas_config IS 'Configuración de alertas por instalación';


--
-- Name: alertas_historial; Type: TABLE; Schema: public; Owner: tfg_user
--

CREATE TABLE public.alertas_historial (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    alerta_config_id uuid,
    dispositivo_id uuid,
    instalacion_id uuid,
    tipo character varying(50) NOT NULL,
    valor_detectado double precision,
    umbral_configurado double precision,
    mensaje text,
    email_enviado boolean DEFAULT false,
    email_error text,
    destinatarios text[],
    fecha_disparo timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_email timestamp without time zone
);


ALTER TABLE public.alertas_historial OWNER TO tfg_user;

COMMENT ON TABLE public.alertas_historial IS 'Histórico de alertas disparadas';


--
-- Name: config_email; Type: TABLE; Schema: public; Owner: tfg_user
--

CREATE TABLE public.config_email (
    id integer NOT NULL,
    smtp_host character varying(100) NOT NULL,
    smtp_port integer NOT NULL,
    smtp_user character varying(100) NOT NULL,
    smtp_pass character varying(100) NOT NULL,
    smtp_secure boolean DEFAULT false,
    activo boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT now(),
    nombre character varying(100)
);


ALTER TABLE public.config_email OWNER TO tfg_user;

--
-- Name: config_email_id_seq; Type: SEQUENCE; Schema: public; Owner: tfg_user
--

CREATE SEQUENCE public.config_email_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.config_email_id_seq OWNER TO tfg_user;

ALTER SEQUENCE public.config_email_id_seq OWNED BY public.config_email.id;

ALTER TABLE ONLY public.config_email ALTER COLUMN id SET DEFAULT nextval('public.config_email_id_seq'::regclass);


--
-- Name: dispositivos; Type: TABLE; Schema: public; Owner: tfg_user
--

CREATE TABLE public.dispositivos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    mac_address character varying(17) NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    instalacion_id uuid,
    hw_version character varying(20),
    fw_version character varying(20),
    activo boolean DEFAULT true,
    ultima_conexion timestamp without time zone,
    ultima_ip character varying(15),
    fecha_instalacion date,
    notas text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    latitud numeric(10,7),
    longitud numeric(10,7),
    altura numeric(8,2),
    nivel_bateria integer,
    titular_id uuid,
    ip_registro character varying(45),
    fecha_caducidad_ip date,
    -- Bloque 1: Identificación del equipo de medición
    marca_comercial character varying(100),
    modelo_electronica character varying(100),
    num_serie_electronica character varying(100),
    num_serie_sonda character varying(100),
    tipo_detector character varying(100),
    -- Bloque 2: Calibración y verificación
    calibrado boolean DEFAULT false NOT NULL,
    fecha_ultima_calibracion date,
    fecha_proxima_calibracion date,
    verificacion_periodica boolean DEFAULT false NOT NULL,
    periodicidad_verificacion character varying(50),
    -- Bloque 3: Medida en continuo
    medida_continuo boolean DEFAULT false NOT NULL,
    unidades_medida character varying(20) DEFAULT 'µSv/h'::character varying,
    factor_correccion numeric(10,6) DEFAULT 1.0,
    zona_radiologica public.enum_dispositivos_zona_radiologica
);


ALTER TABLE public.dispositivos OWNER TO tfg_user;

COMMENT ON TABLE public.dispositivos IS 'Dispositivos IoT registrados';


--
-- Name: informes; Type: TABLE; Schema: public; Owner: tfg_user
--

CREATE TABLE public.informes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    instalacion_id uuid,
    mes integer NOT NULL,
    anio integer NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    ruta_pdf text,
    tamano_bytes bigint,
    generado boolean DEFAULT false,
    email_enviado boolean DEFAULT false,
    email_destinatarios text[],
    fecha_generacion timestamp without time zone,
    fecha_envio_email timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT informes_anio_check CHECK (((anio >= 2020) AND (anio <= 2100))),
    CONSTRAINT informes_mes_check CHECK (((mes >= 1) AND (mes <= 12)))
);


ALTER TABLE public.informes OWNER TO tfg_user;

COMMENT ON TABLE public.informes IS 'Informes PDF generados mensualmente';


--
-- Name: instalaciones; Type: TABLE; Schema: public; Owner: tfg_user
--

CREATE TABLE public.instalaciones (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nombre character varying(100) NOT NULL,
    codigo character varying(100) NOT NULL,
    descripcion text,
    ubicacion character varying(255),
    responsable_id uuid,
    activa boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tipo_instalacion public.enum_instalaciones_tipo_instalacion,
    direccion_instalacion text,
    codigo_referencia character varying(50)
);


ALTER TABLE public.instalaciones OWNER TO tfg_user;

COMMENT ON TABLE public.instalaciones IS 'Instalaciones físicas donde están los IoT';

--
-- Name: log_accesos; Type: TABLE; Schema: public; Owner: tfg_user
--

CREATE TABLE public.log_accesos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid,
    username character varying(50),
    ip character varying(45),
    fecha timestamp without time zone DEFAULT now(),
    exito boolean DEFAULT true
);


ALTER TABLE public.log_accesos OWNER TO tfg_user;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: tfg_user
--

CREATE TABLE public.usuarios (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role public.enum_usuarios_role NOT NULL,
    nombre character varying(100),
    apellidos character varying(100),
    email character varying(100) NOT NULL,
    movil character varying(20),
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso timestamp without time zone,
    avatar character varying(255),
    CONSTRAINT usuarios_role_check CHECK ((role = ANY (ARRAY['ADMIN'::public.enum_usuarios_role, 'RESPONSABLE'::public.enum_usuarios_role, 'TITULAR'::public.enum_usuarios_role])))
);


ALTER TABLE public.usuarios OWNER TO tfg_user;

COMMENT ON TABLE public.usuarios IS 'Usuarios del sistema (admin y responsables)';


--
-- Views
--

CREATE VIEW public.v_alertas_recientes AS
 SELECT ah.id,
    ah.tipo,
    ah.valor_detectado,
    ah.fecha_disparo,
    d.nombre AS dispositivo_nombre,
    d.mac_address,
    i.nombre AS instalacion_nombre,
    ah.email_enviado
   FROM ((public.alertas_historial ah
     LEFT JOIN public.dispositivos d ON ((ah.dispositivo_id = d.id)))
     LEFT JOIN public.instalaciones i ON ((ah.instalacion_id = i.id)))
  WHERE (ah.fecha_disparo > (now() - '24:00:00'::interval))
  ORDER BY ah.fecha_disparo DESC;

ALTER TABLE public.v_alertas_recientes OWNER TO tfg_user;


CREATE VIEW public.v_dispositivos_completos AS
 SELECT d.id,
    d.mac_address,
    d.nombre AS dispositivo_nombre,
    d.activo AS dispositivo_activo,
    d.ultima_conexion,
    i.nombre AS instalacion_nombre,
    i.codigo AS instalacion_codigo,
    (((u.nombre)::text || ' '::text) || (u.apellidos)::text) AS responsable_nombre,
    u.email AS responsable_email
   FROM ((public.dispositivos d
     LEFT JOIN public.instalaciones i ON ((d.instalacion_id = i.id)))
     LEFT JOIN public.usuarios u ON ((i.responsable_id = u.id)));

ALTER TABLE public.v_dispositivos_completos OWNER TO tfg_user;


--
-- Primary keys and constraints
--

ALTER TABLE ONLY public.alertas_config
    ADD CONSTRAINT alertas_config_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.alertas_historial
    ADD CONSTRAINT alertas_historial_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.config_email
    ADD CONSTRAINT config_email_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.dispositivos
    ADD CONSTRAINT dispositivos_mac_address_key UNIQUE (mac_address);

ALTER TABLE ONLY public.dispositivos
    ADD CONSTRAINT dispositivos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.informes
    ADD CONSTRAINT informes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.instalaciones
    ADD CONSTRAINT instalaciones_codigo_key UNIQUE (codigo);

ALTER TABLE ONLY public.instalaciones
    ADD CONSTRAINT instalaciones_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.log_accesos
    ADD CONSTRAINT log_accesos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key UNIQUE (username);


--
-- Indexes
--

CREATE INDEX idx_alertas_config_activa ON public.alertas_config USING btree (activa);
CREATE INDEX idx_alertas_config_instalacion ON public.alertas_config USING btree (instalacion_id);
CREATE INDEX idx_alertas_historial_dispositivo ON public.alertas_historial USING btree (dispositivo_id);
CREATE INDEX idx_alertas_historial_fecha ON public.alertas_historial USING btree (fecha_disparo DESC);
CREATE INDEX idx_alertas_historial_instalacion ON public.alertas_historial USING btree (instalacion_id);
CREATE INDEX idx_dispositivos_activo ON public.dispositivos USING btree (activo);
CREATE INDEX idx_dispositivos_instalacion ON public.dispositivos USING btree (instalacion_id);
CREATE INDEX idx_dispositivos_mac ON public.dispositivos USING btree (mac_address);
CREATE INDEX idx_informes_instalacion ON public.informes USING btree (instalacion_id);
CREATE INDEX idx_informes_periodo ON public.informes USING btree (anio DESC, mes DESC);
CREATE UNIQUE INDEX idx_informes_unique ON public.informes USING btree (instalacion_id, anio, mes);
CREATE INDEX idx_instalaciones_codigo ON public.instalaciones USING btree (codigo);
CREATE INDEX idx_instalaciones_responsable ON public.instalaciones USING btree (responsable_id);
CREATE INDEX idx_usuarios_email ON public.usuarios USING btree (email);
CREATE INDEX idx_usuarios_role ON public.usuarios USING btree (role);
CREATE INDEX idx_usuarios_username ON public.usuarios USING btree (username);


--
-- Triggers
--

CREATE TRIGGER trigger_alertas_config_updated_at BEFORE UPDATE ON public.alertas_config FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();
CREATE TRIGGER trigger_dispositivos_updated_at BEFORE UPDATE ON public.dispositivos FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();
CREATE TRIGGER trigger_instalaciones_updated_at BEFORE UPDATE ON public.instalaciones FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();
CREATE TRIGGER trigger_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- Foreign keys
--

ALTER TABLE ONLY public.alertas_config
    ADD CONSTRAINT alertas_config_instalacion_id_fkey FOREIGN KEY (instalacion_id) REFERENCES public.instalaciones(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.alertas_historial
    ADD CONSTRAINT alertas_historial_alerta_config_id_fkey FOREIGN KEY (alerta_config_id) REFERENCES public.alertas_config(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.alertas_historial
    ADD CONSTRAINT alertas_historial_dispositivo_id_fkey FOREIGN KEY (dispositivo_id) REFERENCES public.dispositivos(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.alertas_historial
    ADD CONSTRAINT alertas_historial_instalacion_id_fkey FOREIGN KEY (instalacion_id) REFERENCES public.instalaciones(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.dispositivos
    ADD CONSTRAINT dispositivos_instalacion_id_fkey FOREIGN KEY (instalacion_id) REFERENCES public.instalaciones(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.dispositivos
    ADD CONSTRAINT dispositivos_titular_id_fkey FOREIGN KEY (titular_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.informes
    ADD CONSTRAINT informes_instalacion_id_fkey FOREIGN KEY (instalacion_id) REFERENCES public.instalaciones(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.instalaciones
    ADD CONSTRAINT instalaciones_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.log_accesos
    ADD CONSTRAINT log_accesos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--