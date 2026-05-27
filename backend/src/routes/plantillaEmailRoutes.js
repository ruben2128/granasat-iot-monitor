const express = require('express');
const router = express.Router();
const plantillaEmailController = require('../controllers/plantillaEmailController');
const {authenticateToken, requireAdmin} = require('../middleware/auth');

router.get('/', authenticateToken, plantillaEmailController.obtenerPlantilla);

router.put('/', authenticateToken, requireAdmin, plantillaEmailController.actualizarPlantilla);

module.exports = router;