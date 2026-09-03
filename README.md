# Sistema de Supervisión de Instalaciones Radiactivas — GranaSAT

Plataforma de supervisión de dispositivos IoT y aplicación Android de información al usuario.

**Trabajo Fin de Grado — Grado en Ingeniería Informática**
Escuela Técnica Superior de Ingenierías Informática y de Telecomunicación
Universidad de Granada

**Autor:** Rubén Martín Jáimez
**Director:** Prof. Andrés Roldán Aranda. Grupo de investigación GranaSAT

---

## Descripción

Sistema de vigilancia radiológica para instalaciones radiactivas. Los nodos ESP32 instalados en cada recinto miden la tasa de dosis ambiental,
el estado del suministro eléctrico y la actividad del elemento de irradiación, y publican las lecturas por MQTT.
Telegraf las inserta en InfluxDB, y un backend en Node.js las expone mediante una API REST que consumen una aplicación web y una aplicación Android.

Sobre esos datos, el sistema:

- Clasifica cada recinto según las zonas radiológicas del **Real Decreto 1029/2022**
  (vigilada, controlada, permanencia limitada, permanencia reglamentada y acceso prohibido), con umbrales configurables desde la propia interfaz.
- Evalúa cada cinco minutos **seis mecanismos de alerta** independientes y notifica por correo al responsable de la instalación.
- Mantiene el inventario de equipos con sus datos de calibración y verificación periódica, y el registro de licencias del Consejo de Seguridad Nuclear del personal.
- Genera informes mensuales en PDF de forma automática.

El control de acceso está segregado por rol: cada usuario ve únicamente las instalaciones o los dispositivos que le corresponden.

---

## Arquitectura

```
  ESP32  ──MQTT──▶  Broker  ──▶  Telegraf  ──▶  InfluxDB
                                                    │
                                                    ▼
   Web (Next.js)  ──┐                       Backend (Express)
                    ├──── HTTPS / REST ───▶        │
   Android (Expo) ──┘                              ▼
                                              PostgreSQL
```

Dos bases de datos con propósitos distintos:

| Base de datos | Contenido |
|---|---|
| **PostgreSQL 15** | 13 tablas y 2 vistas: usuarios, instalaciones, dispositivos, licencias, invitaciones, reglas e historial de alertas, informes, configuración, plantillas de correo y registros de auditoría. |
| **InfluxDB 2.x** | Series temporales: las lecturas que publican los nodos, indexadas por dirección MAC bajo el *measurement* `radiacion_iot`. |

---

## Stack tecnológico

### Captación e ingesta

| Componente | Función |
|---|---|
| ESP32 | Microcontrolador con Wi-Fi que muestrea el detector y publica por MQTT |
| Mosquitto / EMQX | Broker MQTT |
| Telegraf | Puente MQTT → InfluxDB |
| InfluxDB 2.x | Base de datos de series temporales |
| Grafana | Cuadros de mando técnicos sobre InfluxDB |

### Backend

| Componente | Función |
|---|---|
| Node.js + Express | API REST |
| Sequelize | ORM sobre PostgreSQL |
| PostgreSQL 15 | Base de datos relacional |
| JWT + bcrypt | Autenticación sin estado y cifrado de contraseñas |
| Nodemailer | Envío de los correos de alerta e informe |
| PDFKit + chartjs-node-canvas | Generación de los informes mensuales y sus gráficas |
| node-cron | Ciclo de alertas (5 min) e informes automáticos (día 1 a las 06:00) |

### Frontend web

| Componente | Función |
|---|---|
| Next.js | Framework React con enrutado por ficheros |
| Recharts | Gráficas de evolución temporal |
| Leaflet | Mapa de dispositivos sobre OpenStreetMap |

Los estilos se resuelven con objetos de estilo en línea a partir de la paleta de `src/lib/temas.js`, que implementa los cuatro temas de la interfaz (claro, oscuro,
alto contraste y azul).

### Aplicación Android

| Componente | Función |
|---|---|
| React Native + Expo | Aplicación móvil y generación del APK |
| React Navigation | Navegación entre pantallas |
| AsyncStorage | Persistencia del token de sesión |

---

## Estructura del repositorio

```
.
├── arduino/          Sketches del nodo ESP32 (Wi-Fi, MQTT, envío de lecturas)
├── backend/          API REST en Node.js + Express
│   ├── src/
│   │   ├── controllers/   Lógica de cada recurso
│   │   ├── models/        Modelos Sequelize
│   │   ├── routes/        Definición de endpoints y guardias de acceso
│   │   ├── middleware/    Autenticación JWT y subida de ficheros
│   │   └── services/      Alertas, correo, InfluxDB e informes
│   └── tests/        Suite Jest + Supertest
├── conf/             Configuración de Mosquitto y Telegraf
├── database/         Esquema SQL de PostgreSQL
├── frontend/         Aplicación web Next.js
├── mobile/           Aplicación Android React Native (Expo)
├── docker-compose.prod.yml
└── LICENSE
```

---

## Roles y control de acceso

| Rol | Alcance |
|---|---|
| `ADMIN` | Acceso completo: usuarios, instalaciones, dispositivos, alertas, configuración del sistema y registros de auditoría. |
| `RESPONSABLE` | Las instalaciones de las que es responsable: sus dispositivos, sus alertas y sus informes. No puede dar de alta instalaciones ni administrar usuarios. |
| `TITULAR` | Solo los dispositivos que figuran a su nombre, en modo consulta. No accede a instalaciones, alertas ni informes. |

El control de acceso se aplica en dos capas: el *middleware* `requireAdmin` restringe a nivel de ruta los *endpoints* reservados al administrador, y los
controladores accesibles a varios roles comprueban la propiedad del recurso antes de responder. 
Las comprobaciones están escritas como listas blancas, de modo que un rol nuevo queda denegado por omisión.

