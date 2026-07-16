const Configuracion = require('../models/Configuracion');

/**
 * Devuelve todas las entradas de configuración del sistema.
 * Solo accesible por ADMIN.
 */
async function obtenerConfiguracion(req, res) {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'No tienes permiso' });
        }

        const config = await Configuracion.findAll({
            order: [['clave', 'ASC']]
        });

        res.json({ configuracion: config });

    } catch (error) {
        console.error('Error al obtener configuración:', error);
        res.status(500).json({ error: 'Error al obtener la configuración' });
    }
}

/**
 * Devuelve todas las entradas de configuración sin requerir autenticación.
 */
async function obtenerConfiguracionPublica(req, res) {
    try {
        const config = await Configuracion.findAll({
            order: [['clave', 'ASC']]
        });

        // Convertir a objeto clave-valor para facilitar el uso en el frontend
        const resultado = {};
        config.forEach(function(c) {
            resultado[c.clave] = parseFloat(c.valor);
        });

        res.json({ configuracion: resultado });

    } catch (error) {
        console.error('Error al obtener configuración pública:', error);
        res.status(500).json({ error: 'Error al obtener la configuración' });
    }
}

/**
 * Actualiza el valor de una clave de configuración existente.
 * Solo accesible por ADMIN.
 */
async function actualizarConfiguracion(req, res) {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'No tienes permiso' });
        }

        const { clave } = req.params;
        const { valor } = req.body;

        if (!valor && valor !== 0) {
            return res.status(400).json({ error: 'El valor es obligatorio' });
        }

        const config = await Configuracion.findByPk(clave);

        if (!config) {
            return res.status(404).json({ error: 'Clave de configuración no encontrada' });
        }

        await config.update({ valor: String(valor) });

        res.json({ message: 'Configuración actualizada correctamente', configuracion: config });

    } catch (error) {
        console.error('Error al actualizar configuración:', error);
        res.status(500).json({ error: 'Error al actualizar la configuración' });
    }
}

module.exports = { obtenerConfiguracion, obtenerConfiguracionPublica, actualizarConfiguracion };