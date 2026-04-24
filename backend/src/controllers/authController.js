// backend/src/controllers/authController.js
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

/*
  Ruta: POST /api/auth/register
  Registrar nuevo usuario (solo ADMIN puede hacerlo)
 
*/
async function registrarUsuario(req, res) {
  try {
    const { username, email, password, role, nombre, apellidos, movil } = req.body;

    // Validar datos obligatorios
    if (!username || !email || !password || !role) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
        required: ['username', 'email', 'password', 'role']
      });
    }

    // Validar que el rol sea válido
    if (!['ADMIN', 'RESPONSABLE'].includes(role)) {
      return res.status(400).json({
        error: 'Rol inválido',
        valid_roles: ['ADMIN', 'RESPONSABLE']
      });
    }

    // Verificar que no exista ya el nombre de usuario
    const existeUsername = await Usuario.findOne({ where: { username } });
    if (existeUsername) {
      return res.status(409).json({
        error: 'El username ya está en uso'
      });
    }

    // Verificar que no exista ya el email
    const existeEmail = await Usuario.findOne({ where: { email } });
    if (existeEmail) {
      return res.status(409).json({
        error: 'El email ya está registrado'
      });
    }

    // Crear usuario
    const nuevoUsuario = await Usuario.create({
      username,
      email,
      password_hash: password, // El hook beforeCreate lo hasheará
      role,
      nombre,
      apellidos,
      movil,
      activo: true
    });

    // No devolver el password_hash
    const usuarioRespuesta = {
      id: nuevoUsuario.id,
      username: nuevoUsuario.username,
      email: nuevoUsuario.email,
      role: nuevoUsuario.role,
      nombre: nuevoUsuario.nombre,
      apellidos: nuevoUsuario.apellidos,
      activo: nuevoUsuario.activo,
      created_at: nuevoUsuario.created_at
    };

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuario: usuarioRespuesta
    });
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    res.status(500).json({error: 'Error al crear el usuario'});
  }
}

/*
  Ruta: POST /api/auth/login
  Iniciar sesión
*/
async function iniciarSesion(req, res) {
  try {
    const { username, password } = req.body;

    // Validar datos
    if (!username || !password) {
      return res.status(400).json({
        error: 'Username y password son obligatorios'
      });
    }

    // Buscar usuario
    const usuario = await Usuario.findOne({ where: { username } });

    if (!usuario) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Verificar que el usuario esté activo
    if (!usuario.activo) {
      return res.status(403).json({
        error: 'Usuario desactivado'
      });
    }

    // Comparar contraseña
    const passwordValido = await usuario.comparePassword(password);

    if (!passwordValido) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Actualizar último acceso
    await usuario.update({ ultimo_acceso: new Date() });

    // Generar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        username: usuario.username,
        role: usuario.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    );

    // Respuesta
    res.json({
      message: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        role: usuario.role,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({error: 'Error al iniciar sesión'});
  }
}

/*
  Ruta: GET /api/auth/me
  Obtener información del usuario actual (requiere token) 
*/
async function obtenerMiPerfil(req, res) {
  try {
    // req.user viene del middleware de autenticación
    const usuario = await Usuario.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'role', 'nombre', 'apellidos', 'movil', 'activo']
    });

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.json(usuario);

  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    res.status(500).json({error: 'Error al obtener información del usuario'});
  }
}

module.exports = {registrarUsuario, iniciarSesion, obtenerMiPerfil};
