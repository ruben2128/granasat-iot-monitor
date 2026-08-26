const AlertaConfig = require('../models/AlertaConfig');
const AlertaHistorial = require('../models/AlertaHistorial');
const Dispositivo = require('../models/Dispositivo');
const Instalacion = require('../models/Instalacion');
const Usuario = require('../models/Usuario');
const influxService = require('./influxService');
const emailService = require('./emailService');
const {Op} = require('sequelize');

const COOLDOWN_MINUTOS = 30;

// Cooldown especifico para avisos de calibracion: 7 dias para no repetir el mismo aviso constantemente
const COOLDOWN_CALIBRACION_DIAS = 7;

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
            fecha_disparo: { [Op.gte]: limite} //Operador de Sequelize similar a >= en SQL
        }
    });

    if(alertaReciente){
        return true;
    } else {
        return false;
    }
}

/**
 * Comprueba si ya se envió un aviso de calibración para este dispositivo
 * en los últimos 7 días, para evitar spam de emails.
 */
async function yaAvisadoCalibracion(dispositivoId) {
    const limite = new Date(Date.now() - COOLDOWN_CALIBRACION_DIAS * 24 * 60 * 60 * 1000);

    const avisoReciente = await AlertaHistorial.findOne({
        where: {
            dispositivo_id: dispositivoId,
            tipo: 'CALIBRACION',
            fecha_disparo: { [Op.gte]: limite }
        }
    });

    return !!avisoReciente;
}

/**
 * Comprueba si algún dispositivo activo tiene la calibración próxima a caducar
 * (dentro de los próximos 90 días) y envía un aviso por email al responsable
 */
async function comprobarCalibraciones() {
    const hoy = new Date();
    const en90dias = new Date(hoy.getTime() + 90 * 24 * 60 * 60 * 1000);

    const dispositivos = await Dispositivo.findAll({
        where: {
            activo: true,
            calibrado: true,
            fecha_proxima_calibracion: {
                [Op.between]: [hoy, en90dias]
            }
        },
        include: [{
            model: Instalacion,
            as: 'instalacion',
            include: [{
                model: require('../models/Usuario'),
                as: 'responsable',
                attributes: ['email', 'nombre']
            }]
        }]
    });

    for (const dispositivo of dispositivos) {
        try {
            const yaAvisado = await yaAvisadoCalibracion(dispositivo.id);
            if (yaAvisado)
                continue;

            const diasRestantes = Math.ceil(
                (new Date(dispositivo.fecha_proxima_calibracion) - hoy) / (1000 * 60 * 60 * 24)
            );

            const emailsDestino = [];

            if (dispositivo.instalacion?.responsable?.email) {
                emailsDestino.push(dispositivo.instalacion.responsable.email);
            }

            const mensaje =
                `AVISO DE CALIBRACIÓN PRÓXIMA A CADUCAR\n\n` +
                `El dispositivo "${dispositivo.nombre}" tiene la calibración próxima a caducar.\n\n` +
                `Instalación: ${dispositivo.instalacion?.nombre || '-'}\n` +
                `Dispositivo: ${dispositivo.nombre} (MAC: ${dispositivo.mac_address})\n` +
                `Fecha de próxima calibración: ${dispositivo.fecha_proxima_calibracion}\n` +
                `Días restantes: ${diasRestantes}\n\n` +
                `Por favor, gestione la renovación de la calibración antes de que caduque.`;

            let emailEnviado = false;
            let emailError = null;

            if (emailsDestino.length === 0) {
                emailError = 'La instalación no tiene responsable asignado';
            } else {
                try {
                    await emailService.enviarEmailAlerta(
                        emailsDestino,
                        `[IOT AVISO] Calibración próxima a caducar: ${dispositivo.nombre}`,
                        mensaje
                    );
                    emailEnviado = true;
                    console.log(`Aviso de calibración enviado para: ${dispositivo.nombre}`);
                } catch (err) {
                    emailError = err.message;
                    console.error(`Error enviando aviso de calibración para ${dispositivo.nombre}: ${err.message}`);
                }
            }

            // Registrar el aviso en el historial aunque el email falle
            await AlertaHistorial.create({
                alerta_config_id: null,
                dispositivo_id: dispositivo.id,
                instalacion_id: dispositivo.instalacion_id,
                tipo: 'CALIBRACION',
                valor_detectado: diasRestantes,
                umbral_configurado: 90,
                mensaje,
                email_enviado: emailEnviado,
                email_error: emailError,
                destinatarios: emailsDestino,
                fecha_disparo: new Date(),
                fecha_email: emailEnviado ? new Date() : null
            });

        } catch (err) {
            console.error(`Error comprobando calibración de ${dispositivo.nombre}: ${err.message}`);
        }
    }
}

