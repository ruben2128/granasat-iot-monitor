const express = require('express');
const router = express.Router();
const dispositivoController = require('../controllers/dispositivoController');
const {authenticateToken, requireAdmin} = require('../middleware/auth');

router.get('/', authenticateToken, dispositivoController.obtenerDispositivos);

router.get('/:id', authenticateToken, dispositivoController.obtenerDispositivoPorId);

router.post('/', authenticateToken, requireAdmin, dispositivoController.crearDispositivo);

router.put('/:id', authenticateToken, requireAdmin, dispositivoController.actualizarDispositivo);

router.delete('/:id', authenticateToken, requireAdmin, dispositivoController.eliminarDispositivo);

module.exports = router;