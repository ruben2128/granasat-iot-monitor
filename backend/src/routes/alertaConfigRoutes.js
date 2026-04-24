const express = require('express');
const router = express.Router();
const alertaConfigController = require('../controllers/alertaConfigController');
const {authenticateToken, requireAdmin} = require('../middleware/auth');

router.get('/', authenticateToken, alertaConfigController.obtenerAlertas);

router.get('/:id', authenticateToken, alertaConfigController.obtenerAlertaPorId);

router.post('/', authenticateToken, requireAdmin, alertaConfigController.crearAlerta);

router.put('/:id', authenticateToken, requireAdmin, alertaConfigController.actualizarAlerta);

router.delete('/:id', authenticateToken, requireAdmin, alertaConfigController.eliminarAlerta);

module.exports = router;