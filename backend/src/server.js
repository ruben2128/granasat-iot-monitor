const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection, sequelize } = require('./config/database');

// Importar los modelos para saber las asociaciones entre ellos
require('./models/index');

//Importar el servicio de las alertas
const {procesarAlertas} = require('./services/alertaService');

// Importar las rutas
const authRoutes = require('./routes/authRoutes');
const instalacionRoutes = require('./routes/instalacionRoutes');
const dispositivoRoutes = require('./routes/dispositivoRoutes');
const alertaConfigRoutes = require('./routes/alertaConfigRoutes');
const lecturaRoutes = require('./routes/lecturaRoutes');
const informeRoutes = require('./routes/informeRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const logRoutes = require('./routes/logRoutes');
const emailHistorialRoutes = require('./routes/emailHistorialRoutes');
const configEmailRoutes = require('./routes/configEmailRoutes');
const dockerRoutes = require('./routes/dockerRoutes');

// Crear app de Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Health check para comprobar que esta desplegado
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

app.get('/api/test-alertas', async (req, res) => {
  await procesarAlertas();
  res.json({ message: 'Alertas procesadas' });
});

app.get('/api/setup-admin', async (req, res) => {
    try {
        const bcrypt = require('bcrypt');
        const Usuario = require('./models/Usuario');
        const hash = await bcrypt.hash('admin123', 10);
        
        const [actualizado] = await Usuario.update({ password_hash: hash },{ where: { username: 'admin' }});

        if (actualizado === 0) {
            await Usuario.create({password_hash: hash, role: 'ADMIN', nombre: 'Administrador', apellidos: 'del Sistema', email: 'admin@granasat.ugr.es', activo: true, username: 'admin'});
        }

        res.json({message: 'Admin listo'});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Rutas que pertenecen a la API
app.use('/api/auth', authRoutes);
app.use('/api/instalaciones', instalacionRoutes);
app.use('/api/dispositivos', dispositivoRoutes);
app.use('/api/alertas-config', alertaConfigRoutes);
app.use('/api/dispositivos', lecturaRoutes);
app.use('/api/informes', informeRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/log', logRoutes);
app.use('/api/email-historial', emailHistorialRoutes);
app.use('/api/config-email', configEmailRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/docker', dockerRoutes);

// Middleware para las rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path
  });
});

//Puerto que vamos a utilizar
const PORT = process.env.PORT || 3001;

//Funcion encargada de conectar con Postgre, sincronizar los modelos y arrancar el servidor
async function startServer() {
  try {
    const conexBBDD = await testConnection();

    if (!conexBBDD) {
      console.error('No se pudo conectar a la base de datos');
      process.exit(1);
    }

    // La BD ya esta creada desde DBeaver, solo sincronizar sin modificar nada
    await sequelize.sync({ alter: false });
    console.log('Tablas sincronizadas con la BD');

    app.listen(PORT, () => {
      console.log(`Entorno: ${process.env.NODE_ENV}`);
      console.log(`\nRutas disponibles:`);
      console.log(`   POST   /api/auth/register`);
      console.log(`   POST   /api/auth/login`);
      console.log(`   GET    /api/auth/me`);
      console.log(`   GET    /api/instalaciones`);
      console.log(`   GET    /api/instalaciones/:id`);
      console.log(`   POST   /api/instalaciones`);
      console.log(`   PUT    /api/instalaciones/:id`);
      console.log(`   DELETE /api/instalaciones/:id`);
      console.log(`   GET    /api/dispositivos/:id`);
      console.log(`   GET    /api/dispositivos`);
      console.log(`   POST   /api/dispositivos`);
      console.log(`   PUT    /api/dispositivos/:id`);
      console.log(`   DELETE /api/dispositivos/:id`);
      console.log(`   GET    /api/alertas-config/:id`);
      console.log(`   GET    /api/alertas-config`);
      console.log(`   POST   /api/alertas-config`);
      console.log(`   PUT    /api/alertas-config/:id`);
      console.log(`   DELETE /api/alertas-config/:id`);
      console.log(`   GET    /api/dispositivos/:id/lecturas`);
      console.log(`   GET    /api/dispositivos/:id/lecturas/ultima`);
      console.log(`   POST   /api/informes/generar`);
      console.log(`   GET    /api/informes`);
      console.log(`   GET    /api/informes/:id/descargar`);

      const intervalo = 5*60*1000; // 5 Minutos en ms
      console.log(`\n Arrancado el servicio de alertas, con un intervalo de 5 minutos`);
      procesarAlertas();
      setInterval(procesarAlertas, intervalo);
    });
  } catch (error) {
    console.error('Error iniciando servidor:', error);
    process.exit(1);
  }
}

startServer();