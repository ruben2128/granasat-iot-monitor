-- =====================================================
-- ESQUEMA POSTGRESQL PARA TFG IoT MQTT
-- Sistema de Monitorización de Radiación
-- =====================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: usuarios
-- Almacena admin y responsables
-- =====================================================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'RESPONSABLE')),
  
  -- Datos personales
  nombre VARCHAR(100),
  apellidos VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL,
  movil VARCHAR(20),
  avatar TEXT,
  
  -- Estado
  activo BOOLEAN DEFAULT true,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso TIMESTAMP
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_role ON usuarios(role);

-- =====================================================
-- TABLA: instalaciones
-- Lugares físicos con dispositivos IoT
-- =====================================================
CREATE TABLE instalaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(20) UNIQUE NOT NULL,  -- Ej: "INST_A", "INST_B"
  descripcion TEXT,
  ubicacion VARCHAR(255),
  
  -- Relación con responsable
  responsable_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  
  -- Estado
  activa BOOLEAN DEFAULT true,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_instalaciones_responsable ON instalaciones(responsable_id);
CREATE INDEX idx_instalaciones_codigo ON instalaciones(codigo);

-- =====================================================
-- TABLA: dispositivos
-- Dispositivos IoT registrados en el sistema
-- =====================================================
CREATE TABLE dispositivos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificación única
  mac_address VARCHAR(17) UNIQUE NOT NULL,  -- AA:BB:CC:DD:EE:FF
  nombre VARCHAR(100) NOT NULL,             -- Ej: "IoT-001"
  descripcion TEXT,
  
  -- Relación con instalación
  instalacion_id UUID REFERENCES instalaciones(id) ON DELETE CASCADE,
  
  -- Versiones (se actualizan desde MQTT)
  hw_version VARCHAR(20),
  fw_version VARCHAR(20),
  
  -- Estado
  activo BOOLEAN DEFAULT true,
  ultima_conexion TIMESTAMP,
  ultima_ip VARCHAR(15),
  
  -- Metadata
  fecha_instalacion DATE,
  notas TEXT,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dispositivos_mac ON dispositivos(mac_address);
CREATE INDEX idx_dispositivos_instalacion ON dispositivos(instalacion_id);
CREATE INDEX idx_dispositivos_activo ON dispositivos(activo);

-- =====================================================
-- TABLA: alertas_config
-- Configuración de alertas por instalación
-- =====================================================
CREATE TABLE alertas_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- A qué instalación aplica
  instalacion_id UUID REFERENCES instalaciones(id) ON DELETE CASCADE,
  
  -- Tipo de alerta
  tipo VARCHAR(50) NOT NULL,  -- 'RADIACION_ALTA', 'SIN_SUMINISTRO', etc.
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  
  -- Condición
  campo VARCHAR(50) NOT NULL,     -- 'radiacion', 'suministro', etc.
  operador VARCHAR(10) NOT NULL,  -- '>', '<', '==', '!='
  umbral FLOAT,                   -- Valor de comparación
  
  -- Acción
  emails_destino TEXT[],          -- Array de emails
  mensaje_personalizado TEXT,
  
  -- Estado
  activa BOOLEAN DEFAULT true,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alertas_config_instalacion ON alertas_config(instalacion_id);
CREATE INDEX idx_alertas_config_activa ON alertas_config(activa);

-- =====================================================
-- TABLA: alertas_historial
-- Registro de alertas disparadas
-- =====================================================
CREATE TABLE alertas_historial (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relaciones
  alerta_config_id UUID REFERENCES alertas_config(id) ON DELETE SET NULL,
  dispositivo_id UUID REFERENCES dispositivos(id) ON DELETE SET NULL,
  instalacion_id UUID REFERENCES instalaciones(id) ON DELETE SET NULL,
  
  -- Datos del evento
  tipo VARCHAR(50) NOT NULL,
  valor_detectado FLOAT,
  umbral_configurado FLOAT,
  mensaje TEXT,
  
  -- Estado del envío
  email_enviado BOOLEAN DEFAULT false,
  email_error TEXT,
  destinatarios TEXT[],
  
  -- Auditoría
  fecha_disparo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_email TIMESTAMP
);

CREATE INDEX idx_alertas_historial_dispositivo ON alertas_historial(dispositivo_id);
CREATE INDEX idx_alertas_historial_instalacion ON alertas_historial(instalacion_id);
CREATE INDEX idx_alertas_historial_fecha ON alertas_historial(fecha_disparo DESC);

