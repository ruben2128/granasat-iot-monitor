const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importar los modelos para saber las asociaciones entre ellos
require('./models/index');

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
const logCambioRoutes = require('./routes/logCambioRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() });
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
app.use('/api/plantilla-email', plantillaEmailRoutes);
app.use('/api/usuarios/:usuario_id/licencias', licenciaRoutes);
app.use('/api/log-cambios', logCambioRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada', path: req.path });
});

module.exports = app;