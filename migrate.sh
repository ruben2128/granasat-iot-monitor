#!/bin/bash
# Script de migración — ejecutar sola vez en el servidor
echo "Aplicando migraciones"

docker exec -i postgres_rad psql -U tfg_user -d tfg_iot << 'EOF'

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
ALTER TABLE instalaciones ALTER COLUMN codigo TYPE VARCHAR(100);
CREATE VIEW public.v_dispositivos_completos AS SELECT d.id, d.mac_address, d.nombre AS dispositivo_nombre, d.activo AS dispositivo_activo, d.ultima_conexion, i.nombre AS instalacion_nombre, i.codigo AS instalacion_codigo, (((u.nombre)::text || ' '::text) || (u.apellidos)::text) AS responsable_nombre, u.email AS responsable_email FROM ((public.dispositivos d LEFT JOIN public.instalaciones i ON ((d.instalacion_id = i.id))) LEFT JOIN public.usuarios u ON ((i.responsable_id = u.id)));

SELECT 'Migracion completada' AS resultado;
EOF

echo "Reiniciando backend"
docker restart backend_rad
echo "Listo"