-- =====================================================
-- TABLA: informes
-- Registro de informes PDF generados
-- =====================================================
CREATE TABLE informes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- A qué instalación pertenece
  instalacion_id UUID REFERENCES instalaciones(id) ON DELETE CASCADE,
  
  -- Período del informe
  mes INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio INT NOT NULL CHECK (anio BETWEEN 2020 AND 2100),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  
  -- Archivo generado
  ruta_pdf TEXT,
  tamano_bytes BIGINT,
  
  -- Estado
  generado BOOLEAN DEFAULT false,
  email_enviado BOOLEAN DEFAULT false,
  email_destinatarios TEXT[],
  
  -- Auditoría
  fecha_generacion TIMESTAMP,
  fecha_envio_email TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_informes_instalacion ON informes(instalacion_id);
CREATE INDEX idx_informes_periodo ON informes(anio DESC, mes DESC);
CREATE UNIQUE INDEX idx_informes_unique ON informes(instalacion_id, anio, mes);

-- =====================================================
-- TABLA: sesiones
-- Para gestionar tokens JWT (opcional)
-- =====================================================
CREATE TABLE sesiones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expira_en TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sesiones_usuario ON sesiones(usuario_id);
CREATE INDEX idx_sesiones_token ON sesiones(token_hash);
CREATE INDEX idx_sesiones_expira ON sesiones(expira_en);

-- =====================================================
-- TABLA: logs_sistema
-- Auditoría de acciones importantes
-- =====================================================
CREATE TABLE logs_sistema (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  accion VARCHAR(100) NOT NULL,  -- 'LOGIN', 'CREAR_DISPOSITIVO', etc.
  entidad VARCHAR(50),            -- 'usuario', 'dispositivo', etc.
  entidad_id UUID,
  detalles JSONB,                 -- Datos adicionales en JSON
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logs_usuario ON logs_sistema(usuario_id);
CREATE INDEX idx_logs_accion ON logs_sistema(accion);
CREATE INDEX idx_logs_fecha ON logs_sistema(created_at DESC);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER trigger_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_instalaciones_updated_at
  BEFORE UPDATE ON instalaciones
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_dispositivos_updated_at
  BEFORE UPDATE ON dispositivos
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_alertas_config_updated_at
  BEFORE UPDATE ON alertas_config
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- =====================================================
-- DATOS INICIALES (SEEDS)
-- =====================================================

-- Usuario administrador por defecto
-- Contraseña: "admin123" (cambiar en producción)
-- Hash bcrypt de "admin123"
INSERT INTO usuarios (username, email, role, password_hash, nombre, apellidos)
VALUES (
  'admin',
  'admin@ugr.es',
  'ADMIN',
  '$2b$10$rKvVx.5qNYqYJ5fH0ZvBZOxH9jX7qLNYtKxJ8yP8nK5vJ6fH0ZvBZ',
  'Administrador',
  'del Sistema'
);

-- Instalación de ejemplo
INSERT INTO instalaciones (codigo, nombre, descripcion, ubicacion)
VALUES (
  'INST_A',
  'Instalación A',
  'Laboratorio de Física Nuclear',
  'ETSIIT, Planta 3, Sala 301'
);

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista: Dispositivos con su instalación y responsable
CREATE VIEW v_dispositivos_completos AS
SELECT 
  d.id,
  d.mac_address,
  d.nombre AS dispositivo_nombre,
  d.activo AS dispositivo_activo,
  d.ultima_conexion,
  i.nombre AS instalacion_nombre,
  i.codigo AS instalacion_codigo,
  u.nombre || ' ' || u.apellidos AS responsable_nombre,
  u.email AS responsable_email
FROM dispositivos d
LEFT JOIN instalaciones i ON d.instalacion_id = i.id
LEFT JOIN usuarios u ON i.responsable_id = u.id;

-- Vista: Alertas recientes (últimas 24 horas)
CREATE VIEW v_alertas_recientes AS
SELECT 
  ah.id,
  ah.tipo,
  ah.valor_detectado,
  ah.fecha_disparo,
  d.nombre AS dispositivo_nombre,
  d.mac_address,
  i.nombre AS instalacion_nombre,
  ah.email_enviado
FROM alertas_historial ah
LEFT JOIN dispositivos d ON ah.dispositivo_id = d.id
LEFT JOIN instalaciones i ON ah.instalacion_id = i.id
WHERE ah.fecha_disparo > NOW() - INTERVAL '24 hours'
ORDER BY ah.fecha_disparo DESC;

-- =====================================================
-- COMENTARIOS EN TABLAS
-- =====================================================

COMMENT ON TABLE usuarios IS 'Usuarios del sistema (admin y responsables)';
COMMENT ON TABLE instalaciones IS 'Instalaciones físicas donde están los IoT';
COMMENT ON TABLE dispositivos IS 'Dispositivos IoT registrados';
COMMENT ON TABLE alertas_config IS 'Configuración de alertas por instalación';
COMMENT ON TABLE alertas_historial IS 'Histórico de alertas disparadas';
COMMENT ON TABLE informes IS 'Informes PDF generados mensualmente';

-- =====================================================
-- FIN DEL ESQUEMA
-- =====================================================
