const LogCambio = require('../models/LogCambio');
const Usuario = require('../models/Usuario');

async function obtenerLogCambios(req, res) {
    try {
        const { usuario_id } = req.query;
        const where = usuario_id ? { usuario_id } : {};

        const logs = await LogCambio.findAll({
            where,
            order: [['fecha', 'DESC']],
            limit: 100
        });

        res.json({ logs });
    } catch (error) {
        console.error('Error al obtener log de cambios:', error);
        res.status(500).json({ error: 'Error al obtener log de cambios' });
    }
}

module.exports = { obtenerLogCambios };