const PlantillaEmail = require('../models/PlantillaEmail');

async function obtenerPlantilla(req, res){
    try{
        const plantilla = await PlantillaEmail.findOne();

        if(!plantilla){
            return res.status(400).json({ error: 'Plantilla no encontrada'});
        }
        
        res.json(plantilla);
    } catch (error){
        console.error('Error al obtener la plantilla', error);
        res.status(500).json({ error: 'Error al obtener la plantilla'});
    }
}

async function actualizarPlantilla(req, res){
    try{
        if(req.user.role !== 'ADMIN'){
            return res.status(403).json({ error: 'No tienes permiso'});
        }

        const { html } = req.body;

        if(!html){
            return res.status(400).json({ error: 'El campo html es obligatoria'});
        }

        const plantilla = await PlantillaEmail.findOne();

        if(!plantilla){
            return res.status(404).json({ error: 'Plantilla no encontrada'});
        }

        await plantilla.update({ html, updated_at: new Date()});

        res.json({ message: 'Plantilla actualizada correctamente', plantilla});
    } catch (error) {
        console.error('Error al actualizar la plantilla', error);
        res.status(500).json({ error: 'Error al actualizar la plantilla'});
    }
}

module.exports = {obtenerPlantilla, actualizarPlantilla};