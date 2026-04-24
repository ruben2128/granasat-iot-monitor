const express = require('express');
const router = express.Router();
const informeController = require('../controllers/informeController');
const {authenticateToken, requireAdmin} = require('../middleware/auth');

/*
    Ruta: POST /api/informes/generar 
    Generar el informe de una instalacion
*/
router.post('/generar', authenticateToken, requireAdmin, informeController.generar);

/*
    Ruta: GET /api/informes/ 
    Devolver todos los informes en el caso del admin, y solo los de su instalaciones en caso de ser responsable
*/
router.get('/', authenticateToken, informeController.getAll);

/*
    Ruta: GET /api/informes/:id/descargar
    Descargar el PDF de un informe
*/
router.get('/:id/descargar', authenticateToken, informeController.descargar);

module.exports = router;