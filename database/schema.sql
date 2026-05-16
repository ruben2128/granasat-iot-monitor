--
-- PostgreSQL database dump
--

\restrict gAyTZ24zbSk3aoTC5sAduoSYTyP0g97UEe10tOZaOWKzWYD9VUHUKsEF2HrVc7U

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
-- Name: enum_usuarios_role; Type: TYPE; Schema: public; Owner: tfg_user
--

CREATE TYPE public.enum_usuarios_role AS ENUM (
    'ADMIN',
    'RESPONSABLE'
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

--
-- Name: TABLE alertas_config; Type: COMMENT; Schema: public; Owner: tfg_user
--

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

--
-- Name: TABLE alertas_historial; Type: COMMENT; Schema: public; Owner: tfg_user
--

COMMENT ON TABLE public.alertas_historial IS 'Histórico de alertas disparadas';


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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.dispositivos OWNER TO tfg_user;

--
-- Name: TABLE dispositivos; Type: COMMENT; Schema: public; Owner: tfg_user
--

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

--
-- Name: TABLE informes; Type: COMMENT; Schema: public; Owner: tfg_user
--

COMMENT ON TABLE public.informes IS 'Informes PDF generados mensualmente';


--
-- Name: instalaciones; Type: TABLE; Schema: public; Owner: tfg_user
--

CREATE TABLE public.instalaciones (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nombre character varying(100) NOT NULL,
    codigo character varying(20) NOT NULL,
    descripcion text,
    ubicacion character varying(255),
    responsable_id uuid,
    activa boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.instalaciones OWNER TO tfg_user;

--
-- Name: TABLE instalaciones; Type: COMMENT; Schema: public; Owner: tfg_user
--

COMMENT ON TABLE public.instalaciones IS 'Instalaciones físicas donde están los IoT';


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
    CONSTRAINT usuarios_role_check CHECK (((role)::text = ANY (ARRAY[('ADMIN'::character varying)::text, ('RESPONSABLE'::character varying)::text])))
);


ALTER TABLE public.usuarios OWNER TO tfg_user;

--
-- Name: TABLE usuarios; Type: COMMENT; Schema: public; Owner: tfg_user
--

COMMENT ON TABLE public.usuarios IS 'Usuarios del sistema (admin y responsables)';


--
-- Name: v_alertas_recientes; Type: VIEW; Schema: public; Owner: tfg_user
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

--
-- Name: v_dispositivos_completos; Type: VIEW; Schema: public; Owner: tfg_user
--

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
-- Data for Name: alertas_config; Type: TABLE DATA; Schema: public; Owner: tfg_user
--

COPY public.alertas_config (id, instalacion_id, tipo, nombre, descripcion, campo, operador, umbral, emails_destino, mensaje_personalizado, activa, created_at, updated_at) FROM stdin;
cf8e7393-223d-4191-b300-494833290cfe	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	Alerta radiación alta	Dispara cuando la radiación supera el umbral	radiacion	>	50	{gilrubenmartin@gmail.com}	Nivel de radiación crítico detectado	f	2026-03-16 20:13:09.16	2026-05-03 16:09:40.252076
\.


--
-- Data for Name: alertas_historial; Type: TABLE DATA; Schema: public; Owner: tfg_user
--

COPY public.alertas_historial (id, alerta_config_id, dispositivo_id, instalacion_id, tipo, valor_detectado, umbral_configurado, mensaje, email_enviado, email_error, destinatarios, fecha_disparo, fecha_email) FROM stdin;
69e9eeca-fd99-4518-8a43-8eaf73030f35	cf8e7393-223d-4191-b300-494833290cfe	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	65.21	50	Nivel de radiación crítico detectado	f	Invalid login: 535 5.7.8 Error: authentication failed: authentication failure	{responsable@ugr.es}	2026-03-23 22:40:56.407	\N
b660d620-a20a-4b83-a0c0-0db691591c42	cf8e7393-223d-4191-b300-494833290cfe	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	99.74	50	Nivel de radiación crítico detectado	f	connect ECONNREFUSED 150.214.204.23:587	{responsable@ugr.es}	2026-03-23 22:54:21.516	\N
2809cf46-d9a5-4a0e-af5b-196f499f4199	cf8e7393-223d-4191-b300-494833290cfe	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	99.74	50	Nivel de radiación crítico detectado	f	Invalid login: 534-5.7.9 Application-specific password required. For more information, go to\n534 5.7.9  https://support.google.com/mail/?p=InvalidSecondFactor 5b1f17b1804b1-487116ee57esm5107665e9.14 - gsmtp	{responsable@ugr.es}	2026-03-23 22:57:01.06	\N
2f93b929-2967-4325-8070-5210ac5ca2eb	cf8e7393-223d-4191-b300-494833290cfe	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	99.74	50	Nivel de radiación crítico detectado	f	Invalid login: 534-5.7.9 Application-specific password required. For more information, go to\n534 5.7.9  https://support.google.com/mail/?p=InvalidSecondFactor 5b1f17b1804b1-487113d73c0sm6536995e9.0 - gsmtp	{responsable@ugr.es}	2026-03-23 22:57:44.479	\N
d44ee562-a883-42cc-85e4-e598d99ffe5b	cf8e7393-223d-4191-b300-494833290cfe	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	99.74	50	Nivel de radiación crítico detectado	f	Invalid login: 534-5.7.9 Application-specific password required. For more information, go to\n534 5.7.9  https://support.google.com/mail/?p=InvalidSecondFactor 5b1f17b1804b1-487116f1905sm5842105e9.3 - gsmtp	{responsable@ugr.es}	2026-03-23 22:57:54.172	\N
16115f90-ddfb-4a0d-b4a0-bb93be55687a	cf8e7393-223d-4191-b300-494833290cfe	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	99.74	50	Nivel de radiación crítico detectado	t	\N	{responsable@ugr.es}	2026-03-23 23:00:23.505	\N
7559fb16-d2b9-4b78-8e1b-87a4eea249f7	\N	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	46.45	1	ALERTA: Test alerta radiación\nInstaalcion: Instalación A\nDispositivo:  (Direccion MAC: 84:1F:E8:39:54:D4)\nCampo: radiacion\nValor detectado: 46.45\nUmbral configurado: > 1\nFecha: Mon Mar 23 2026 23:40:38 GMT+0100 (hora estándar de Europa central)	f	Invalid login: 535 5.7.8 Error: authentication failed: authentication failure	{rubenmartin12@correo.ugr.es}	2026-03-23 22:40:40.841	\N
fedf2f8a-d36b-4b71-9148-77c1cc8d931c	\N	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	65.21	1	ALERTA: Test alerta radiación\nInstaalcion: Instalación A\nDispositivo:  (Direccion MAC: 84:1F:E8:39:54:D4)\nCampo: radiacion\nValor detectado: 65.21\nUmbral configurado: > 1\nFecha: Mon Mar 23 2026 23:40:56 GMT+0100 (hora estándar de Europa central)	f	Invalid login: 535 5.7.8 Error: authentication failed: authentication failure	{rubenmartin12@correo.ugr.es}	2026-03-23 22:40:58.967	\N
40c9e894-ed27-44dd-b1ca-da003ea2b50c	\N	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	13.38	1	ALERTA: Test alerta radiación\nInstaalcion: Instalación A\nDispositivo:  (Direccion MAC: 84:1F:E8:39:54:D4)\nCampo: radiacion\nValor detectado: 13.38\nUmbral configurado: > 1\nFecha: Mon Mar 23 2026 23:41:20 GMT+0100 (hora estándar de Europa central)	f	Invalid login: 535 5.7.8 Error: authentication failed: authentication failure	{rubenmartin12@correo.ugr.es}	2026-03-23 22:41:23.443	\N
9d6dbf96-c54f-47a9-8f18-e3dfaa3b7a12	\N	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	15.61	1	ALERTA: Test alerta radiación\nInstaalcion: Instalación A\nDispositivo:  (Direccion MAC: 84:1F:E8:39:54:D4)\nCampo: radiacion\nValor detectado: 15.61\nUmbral configurado: > 1\nFecha: Mon Mar 23 2026 23:42:30 GMT+0100 (hora estándar de Europa central)	f	connect ECONNREFUSED 150.214.204.23:587	{rubenmartin12@correo.ugr.es}	2026-03-23 22:42:30.931	\N
2bad330e-79b0-4dc4-9efb-8497bc9e14f0	\N	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	43.83	1	ALERTA: Test alerta radiación\nInstaalcion: Instalación A\nDispositivo:  (Direccion MAC: 84:1F:E8:39:54:D4)\nCampo: radiacion\nValor detectado: 43.83\nUmbral configurado: > 1\nFecha: Mon Mar 23 2026 23:47:30 GMT+0100 (hora estándar de Europa central)	f	connect ECONNREFUSED 150.214.204.23:587	{rubenmartin12@correo.ugr.es}	2026-03-23 22:47:30.98	\N
9ce88c11-70b0-4f16-a9b7-4908c816eefa	\N	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	99.74	1	ALERTA: Test alerta radiación\nInstaalcion: Instalación A\nDispositivo:  (Direccion MAC: 84:1F:E8:39:54:D4)\nCampo: radiacion\nValor detectado: 99.74\nUmbral configurado: > 1\nFecha: Mon Mar 23 2026 23:54:21 GMT+0100 (hora estándar de Europa central)	f	connect ECONNREFUSED 150.214.204.23:587	{rubenmartin12@correo.ugr.es}	2026-03-23 22:54:21.616	\N
68f3d71e-7243-4878-8281-2fced35e84f3	\N	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	99.74	1	ALERTA: Test alerta radiación\nInstaalcion: Instalación A\nDispositivo:  (Direccion MAC: 84:1F:E8:39:54:D4)\nCampo: radiacion\nValor detectado: 99.74\nUmbral configurado: > 1\nFecha: Mon Mar 23 2026 23:57:01 GMT+0100 (hora estándar de Europa central)	f	Invalid login: 534-5.7.9 Application-specific password required. For more information, go to\n534 5.7.9  https://support.google.com/mail/?p=InvalidSecondFactor 5b1f17b1804b1-4870f6c0fa6sm5014025e9.1 - gsmtp	{rubenmartin12@correo.ugr.es}	2026-03-23 22:57:01.672	\N
d53514eb-ee37-41aa-ab51-0c5ad6d94ce8	\N	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	99.74	1	ALERTA: Test alerta radiación\nInstaalcion: Instalación A\nDispositivo:  (Direccion MAC: 84:1F:E8:39:54:D4)\nCampo: radiacion\nValor detectado: 99.74\nUmbral configurado: > 1\nFecha: Mon Mar 23 2026 23:57:44 GMT+0100 (hora estándar de Europa central)	f	Invalid login: 534-5.7.9 Application-specific password required. For more information, go to\n534 5.7.9  https://support.google.com/mail/?p=InvalidSecondFactor ffacd0b85a97d-43b6425eeb4sm28594757f8f.0 - gsmtp	{rubenmartin12@correo.ugr.es}	2026-03-23 22:57:45.091	\N
67b1b750-49b3-4aeb-b585-afb332e0a187	\N	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	99.74	1	ALERTA: Test alerta radiación\nInstaalcion: Instalación A\nDispositivo:  (Direccion MAC: 84:1F:E8:39:54:D4)\nCampo: radiacion\nValor detectado: 99.74\nUmbral configurado: > 1\nFecha: Mon Mar 23 2026 23:57:54 GMT+0100 (hora estándar de Europa central)	f	Invalid login: 534-5.7.9 Application-specific password required. For more information, go to\n534 5.7.9  https://support.google.com/mail/?p=InvalidSecondFactor ffacd0b85a97d-43b6470b243sm33442585f8f.26 - gsmtp	{rubenmartin12@correo.ugr.es}	2026-03-23 22:57:54.819	\N
159f3861-2551-480a-be1a-526690f51343	\N	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	99.74	1	ALERTA: Test alerta radiación\nInstaalcion: Instalación A\nDispositivo:  (Direccion MAC: 84:1F:E8:39:54:D4)\nCampo: radiacion\nValor detectado: 99.74\nUmbral configurado: > 1\nFecha: Tue Mar 24 2026 00:00:23 GMT+0100 (hora estándar de Europa central)	t	\N	{rubenmartin12@correo.ugr.es}	2026-03-23 23:00:24.734	\N
d99ea690-4d45-4593-96e3-dce5057c7782	\N	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	99.74	1	ALERTA: Test alerta radiación\nInstaalcion: Instalación A\nDispositivo:  (Direccion MAC: 84:1F:E8:39:54:D4)\nCampo: radiacion\nValor detectado: 99.74\nUmbral configurado: > 1\nFecha: Tue Mar 24 2026 00:00:24 GMT+0100 (hora estándar de Europa central)	t	\N	{runo1821@gmail.com}	2026-03-23 23:00:25.962	\N
7ccae5b5-e75e-4f4f-af2d-3030fc60665c	\N	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	99.74	1	ALERTA: Test alerta radiación\nInstaalcion: Instalación A\nDispositivo:  (Direccion MAC: 84:1F:E8:39:54:D4)\nCampo: radiacion\nValor detectado: 99.74\nUmbral configurado: > 1\nFecha: Mon Mar 23 2026 23:57:54 GMT+0100 (hora estándar de Europa central)	f	Invalid login: 534-5.7.9 Application-specific password required. For more information, go to\n534 5.7.9  https://support.google.com/mail/?p=InvalidSecondFactor ffacd0b85a97d-43b647177e8sm32105428f8f.34 - gsmtp	{runo1821@gmail.com}	2026-03-23 22:57:55.432	\N
0365e041-e327-4507-980d-99615c420fbb	\N	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	99.74	1	ALERTA: Test alerta radiación\nInstaalcion: Instalación A\nDispositivo:  (Direccion MAC: 84:1F:E8:39:54:D4)\nCampo: radiacion\nValor detectado: 99.74\nUmbral configurado: > 1\nFecha: Tue Mar 24 2026 00:02:00 GMT+0100 (hora estándar de Europa central)	f	No recipients defined	{sofibetancortsuarez.com}	2026-03-23 23:02:01.524	\N
cb9d817a-4e54-4dea-99d5-681a51a09563	\N	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	99.74	1	ALERTA: Test alerta radiación\nInstaalcion: Instalación A\nDispositivo:  (Direccion MAC: 84:1F:E8:39:54:D4)\nCampo: radiacion\nValor detectado: 99.74\nUmbral configurado: > 1\nFecha: Tue Mar 24 2026 00:03:40 GMT+0100 (hora estándar de Europa central)	f	No recipients defined	{sofibetancortsuarez.com}	2026-03-23 23:03:41.041	\N
4441368a-b61b-405f-8724-7b8391c1f5cc	\N	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	99.74	1	ALERTA: Test alerta radiación\nInstaalcion: Instalación A\nDispositivo:  (Direccion MAC: 84:1F:E8:39:54:D4)\nCampo: radiacion\nValor detectado: 99.74\nUmbral configurado: > 1\nFecha: Tue Mar 24 2026 00:03:41 GMT+0100 (hora estándar de Europa central)	t	\N	{sofibetancortsuarez@gmail.com}	2026-03-23 23:03:42.369	\N
dc1bf133-7172-40a4-9721-a9c3a2fe22df	cf8e7393-223d-4191-b300-494833290cfe	55add4e0-10f0-4a4a-8b9b-80793800e1bf	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	RADIACION_ALTA	75.87	50	Nivel de radiación crítico detectado	t	\N	{responsable@ugr.es}	2026-04-27 20:59:40.129	\N
\.


--
-- Data for Name: dispositivos; Type: TABLE DATA; Schema: public; Owner: tfg_user
--

COPY public.dispositivos (id, mac_address, nombre, descripcion, instalacion_id, hw_version, fw_version, activo, ultima_conexion, ultima_ip, fecha_instalacion, notas, created_at, updated_at) FROM stdin;
55add4e0-10f0-4a4a-8b9b-80793800e1bf	84:1F:E8:39:54:D4	Sensor-001	prueba descripcion	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	1.0	1.0	t	2026-03-13 20:09:44.838657		2026-03-13		2026-03-13 20:09:44.838657	2026-04-23 22:48:56.254795
\.


--
-- Data for Name: informes; Type: TABLE DATA; Schema: public; Owner: tfg_user
--

COPY public.informes (id, instalacion_id, mes, anio, fecha_inicio, fecha_fin, ruta_pdf, tamano_bytes, generado, email_enviado, email_destinatarios, fecha_generacion, fecha_envio_email, created_at) FROM stdin;
87985188-9e9c-45d6-8afd-46984216e898	d9c72d36-151f-4e96-bd98-f7d3042cc6f3	3	2026	2026-03-01	2026-03-31	/home/ruben/Escritorio/tig/backend/informes/informe_INST_A_2026_03.pdf	\N	t	f	{}	2026-04-14 18:07:51.361	\N	2026-04-14 18:07:51.367
\.


--
-- Data for Name: instalaciones; Type: TABLE DATA; Schema: public; Owner: tfg_user
--

COPY public.instalaciones (id, nombre, codigo, descripcion, ubicacion, responsable_id, activa, created_at, updated_at) FROM stdin;
9f1755fc-431d-4b89-8227-8af3f17bce9e	Instalación B	INST_B	\N	ETSIIT, Planta 2, Sala 201	0e60c4fd-3029-4dd7-b97d-bf6c0912be9e	t	2026-03-12 20:59:57.476	2026-04-14 19:48:43.544047
d9c72d36-151f-4e96-bd98-f7d3042cc6f3	Instalación A	INST_A	Laboratorio de Física Nuclear	ETSIIT, Planta 3, Sala 301	6ad3cd3c-4b3d-4152-8db1-795d880d84af	t	2026-01-21 18:28:44.923688	2026-04-14 19:50:34.377373
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: tfg_user
--

COPY public.usuarios (id, username, password_hash, role, nombre, apellidos, email, movil, activo, created_at, updated_at, ultimo_acceso) FROM stdin;
0e60c4fd-3029-4dd7-b97d-bf6c0912be9e	responsable1	$2b$10$mSqX6Dk7iSs29uzLU/P/T.S7RPMpFQYlmVJotHacf8G8o4iZIGkAe	RESPONSABLE	Juan	Pérez García	prueba@gmail.com	666555444	t	2026-02-07 19:49:28.907	2026-05-03 15:54:04.846098	2026-05-03 15:54:04.844
6ad3cd3c-4b3d-4152-8db1-795d880d84af	admin	$2b$10$/yS4MVo6oL9uzcZn351IxeyP9fx6XEwOthPPdGbosMQ1L3I/6AMXy	ADMIN	Administrador	del Sistema	admin@ugr.es	\N	t	2026-01-21 18:28:44.922508	2026-05-03 18:35:21.079137	2026-05-03 18:35:21.075
\.


--
-- Name: alertas_config alertas_config_pkey; Type: CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.alertas_config
    ADD CONSTRAINT alertas_config_pkey PRIMARY KEY (id);


--
-- Name: alertas_historial alertas_historial_pkey; Type: CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.alertas_historial
    ADD CONSTRAINT alertas_historial_pkey PRIMARY KEY (id);


--
-- Name: dispositivos dispositivos_mac_address_key; Type: CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.dispositivos
    ADD CONSTRAINT dispositivos_mac_address_key UNIQUE (mac_address);


--
-- Name: dispositivos dispositivos_pkey; Type: CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.dispositivos
    ADD CONSTRAINT dispositivos_pkey PRIMARY KEY (id);


--
-- Name: informes informes_pkey; Type: CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.informes
    ADD CONSTRAINT informes_pkey PRIMARY KEY (id);


--
-- Name: instalaciones instalaciones_codigo_key; Type: CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.instalaciones
    ADD CONSTRAINT instalaciones_codigo_key UNIQUE (codigo);


--
-- Name: instalaciones instalaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.instalaciones
    ADD CONSTRAINT instalaciones_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_username_key; Type: CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key UNIQUE (username);


--
-- Name: usuarios usuarios_username_key1; Type: CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key1 UNIQUE (username);


--
-- Name: usuarios usuarios_username_key2; Type: CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key2 UNIQUE (username);


--
-- Name: usuarios usuarios_username_key3; Type: CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key3 UNIQUE (username);


--
-- Name: usuarios usuarios_username_key4; Type: CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key4 UNIQUE (username);


--
-- Name: usuarios usuarios_username_key5; Type: CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key5 UNIQUE (username);


--
-- Name: usuarios usuarios_username_key6; Type: CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key6 UNIQUE (username);


--
-- Name: idx_alertas_config_activa; Type: INDEX; Schema: public; Owner: tfg_user
--

CREATE INDEX idx_alertas_config_activa ON public.alertas_config USING btree (activa);


--
-- Name: idx_alertas_config_instalacion; Type: INDEX; Schema: public; Owner: tfg_user
--

CREATE INDEX idx_alertas_config_instalacion ON public.alertas_config USING btree (instalacion_id);


--
-- Name: idx_alertas_historial_dispositivo; Type: INDEX; Schema: public; Owner: tfg_user
--

CREATE INDEX idx_alertas_historial_dispositivo ON public.alertas_historial USING btree (dispositivo_id);


--
-- Name: idx_alertas_historial_fecha; Type: INDEX; Schema: public; Owner: tfg_user
--

CREATE INDEX idx_alertas_historial_fecha ON public.alertas_historial USING btree (fecha_disparo DESC);


--
-- Name: idx_alertas_historial_instalacion; Type: INDEX; Schema: public; Owner: tfg_user
--

CREATE INDEX idx_alertas_historial_instalacion ON public.alertas_historial USING btree (instalacion_id);


--
-- Name: idx_dispositivos_activo; Type: INDEX; Schema: public; Owner: tfg_user
--

CREATE INDEX idx_dispositivos_activo ON public.dispositivos USING btree (activo);


--
-- Name: idx_dispositivos_instalacion; Type: INDEX; Schema: public; Owner: tfg_user
--

CREATE INDEX idx_dispositivos_instalacion ON public.dispositivos USING btree (instalacion_id);


--
-- Name: idx_dispositivos_mac; Type: INDEX; Schema: public; Owner: tfg_user
--

CREATE INDEX idx_dispositivos_mac ON public.dispositivos USING btree (mac_address);


--
-- Name: idx_informes_instalacion; Type: INDEX; Schema: public; Owner: tfg_user
--

CREATE INDEX idx_informes_instalacion ON public.informes USING btree (instalacion_id);


--
-- Name: idx_informes_periodo; Type: INDEX; Schema: public; Owner: tfg_user
--

CREATE INDEX idx_informes_periodo ON public.informes USING btree (anio DESC, mes DESC);


--
-- Name: idx_informes_unique; Type: INDEX; Schema: public; Owner: tfg_user
--

CREATE UNIQUE INDEX idx_informes_unique ON public.informes USING btree (instalacion_id, anio, mes);


--
-- Name: idx_instalaciones_codigo; Type: INDEX; Schema: public; Owner: tfg_user
--

CREATE INDEX idx_instalaciones_codigo ON public.instalaciones USING btree (codigo);


--
-- Name: idx_instalaciones_responsable; Type: INDEX; Schema: public; Owner: tfg_user
--

CREATE INDEX idx_instalaciones_responsable ON public.instalaciones USING btree (responsable_id);


--
-- Name: idx_usuarios_email; Type: INDEX; Schema: public; Owner: tfg_user
--

CREATE INDEX idx_usuarios_email ON public.usuarios USING btree (email);


--
-- Name: idx_usuarios_role; Type: INDEX; Schema: public; Owner: tfg_user
--

CREATE INDEX idx_usuarios_role ON public.usuarios USING btree (role);


--
-- Name: idx_usuarios_username; Type: INDEX; Schema: public; Owner: tfg_user
--

CREATE INDEX idx_usuarios_username ON public.usuarios USING btree (username);


--
-- Name: alertas_config trigger_alertas_config_updated_at; Type: TRIGGER; Schema: public; Owner: tfg_user
--

CREATE TRIGGER trigger_alertas_config_updated_at BEFORE UPDATE ON public.alertas_config FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- Name: dispositivos trigger_dispositivos_updated_at; Type: TRIGGER; Schema: public; Owner: tfg_user
--

CREATE TRIGGER trigger_dispositivos_updated_at BEFORE UPDATE ON public.dispositivos FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- Name: instalaciones trigger_instalaciones_updated_at; Type: TRIGGER; Schema: public; Owner: tfg_user
--

CREATE TRIGGER trigger_instalaciones_updated_at BEFORE UPDATE ON public.instalaciones FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- Name: usuarios trigger_usuarios_updated_at; Type: TRIGGER; Schema: public; Owner: tfg_user
--

CREATE TRIGGER trigger_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- Name: alertas_config alertas_config_instalacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.alertas_config
    ADD CONSTRAINT alertas_config_instalacion_id_fkey FOREIGN KEY (instalacion_id) REFERENCES public.instalaciones(id) ON DELETE CASCADE;


--
-- Name: alertas_historial alertas_historial_alerta_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.alertas_historial
    ADD CONSTRAINT alertas_historial_alerta_config_id_fkey FOREIGN KEY (alerta_config_id) REFERENCES public.alertas_config(id) ON DELETE SET NULL;


--
-- Name: alertas_historial alertas_historial_dispositivo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.alertas_historial
    ADD CONSTRAINT alertas_historial_dispositivo_id_fkey FOREIGN KEY (dispositivo_id) REFERENCES public.dispositivos(id) ON DELETE SET NULL;


--
-- Name: alertas_historial alertas_historial_instalacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.alertas_historial
    ADD CONSTRAINT alertas_historial_instalacion_id_fkey FOREIGN KEY (instalacion_id) REFERENCES public.instalaciones(id) ON DELETE SET NULL;


--
-- Name: dispositivos dispositivos_instalacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.dispositivos
    ADD CONSTRAINT dispositivos_instalacion_id_fkey FOREIGN KEY (instalacion_id) REFERENCES public.instalaciones(id) ON DELETE CASCADE;


--
-- Name: informes informes_instalacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.informes
    ADD CONSTRAINT informes_instalacion_id_fkey FOREIGN KEY (instalacion_id) REFERENCES public.instalaciones(id) ON DELETE CASCADE;


--
-- Name: instalaciones instalaciones_responsable_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tfg_user
--

ALTER TABLE ONLY public.instalaciones
    ADD CONSTRAINT instalaciones_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict gAyTZ24zbSk3aoTC5sAduoSYTyP0g97UEe10tOZaOWKzWYD9VUHUKsEF2HrVc7U

