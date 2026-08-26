const Licencia = require('../models/Licencia');
const Instalacion = require('../models/Instalacion');

async function obtenerLicencias(req, res) {
    try {
        const { usuario_id } = req.params;

        if (req.user.role !== 'ADMIN' && usuario_id !== req.user.id) {
            return res.status(403).json({ error: 'No tienes acceso a las licencias de otro usuario' });
        }
        
        const licencias = await Licencia.findAll({
            where: { usuario_id },
            include: [{
                model: Instalacion,
                as: 'instalacion',
                attributes: ['id', 'nombre', 'codigo_referencia']
            }],
            order: [['created_at', 'DESC']]
        });
        res.json({ licencias });
    } catch (error) {
        console.error('Error al obtener las licencias:', error);
        res.status(500).json({ error: 'Error al obtener licencias' });
    }
}

async function crearLicencia(req, res) {
    try {
        const { usuario_id } = req.params;
        const { instalacion_id, campo_aplicacion, nivel, fecha_concesion, fecha_caducidad } = req.body;

        if (!campo_aplicacion) {
            return res.status(400).json({ error: 'El campo de aplicación es obligatorio' });
        }

        const licencia = await Licencia.create({
            usuario_id,
            instalacion_id: instalacion_id || null,
            campo_aplicacion,
            fecha_concesion: fecha_concesion || null,
            fecha_caducidad: fecha_caducidad || null,
            nivel: nivel || null
        });

        res.status(201).json({ message: 'Licencia creada correctamente', licencia });
    } catch (error) {
        console.error('Error al crear la licencia:', error);
        res.status(500).json({ error: 'Error al crear licencia' });
    }
}

async function eliminarLicencia(req, res) {
    try {
        const { id } = req.params;
        const licencia = await Licencia.findByPk(id);

        if (!licencia) {
            return res.status(404).json({ error: 'Licencia no encontrada' });
        }

        await licencia.destroy();
        res.json({ message: 'Licencia eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar la licencia:', error);
        res.status(500).json({ error: 'Error al eliminar licencia' });
    }
}

module.exports = { obtenerLicencias, crearLicencia, eliminarLicencia };