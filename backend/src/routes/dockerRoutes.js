const express = require('express');
const router  = express.Router();
const dockerController = require('../controllers/dockerController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/espacio', authenticateToken, requireAdmin, dockerController.obtenerEspacioDocker);

module.exports = router;