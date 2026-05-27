const AlertaConfig = require('../models/AlertaConfig');
const Instalacion = require('../models/Instalacion');

/*
    Ruta: GET /api/alertas-config/ 
    Devolver todos las alertas de las instalaciones donde el usuario es responsable. O todos las alertas, si el usuario es administrador
*/
async function obtenerAlertas(req, res) {
    try {
        let alertas;

        if(req.user.role === 'ADMIN') {
            alertas = await AlertaConfig.findAll ({
                include: [{
                    model: Instalacion,
                    as: 'instalacion',
                    attributes: ['id', 'nombre', 'codigo_referencia']
                }],
                order: [['created_at', 'DESC']]
            });
        } else {
            alertas = await AlertaConfig.findAll({
                include: [{
                    model: Instalacion,
                    as: 'instalacion',
                    attributes: ['id', 'nombre', 'codigo_referencia'],
                    where: { responsable_id: req.user.id },
                    required: true 
                }],
                order: [['created_at', 'DESC']]
            });
        }

        res.json({total: alertas.length, alertas});

    } catch (error) {
        console.error('Error al obtener las alertas:', error);
        res.status(500).json({ error: 'Error al obtener las alertas'});
    }
}

/*
    Ruta: GET /api/alertas-config/:id
    Devolver la alerta con el id :id
*/
async function obtenerAlertaPorId(req, res) {
    try {
        const { id } = req.params;

        const alerta = await AlertaConfig.findByPk(id, {
            include: [{
                model: Instalacion,
                as: 'instalacion',
                attributes: ['id', 'nombre', 'responsable_id']
            }]
        });

        if(!alerta){
            return res.status(404).json({error: 'Alerta no encontrada'});
        }

        if(req.user.role === 'RESPONSABLE') {
            if(!alerta.instalacion || alerta.instalacion.responsable_id !== req.user.id){
                return res.status(403).json({error: 'No tienes acceso a esta alerta'});
            }   
        }

        res.json(alerta);

    }catch(error){
        console.error('Error al obtener la alerta:', error);
        res.status(500).json({ error: 'Error al obtener la alerta'});
    }
}

/*
    Ruta: POST /api/alertas-config 
    Crear una alerta producida por un dispositivo y perteneneciente a una instalación
*/
async function crearAlerta(req, res) {
    try {
        const { instalacion_id, tipo, nombre, descripcion, campo, operador, umbral, emails_destino, mensaje_personalizado } = req.body;

        if (!instalacion_id || !tipo || !nombre || !campo || !operador) {
            return res.status(400).json({ error: 'instalacion_id, tipo, nombre, campo y operador son obligatorios' });
        }

        const operadoresValidos = ['>', '<', '>=', '<=', '=='];
        if (!operadoresValidos.includes(operador)) {
            return res.status(400).json({ error: 'Operador inválido. Usa <, >, >=, <= o ==' });
        }

        const instalacion = await Instalacion.findByPk(instalacion_id);

        if(!instalacion){
            return res.status(404).json( { error: 'La instalacion no existe'});
        }

        const alerta = await AlertaConfig.create({instalacion_id, tipo, nombre, descripcion, campo, operador, umbral, emails_destino, mensaje_personalizado});

        const alertaCompleta = await AlertaConfig.findByPk(alerta.id, {
            include: [{
                model: Instalacion,
                as: 'instalacion',
                attributes: ['id', 'nombre']
            }]
        });

        res.status(201).json({
            message: 'Alerta creada correctamente',
            alerta: alertaCompleta
        });

    }catch(error){
        console.error('Error al crear la alerta:', error);
        res.status(500).json({ error: 'Error al crear la alerta'});
    }
}

/*
    Ruta: PUT /api/alertas-config/:id 
    Actualizar los datos de la alerta id
*/
async function actualizarAlerta(req,res){

    try{
        const { id } = req.params;
        const { nombre, descripcion, campo, operador, umbral, emails_destino, mensaje_personalizado, activa} = req.body;

        const alerta = await AlertaConfig.findByPk(id);
        
        if(!alerta){
            return res.status(404).json({ error: 'Alerta no encontrada'});
        }

        if(operador){
            const operadoresValidos = ['>', '<', '>=', '<=', '=='];

            if(!operadoresValidos.includes(operador)){
                return res.status(400).json( { error: 'Operador inválido.  Usa <, >, >=, <= o =='});
            }
        }

        await alerta.update({
            nombre: nombre ?? alerta.nombre,
            descripcion: descripcion ?? alerta.descripcion,
            campo: campo ?? alerta.campo,
            operador: operador ?? alerta.operador,
            umbral: umbral ?? alerta.umbral,
            activa: activa ?? alerta.activa,
            emails_destino: emails_destino ?? alerta.emails_destino,
            mensaje_personalizado: mensaje_personalizado ?? alerta.mensaje_personalizado
        });

        const alertaActualizada = await AlertaConfig.findByPk(id, 
            { include: [{
                model: Instalacion, 
                as:'instalacion', 
                attributes: ['id', 'nombre']
            }]
        });

        res.json({
            message: 'Alerta actualizada correctamente',
            alerta: alertaActualizada
        })

    } catch (error) {
        console.error('Error al actualizar la alerta: ' , error);
        res.status(500).json({error: 'Error al actualizar la alerta'});
    }
}

/*
    Ruta: DELETE /api/alertas-config/:id 
    Eliminar la alerta id
*/
async function eliminarAlerta(req, res){
    try {
        const { id } = req.params;

        const alerta = await AlertaConfig.findByPk(id);

        if(!alerta){
            return res.status(404).json( { error: 'Alerta no encontrada'});
        }

        await alerta.destroy();

        res.json({ message: 'Alerta eliminada correctamente'});

    } catch (error){
        console.error('Error al eliminar la alerta: ', error);
        res.status(500).json({ error: 'Error al eliminar la alerta'});
    }
}

module.exports = {obtenerAlertas, obtenerAlertaPorId, crearAlerta, actualizarAlerta, eliminarAlerta};

