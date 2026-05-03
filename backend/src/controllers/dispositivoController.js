const Dispositivo = require('../models/Dispositivo');
const Instalacion = require('../models/Instalacion');

/*
    Ruta: GET /api/dispositivos/ 
    Devolver todos los dispositivos de las instalaciones donde el usuario es responsable. O todos los dispositivos, si el usuario es administrador
*/
async function obtenerDispositivos(req, res) {
    try {
        let dispositivos;

        if(req.user.role === 'ADMIN') {
            dispositivos = await Dispositivo.findAll ({
                include: [{
                    model: Instalacion,
                    as: 'instalacion',
                    attributes: ['id', 'nombre', 'codigo']
                }],
                order: [['created_at', 'DESC']]
            });
        } else {
            // Buscar solo dispositivos de las instalaciones donde el usuario es responsable
            dispositivos = await Dispositivo.findAll({
                include: [{
                    model: Instalacion,
                    as: 'instalacion',
                    attributes: ['id', 'nombre', 'codigo'],
                    where: { responsable_id: req.user.id },
                    required: true // INNER JOIN: solo dispositivos que tengan instalacion del responsable
                }],
                order: [['created_at', 'DESC']]
            });
        }

        res.json({
            total:dispositivos.length,
            dispositivos
        });
    } catch (error) {
        console.error('Error al obtener los dispositivos:', error);
        res.status(500).json({ error: 'Error al obtener los dispositivos'});
    }
}

/*
    Ruta: GET /api/dispositivos/:id
    Devolver el dispositivo con el id :id
*/
async function obtenerDispositivoPorId(req, res) {
    try {
        const { id } = req.params;

        const dispositivo = await Dispositivo.findByPk(id, {
            include: [{
                model: Instalacion,
                as: 'instalacion',
                attributes: ['id', 'nombre', 'codigo', 'responsable_id']
            }]
        });

        if(!dispositivo){
            return res.status(404).json({error: 'Dispositivo no encontrado'});
        }

        if(req.user.role === 'RESPONSABLE' && dispositivo.instalacion.responsable_id !== req.user.id) {
            return res.status(403).json({error: 'No tienes acceso a esta dispositivo'});
        }

        res.json(dispositivo);
    }catch(error){
        console.error('Error al obtener el dispositivo:', error);
        res.status(500).json({ error: 'Error al obtener el dispositivo'});
    }
}

/*
    Ruta: POST /api/dispositivos 
    Crear un dispositivo perteneneciente a una instalación
*/
async function crearDispositivo(req, res) {
    try {
        const { mac_address, nombre, descripcion, instalacion_id, hw_version, fw_version, fecha_instalacion, notas } = req.body;

        if (!mac_address || !nombre) {
            return res.status(400).json({ error: 'mac_address y nombre son obligatorios' });
        }

        const macRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/; // 5 Digitos formados de 2 caracteres que pueden tener valores entre 0-9, A-F o a-f separados por dos puntos, y último digito aparte porque no tiene 2 puntos
        if (!macRegex.test(mac_address)) {
            return res.status(400).json({ error: 'Formato de MAC inválido. Usa AA:BB:CC:DD:EE:FF' });
        }

        const existe = await Dispositivo.findOne({where: {mac_address}});

        if(existe){
            return res.status(409).json({error: `La MAC '${mac_address}' ya existe`});
        }

        if (instalacion_id){
            const instalacion = await Instalacion.findByPk(instalacion_id);

            if(!instalacion){
                return res.status(404).json({error: 'La instalación no existe'});
            }
        }

        const dispositivo = await Dispositivo.create({mac_address, nombre, descripcion, instalacion_id: instalacion_id || null, hw_version, fw_version, fecha_instalacion, notas});

        const dispositivoCompleto = await Dispositivo.findByPk(dispositivo.id, {
            include: [{
                model: Instalacion,
                as: 'instalacion',
                attributes: ['id', 'nombre', 'codigo']
            }]
        });

        res.status(201).json({
            message: 'Dispositivo creado correctamente',
            dispositivo: dispositivoCompleto
        });

    }catch(error){
        console.error('Error al crear el dispositivo:', error);
        res.status(500).json({ error: 'Error al crear el dispositivo'});
    }
}

/*
    Ruta: PUT /api/dispositivo/:id 
    Actualizar los datos del dispositivo id
*/
async function actualizarDispositivo(req,res){

    try{
        const { id } = req.params;
        const { nombre, descripcion, instalacion_id, hw_version, fw_version, activo, notas,fecha_instalacion } = req.body;

        const dispositivo = await Dispositivo.findByPk(id);
        
        if(!dispositivo){
            return res.status(404).json({ error: 'Dispositivo no encontrado'});
        }

        if(instalacion_id && instalacion_id !== dispositivo.instalacion_id){
            const instalacion = await Instalacion.findByPk(instalacion_id);

            if(!instalacion){
                return res.status(404).json( { error: 'La instalacion no existe'});
            }
        }

        await dispositivo.update({
            nombre: nombre ?? dispositivo.nombre,
            descripcion: descripcion ?? dispositivo.descripcion,
            instalacion_id: instalacion_id ?? dispositivo.instalacion_id,
            hw_version: hw_version ?? dispositivo.hw_version,
            fw_version: fw_version ?? dispositivo.fw_version,
            activo: activo ?? dispositivo.activo,
            notas: notas ?? dispositivo.notas,
            fecha_instalacion: fecha_instalacion ?? dispositivo.fecha_instalacion
        });

        const dispositivoActualizado = await Dispositivo.findByPk(id, 
            { include: [{
                model: Instalacion, 
                as:'instalacion', 
                attributes: ['id', 'nombre', 'codigo']
            }]
        });

        res.json({
            message: 'Dispositivo actualizado correctamente',
            dispositivo: dispositivoActualizado
        })

    } catch (error) {
        console.error('Error al actualizar el dispositivo: ' , error);
        res.status(500).json({error: 'Error al actualizar el dispositivo'});
    }
}

/*
    Ruta: DELETE /api/dispositivo/:id 
    Eliminar el dispositivo id
*/
async function eliminarDispositivo (req, res){
    try {
        const { id } = req.params;

        const dispositivo = await Dispositivo.findByPk(id);

        if(!dispositivo){
            return res.status(404).json( { error: 'Dispositivo no encontrado'});
        }

        await dispositivo.destroy();

        res.json({ message: 'Dispositivo eliminado correctamente'});
    } catch (error){
        console.error('Error al eliminar el dispositivo: ', error);
        res.status(500).json({ error: 'Error al eliminar el dispositivo'});
    }
}

module.exports = {obtenerDispositivos, obtenerDispositivoPorId, crearDispositivo, actualizarDispositivo, eliminarDispositivo};

