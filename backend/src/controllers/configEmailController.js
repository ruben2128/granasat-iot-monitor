const ConfigEmail = require('../models/ConfigEmail');
const emailService = require('../services/emailService');

async function obtenerConfigEmail(req, res){
    try {
        if(req.user.role !== 'ADMIN'){
            return res.status(403).json({ error: 'No tienes permiso' });
        }

        const configs = await ConfigEmail.findAll({
            order: [['updated_at', 'DESC']]
        });

        const configActiva = configs.find(function(c) { return c.activo; });

        if(!configActiva){
            return res.json({
                configs: [],
                configActiva: {
                    smtp_host: process.env.SMTP_HOST,
                    smtp_port: process.env.SMTP_PORT,
                    smtp_user: process.env.SMTP_USER,
                    smtp_pass: '',
                    smtp_secure: false,
                    nombre: 'Configuración del .env'
                },
                fuente: 'env'
            });
        }

        res.json({ configs, configActiva, fuente: 'bd' });
    } catch (error){
        console.error('Error al obtener config email:', error);
        res.status(500).json({ error: 'Error al obtener la configuración' });
    }
}

async function guardarConfigEmail(req, res){
    try {
        if(req.user.role !== 'ADMIN'){
            return res.status(403).json({ error: 'No tienes permiso' });
        }

        const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure, nombre } = req.body;

        if(!smtp_host || !smtp_port || !smtp_user || !smtp_pass){
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        // Desactivar todas las configs
        await ConfigEmail.update({ activo: false }, { where: {}});

        const passEncoded = Buffer.from(smtp_pass).toString('base64');
        const config = await ConfigEmail.create({nombre: nombre || smtp_host, smtp_host, smtp_port: parseInt(smtp_port), smtp_user, smtp_pass: passEncoded, smtp_secure: smtp_secure || false, activo: true});

        const pass = Buffer.from(config.smtp_pass, 'base64').toString('utf8');
        emailService.actualizarTransporter(smtp_host, smtp_port, smtp_user, pass, smtp_secure);

        res.json({ message: 'Configuración guardada correctamente', config });

    } catch (error){
        console.error('Error al guardar config email:', error);
        res.status(500).json({ error: 'Error al guardar la configuración' });
    }
}

async function activarConfigEmail(req, res){
    try {
        if(req.user.role !== 'ADMIN'){
            return res.status(403).json({ error: 'No tienes permiso' });
        }

        const { id } = req.params;
        const config = await ConfigEmail.findByPk(id);

        if(!config){
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }

        await ConfigEmail.update({ activo: false }, { where: {}});
        await config.update({ activo: true });

        const pass = Buffer.from(config.smtp_pass, 'base64').toString('utf8');
        emailService.actualizarTransporter(config.smtp_host, config.smtp_port, config.smtp_user, pass, config.smtp_secure);

        res.json({ message: 'Configuración activada correctamente', config });
    } catch (error){
        console.error('Error al activar config email:', error);
        res.status(500).json({ error: 'Error al activar la configuración' });
    }
}

async function eliminarConfigEmail(req, res){
    try {
        if(req.user.role !== 'ADMIN'){
            return res.status(403).json({ error: 'No tienes permiso' });
        }

        const { id } = req.params;
        const config = await ConfigEmail.findByPk(id);

        if(!config){
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }

        if(config.activo){
            return res.status(400).json({ error: 'No puedes eliminar la configuración activa' });
        }

        await config.destroy();
        res.json({ message: 'Configuración eliminada correctamente' });
    } catch (error){
        console.error('Error al eliminar config email:', error);
        res.status(500).json({ error: 'Error al eliminar la configuración' });
    }
}

async function testEmail(req, res){
    try {
        if(req.user.role !== 'ADMIN'){
            return res.status(403).json({ error: 'No tienes permiso' });
        }

        const { destinatario } = req.body;

        if(!destinatario){
            return res.status(400).json({ error: 'El campo destinatario es obligatorio' });
        }

        await emailService.enviarEmailTest(destinatario);

        res.json({ message: `Email de prueba enviado correctamente a ${destinatario}` });

    } catch (error){
        console.error('Error al enviar email de test:', error);
        res.status(500).json({ error: 'Error al enviar el email de prueba. Revisa la configuración SMTP.' });
    }
}

module.exports = { obtenerConfigEmail, guardarConfigEmail, activarConfigEmail, eliminarConfigEmail, testEmail };