/**
 * Comprueba el estado de conexión de cada dispositivo activo y envía
 * un email al responsable cuando detecta un cambio de estado
 */
async function comprobarConexiones() {
    const dispositivos = await Dispositivo.findAll({
        where: { activo: true },
        include: [{
            model: Instalacion,
            as: 'instalacion',
            include: [{
                model: require('../models/Usuario'),
                as: 'responsable',
                attributes: ['email', 'nombre']
            }]
        }]
    });

    for (const dispositivo of dispositivos) {
        if (!dispositivo.mac_address)
            continue;

        try {
            const ultimaLectura = await influxService.obtenerUltimaLectura(dispositivo.mac_address);
            const camposConDatos = Object.values(ultimaLectura);

            // Determinar si está conectado ahora mismo (lectura reciente < 6 min)
            let ahoraConectado = false;
            if (camposConDatos.length > 0) {
                const fechaMasReciente = camposConDatos.reduce(function(masReciente, campo) {
                    return new Date(campo.time) > new Date(masReciente) ? campo.time : masReciente;
                }, camposConDatos[0].time);

                const minutosTranscurridos = (new Date() - new Date(fechaMasReciente)) / (1000 * 60);
                ahoraConectado = minutosTranscurridos <= 6;
            }

            const estabaConectado = dispositivo.conectado;

            // Detectar cambio de estado
            if (estabaConectado === ahoraConectado) {
                // Sin cambio, no hacer nada
                continue;
            }

            // Actualizar el estado en BD
            await dispositivo.update({ conectado: ahoraConectado });

            // Obtener email del responsable
            const emailsDestino = [];
            if (dispositivo.instalacion?.responsable?.email) {
                emailsDestino.push(dispositivo.instalacion.responsable.email);
            }

            const tipo = ahoraConectado ? 'RECONEXION' : 'DESCONEXION';
            const asunto = ahoraConectado
                ? `[IOT AVISO] Dispositivo reconectado: ${dispositivo.nombre}`
                : `[IOT AVISO] Dispositivo desconectado: ${dispositivo.nombre}`;
            const mensaje = ahoraConectado
                ? `AVISO DE RECONEXIÓN\n\nEl dispositivo "${dispositivo.nombre}" ha vuelto a estar en uso.\n\n` +
                  `Instalación: ${dispositivo.instalacion?.nombre || '-'}\n` +
                  `Dispositivo: ${dispositivo.nombre} (MAC: ${dispositivo.mac_address})\n` +
                  `Fecha: ${new Date()}`
                : `AVISO DE DESCONEXIÓN\n\nEl dispositivo "${dispositivo.nombre}" ha dejado de enviar datos.\n\n` +
                  `Instalación: ${dispositivo.instalacion?.nombre || '-'}\n` +
                  `Dispositivo: ${dispositivo.nombre} (MAC: ${dispositivo.mac_address})\n` +
                  `Última conexión: ${dispositivo.ultima_conexion || '-'}\n` +
                  `Fecha: ${new Date()}`;

            let emailEnviado = false;
            let emailError = null;

            if (emailsDestino.length === 0) {
                emailError = 'La instalación no tiene responsable asignado';
            } else {
                try {
                    await emailService.enviarEmailAlerta(emailsDestino, asunto, mensaje);
                    emailEnviado = true;
                    console.log(`Aviso de ${tipo} enviado para: ${dispositivo.nombre}`);
                } catch (err) {
                    emailError = err.message;
                    console.error(`Error enviando aviso de ${tipo} para ${dispositivo.nombre}: ${err.message}`);
                }
            }

            await AlertaHistorial.create({
                alerta_config_id: null,
                dispositivo_id: dispositivo.id,
                instalacion_id: dispositivo.instalacion_id,
                tipo,
                valor_detectado: null,
                umbral_configurado: null,
                mensaje,
                email_enviado: emailEnviado,
                email_error: emailError,
                destinatarios: emailsDestino,
                fecha_disparo: new Date(),
                fecha_email: emailEnviado ? new Date() : null
            });

        } catch (err) {
            console.error(`Error comprobando conexión de ${dispositivo.nombre}: ${err.message}`);
        }
    }
}

