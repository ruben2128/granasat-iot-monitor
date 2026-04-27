Sistema de Supervisión IoT — GranaSAT

Trabajo Fin de Grado — Ingeniería Informática
Escuela Técnica Superior de Ingenierías Informática y de Telecomunicación
Universidad de Granada

Descripción
Plataforma web para la supervisión y monitorización de dispositivos IoT en instalaciones de GranaSAT. El sistema permite gestionar instalaciones, dispositivos, alertas y generar informes automáticos mensuales.

Los dispositivos ESP32 envían datos de radiación, suministro eléctrico y estado del elemento de irradiación mediante el protocolo MQTT. Estos datos son almacenados en InfluxDB y visualizados tanto en Grafana como en la plataforma web desarrollada.

Stack Tecnológico

IoT
ESP32   Microcontrolador con WiFi integrado
MQTT (Mosquitto)    Protocolo de comunicación IoT
Telegraf            Bridge MQTT a InfluxDB
InfluxDB 2.x        Base de datos de series temporales
Grafana             Dashboard de visualización técnica

Backend
Node.js + Express   API REST
Sequelize           ORM para PostgreSQL
PostgreSQL 15       Base de datos relacional
JWT + bcrypt        Autenticación y seguridad
Nodemailer          Envío de emails
PDFKit              Generación de informes PDF
InfluxDB Client     Consulta de lecturas IoT

Frontend
Next.js     Framework web React
React       Librería de interfaz de usuario
Tailwind CSS    EstilosAxiosPeticiones HTTP


Base de Datos
El sistema utiliza dos bases de datos con propósitos distintos:

PostgreSQL — Datos relacionales: usuarios, instalaciones, dispositivos, alertas configuradas e informes
InfluxDB — Series temporales: lecturas de los dispositivos IoT en tiempo real

Tablas principales (PostgreSQL)

usuarios — Administradores y responsables de instalaciones
instalaciones — Ubicaciones físicas con dispositivos IoT
dispositivos — Dispositivos ESP32 registrados
alertas_config — Configuración de umbrales de alerta
alertas_historial — Registro de alertas disparadas
informes — Control de informes PDF generados


Instalación y Despliegue

Requisitos previos
Node.js >= 18
PostgreSQL 15
InfluxDB 2.x
Mosquitto (broker MQTT)
Docker y Docker Compose 

