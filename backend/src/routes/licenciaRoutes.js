const express = require('express');
const router = express.Router({mergeParams: true});
const licenciaController = require('../controllers/licenciaController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, licenciaController.obtenerLicencias);
router.post('/', authenticateToken, licenciaController.crearLicencia);
router.delete('/:id', authenticateToken, licenciaController.eliminarLicencia);

module.exports = router;