/**
 * Calcula el Z-Score de un valor respecto a un conjunto de lecturas.
 * Z = (valor - media) / desviacion_estandar
 * Se considera anomalo si |Z| > 3 (mas de 3 desviaciones estandar).
 */
function calcularZScore(valor, lecturas) {
    if (lecturas.length < 10) return null; // Minimo de datos para que sea estadisticamente significativo

    const valores = lecturas.map(function(l) { return l.valor; });
    const media = valores.reduce(function(a, b) { return a + b; }, 0) / valores.length;
    const varianza = valores.reduce(function(acc, v) { return acc + Math.pow(v - media, 2); }, 0) / valores.length;
    const desviacion = Math.sqrt(varianza);

    if (desviacion === 0) return null; // Evitar division por cero si todos los valores son iguales

    return (valor - media) / desviacion;
}

/**
 * Comprueba si las últimas lecturas de cada dispositivo de medida continua
 * contienen valores anómalos según el criterio Z-Score.
 * Usa las lecturas de los ultimos 30 minutos como referencia.
 * Cooldown de 30 minutos para no repetir el aviso constantemente.
 */
async function comprobarZScore() {
    const dispositivos = await Dispositivo.findAll({
        where: {
            activo: true,
            medida_continuo: true
        },
        include: [{
            model: Instalacion,
            as: 'instalacion',
            include: [{
                model: require('../models/Usuario'),
                as: 'responsable',
                attributes: ['email', 'nombre']
            }]
        }]
    });

    for (const dispositivo of dispositivos) {
        if (!dispositivo.mac_address)
            continue;

        try {
            // Obtener las lecturas de radiacion de los ultimos 30 minutos para calcular la referencia estadistica
            const lecturas = await influxService.obtenerLecturas(dispositivo.mac_address, '-30m', 'radiacion');

            if (lecturas.length < 10)
                continue; // No hay suficientes datos

            // La lectura mas reciente es el valor a evaluar
            const lecturaActual = lecturas[0];
            const minutosTranscurridos = (new Date() - new Date(lecturaActual.time)) / (1000 * 60);

            if (minutosTranscurridos > 6)
                continue; // Lectura no es reciente

            const zScore = calcularZScore(lecturaActual.valor, lecturas.slice(1)); // Excluir la lectura actual del calculo de referencia

            if (zScore === null || Math.abs(zScore) <= 3)
                continue; // No es anomalo

            // Comprobar cooldown — reutilizamos yaAlertadoRecientemente con un ID ficticio de tipo ZSCORE
            const yaAlertado = await AlertaHistorial.findOne({
                where: {
                    dispositivo_id: dispositivo.id,
                    tipo: 'ZSCORE',
                    fecha_disparo: { [Op.gte]: new Date(Date.now() - COOLDOWN_MINUTOS * 60 * 1000) }
                }
            });

            if (yaAlertado) continue;

            const emailsDestino = [];
            if (dispositivo.instalacion?.responsable?.email) {
                emailsDestino.push(dispositivo.instalacion.responsable.email);
            }

            const mensaje =
                `AVISO DE VALOR ANÓMALO (Z-Score)\n\n` +
                `Se ha detectado un valor estadísticamente anómalo en el dispositivo "${dispositivo.nombre}".\n\n` +
                `Instalación: ${dispositivo.instalacion?.nombre || '-'}\n` +
                `Dispositivo: ${dispositivo.nombre} (MAC: ${dispositivo.mac_address})\n` +
                `Valor detectado: ${lecturaActual.valor.toFixed(2)} ${dispositivo.unidades_medida || 'µSv/h'}\n` +
                `Z-Score: ${zScore.toFixed(2)} (umbral: ±3)\n` +
                `Fecha: ${new Date(lecturaActual.time).toLocaleString('es-ES')}\n\n` +
                `Un Z-Score de ${zScore.toFixed(2)} indica que el valor está a ${Math.abs(zScore).toFixed(1)} desviaciones estándar de la media de las lecturas de los últimos 30 minutos.`;

            let emailEnviado = false;
            let emailError = null;

            if (emailsDestino.length === 0) {
                emailError = 'La instalación no tiene responsable asignado';
            } else {
                try {
                    await emailService.enviarEmailAlerta(
                        emailsDestino,
                        `[IOT ANOMALÍA] Valor anómalo detectado: ${dispositivo.nombre}`,
                        mensaje
                    );
                    emailEnviado = true;
                    console.log(`Aviso Z-Score enviado para: ${dispositivo.nombre} (Z=${zScore.toFixed(2)})`);
                } catch (err) {
                    emailError = err.message;
                    console.error(`Error enviando aviso Z-Score para ${dispositivo.nombre}: ${err.message}`);
                }
            }

            await AlertaHistorial.create({
                alerta_config_id: null,
                dispositivo_id: dispositivo.id,
                instalacion_id: dispositivo.instalacion_id,
                tipo: 'ZSCORE',
                valor_detectado: lecturaActual.valor,
                umbral_configurado: 3,
                mensaje,
                email_enviado: emailEnviado,
                email_error: emailError,
                destinatarios: emailsDestino,
                fecha_disparo: new Date(),
                fecha_email: emailEnviado ? new Date() : null
            });

        } catch (err) {
            console.error(`Error calculando Z-Score para ${dispositivo.nombre}: ${err.message}`);
        }
    }
}

