const express = require('express');
const router = express.Router();
const lecturaController = require('../controllers/lecturaController');
const {authenticateToken, requireAdmin} = require('../middleware/auth');

router.get('/:id/lecturas', authenticateToken, lecturaController.obtenerLecturas);

router.get('/:id/lecturas/ultima', authenticateToken, lecturaController.obtenerUltimaLectura);

module.exports = router;