const AlertaHistorial = require('../models/AlertaHistorial');
const Informe = require('../models/Informe');
const Instalacion = require('../models/Instalacion');
const Dispositivo = require('../models/Dispositivo');

async function obtenerHistorialEmails(req, res){
    try{
        if(req.user.role !== 'ADMIN'){
            return res.status(403).json({ error: 'No tienes permiso para ver el historial de emails'});
        }

        //Emails de alertas
        const emailAlertas = await AlertaHistorial.findAll({
            where: { email_enviado: true},
            include: [{
                model: Instalacion,
                as: 'instalacion',
                attributes: ['nombre', 'categoria']
            }],
            order: [['fecha_disparo', 'DESC']],
            limit: 200
        });

        //Emails de informes
        const emailsInformes = await Informe.findAll({
            where: { email_enviado: true},
            include: [{
                model: Instalacion,
                as: 'instalacion',
                attributes: ['nombre', 'categoria']
            }],
            order: [['fecha_envio_email', 'DESC']],
            limit: 200
        });

        //Combinar y formatear ambos
        const listaAlertas = emailAlertas.map(function(alerta){
            return {
                id: alerta.id,
                tipo: 'ALERTA',
                asunto: `[ALERTA] ${alerta.tipo}`,
                destinatarios: alerta.destinatarios,
                fecha: alerta.fecha_disparo,
                instalacion: alerta.instalacion ? alerta.instalacion.nombre : '-',
                detalle: `Valor: ${alerta.valor_detectado} (umbral: ${alerta.umbral_configurado})`
            };
        });

        const listaInformes = emailsInformes.map(function(informe){
            return {
                id: informe.id,
                tipo: 'INFORME',
                asunto: `Informe mensual - ${informe.mes}/${informe.anio}`,
                destinatarios: informe.email_destinatarios,
                fecha: informe.fecha_envio_email,
                instalacion: informe.instalacion ? informe.instalacion.nombre : '-',
                detalle: `Período: ${informe.fecha_inicio} - ${informe.fecha_fin}`
            };
        });

        const historial = listaAlertas.concat(listaInformes).sort(function(a, b){
            return new Date(b.fecha) - new Date(a.fecha);
        });
        
        console.log('Historial formateado:', historial.length);
        console.log('Primer elemento:', historial[0]);

        res.json({total: historial.length, historial});
    } catch (error){
        console.error('Error al obtener el historial de emails: ', error);
        res.status(500).json({error: 'Error al obtener el historial de emails'});
    }
}

module.exports = {obtenerHistorialEmails};