/**
 * Comprueba si las últimas 5 lecturas consecutivas de un dispositivo
 * superan el valor medio de las últimas 24 horas.
 * Si se cumple, envía un aviso por email al responsable.
 */
async function comprobarMediaConsecutiva() {
    const dispositivos = await Dispositivo.findAll({
        where: {
            activo: true,
            medida_continuo: true
        },
        include: [{
            model: Instalacion,
            as: 'instalacion',
            include: [{
                model: require('../models/Usuario'),
                as: 'responsable',
                attributes: ['email', 'nombre']
            }]
        }]
    });

    for (const dispositivo of dispositivos) {
        if (!dispositivo.mac_address) continue;

        try {
            // Obtener lecturas de las ultimas 24h para calcular la media de referencia
            const lecturas24h = await influxService.obtenerLecturas(dispositivo.mac_address, '-24h', 'radiacion');

            if (lecturas24h.length < 10) continue; // No hay suficientes datos

            // Calcular media de referencia con todas las lecturas de 24h
            const media = lecturas24h.reduce(function(acc, l) { return acc + l.valor; }, 0) / lecturas24h.length;

            // Comprobar si las ultimas 5 lecturas consecutivas superan la media
            // lecturas24h ya viene ordenado por tiempo descendente (la mas reciente primero)
            if (lecturas24h.length < 5) continue;

            const ultimas5 = lecturas24h.slice(0, 5);
            const todas5SuperanMedia = ultimas5.every(function(l) { return l.valor > media; });

            if (!todas5SuperanMedia) continue;

            // Verificar que las 5 lecturas son recientes (la mas antigua no tiene mas de 10 min)
            const minutosUltima = (new Date() - new Date(ultimas5[0].time)) / (1000 * 60);
            if (minutosUltima > 6) continue;

            // Comprobar cooldown
            const yaAlertado = await AlertaHistorial.findOne({
                where: {
                    dispositivo_id: dispositivo.id,
                    tipo: 'MEDIA_CONSECUTIVA',
                    fecha_disparo: { [Op.gte]: new Date(Date.now() - COOLDOWN_MINUTOS * 60 * 1000) }
                }
            });

            if (yaAlertado) continue;

            const emailsDestino = [];
            if (dispositivo.instalacion?.responsable?.email) {
                emailsDestino.push(dispositivo.instalacion.responsable.email);
            }

            const valorMedio = media.toFixed(2);
            const valoresUltimas5 = ultimas5.map(function(l) { return l.valor.toFixed(2); }).join(', ');

            const mensaje =
                `AVISO: SUPERACIÓN DEL VALOR MEDIO EN 5 REGISTROS CONSECUTIVOS\n\n` +
                `El dispositivo "${dispositivo.nombre}" ha registrado 5 lecturas consecutivas por encima del valor medio de las últimas 24 horas.\n\n` +
                `Instalación: ${dispositivo.instalacion?.nombre || '-'}\n` +
                `Dispositivo: ${dispositivo.nombre} (MAC: ${dispositivo.mac_address})\n` +
                `Valor medio de referencia (24h): ${valorMedio} ${dispositivo.unidades_medida || 'µSv/h'}\n` +
                `Últimas 5 lecturas: ${valoresUltimas5} ${dispositivo.unidades_medida || 'µSv/h'}\n` +
                `Fecha: ${new Date().toLocaleString('es-ES')}`;

            let emailEnviado = false;
            let emailError = null;

            if (emailsDestino.length === 0) {
                emailError = 'La instalación no tiene responsable asignado';
            } else {
                try {
                    await emailService.enviarEmailAlerta(
                        emailsDestino,
                        `[IOT AVISO] Superación del valor medio: ${dispositivo.nombre}`,
                        mensaje
                    );
                    emailEnviado = true;
                    console.log(`Aviso de media consecutiva enviado para: ${dispositivo.nombre}`);
                } catch (err) {
                    emailError = err.message;
                    console.error(`Error enviando aviso de media consecutiva para ${dispositivo.nombre}: ${err.message}`);
                }
            }

            await AlertaHistorial.create({
                alerta_config_id: null,
                dispositivo_id: dispositivo.id,
                instalacion_id: dispositivo.instalacion_id,
                tipo: 'MEDIA_CONSECUTIVA',
                valor_detectado: ultimas5[0].valor,
                umbral_configurado: media,
                mensaje,
                email_enviado: emailEnviado,
                email_error: emailError,
                destinatarios: emailsDestino,
                fecha_disparo: new Date(),
                fecha_email: emailEnviado ? new Date() : null
            });

        } catch (err) {
            console.error(`Error comprobando media consecutiva para ${dispositivo.nombre}: ${err.message}`);
        }
    }
}

