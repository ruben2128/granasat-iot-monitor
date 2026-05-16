const express = require('express');
const router  = express.Router();
const emailHistorialController = require('../controllers/emailHistorialController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, requireAdmin, emailHistorialController.obtenerHistorialEmails);

module.exports = router;