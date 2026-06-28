#!/bin/bash
# Script de migración — ejecutar sola vez en el servidor
echo "Aplicando migraciones"

docker exec -i postgres_rad psql -U tfg_user -d tfg_iot << 'EOF'

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS avatar VARCHAR(255);
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_role_check;
DO $$ BEGIN
    ALTER TYPE enum_usuarios_role ADD VALUE IF NOT EXISTS 'TITULAR';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS latitud NUMERIC(10,7);
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS longitud NUMERIC(10,7);
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS altura NUMERIC(8,2);
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS nivel_bateria INTEGER;
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS titular_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS ip_registro VARCHAR(45);
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS fecha_caducidad_ip DATE;

ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS marca_comercial VARCHAR(100);
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS modelo_electronica VARCHAR(100);
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS num_serie_electronica VARCHAR(100);
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS num_serie_sonda VARCHAR(100);
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS tipo_detector VARCHAR(100);

ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS calibrado BOOLEAN DEFAULT false;
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS fecha_ultima_calibracion DATE;
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS fecha_proxima_calibracion DATE;
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS verificacion_periodica BOOLEAN DEFAULT false;
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS periodicidad_verificacion VARCHAR(50);

ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS medida_continuo BOOLEAN DEFAULT false;
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS unidades_medida VARCHAR(20) DEFAULT 'µSv/h';
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS factor_correccion NUMERIC(10,6) DEFAULT 1.0;

ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS zona_radiologica VARCHAR(30);
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_zona_radiologica') THEN
        CREATE TYPE enum_zona_radiologica AS ENUM ( 'LIBRE_PASO', 'VIGILADA', 'CONTROLADA', 'CONTROLADA_LIMITADA','CONTROLADA_REGLAMENTADA','ACCESO_PROHIBIDO');
    END IF;
END $$;
ALTER TABLE dispositivos ALTER COLUMN zona_radiologica TYPE enum_zona_radiologica USING zona_radiologica::enum_zona_radiologica;

ALTER TABLE instalaciones ADD COLUMN IF NOT EXISTS tipo_instalacion VARCHAR(10);
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_tipo_instalacion') THEN
        CREATE TYPE enum_tipo_instalacion AS ENUM ('IRA', 'IRD');
    END IF;
END $$;
ALTER TABLE instalaciones ALTER COLUMN tipo_instalacion TYPE enum_tipo_instalacion USING tipo_instalacion::enum_tipo_instalacion;
ALTER TABLE instalaciones ADD COLUMN IF NOT EXISTS direccion_instalacion TEXT;
ALTER TABLE instalaciones ADD COLUMN IF NOT EXISTS codigo_referencia VARCHAR(50);

CREATE TABLE IF NOT EXISTS config_email (id SERIAL PRIMARY KEY,nombre VARCHAR(100),smtp_host VARCHAR(100) NOT NULL,smtp_port INTEGER NOT NULL,smtp_user VARCHAR(100) NOT NULL,smtp_pass VARCHAR(100) NOT NULL,smtp_secure BOOLEAN DEFAULT false,activo BOOLEAN DEFAULT true,updated_at TIMESTAMP DEFAULT now());

CREATE TABLE IF NOT EXISTS log_accesos (id UUID DEFAULT gen_random_uuid() PRIMARY KEY,usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,username VARCHAR(50),ip VARCHAR(45),fecha TIMESTAMP DEFAULT now(),exito BOOLEAN DEFAULT true);

DROP VIEW IF EXISTS v_dispositivos_completos;
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='instalaciones' AND column_name='codigo') THEN
        ALTER TABLE instalaciones ALTER COLUMN codigo TYPE VARCHAR(100);
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='instalaciones' AND column_name='codigo') THEN
        ALTER TABLE instalaciones RENAME COLUMN codigo TO categoria;
    END IF;
END $$;
ALTER INDEX IF EXISTS instalaciones_codigo_key RENAME TO instalaciones_categoria_key;
ALTER INDEX IF EXISTS idx_instalaciones_codigo RENAME TO idx_instalaciones_categoria;
ALTER TABLE instalaciones DROP CONSTRAINT IF EXISTS instalaciones_categoria_key;
DROP INDEX IF EXISTS idx_instalaciones_categoria;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'instalaciones_codigo_referencia_key'
    ) THEN
        ALTER TABLE instalaciones ADD CONSTRAINT instalaciones_codigo_referencia_key UNIQUE (codigo_referencia);
    END IF;
END $$;
DROP VIEW IF EXISTS v_dispositivos_completos;
CREATE VIEW public.v_dispositivos_completos AS
 SELECT d.id, d.mac_address, d.nombre AS dispositivo_nombre, d.activo AS dispositivo_activo,
    d.ultima_conexion, i.nombre AS instalacion_nombre, i.categoria AS instalacion_categoria,
    (((u.nombre)::text || ' '::text) || (u.apellidos)::text) AS responsable_nombre,
    u.email AS responsable_email
   FROM ((public.dispositivos d
     LEFT JOIN public.instalaciones i ON ((d.instalacion_id = i.id)))
     LEFT JOIN public.usuarios u ON ((i.responsable_id = u.id)));

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono_movil VARCHAR(20);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono_fijo VARCHAR(20);

ALTER TABLE usuarios DROP COLUMN IF EXISTS movil;

ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS modelo_sonda VARCHAR(100);
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS foto VARCHAR(255);

CREATE TABLE IF NOT EXISTS licencias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    instalacion_id UUID REFERENCES instalaciones(id) ON DELETE SET NULL,
    campo_aplicacion VARCHAR(255) NOT NULL,
    fecha_concesion DATE,
    fecha_caducidad DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_licencias_nivel') THEN
        CREATE TYPE enum_licencias_nivel AS ENUM ('OPERADOR', 'SUPERVISOR');
    END IF;
END $$;
ALTER TABLE licencias ADD COLUMN IF NOT EXISTS nivel enum_licencias_nivel;

CREATE TABLE IF NOT EXISTS log_cambios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    username VARCHAR(50),
    campo_modificado VARCHAR(100) NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE alertas_config ADD COLUMN IF NOT EXISTS dispositivo_id UUID REFERENCES dispositivos(id) ON DELETE CASCADE;


SELECT 'Migracion completada' AS resultado;
EOF

mkdir -p uploads/avatares
mkdir -p uploads/dispositivos

echo "Reiniciando backend"
docker restart backend_rad
echo "Listo"