/**
 * Comprueba que InfluxDB sigue accesible.
 * Si no responde, avisa por email a todos los usuarios con rol ADMIN.
 */
async function comprobarInfluxDB(){
    const disponible = await influxService.comprobarConexion();

    if(disponible){
        return true;
    }

    const yaAvisado = await AlertaHistorial.findOne({
        where: {
            tipo: 'INFLUXDB_CAIDO',
            fecha_disparo: { [Op.gte]: new Date(Date.now() - COOLDOWN_MINUTOS * 60 * 1000) }
        }
    });

    if(yaAvisado){
        console.warn('[alertas] InfluxDB sigue sin responder — ciclo omitido');
        return false;
    }

    const admins = await Usuario.findAll({ where: { role: 'ADMIN', activo: true } });
    const emailsDestino = admins.map(a => a.email).filter(Boolean);

    const mensaje = `AVISO: la base de datos InfluxDB no responde.\n` +
        `Fecha de deteccion: ${new Date()}`;

    let emailEnviado = false;
    let emailError = null;

    if(emailsDestino.length > 0){
        try {
            await emailService.enviarEmailAlerta(
                emailsDestino,
                '[IOT ALERTA] InfluxDB no responde',
                mensaje
            );
            emailEnviado = true;
            console.log('Aviso de caida de InfluxDB enviado a los administradores');
        } catch(err){
            emailError = err.message;
            console.error(`Error enviando aviso de caida de InfluxDB: ${err.message}`);
        }
    }

    await AlertaHistorial.create({
        alerta_config_id: null,
        dispositivo_id: null,
        instalacion_id: null,
        tipo: 'INFLUXDB_CAIDO',
        valor_detectado: null,
        umbral_configurado: null,
        mensaje,
        email_enviado: emailEnviado,
        email_error: emailError,
        destinatarios: emailsDestino,
        fecha_disparo: new Date(),
        fecha_email: emailEnviado ? new Date() : null
    });

    return false;
}

