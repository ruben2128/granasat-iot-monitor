const LogAcceso = require('../models/LogAcceso');
const { Op } = require('sequelize');

async function obtenerLog(req, res){
    try {
        if(req.user.role !== 'ADMIN'){
            return res.status(403).json({ error: 'No tienes permiso para ver el log' });
        }

        const { dias = 30 } = req.query;

        const limite = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

        const registros = await LogAcceso.findAll({
            where: {
                fecha: { [Op.gte]: limite }
            },
            order: [['fecha', 'DESC']],
            limit: 500
        });

        res.json({ total: registros.length, registros });

    } catch (error) {
        console.error('Error al obtener el log:', error);
        res.status(500).json({ error: 'Error al obtener el log de accesos' });
    }
}

module.exports = { obtenerLog };