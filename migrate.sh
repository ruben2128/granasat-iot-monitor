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

-- Dispositivos
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS latitud NUMERIC(10,7);
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS longitud NUMERIC(10,7);
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS altura NUMERIC(8,2);
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS nivel_bateria INTEGER;
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS titular_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS ip_registro VARCHAR(45);
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS fecha_caducidad_ip DATE;

-- Tabla config_email
CREATE TABLE IF NOT EXISTS config_email (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    smtp_host VARCHAR(100) NOT NULL,
    smtp_port INTEGER NOT NULL,
    smtp_user VARCHAR(100) NOT NULL,
    smtp_pass VARCHAR(100) NOT NULL,
    smtp_secure BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT now()
);

-- Tabla log_accesos
CREATE TABLE IF NOT EXISTS log_accesos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    username VARCHAR(50),
    ip VARCHAR(45),
    fecha TIMESTAMP DEFAULT now(),
    exito BOOLEAN DEFAULT true
);

SELECT 'Migracion completada' AS resultado;
EOF

echo "Reiniciando backend"
docker restart backend_rad
echo "Listo"
