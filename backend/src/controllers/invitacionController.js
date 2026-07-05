const crypto = require('crypto');
const Invitacion = require('../models/Invitacion');
const Usuario = require('../models/Usuario');
const emailService = require('../services/emailService');
const bcrypt = require('bcrypt');
const LogCambio = require('../models/LogCambio');


/**
 * Crea una invitación y envía el email al destinatario.
 * Solo accesible por ADMIN.
 */
async function crearInvitacion(req, res) {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'No tienes permiso' });
        }

        const { email, role } = req.body;

        // Validar que el rol sea uno de los permitidos por invitación
        if (!email || !role) {
            return res.status(400).json({ error: 'Email y rol son obligatorios' });
        }

        if (!['RESPONSABLE', 'TITULAR'].includes(role)) {
            return res.status(400).json({ error: 'Rol inválido. Solo se puede invitar como RESPONSABLE o TITULAR' });
        }

        // Verificar que no haya un usuario registrado con ese email
        const usuarioExistente = await Usuario.findOne({ where: { email } });
        if (usuarioExistente) {
            return res.status(400).json({ error: 'Ya existe un usuario registrado con ese email' });
        }

        // Invalidar invitaciones anteriores pendientes para el mismo email
        await Invitacion.update(
            { usado: true },
            { where: { email, usado: false } }
        );

        // Generar token seguro
        const token = crypto.randomBytes(32).toString('hex');

        // Caducidad de 48 horas desde ahora
        const fecha_caducidad = new Date(Date.now() + 48 * 60 * 60 * 1000);

        // Construir enlace de registro
        const enlace = `${process.env.FRONTEND_URL}/registro?token=${token}`;

        // Enviar email de invitación
        await emailService.enviarEmailAlerta(
            [email],
            'Invitación al Sistema IoT GranaSAT',
            `Has sido invitado a unirte al Sistema IoT GranaSAT como ${role}.\n\nPara completar tu registro, accede al siguiente enlace (válido durante 48 horas):\n\n${enlace}\n\n.`
        );

        const invitacion = await Invitacion.create({
            email,
            token,
            role,
            fecha_caducidad,
            invitado_por: req.user.id
        });

        res.status(201).json({
            message: 'Invitación enviada correctamente',
            invitacion: {
                id: invitacion.id,
                email: invitacion.email,
                role: invitacion.role,
                fecha_caducidad: invitacion.fecha_caducidad
            }
        });

    } catch (error) {
        console.error('Error al crear invitación:', error);
        res.status(500).json({ error: 'Error al crear la invitación' });
    }
}

/**
 * Verifica que un token de invitación es válido, no ha caducado y no ha sido usado.
 * Usado por el frontend para mostrar el formulario de registro.
 */
async function verificarToken(req, res) {
    try {
        const { token } = req.params;

        const invitacion = await Invitacion.findOne({ where: { token } });

        // Respuesta genérica para no revelar si el token existe o no
        if (!invitacion || invitacion.usado || new Date() > invitacion.fecha_caducidad) {
            return res.status(400).json({ error: 'Token inválido o caducado' });
        }

        res.json({
            email: invitacion.email,
            role: invitacion.role
        });

    } catch (error) {
        console.error('Error al verificar token:', error);
        res.status(500).json({ error: 'Error al verificar el token' });
    }
}

/**
 * Completa el registro de un usuario a partir de un token de invitación válido.
 * Crea el usuario, invalida el token y registra el log de cambios.
 */
async function completarRegistro(req, res) {
    try {
        const { token, username, password, nombre, apellidos, telefono_movil } = req.body;

        if (!token || !username || !password) {
            return res.status(400).json({ error: 'Token, username y password son obligatorios' });
        }

        const invitacion = await Invitacion.findOne({ where: { token } });

        if (!invitacion || invitacion.usado || new Date() > invitacion.fecha_caducidad) {
            return res.status(400).json({ error: 'Token inválido o caducado' });
        }

        // Verificar que el username no esté ya en uso
        const usernameExistente = await Usuario.findOne({ where: { username } });

        if (usernameExistente) {
            return res.status(400).json({ error: 'Ese nombre de usuario ya está en uso' });
        }

        // Crear el usuario con el rol de la invitación
        const usuario = await Usuario.create({
            username,
            password_hash: password, // El hook beforeCreate de Usuario lo hashea automáticamente
            role: invitacion.role,
            email: invitacion.email,
            nombre: nombre || null,
            apellidos: apellidos || null,
            telefono_movil: telefono_movil || null
        });

        // Invalidar el token para que no pueda usarse de nuevo
        await invitacion.update({ usado: true });

        await LogCambio.create({
            usuario_id: usuario.id,
            tabla_afectada: 'usuarios',
            campo_modificado: 'registro',
            valor_anterior: null,
            valor_nuevo: `Usuario registrado por invitación (email: ${invitacion.email}, rol: ${invitacion.role})`,
            ip_address: req.ip || null
        });

        res.status(201).json({
            message: 'Registro completado correctamente',
            usuario: {
                id: usuario.id,
                username: usuario.username,
                email: usuario.email,
                role: usuario.role
            }
        });

    } catch (error) {
        console.error('Error al completar el registro:', error);
        res.status(500).json({ error: 'Error al completar el registro' });
    }
}

/**
 * Lista todas las invitaciones (pendientes y usadas).
 * Solo accesible por ADMIN.
 */
async function listarInvitaciones(req, res) {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'No tienes permiso' });
        }

        const invitaciones = await Invitacion.findAll({
            attributes: ['id', 'email', 'role', 'usado', 'fecha_caducidad', 'created_at'],
            order: [['created_at', 'DESC']]
        });

        res.json({ invitaciones });

    } catch (error) {
        console.error('Error al listar invitaciones:', error);
        res.status(500).json({ error: 'Error al listar invitaciones' });
    }
}

module.exports = { crearInvitacion, verificarToken, completarRegistro, listarInvitaciones };