> Estos son roles **de aplicación** y no se corresponden con las figuras reglamentarias de titular, supervisor y operador del Real Decreto 1836/1999.
> Las licencias del CSN se registran como un dato independiente del rol.

---

## Puesta en marcha

### Requisitos

- Node.js ≥ 18
- Docker y Docker Compose
- Acceso a una instancia de InfluxDB 2.x y a un broker MQTT

### 1. Variables de entorno

```bash
cp .env.example .env
```

Rellena `.env` con las credenciales de tu despliegue. 

| Variable | Descripción |
|---|---|
| `DB_PASSWORD` | Contraseña de PostgreSQL |
| `JWT_SECRET` | Secreto de firma de los tokens. Usa una cadena aleatoria larga. |
| `INFLUX_TOKEN` | Token de InfluxDB |
| `SMTP_USER` / `SMTP_PASS` | Credenciales del servidor de correo |

### 2. Infraestructura

```bash
docker compose -f docker-compose.prod.yml up -d
```

Levanta cinco servicios: PostgreSQL, Mosquitto, Grafana, el *backend* y el *frontend*.

> **InfluxDB y Telegraf no están en este *compose*.** En el despliegue de GranaSAT son contenedores compartidos, gestionados por la infraestructura del grupo. El
> *backend* los alcanza por nombre de host a través de la red Docker común; la variable `INFLUX_URL` debe apuntar al contenedor real.

### 3. Base de datos

```bash
psql -h localhost -U tfg_user -d tfg_iot -f database/schema.sql
```

### 4. Backend

```bash
cd backend
npm ci
npm start          # o npm run dev con nodemon
```

Al arrancar registra el servicio de alertas (cada 5 min) y el de informes mensuales.

### 5. Frontend web

```bash
cd frontend
npm ci
npm run dev        # http://localhost:3000
```

### 6. Aplicación Android

En desarrollo:

```bash
cd mobile
npm ci
npx expo start
```

Escanea el QR con Expo Go. La URL base se resuelve en `mobile/src/lib/api.js`: en desarrollo apunta a la IP local de la máquina —**ajústala a la tuya**— y en una
compilación de producción, al servidor de GranaSAT.

Para generar el APK instalable:

```bash
eas build -p android --profile preview
```

### 7. Nodos ESP32

Los sketches de `arduino/` requieren un fichero `secrets.h` en cada carpeta, que no
se versiona. Copia `secrets_ejemplo.h` y rellena las credenciales de la red y del
broker.

---

## Tests

```bash
cd backend
npm test
```

41 casos sobre cinco módulos (autenticación, instalaciones, dispositivos, alertas y usuarios). La capa de persistencia se simula con `jest.mock()`, de modo que la suite no necesita bases de datos reales.

---

## API REST

Todos los *endpoints* salvo `/api/auth/login` requieren la cabecera
`Authorization: Bearer <token>`.

| Prefijo | Contenido |
|---|---|
| `/api/auth` | Login, registro y usuario autenticado |
| `/api/instalaciones` | CRUD de instalaciones |
| `/api/dispositivos` | CRUD de dispositivos, lecturas, test de conexión y foto |
| `/api/alertas-config` | Reglas de alerta por dispositivo |
| `/api/informes` | Informes mensuales: listado, generación y descarga |
| `/api/usuarios` | Gestión de usuarios |
| `/api/usuarios/:id/licencias` | Licencias del CSN asociadas a un usuario |
| `/api/invitaciones` | Alta de usuarios por invitación con token de un solo uso |
| `/api/configuracion` | Umbrales de zona radiológica |
| `/api/config-email` · `/api/plantilla-email` | Servidor SMTP y plantilla HTML |
| `/api/email-historial` | Historial de correos emitidos |
| `/api/log` · `/api/log-cambios` | Auditoría de accesos y de cambios |
| `/api/docker` | Ocupación de los volúmenes Docker |

---

## Mecanismos de alerta

El servicio evalúa seis comprobaciones en cada ciclo de cinco minutos:

| Mecanismo | Condición |
|---|---|
| Umbral configurable | El valor de un campo cumple la condición definida en la regla |
| Z-Score | Lectura a más de 3 desviaciones estándar de la media de los últimos 30 minutos |
| Media consecutiva | 5 lecturas seguidas por encima de la media de las últimas 24 h |
| Calibración | Un equipo tiene la calibración a menos de 90 días de caducar |
| Conexión | Un dispositivo pasa a estar conectado o desconectado |
| InfluxDB | La base de datos de series temporales no responde |

Toda detección se registra en `alertas_historial` **aunque el envío del correo falle**, con el motivo en `email_error`: la trazabilidad no depende de la notificación. Unperíodo de silencio de 30 minutos evita el reenvío mientras la condición persista.

---

## Integración con dispositivos de terceros

La plataforma identifica cada equipo por su dirección MAC y acepta cualquier fuente que publique en el formato esperado. Como validación de esa interoperabilidad se
integró el dispositivo TRMS desarrollado en un Trabajo Fin de Máster del propio grupo: un ESP32 con pantalla táctil gobernada por LVGL, ajeno a este proyecto.

La integración se resolvió como un módulo independiente sobre el firmware original, con solo tres puntos de enganche y sin modificar una línea del *backend*. Basta con
dar de alta el equipo con su dirección MAC desde la interfaz de administración.

---

## Licencia

El **código fuente** de este repositorio se publica bajo licencia **MIT** (véase [`LICENSE`](LICENSE)).

La **memoria** del Trabajo Fin de Grado es una obra distinta y se publica bajo Creative Commons Attribution-ShareAlike 4.0 International (**CC BY-SA 4.0**).