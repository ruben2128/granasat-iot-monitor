const express = require('express');
const router = express.Router();
const invitacionController = require('../controllers/invitacionController');
const { authenticateToken } = require('../middleware/auth');

// Rutas protegidas (requieren token de admin)
router.post('/', authenticateToken, invitacionController.crearInvitacion);
router.get('/', authenticateToken, invitacionController.listarInvitaciones);

// Rutas públicas (no requieren autenticación — las usa el usuario invitado)
router.get('/verificar/:token', invitacionController.verificarToken);
router.post('/registro', invitacionController.completarRegistro);

module.exports = router;