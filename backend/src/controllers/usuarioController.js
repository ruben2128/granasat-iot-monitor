const Usuario = require('../models/Usuario');

async function obtenerUsuarios(req, res){
    try {
        let usuarios;

        if(req.user.role !== 'ADMIN'){
            return res.status(403).json({ error: 'No tienes permiso para ver los usuarios' });
        }
        
        usuarios = await Usuario.findAll({
            attributes: ['id', 'username', 'nombre', 'apellidos', 'email', 'role', 'activo'],
            order: [['created_at', 'DESC']]
        });

        res.json({ total: usuarios.length, usuarios });

    } catch (error){
        console.error('Error al obtener los usuarios:', error);
        res.status(500).json({ error: 'Error al obtener los usuarios'});
    }
}

async function activarDesactivarUsuario(req, res){
    try{
        if(req.user.role !== 'ADMIN'){
            return res.status(403).json({error: 'No tienes permiso para realizar esta acción'});
        }

        const {id} = req.params;
        const usuario = await Usuario.findByPk(id);

        if(!usuario){
            return res.status(404).json({error: 'Usuario no encontrado'});
        }

        if(usuario.id === req.user.id){
            return res.status(400).json({error: 'No puedes desactivarte a ti mismo'});
        }

        await usuario.update({activo: !usuario.activo});

        res.json({message: `Usuario ${usuario.activo ? 'activado': 'desactivado'} correctamente`, usuario: {id: usuario.id, username: usuario.username, activo: usuario.activo}});

    } catch (error) {
        console.error('Error al activar/desactivar usuario: ', error);
        res.status(500).json({error : 'Error al activar/desactivar usuario'});
    }
}

module.exports = { obtenerUsuarios, activarDesactivarUsuario };