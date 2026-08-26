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

        if(req.user.role !== 'ADMIN' && instalacion.responsable_id !== req.user.id) {
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
        const {nombre, categoria, descripcion, ubicacion, responsable_id, tipo_instalacion, direccion_instalacion, codigo_referencia} = req.body;

        if(!nombre || !categoria || !responsable_id) {
            return res.status(400).json({ error: 'El nombre, el código de referencia y el responsable son obligatorios'});
        }

        if(codigo_referencia){
            const existe = await Instalacion.findOne({ where: { codigo_referencia: codigo_referencia.toUpperCase()}});

            if(existe) {
                return res.status(409).json({ error: `El código de referencia '${codigo_referencia}' ya está en uso` });
            }
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
            categoria: categoria.toUpperCase(),
            descripcion,
            ubicacion,
            responsable_id: responsable_id || null,
            tipo_instalacion: tipo_instalacion || null,
            direccion_instalacion: direccion_instalacion || null,
            codigo_referencia: codigo_referencia || null
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
        const {nombre, categoria, descripcion, ubicacion, responsable_id, activa, tipo_instalacion, direccion_instalacion, codigo_referencia} = req.body;
        const instalacion = await Instalacion.findByPk(id);
        
        if(!instalacion){
            return res.status(404).json({ error: 'Instalacion no encontrada'});
        }

        if(codigo_referencia && codigo_referencia.toUpperCase() !== instalacion.codigo_referencia){
            const existe = await Instalacion.findOne({where: { codigo_referencia: codigo_referencia.toUpperCase()}});
            
            if(existe){
                return res.status(409).json({ error: `El codigo de referencia '${codigo_referencia}' ya existe` });
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
            categoria: categoria ? categoria.toUpperCase() : instalacion.categoria,
            descripcion: descripcion ?? instalacion.descripcion,
            ubicacion: ubicacion ?? instalacion.ubicacion,
            responsable_id: responsable_id ?? instalacion.responsable_id,
            activa: activa ?? instalacion.activa,
            tipo_instalacion: tipo_instalacion ?? instalacion.tipo_instalacion,
            direccion_instalacion: direccion_instalacion ?? instalacion.direccion_instalacion,
            codigo_referencia: codigo_referencia ?? instalacion.codigo_referencia
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

