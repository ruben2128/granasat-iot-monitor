const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, usuarioController.obtenerUsuarios);

//Patch actualiza parcialmente un recurso sin necesidad de mandar el resto de campos
router.patch('/:id/estado', authenticateToken, requireAdmin, usuarioController.activarDesactivarUsuario);

module.exports = router;