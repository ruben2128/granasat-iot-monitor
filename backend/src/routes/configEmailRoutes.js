const express = require('express');
const router = express.Router();
const configEmailController = require('../controllers/configEmailController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, requireAdmin, configEmailController.obtenerConfigEmail);

router.post('/', authenticateToken, requireAdmin, configEmailController.guardarConfigEmail);

router.patch('/:id/activar', authenticateToken, requireAdmin, configEmailController.activarConfigEmail);

router.delete('/:id', authenticateToken, requireAdmin, configEmailController.eliminarConfigEmail);

router.post('/test', authenticateToken, requireAdmin, configEmailController.testEmail);

module.exports = router;