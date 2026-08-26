const influxService = require('../services/influxService');
const Dispositivo = require('../models/Dispositivo');
const Instalacion = require('../models/Instalacion');

// Comprueba si el usuario tiene permiso para ver los datos de un dispositivo
// El ADMIN siempre tiene acceso, el RESPONSABLE solo si el dispositivo pertenece a una de sus instalaciones
async function tieneAcceso(idUsuario, rol, dispositivo){
    if(rol === 'ADMIN'){
        return true;
    }
    if(dispositivo.titular_id === idUsuario){
        return true;
    }

    const instalacion = await Instalacion.findOne({
        where:{
            id: dispositivo.instalacion_id, 
            responsable_id: idUsuario
        }
    });

    if(instalacion){
        return true;
    } else {
        return false;
    }
}

/*
    Ruta: GET /api/dispositivos/:id/lecturas
    Devuelve el historial de lecturas de un dispositivo desde InfluxDB
*/
async function obtenerLecturas(req,res){
    try {
        const {id} = req.params;
        const {rango = '-24h', variable} = req.query;

        const rangosValidos = ['-1h', '-6h', '-24h', '-7d', '-30d'];

        if(!rangosValidos.includes(rango)){
            return res.status(400).json({
                error: `Rango invalido, Usa 1h, 6h, 24h, 7d o 30d`
            });
        }

        const dispositivo = await Dispositivo.findByPk(id);

        if(!dispositivo){
            return res.status(404).json({error: 'Dispositivo no encontrado'});
        }

        const acceso = await tieneAcceso(req.user.id, req.user.role, dispositivo);

        if(!acceso){
            return res.status(403).json({error: 'No tiene acceso a este dispositivo'});
        }

        if (!dispositivo.medida_continuo || !dispositivo.mac_address) {
            return res.status(400).json({ error: 'Este dispositivo no es un equipo de medida en continuo y no registra lecturas' });
        }

        const lecturas = await influxService.obtenerLecturas(dispositivo.mac_address, rango, variable);

        res.json({
            dispositivo: {
                id: dispositivo.id,
                nombre: dispositivo.nombre,
                mac_address: dispositivo.mac_address
            },
            rango,
            variable: variable || 'todas',
            total: lecturas.length,
            lecturas
        });

    } catch(error){
        console.error('Error obteniendo las lecturas:', error);
        res.status(500).json({error: 'Error al obtener las lecturas'});
    }
}

/*
    Ruta: GET /api/dispositivos/:id/lecturas/ultima
    Devuelve la última lectura de un dispositivo desde InfluxDB
*/
async function obtenerUltimaLectura(req, res){
    try {
        const {id} = req.params;
        const dispositivo = await Dispositivo.findByPk(id);

        if(!dispositivo){
            return res.status(404).json({error: 'Dispositivo no encontrado'});
        }

        const acceso = await tieneAcceso(req.user.id, req.user.role, dispositivo);

        if(!acceso){
            return res.status(403).json({error: 'No tiene acceso a este dispositivo'});
        }

        if (!dispositivo.medida_continuo || !dispositivo.mac_address) {
            return res.status(400).json({ error: 'Este dispositivo no es un equipo de medida en continuo y no registra lecturas' });
        }

        const ultima = await influxService.obtenerUltimaLectura(dispositivo.mac_address);

        res.json({
            dispositivo: {
                id: dispositivo.id,
                nombre: dispositivo.nombre,
                mac_address: dispositivo.mac_address
            },
            ultima_lectura: ultima
        });
    } catch (error){
        console.error('Error al obtener la ultima lectura:',error);
        res.status(500).json({error: 'Error al obtener la ultima lectura'});
    }
}

module.exports = {obtenerLecturas, obtenerUltimaLectura};