const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, requireAdmin, logController.obtenerLog);

module.exports = router;