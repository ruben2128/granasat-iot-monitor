const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const Informe = require('../models/Informe');
const Instalacion = require('../models/Instalacion');
const Dispositivo = require('../models/Dispositivo');
const AlertaHistorial = require('../models/AlertaHistorial');
const AlertaConfig = require('../models/AlertaConfig');
const influxService = require('./influxService');
const emailService = require('./emailService');

//Carpeta en donde se guardaran los PDFS
const CARPETA_INFORMES = path.join(__dirname, '../../informes');

if(!fs.existsSync(CARPETA_INFORMES)){
    fs.mkdirSync(CARPETA_INFORMES, { recursive: true});
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre', '' ];

/* Generar PDF del informe mensual de una instalación y lo guarda*/
async function generarPDF(instalacion, dispositivos, alertas, mes, anio, fechaInicio, fechaFin, graficas) {
    return new Promise((resolve, reject) => {
        //codigo_referencia es texto libre (p.ej. "IR/GR-057") y puede llevar caracteres
        //no validos en nombres de fichero (/, \). Los saneamos para no romper la ruta,
        //y usamos el id como respaldo si la instalacion no tiene codigo asignado.
        const codigoSeguro = (instalacion.codigo_referencia || instalacion.id).replace(/[\\/]/g, '-');
        const nombreArchivo = `informe_${codigoSeguro}_${anio}_${String(mes).padStart(2, '0')}.pdf`;
        const rutaArchivo = path.join(CARPETA_INFORMES, nombreArchivo);
        const LOGO = path.join(__dirname, '../assets/granasat-logo.png');
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const fechaGeneracion = new Date().toLocaleString('es-ES');
        const stream = fs.createWriteStream(rutaArchivo);

        doc.pipe(stream);

        // Cabecera
        // Logo GranaSAT
        if (fs.existsSync(LOGO)) {
            doc.image(LOGO, 50, 40, { width: 50, height: 50 });
        }

        // Bloque texto cabecera (derecha del logo)
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#e8550a').text('GranaSAT', 110, 42);
        doc.fontSize(9).font('Helvetica').fillColor('#444444').text('Electronics Department — University of Granada, SPAIN', 110, 59);

        // Línea separadora
        doc.moveDown(0.5);
        doc.moveTo(50, 100).lineTo(545, 100).strokeColor('#e8550a').lineWidth(2).stroke();
        doc.strokeColor('black').lineWidth(1);

        // Título
        doc.moveDown(1.5);
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#1a1a1a').text('INFORME MENSUAL DE MONITORIZACIÓN IoT', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(13).font('Helvetica').fillColor('#444444').text(`${MESES[mes - 1]} de ${anio}`, { align: 'center' });

        doc.moveDown(1);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
        doc.moveDown(1);

        // Datos de la instalación
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#e8550a').text('DATOS DE LA INSTALACIÓN');
        doc.moveDown(0.4);

        // Fondo gris claro para la tarjeta de datos
        const yTarjeta = doc.y;
        doc.rect(50, yTarjeta, 495, 80).fill('#f7f7f7').stroke('#e0e0e0');
        doc.fillColor('#1a1a1a').fontSize(10).font('Helvetica');

        doc.text(`Nombre:`, 65, yTarjeta + 10, { continued: true }).font('Helvetica-Bold').text(`  ${instalacion.nombre}`);
        doc.font('Helvetica').text(`Código:`, 65, yTarjeta + 26, { continued: true }).font('Helvetica-Bold').text(`  ${instalacion.codigo_referencia}`);
        doc.font('Helvetica').text(`Ubicación:`, 65, yTarjeta + 42, { continued: true }).font('Helvetica-Bold').text(`  ${instalacion.ubicacion || 'No especificada'}`);
        doc.font('Helvetica').text(`Período:`, 65, yTarjeta + 58, { continued: true }).font('Helvetica-Bold').text(`  ${fechaInicio} - ${fechaFin}`);

        doc.y = yTarjeta + 90;
        doc.moveDown(1);

        // Dispositivos registrados
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#e8550a').text('DISPOSITIVOS REGISTRADOS');
        doc.moveDown(0.4);
        doc.fontSize(10).font('Helvetica').fillColor('#1a1a1a');

        if (dispositivos.length === 0) {
            doc.text('No hay dispositivos registrados en esta instalación.');
        } else {
            dispositivos.forEach((d, i) => {
                doc.font('Helvetica-Bold').text(`${i + 1}. ${d.nombre}`, { continued: true }).font('Helvetica').fillColor('#444444').text(`   MAC: ${d.mac_address}   HW: ${d.hw_version || 'N/A'}   FW: ${d.fw_version || 'N/A'}`);
                doc.fillColor('#1a1a1a');
            });
        }

        doc.moveDown(1);

        //Resumen de alertas
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#e8550a').text('RESUMEN DE ALERTAS DEL MES');
        doc.moveDown(0.4);
        doc.fontSize(10).font('Helvetica').fillColor('#1a1a1a');

        if (alertas.length === 0) {
            doc.text('No se registraron alertas durante este período.');
        } else {
            doc.text(`Total de alertas disparadas: ${alertas.length}`);
            doc.moveDown(0.4);
            alertas.forEach((a, i) => {
                const fecha = new Date(a.fecha_disparo).toLocaleString('es-ES');
                const nombreDispositivo = a.dispositivo?.nombre || 'Dispositivo eliminado';
                doc.fontSize(9).fillColor('#444444').text(`${i + 1}.  [${a.tipo}]  ${nombreDispositivo}  —  ${fecha}  —  Valor: ${a.valor_detectado}  (umbral: ${a.umbral_configurado})  —  Email: ${a.email_enviado ? 'Enviado ' : 'No enviado'}`);
            });
        }

        //Gráficas
        if (graficas && graficas.length > 0) {
            doc.moveDown(2);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e0e0e0').lineWidth(1).stroke();
            doc.moveDown(0.3);
            doc.fontSize(8).font('Helvetica').fillColor('#888888').text('Edif. I+D Josefina Castro Vizoso · Avda. Madrid 15, 2 Pta. · 18011 Granada · Tel. +34-958244010 · amroldan@ugr.es', { align: 'center' });
            doc.text(`Informe generado automaticamente el ${fechaGeneracion}`, { align: 'center' });

            doc.addPage();

            // Cabecera repetida en la nueva página
            if (fs.existsSync(LOGO)) {
                doc.image(LOGO, 50, 40, { width: 40, height: 40 });
            }
            
            doc.fontSize(9).font('Helvetica').fillColor('#888888').text('GranaSAT — University of Granada', 100, 52);
            doc.moveTo(50, 88).lineTo(545, 88).strokeColor('#e8550a').lineWidth(2).stroke();
            doc.strokeColor('black').lineWidth(1);

            doc.moveDown(2);
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#e8550a').text('GRÁFICAS DE MONITORIZACIÓN', 50, 105);
            doc.moveDown(1);

            graficas.forEach(function (grafica) {
                doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a').text(grafica.nombre);
                doc.moveDown(0.3);
                doc.image(grafica.imagen, { width: 495, align: 'center' });
                doc.moveDown(1.5);
            });

        }

        doc.moveDown(2);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e0e0e0').lineWidth(1).stroke();
        doc.moveDown(0.3);
        doc.fontSize(8).font('Helvetica').fillColor('#888888').text('Edif. I+D Josefina Castro Vizoso · Avda. Madrid 15, 2 Pta. · 18011 Granada · Tel. +34-958244010 · amroldan@ugr.es', { align: 'center' });
        doc.text(`Informe generado automaticamente el ${fechaGeneracion}`, { align: 'center' });

        doc.end();

        stream.on('finish', () => {
            const tamanio = fs.statSync(rutaArchivo).size;
            resolve({ rutaArchivo, nombreArchivo, tamanio });
        });

        stream.on('error', reject);
    });
}


/*
    Generar informe mensual de una instalacion
    
    Parametros:
        - instalacion_id = UUID
        - mes = numero [1-12]
        - anio = numero
*/
async function generarInformeMensual(instalacion_id, mes, anio) {

    const instalacion  = await Instalacion.findByPk(instalacion_id, {
        include: [{ model: Dispositivo, as: 'dispositivos'}]   
    });

    if(!instalacion){
        throw new Error('La instalación no existe / no fue encontrada.');
    }

    //Calcular fechas
    const fechaInicio = new Date(anio, mes - 1, 1); // Los meses van del 0 al 11
    const fechaFin = new Date(anio, mes, 0); // Dia 0 del siguiente mes = ultimo dia del mes actual
    const fechaInicioMesSiguiente = new Date(anio, mes, 1); // Limite superior exclusivo (medianoche del dia 1 del mes siguiente)

    //Transformar a String con formato 'YYYY-MM-DD'
    const fechaInicioStr = fechaInicio.toLocaleDateString('en-CA');
    const fechaFinStr = fechaFin.toLocaleDateString('en-CA');

    //Rango RFC3339 para InfluxDB: del inicio del mes al inicio del mes siguiente (stop exclusivo,
    //para no perder las lecturas del último día del mes)
    const influxInicioISO = fechaInicio.toISOString();
    const influxFinISO = fechaInicioMesSiguiente.toISOString();

    //Asegurarnos de que no exista ya un informe en este mes y año
    const informeExistente = await Informe.findOne({
        where: { instalacion_id, mes, anio}
    });

    //Obtener los dispositivos que hay en la instalacion
    const dispositivos = await Dispositivo.findAll({
        where: { instalacion_id }
    });

    //Recopilar las alertas del mes
    //(limite superior exclusivo: [Op.lt] evita perder las alertas disparadas
    //despues de medianoche del ultimo dia del mes)
    const alertas = await AlertaHistorial.findAll({
        where: {
            instalacion_id,
            fecha_disparo: {
                [Op.gte]: fechaInicio,
                [Op.lt]: fechaInicioMesSiguiente
            }
        },
        include: [{ model: Dispositivo, as: 'dispositivo', attributes: ['nombre'] }],
        order: [['fecha_disparo', 'ASC']]
    });

    // Generar gráficas para cada dispositivo
    const graficas = [];
    for(const dispositivo of dispositivos){
        if(dispositivo.mac_address){
            try {
                const lecturas = await influxService.obtenerLecturas(dispositivo.mac_address, influxInicioISO, null, influxFinISO);
                if(lecturas.length > 0){
                    //Usamos el umbral realmente configurado para radiacion (el mismo que dispara
                    //las alertas del resumen de arriba), en vez de un valor fijo desconectado de la realidad
                    const alertaConfig = await AlertaConfig.findOne({
                        where: { dispositivo_id: dispositivo.id, campo: 'radiacion', activa: true }
                    });
                    const umbral = alertaConfig?.umbral ?? 80;
                    const imagen = await generarGraficaRadiacion(lecturas, umbral);
                    graficas.push({
                        nombre: `${dispositivo.nombre} - Radiación`,
                        imagen
                    });
                }
            } catch(err) {
                console.error(`Error generando gráfica para ${dispositivo.nombre}:`, err.message);
            }
        }
    }

    //Generar el PDF
    const { rutaArchivo, nombreArchivo, tamanio } = await generarPDF(instalacion, dispositivos, alertas, mes, anio, fechaInicioStr, fechaFinStr, graficas);

    //Determinar los destinatarios (responsable por ahora) que recibiran el email
    const destinatarios = [];

    if(instalacion.responsable && instalacion.responsable.email){
        destinatarios.push(instalacion.responsable.email);
    }

    //Añadir titulares de cada dispositivo
    for(const dispositivo of dispositivos) {
        if(dispositivo.titular_id){
            const titular = await require('../models/Usuario').findByPk(dispositivo.titular_id,{
                attributes: ['email']
            });

            if(titular && titular.email && !destinatarios.includes(titular.email)){
                destinatarios.push(titular.email);
            }
        }
    }

    //Enviar el informe por email
    let emailEnviado = false;
    let fechaEnvioEmail = null;

    if(destinatarios.length > 0){
        try {
            await emailService.enviarEmailInforme(
                destinatarios,
                `Informe mensual IoT - ${MESES[mes - 1]} ${anio} - ${instalacion.nombre}`,
                `El informe mensual de la instalacion <strong>${instalacion.nombre}</strong> correspondiente al mes de <strong>${MESES[mes - 1]} de ${anio}</strong> esta listo.`,
                rutaArchivo,
                nombreArchivo
            );
            emailEnviado = true;
            fechaEnvioEmail = new Date();
        }catch (err) {
            console.error('Error enviando el informe por email', err.message);
        }
    }

    let registro;

    //Si existia un informe para este mes, lo actualizamos. Si no existe, lo creamos de cero
    if(informeExistente){
        registro = await informeExistente.update({
            ruta_pdf: rutaArchivo,
            tamano_bytes: tamanio,
            generado: true,
            email_enviado: emailEnviado,
            email_destinatarios: destinatarios,
            fecha_generacion: new Date(),
            fecha_envio_email: fechaEnvioEmail
        });
    } else {
        registro = await Informe.create({
            instalacion_id,
            mes,
            anio,
            fecha_inicio: fechaInicioStr,
            fecha_fin: fechaFinStr,
            ruta_pdf: rutaArchivo,
            tamano_bytes: tamanio,
            generado: true,
            email_enviado: emailEnviado,
            email_destinatarios: destinatarios,
            fecha_generacion: new Date(),
            fecha_envio_email: fechaEnvioEmail
        });
    }

    const resultado = {
        informe: registro,
        ruta: rutaArchivo,
        emailEnviado: emailEnviado
    };

    return resultado;
}

/*
    Genera el informe del mes que acaba de terminar para todas las instalaciones activas.
    Pensada para ejecutarse desde un cron el día 1 de cada mes (ver server.js).
*/
async function generarInformesMensualesAutomaticos() {
    //Mes/año que acaba de cerrar respecto a hoy
    const hoy = new Date();
    const mesAnterior = hoy.getMonth() === 0 ? 12 : hoy.getMonth();
    const anioAnterior = hoy.getMonth() === 0 ? hoy.getFullYear() - 1 : hoy.getFullYear();

    const instalaciones = await Instalacion.findAll({ where: { activa: true } });

    console.log(`[informes] Generando informes automaticos de ${mesAnterior}/${anioAnterior} para ${instalaciones.length} instalacion(es)...`);

    for (const instalacion of instalaciones) {
        try {
            await generarInformeMensual(instalacion.id, mesAnterior, anioAnterior);
            console.log(`[informes] Informe generado para "${instalacion.nombre}" (${mesAnterior}/${anioAnterior})`);
        } catch (err) {
            console.error(`[informes] Error generando el informe automatico de "${instalacion.nombre}":`, err.message);
        }
    }
}

async function generarGraficaRadiacion(lecturas, umbral) {
    const width = 500;
    const height = 250;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

    // Filtrar solo lecturas de radiación y ordenar por tiempo
    const lecturasRadiacion = lecturas
        .filter(function(l) { return l.variable === 'radiacion'; })
        .reverse();

    const labels = lecturasRadiacion.map(function(l) {
        return new Date(l.time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    });

    const valores = lecturasRadiacion.map(function(l) { return l.valor; });

    const config = {type: 'line', data: { labels, datasets: [
                {
                    label: 'Radiación',
                    data: valores,
                    borderColor: '#e8550a',
                    backgroundColor: 'rgba(232, 85, 10, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: true
                },
                {
                    label: `Umbral (${umbral})`,
                    data: new Array(labels.length).fill(umbral),
                    borderColor: '#ff0000',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: { responsive: false, plugins: { legend: { display: true } }, scales: { y: { beginAtZero: true }}}
    };

    return await chartJSNodeCanvas.renderToBuffer(config);
}

module.exports = { generarInformeMensual, generarInformesMensualesAutomaticos };
