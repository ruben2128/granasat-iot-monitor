const express = require('express');
const router = express.Router();
const logCambioController = require('../controllers/logCambioController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, requireAdmin, logCambioController.obtenerLogCambios);

module.exports = router;