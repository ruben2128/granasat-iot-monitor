const Instalacion = require('../models/Instalacion');
const Usuario = require('../models/Usuario');

/*
    Ruta: GET /api/instalaciones/ 
    Devolver todos las instalaciones en caso de admin, solo las suyas en caso de responsable
*/
async function obtenerInstalaciones(req, res){
    try {
        let instalaciones;

        if(req.user.role === 'ADMIN') {
            instalaciones = await Instalacion.findAll({
                include: [{
                    model: Usuario,
                    as: 'responsable',
                    attributes: ['id', 'username', 'nombre', 'apellidos', 'email']
                }],
                order: [['created_at', 'DESC']]
            });
        } else {
            instalaciones = await Instalacion.findAll({
                where: { responsable_id: req.user.id },
                include: [{
                    model: Usuario,
                    as: 'responsable',
                    attributes: ['id', 'username', 'nombre', 'apellidos', 'email']
                }],
                order: [['created_at', 'DESC']]
            });
        }

        res.json({
            total: instalaciones.length,
            instalaciones
        });

    } catch (error){
        console.error('Error al obtener las instalaciones:', error);
        res.status(500).json({ error: 'Error al obtener las instalaciones'});
    }
}


/*
    Ruta: GET /api/instalaciones/:id
    Devolver la instalación con el id :id
*/
async function obtenerInstalacionPorId(req, res) {
    try {
        const { id } = req.params;

        const instalacion = await Instalacion.findByPk(id, {
            include: [{
                model: Usuario,
                as: 'responsable',
                attributes: ['id', 'username', 'nombre', 'apellidos', 'email']
            }]
        });

        if(!instalacion){
            return res.status(404).json({error: 'Instalación no encontrada'});
        }

        if(req.user.role === 'RESPONSABLE' && instalacion.responsable_id !== req.user.id) {
            return res.status(403).json({error: 'No tienes acceso a esta instalación'});
        }

        res.json(instalacion);

    }catch(error){
        console.error('Error al obtener la instalación:', error);
        res.status(500).json({ error: 'Error al obtener la instalación'});
    }
}

/*
    Ruta: POST /api/instalaciones
    Crear un instalación nueva
*/
async function crearInstalacion(req, res) {
    try{
        const { nombre, codigo, descripcion, ubicacion, responsable_id } = req.body;

        if(!nombre || !codigo || !responsable_id) {
            return res.status(400).json({ error: 'nombre, codigo y responsable_id son obligatorios'});
        }

        const existe = await Instalacion.findOne({ where: { codigo: codigo.toUpperCase()}});

        if(existe) {
            return res.status(409).json({ error: `El código '${codigo}' ya está en uso` });
        }

        if(responsable_id){
            const responsable = await Usuario.findByPk(responsable_id);

            if(!responsable) {
                return res.status(404).json({error: 'El responsable indicado no existe' });
            }

            if(responsable.role !== 'RESPONSABLE') {
                return res.status(400).json({ error: 'El usuario indicado no tiene rol RESPONSABLE'});
            }
        }

        const instalacion = await Instalacion.create({
            nombre,
            codigo: codigo.toUpperCase(),
            descripcion,
            ubicacion,
            responsable_id: responsable_id || null
        });

        const instalacionCompleta = await Instalacion.findByPk(instalacion.id, {
            include: [{
                model: Usuario,
                as: 'responsable',
                attributes: ['id', 'username', 'nombre', 'apellidos', 'email']
            }]
        });

        res.status(201).json({
            message: 'Instalacion creada correctamente',
            instalacion: instalacionCompleta
        });

    }catch(error){
        console.error('Error al crear la instalación', error);
        res.status(500).json({ error: 'Error al crear la instalacion'});
    }
}

/*
    Ruta: PUT /api/instalaciones/:id 
    Actualizar los datos del la instalación id
*/
async function actualizarInstalacion(req,res){

    try{
        const { id } = req.params;
        const { nombre, codigo, descripcion, ubicacion, responsable_id, activa} = req.body;

        const instalacion = await Instalacion.findByPk(id);
        
        if(!instalacion){
            return res.status(404).json({ error: 'Instalacion no encontrada'});
        }

        if(codigo && codigo.toUpperCase() !== instalacion.codigo){
            const existe = await Instalacion.findOne({where: { codigo: codigo.toUpperCase()}});
            
            if(existe){
                return res.status(409).json({ error: `El codigo '${codigo}' ya existe` });
            }
        }

        if(responsable_id && responsable_id !== instalacion.responsable_id){
            const responsable = await Usuario.findByPk(responsable_id);

            if(!responsable){
                return res.status(404).json( { error: 'El responsable indicado no existe'});
            }

            if(responsable.role !== 'RESPONSABLE'){
                return res.status(400).json({ error: 'El usuario indicado no tiene el rol RESPONSABLE'});
            }
        }

        await instalacion.update({
            nombre: nombre ?? instalacion.nombre,
            codigo: codigo ? codigo.toUpperCase() : instalacion.codigo,
            descripcion: descripcion ?? instalacion.descripcion,
            ubicacion: ubicacion ?? instalacion.ubicacion,
            responsable_id: responsable_id ?? instalacion.responsable_id,
            activa: activa ?? instalacion.activa
        });

        const instalacionActualizada = await Instalacion.findByPk(id, { include: [{ model: Usuario, as:'responsable', attributes: ['id', 'username', 'nombre', 'apellidos', 'email']}]});
        res.json({
            message: 'Instalación actualizada correctamente',
            instalacion: instalacionActualizada
        })
    } catch (error) {
        console.error('Error al actualizar la instalación: ' , error);
        res.status(500).json({error: 'Error al actualizar la instalación'});
    }

}

/*
    Ruta: DELETE /api/instalaciones/:id 
    Eliminar la instalacion id
*/
async function eliminarInstalacion (req, res){
    try {
        const { id } = req.params;

        const instalacion = await Instalacion.findByPk(id);

        if(!instalacion){
            return res.status(404).json( { error: 'Instalación no encontrada'});
        }

        await instalacion.destroy();

        res.json({ message: 'Instalación eliminada correctamente'});
    } catch (error){
        console.error('Error al eliminar la instalación: ', error);
        res.status(500).json({ error: 'Error al eliminar la instalación'});
    }
}

module.exports = {obtenerInstalaciones, obtenerInstalacionPorId, crearInstalacion, actualizarInstalacion, eliminarInstalacion};

