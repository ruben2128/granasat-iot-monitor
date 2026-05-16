const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');


router.get('/', authenticateToken, usuarioController.obtenerUsuarios);

//Patch actualiza parcialmente un recurso sin necesidad de mandar el resto de campos
router.patch('/:id/estado', authenticateToken, requireAdmin, usuarioController.activarDesactivarUsuario);

router.get('/titulares', authenticateToken, usuarioController.obtenerTitulares);

router.post('/:id/avatar', authenticateToken, requireAdmin, upload.single('avatar'), usuarioController.subirAvatar);

module.exports = router;