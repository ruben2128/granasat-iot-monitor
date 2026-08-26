const express = require('express');
const router = express.Router({mergeParams: true});
const licenciaController = require('../controllers/licenciaController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, licenciaController.obtenerLicencias);
router.post('/', authenticateToken, requireAdmin, licenciaController.crearLicencia);
router.delete('/:id', authenticateToken, requireAdmin, licenciaController.eliminarLicencia);

module.exports = router;