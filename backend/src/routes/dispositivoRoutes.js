const express = require('express');
const router = express.Router();
const dispositivoController = require('../controllers/dispositivoController');
const {authenticateToken, requireAdmin} = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', authenticateToken, dispositivoController.obtenerDispositivos);

router.get('/:id', authenticateToken, dispositivoController.obtenerDispositivoPorId);

router.post('/', authenticateToken, dispositivoController.crearDispositivo);

router.put('/:id', authenticateToken, requireAdmin, dispositivoController.actualizarDispositivo);

router.delete('/:id', authenticateToken, requireAdmin, dispositivoController.eliminarDispositivo);

router.get('/:id/test', authenticateToken, dispositivoController.testConexion);

router.post('/:id/foto', authenticateToken, upload.single('foto'), dispositivoController.subirFotoDispositivo);

module.exports = router;