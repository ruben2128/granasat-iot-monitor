const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

const { testConnection, sequelize } = require('./config/database');
const app = require('./app');

// Importar los modelos para saber las asociaciones entre ellos
require('./models/index');

//Importar el servicio de las alertas
const {procesarAlertas} = require('./services/alertaService');

//Importar el servicio de los informes mensuales
const {generarInformesMensualesAutomaticos} = require('./services/informeService');

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
const plantillaEmailRoutes = require('./routes/plantillaEmailRoutes');
const licenciaRoutes = require('./routes/licenciaRoutes');

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

    const emailService = require('./services/emailService');
    await emailService.cargarConfigEmailActiva();

    app.listen(PORT, () => {
      const intervalo = 5*60*1000; // 5 Minutos en ms

      console.log(`\n Arrancado el servicio de alertas, con un intervalo de 5 minutos`);
      procesarAlertas();
      setInterval(procesarAlertas, intervalo);

      // Informes mensuales: dia 1 de cada mes a las 06:00, genera el informe del mes que acaba de cerrar
      console.log(' Programado el servicio de informes mensuales, dia 1 de cada mes a las 06:00');
      cron.schedule('0 6 1 * *', generarInformesMensualesAutomaticos, { timezone: 'Europe/Madrid' });
    });
  } catch (error) {
    console.error('Error iniciando servidor:', error);
    process.exit(1);
  }
}

startServer();