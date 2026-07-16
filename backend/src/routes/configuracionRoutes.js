const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracionController');
const { authenticateToken } = require('../middleware/auth');

router.get('/publica', configuracionController.obtenerConfiguracionPublica);

router.get('/', authenticateToken, configuracionController.obtenerConfiguracion);

router.put('/:clave', authenticateToken, configuracionController.actualizarConfiguracion);

module.exports = router;