async function procesarAlertas(){
    console.log('[sched] tick', new Date().toISOString());
    const influxOK = await comprobarInfluxDB();
    console.log('[sched] influxOK =', influxOK);

    if(!influxOK){
        return;
    }

    await actualizarUltimasConexiones();
    await comprobarCalibraciones();
    await comprobarConexiones();
    await comprobarZScore();
    await comprobarMediaConsecutiva();
    
    const alertas = await AlertaConfig.findAll({
        where: { activa : true },
        include: [{
            model: Instalacion,
            as: 'instalacion',
            include: [{
                model: Usuario,
                as: 'responsable',
                attributes: ['email', 'nombre']
            }]
        }, {
            model: Dispositivo,
            as: 'dispositivo'
        }]
    });

    for (const alerta of alertas){
        const dispositivo = alerta.dispositivo;

        if(!dispositivo || !dispositivo.mac_address || !dispositivo.activo){
            continue;
        }

        try {
            const ultimaLectura = await influxService.obtenerUltimaLectura(dispositivo.mac_address);
            const lecturaDelCampo = ultimaLectura[alerta.campo];
            
            if(!lecturaDelCampo){
                continue;
            }

            const minutosTranscurridos = (new Date() - new Date(lecturaDelCampo.time)) / (1000*60);

            if(minutosTranscurridos > 6){
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

            const detalle =
                `Instalacion: ${alerta.instalacion?.nombre || '-'}\n` + 
                `Dispositivo: ${dispositivo.nombre} (Direccion MAC: ${dispositivo.mac_address})\n` +
                `Campo: ${alerta.campo}\n` +
                `Valor detectado: ${valor} ${dispositivo.unidades_medida || ''}\n` +
                `Umbral configurado: ${alerta.operador} ${alerta.umbral}\n` +
                `Fecha: ${new Date().toLocaleString('es-ES')}`;

            const mensaje = alerta.mensaje_personalizado
                ? `${alerta.mensaje_personalizado}\n\n${detalle}`
                : `ALERTA: ${alerta.nombre}\n${detalle}`;

            let emailEnviado = false;
            let emailError = null;
            let fechaEnvio = null;

            const destinatarios = [...new Set([
                ...(alerta.emails_destino || []),
                alerta.instalacion?.responsable?.email
            ].filter(Boolean))];

            try {
                await emailService.enviarEmailAlerta(
                    destinatarios,
                    `[IOT ALERTA] ${alerta.nombre}`,
                    mensaje
                );
                emailEnviado = true;
                console.log(`Email de alerta enviado: ${alerta.nombre} - ${dispositivo.nombre}`);
            }catch (err){
                emailError = err.message;
                console.error(`Ha habido un error enviando el email de alerta: ${err.message}`);
            }

            if(emailEnviado){
                fechaEnvio = new Date();
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
                destinatarios: destinatarios,
                fecha_disparo: new Date(),
                fecha_email: fechaEnvio
            });
        } catch(err){
            console.error(`Ha ocurrido un error en la alerta ${alerta.nombre} del dispositivo ${dispositivo.nombre}:`, err.message);
        }
    }
}

module.exports = {procesarAlertas, comprobarInfluxDB};