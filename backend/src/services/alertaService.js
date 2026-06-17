const AlertaConfig = require('../models/AlertaConfig');
const AlertaHistorial = require('../models/AlertaHistorial');
const Dispositivo = require('../models/Dispositivo');
const influxService = require('./influxService');
const emailService = require('./emailService');
const {Op} = require('sequelize');

const COOLDOWN_MINUTOS = 30;

function superaUmbral(valor,operador, umbral){
    switch(operador){
        case '>': 
            return valor > umbral;
        case '<': 
            return valor < umbral;
        case '>=':
            return valor >= umbral;
        case '<=':
            return valor <= umbral;
        case '==':
            return valor == umbral;
        default:
            return false;
    }
}

async function actualizarUltimasConexiones(){
    const dispositivos = await Dispositivo.findAll({
        where: {activo: true}
    });

    for(const dispositivo of dispositivos){
        if(!dispositivo.mac_address){
            continue;
        }

        try{
            const ultimaLectura = await influxService.obtenerUltimaLectura(dispositivo.mac_address);
            const camposConDatos = Object.values(ultimaLectura);

            if(camposConDatos.length > 0){
                const fechaMasReciente = camposConDatos.reduce(function(masReciente, campo){
                    return new Date(campo.time) > new Date(masReciente) ? campo.time : masReciente;
                }, camposConDatos[0].time);

                await dispositivo.update({ ultima_conexion: fechaMasReciente });
            }

        } catch(err){
            console.error(`Error actualizando ultima conexion de ${dispositivo.nombre}: `, err.message);
        }
    }
}

async function yaAlertadoRecientemente(alertaConfigId, dispositivoId){
    const limite = new Date(Date.now() - COOLDOWN_MINUTOS*60*1000); // Convierte a ms

    const alertaReciente = await AlertaHistorial.findOne({
        where: {
            alerta_config_id: alertaConfigId,
            dispositivo_id: dispositivoId,
            email_enviado: true,
            fecha_disparo: { [Op.gte]: limite} //Operador de Sequelize similar a >= en SQL
        }
    });

    if(alertaReciente){
        return true;
    } else {
        return false;
    }
}

async function procesarAlertas(){
    await actualizarUltimasConexiones();
    
    const alertas = await AlertaConfig.findAll({
        where: { activa : true },
        include: [{
            model: require('../models/Instalacion'),
            as: 'instalacion'
        }]
    });

    for (const alerta of alertas){
        const dispositivos = await Dispositivo.findAll({
            where: {
                instalacion_id: alerta.instalacion_id,
                activo: true
            }
        });

        for(const dispositivo of dispositivos){
            if(!dispositivo.mac_address){
                continue;
            }

            try {
                const ultimaLectura = await influxService.obtenerUltimaLectura(dispositivo.mac_address);
                const lecturaDelCampo = ultimaLectura[alerta.campo];
                
                if(!lecturaDelCampo){
                    continue;
                }

                const valor = lecturaDelCampo.valor;

                if(!superaUmbral(valor, alerta.operador, alerta.umbral)){
                    continue;
                }

                const yaAlertado = await yaAlertadoRecientemente(alerta.id, dispositivo.id);

                if(yaAlertado){
                    continue;
                }

                const mensaje = alerta.mensaje_personalizado ||
                    `ALERTA: ${alerta.nombre}\n` +
                    `Instaalcion: ${alerta.instalacion.nombre}\n` +
                    `Dispositivo: ${dispositivo.nombre} (Direccion MAC: ${dispositivo.mac_address})\n` +
                    `Campo: ${alerta.campo}\n` +
                    `Valor detectado: ${valor}\n` +
                    `Umbral configurado: ${alerta.operador} ${alerta.umbral}\n`+
                    `Fecha: ${new Date()}`;

                let emailEnviado = false;
                let emailError = null;
                let fechaEnvio = null;

                try {
                    await emailService.enviarEmailAlerta(
                        alerta.emails_destino,
                        `[IOT ALERTA] ${alerta.nombre}`,
                        mensaje
                    );
                    emailEnviado = true;
                    console.log(`Email de alerta enviado: ${alerta.nombre} - ${dispositivo.nombre}`);
                }catch (err){
                    emailError = err.message;
                    console.error(`Ha habido un error enviando el email de alerta: ${err.mesage}`);
                }

                if(emailEnviado){
                    const fechaEnvio = new Date();
                }

                await AlertaHistorial.create({
                    alerta_config_id : alerta.id,
                    dispositivo_id: dispositivo.id,
                    instalacion_id: alerta.instalacion_id,
                    tipo: alerta.tipo,
                    valor_detectado: valor,
                    umbral_configurado: alerta.umbral,
                    mensaje,
                    email_enviado: emailEnviado,
                    email_error: emailError,
                    destinatarios: alerta.emails_destino,
                    fecha_disparo: new Date(),
                    fecha_email: fechaEnvio
                });
            } catch(err){
                console.error(`Ha ocurrido un error en la alerta ${alerta.nombre} del dispositivo ${dispositivo.nombre}:`, err.message);
            }

        }

    }

}

module.exports = {procesarAlertas};