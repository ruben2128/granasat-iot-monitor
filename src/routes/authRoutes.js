const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/*
    Ruta: POST /api/auth/register
    Registrar nuevo usuario
 */
router.post('/register', authenticateToken, requireAdmin, authController.registrarUsuario);

/*
    Ruta: POST /api/auth/login
    Iniciar sesión
*/
router.post('/login', authController.iniciarSesion);

/*
    Ruta: GET /api/auth/me
    Obtener información del usuario autenticado
*/
router.get('/me', authenticateToken, authController.obtenerMiPerfil);

module.exports = router;
