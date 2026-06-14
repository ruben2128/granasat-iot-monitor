const Usuario = require('../models/Usuario');
const path = require('path');
const fs = require('fs');
const LogCambio = require('../models/LogCambio');

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

        // Solo el propio usuario o un admin puede subir avatar
        if(req.user.id !== id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'No tienes permiso para modificar este avatar' });
        }

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

        await LogCambio.create({
            usuario_id: id,
            username: usuario.username,
            campo_modificado: 'avatar',
            valor_anterior: usuario.avatar ? 'Avatar anterior' : null,
            valor_nuevo: 'Avatar actualizado'
        });

        res.json({ message: 'Avatar actualizado correctamente', avatar: rutaAvatar });

    } catch (error){
        console.error('Error al subir avatar:', error);
        res.status(500).json({ error: 'Error al subir el avatar' });
    }
}

async function obtenerUsuarioPorId(req, res) {
    try {
        const { id } = req.params;
        const usuario = await Usuario.findByPk(id, {
            attributes: { exclude: ['password_hash'] }
        });
        if(!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
}

async function actualizarUsuario(req, res) {
    try {
        const { id } = req.params;
        
        // Solo el propio usuario o un admin puede editar
        if(req.user.id !== id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'No tienes permiso para editar este usuario' });
        }

        const { nombre, apellidos, email, telefono_movil, telefono_fijo } = req.body;

        const usuario = await Usuario.findByPk(id);
        if(!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        await usuario.update({
            nombre: nombre ?? usuario.nombre,
            apellidos: apellidos ?? usuario.apellidos,
            email: email ?? usuario.email,
            telefono_movil: telefono_movil ?? usuario.telefono_movil,
            telefono_fijo: telefono_fijo ?? usuario.telefono_fijo
        });

        // Registrar cambios en el log
        const campos = { nombre, apellidos, email, telefono_movil, telefono_fijo };
        for (const [campo, valorNuevo] of Object.entries(campos)) {
            if (valorNuevo !== undefined && valorNuevo !== usuario[campo]) {
                await LogCambio.create({
                    usuario_id: id,
                    username: usuario.username,
                    campo_modificado: campo,
                    valor_anterior: usuario[campo] || null,
                    valor_nuevo: valorNuevo || null
                });
            }
        }

        res.json({ message: 'Usuario actualizado correctamente', usuario });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
}

module.exports = { obtenerUsuarios, activarDesactivarUsuario, obtenerTitulares, subirAvatar, obtenerUsuarioPorId, actualizarUsuario };