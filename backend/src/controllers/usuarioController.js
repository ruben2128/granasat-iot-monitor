const Usuario = require('../models/Usuario');
const path = require('path');
const fs = require('fs');

async function obtenerUsuarios(req, res){
    try {
        let usuarios;

        if(req.user.role !== 'ADMIN'){
            return res.status(403).json({ error: 'No tienes permiso para ver los usuarios' });
        }
        
        usuarios = await Usuario.findAll({
            attributes: ['id', 'username', 'nombre', 'apellidos', 'email', 'role', 'activo', 'avatar', 'telefono_movil', 'telefono_fijo'],
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

async function obtenerTitulares(req, res){
    try {
        const titulares = await Usuario.findAll({
            where: { role: 'TITULAR', activo: true},
            attributes: ['id', 'username', 'nombre', 'apellidos', 'email'],
            order: [['nombre', 'ASC']]
        });

        res.json({total: titulares.length, titulares});
        
    } catch (error){

        console.error('Error al obtener los titulareS: ', error);
        res.status(500).json({error: 'Error al obtener los titulares'});
    }
}

async function subirAvatar(req, res){
    try {
        if(!req.file){
            return res.status(400).json({ error: 'No se ha subido ninguna imagen' });
        }

        const { id } = req.params;
        const usuario = await Usuario.findByPk(id);

        if(!usuario){
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Eliminar avatar anterior si existe
        if(usuario.avatar){
            const rutaAnterior = path.join(__dirname, '../../uploads/avatares', path.basename(usuario.avatar));
            if(fs.existsSync(rutaAnterior)){
                fs.unlinkSync(rutaAnterior);
            }
        }

        // Guardar ruta relativa del nuevo avatar
        const rutaAvatar = `/uploads/avatares/${req.file.filename}`;
        await usuario.update({ avatar: rutaAvatar });

        res.json({ message: 'Avatar actualizado correctamente', avatar: rutaAvatar });

    } catch (error){
        console.error('Error al subir avatar:', error);
        res.status(500).json({ error: 'Error al subir el avatar' });
    }
}

module.exports = { obtenerUsuarios, activarDesactivarUsuario, obtenerTitulares, subirAvatar };