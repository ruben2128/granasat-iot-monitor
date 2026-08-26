const Dispositivo = require('../models/Dispositivo');
const Instalacion = require('../models/Instalacion');
const influxService = require('../services/influxService');

/*
    Ruta: GET /api/dispositivos/ 
    Devolver todos los dispositivos de las instalaciones donde el usuario es responsable. O todos los dispositivos, si el usuario es administrador
*/
async function obtenerDispositivos(req, res) {
    try {
        //Filtro opcional por instalacion_id
        const { instalacion_id } = req.query;
        const whereDispositivo = {};
        let dispositivos;

        if(instalacion_id){
            whereDispositivo.instalacion_id = instalacion_id;
        }

        if(req.user.role === 'ADMIN') {
            dispositivos = await Dispositivo.findAll ({
                where: whereDispositivo,
                include: [{
                    model: Instalacion,
                    as: 'instalacion',
                    attributes: ['id', 'nombre', 'categoria']
                }],
                order: [['created_at', 'DESC']]
            });
        } else if (req.user.role === 'TITULAR') {
            whereDispositivo.titular_id = req.user.id;
            dispositivos = await Dispositivo.findAll({
                where: whereDispositivo,
                include: [{ model: Instalacion, as: 'instalacion', attributes: ['id', 'nombre', 'categoria'] }],
                order: [['created_at', 'DESC']]
            });
        } else {
            // Buscar solo dispositivos de las instalaciones donde el usuario es responsable
            dispositivos = await Dispositivo.findAll({
                where: whereDispositivo,
                include: [{
                    model: Instalacion,
                    as: 'instalacion',
                    attributes: ['id', 'nombre', 'categoria'],
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
                attributes: ['id', 'nombre', 'categoria', 'responsable_id']
            }]
        });

        if(!dispositivo){
            return res.status(404).json({error: 'Dispositivo no encontrado'});
        }

        const esResponsable = dispositivo.instalacion?.responsable_id === req.user.id;
        const esTitular = dispositivo.titular_id === req.user.id;

        if (req.user.role !== 'ADMIN' && !esResponsable && !esTitular) {
            return res.status(403).json({ error: 'No tienes acceso a este dispositivo' });
        }

        res.json(dispositivo);
    }catch(error){
        console.error('Error al obtener el dispositivo:', error);
        res.status(500).json({ error: 'Error al obtener el dispositivo'});
    }
}

// Normaliza un campo numérico opcional
function aNumero(valor, actual) {
    if (valor === undefined) {
        return actual;
    }
    if (valor === null || valor === '') {
        return null;
    }

    const numero = Number(valor);
    return Number.isNaN(numero) ? null : numero;
}


/*
    Ruta: POST /api/dispositivos 
    Crear un dispositivo perteneneciente a una instalación
*/
async function crearDispositivo(req, res) {
    try {
        const { mac_address, nombre, descripcion, instalacion_id, hw_version, fw_version, fecha_instalacion, notas, latitud, longitud, altura, nivel_bateria, titular_id, ip_registro, fecha_caducidad_ip, marca_comercial, modelo_electronica, num_serie_electronica, num_serie_sonda, tipo_detector, calibrado, fecha_ultima_calibracion, fecha_proxima_calibracion, verificacion_periodica, periodicidad_verificacion, medida_continuo, unidades_medida, factor_correccion, zona_radiologica, modelo_sonda } = req.body;
        
        if (!nombre) {
            return res.status(400).json({ error: 'El nombre es obligatorio' });
        }

        // La MAC solo tiene sentido en equipos de medida en continuo
        if (medida_continuo) {
            if (!mac_address) {
                return res.status(400).json({ error: 'La dirección MAC es obligatoria en equipos de medida en continuo' });
            }

            const macRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
            if (!macRegex.test(mac_address)) {
                return res.status(400).json({ error: 'Formato de MAC inválido. Usa AA:BB:CC:DD:EE:FF' });
            }

            const existe = await Dispositivo.findOne({ where: { mac_address } });
            if (existe) {
                return res.status(409).json({ error: `La MAC '${mac_address}' ya existe` });
            }
        }

        let instalacion = null;

        if (instalacion_id) {
            instalacion = await Instalacion.findByPk(instalacion_id);
            if (!instalacion) {
                return res.status(404).json({ error: 'La instalación no existe' });
            }
        }

        if (req.user.role !== 'ADMIN') {
            if (!instalacion) {
                return res.status(400).json({ error: 'Debes especificar una instalación' });
            }
            if (instalacion.responsable_id !== req.user.id) {
                return res.status(403).json({ error: 'No puedes crear dispositivos en instalaciones que no son tuyas' });
            }
        }

        const dispositivo = await Dispositivo.create({
            mac_address: medida_continuo ? mac_address : null, 
            nombre, 
            descripcion, 
            instalacion_id: instalacion_id || null, 
            hw_version, 
            fw_version, 
            fecha_instalacion : fecha_instalacion || null , 
            notas, 
            latitud: aNumero(latitud, null),
            longitud: aNumero(longitud, null),
            altura: aNumero(altura, null),
            nivel_bateria: aNumero(nivel_bateria, null),
            titular_id: titular_id || null, ip_registro: ip_registro || null, 
            fecha_caducidad_ip: fecha_caducidad_ip || null,
            marca_comercial: marca_comercial || null,
            modelo_electronica: modelo_electronica || null,
            num_serie_electronica: num_serie_electronica || null,
            num_serie_sonda: num_serie_sonda || null,
            tipo_detector: tipo_detector || null,
            calibrado : calibrado === true ? true : false,
            fecha_ultima_calibracion: fecha_ultima_calibracion || null,
            fecha_proxima_calibracion: fecha_proxima_calibracion || null,
            verificacion_periodica: verificacion_periodica === true ? true : false,
            periodicidad_verificacion: periodicidad_verificacion || null,
            medida_continuo: medida_continuo === true ? true : false,
            unidades_medida: unidades_medida || 'µSv/h',
            factor_correccion: aNumero(factor_correccion, 1.0),            
            zona_radiologica: zona_radiologica || null,
            modelo_sonda: modelo_sonda || null
        });

        const dispositivoCompleto = await Dispositivo.findByPk(dispositivo.id, {
            include: [{
                model: Instalacion,
                as: 'instalacion',
                attributes: ['id', 'nombre', 'categoria']
            }]
        });

        res.status(201).json({
            message: 'Dispositivo creado correctamente',
            dispositivo: dispositivoCompleto
        });

    }catch(error){
        console.error('Error al crear el dispositivo:', error);
        console.error('Error al crear el dispositivo:', error.message);
        console.error('Stack:', error.stack);
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
        const { mac_address, nombre, descripcion, instalacion_id, hw_version, fw_version, activo, notas,fecha_instalacion, latitud, longitud, altura, nivel_bateria, titular_id, ip_registro, fecha_caducidad_ip, marca_comercial, modelo_electronica, num_serie_electronica, num_serie_sonda, tipo_detector, calibrado, fecha_ultima_calibracion, fecha_proxima_calibracion, verificacion_periodica, periodicidad_verificacion, medida_continuo, unidades_medida, factor_correccion, zona_radiologica, modelo_sonda } = req.body;

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
            fecha_instalacion: fecha_instalacion ?? dispositivo.fecha_instalacion,
            latitud: aNumero(latitud, dispositivo.latitud),
            longitud: aNumero(longitud, dispositivo.longitud),
            altura: aNumero(altura, dispositivo.altura),
            nivel_bateria: aNumero(nivel_bateria, dispositivo.nivel_bateria),
            titular_id: titular_id ?? dispositivo.titular_id,
            ip_registro: ip_registro ?? dispositivo.ip_registro,
            fecha_caducidad_ip: fecha_caducidad_ip ?? dispositivo.fecha_caducidad_ip,
            marca_comercial: marca_comercial ?? dispositivo.marca_comercial,
            modelo_electronica: modelo_electronica ?? dispositivo.modelo_electronica,
            num_serie_electronica: num_serie_electronica ?? dispositivo.num_serie_electronica,
            num_serie_sonda: num_serie_sonda ?? dispositivo.num_serie_sonda,
            tipo_detector: tipo_detector ?? dispositivo.tipo_detector,
            calibrado: calibrado ?? dispositivo.calibrado,
            fecha_ultima_calibracion: fecha_ultima_calibracion ?? dispositivo.fecha_ultima_calibracion,
            fecha_proxima_calibracion: fecha_proxima_calibracion ?? dispositivo.fecha_proxima_calibracion,
            verificacion_periodica: verificacion_periodica ?? dispositivo.verificacion_periodica,
            periodicidad_verificacion: periodicidad_verificacion ?? dispositivo.periodicidad_verificacion,
            medida_continuo: medida_continuo ?? dispositivo.medida_continuo,
            unidades_medida: unidades_medida ?? dispositivo.unidades_medida,
            factor_correccion: aNumero(factor_correccion, dispositivo.factor_correccion),            
            zona_radiologica: zona_radiologica ?? dispositivo.zona_radiologica,
            modelo_sonda: modelo_sonda ?? dispositivo.modelo_sonda,
            mac_address: mac_address && !dispositivo.mac_address ? mac_address : dispositivo.mac_address,       
        });

        const dispositivoActualizado = await Dispositivo.findByPk(id, 
            { include: [{
                model: Instalacion, 
                as:'instalacion', 
                attributes: ['id', 'nombre', 'categoria']
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

/*
    Test de conexión de un dispositivo
    Comprueba si el dispositivo ha enviado algún dato en los últimos 10 minutos a través de InfluxDB
*/
async function testConexion(req, res){
    try{
        const { id } = req.params;
        const dispositivo = await Dispositivo.findByPk(id);

        if(!dispositivo){
            return res.status(404).json({error: 'Dispositivo no encontrado'});
        }

        const resultado = await influxService.testConexionDispositivo(dispositivo.mac_address);

        res.json({
            activo: resultado.activo,
            ultimaLectura: resultado.ultimaLectura,
            mensaje: resultado.activo ? 'Dispositivo activo' : 'Dispositivo inactivo'
        });
    }catch (error){
        console.error('Error al testear la conexión del dispositivo: ',error );
        res.status(500).json({ error: 'Error al testear la conexión'});
    }
}

/*
    Subir una foto para reconocer el dispositivo
 */
async function subirFotoDispositivo(req, res){
    try{
        if(!req.file){
            return res.status(400).json({ error: 'No se ha subido ninguna imagen'});
        }

        const {id} = req.params;
        const dispositivo = await Dispositivo.findByPk(id);

        if(!dispositivo){
            return res.status(400).json({ error: 'Dispositivo no encontrado'});
        }

        //Eliminar foto anterior si existe
        const path = require('path');
        const fs = require('fs');

        if(dispositivo.foto){
            const rutaAnterior = path.join(__dirname, '../../uploads/dispositivos', path.basename(dispositivo.foto));

            if(fs.existsSync(rutaAnterior)){
                fs.unlinkSync(rutaAnterior);
            }
        }

        const rutaFotos = `/uploads/dispositivos/${req.file.filename}`;
        await dispositivo.update({
            foto: rutaFotos
        });

        res.json({message: 'Foto actualizada correctamente', foto: rutaFotos});
    
    } catch(error){
        console.error('Error al subir la foto:', error);
        res.status(500).json({error: 'Error al subir la foto'});
    }
}


module.exports = {obtenerDispositivos, obtenerDispositivoPorId, crearDispositivo, actualizarDispositivo, eliminarDispositivo, testConexion, subirFotoDispositivo};

