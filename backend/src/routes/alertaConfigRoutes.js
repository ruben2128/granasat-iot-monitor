const express = require('express');
const router = express.Router();
const alertaConfigController = require('../controllers/alertaConfigController');
const {authenticateToken, requireAdmin} = require('../middleware/auth');

router.get('/', authenticateToken, alertaConfigController.obtenerAlertas);

router.get('/:id', authenticateToken, alertaConfigController.obtenerAlertaPorId);

router.post('/', authenticateToken, alertaConfigController.crearAlerta);

router.put('/:id', authenticateToken, alertaConfigController.actualizarAlerta);

router.delete('/:id', authenticateToken, alertaConfigController.eliminarAlerta);

module.exports = router;