const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const Informe = require('../models/Informe');
const Instalacion = require('../models/Instalacion');
const {generarInformeMensual} = require('../services/informeService');

/*
    Ruta: POST /api/informes/generar 
    Generar el informe de una instalacion
*/
async function generar(req,res) {
    try{
        const { instalacion_id, mes, anio } = req.body;

        if(!instalacion_id || !mes || !anio){
            return res.status(400).json({ error: 'instalacion_id, mes y anio son obligatorios'});
        }

        if(mes < 1 || mes > 12){
            return res.status(400).json({ error: 'El mes debe estar entre 1 y 12'});
        }

        const resultado = await generarInformeMensual(instalacion_id, mes, anio);

        res.status(201).json({
            message: 'Informe generado correctamente',
            informe: resultado.informe,
            email_enviado: resultado.emailEnviado
        });
    } catch (error) {
        console.error('Error generando el informe:', error);

        if(error.message.includes('Ya existe')) {
            return res.status(409).json({error: error.message});
        }

        res.status(500).json({error: 'Error al generar el informe'});
    }
}

/*
    Ruta: GET /api/informes/ 
    Devolver todos los informes en el caso del admin, y solo los de su instalaciones en caso de ser responsable
*/
async function getAll(req,res) {
    try {
        let informes;

        if(req.user.role === 'ADMIN') {
            informes = await Informe.findAll({
                include: [{ model: Instalacion, as: 'instalacion', attributes: ['id', 'nombre', 'codigo']}],
                order: [['fecha_generacion', 'DESC']]
            });
        } else {
            informes = await Informe.findAll({
                include: [{ model: Instalacion, as: 'instalacion', attributes: ['id', 'nombre', 'codigo'], where: {responsable_id: req.user.id}, required: true}],
                order: [['fecha_generacion', 'DESC']]
            });
        }

        res.json({ total: informes.length, informes});
    
    } catch (error){
        console.error('Error obteniendo los informes: ', error);
        res.status(500).json({error: 'Error obteniendo los informes'});  
    }
}

/*
    Ruta: GET /api/informes/:id/descargar
    Descargar el PDF de un informe
*/
async function descargar(req, res){
    try {
        const {id} = req.params;
        const informe = await Informe.findByPk(id, {
            include: [{ model: Instalacion, as: 'instalacion', attributes: ['id', 'nombre', 'responsable_id']}]
        });

        if(!informe){
            return res.status(404).json({error:'Informe no encontrado'});
        }

        //El responsable solo puede descargar los informes de su instalacion
        if(req.user.role === 'RESPONSABLE'){
            if(!informe.instalacion || informe.instalacion.responsable_id !== req.user.id) {
                return res.status(403).json({error: 'No tienes acceso a este informe'});
            }
        }

        if(!informe.ruta_pdf || !fs.existsSync(informe.ruta_pdf)) {
            return res.status(404).json({error: 'El archivo PDF no existe'});
        }

        res.download(informe.ruta_pdf);

    } catch (error) {
        console.error('Error descargando el informe: ', error);
        res.status(500).json({error: 'Error descargando el informe'});
    }
}

module.exports = { generar, getAll, descargar};


