const express = require('express');
const router = express.Router();
const instalacionController = require('../controllers/instalacionController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, instalacionController.obtenerInstalaciones);

router.get('/:id', authenticateToken, instalacionController.obtenerInstalacionPorId);

router.post('/', authenticateToken, requireAdmin, instalacionController.crearInstalacion);

router.put('/:id', authenticateToken, requireAdmin, instalacionController.actualizarInstalacion);

router.delete('/:id', authenticateToken, requireAdmin, instalacionController.eliminarInstalacion);

module.exports = router;