const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

const Informe = require('../models/Informe');
const Instalacion = require('../models/Instalacion');
const Dispositivo = require('../models/Dispositivo');
const AlertaHistorial = require('../models/AlertaHistorial');
const influxService = require('./influxService');
const emailService = require('./emailService');

//Carpeta en donde se guardaran los PDFS
const CARPETA_INFORMES = path.join(__dirname, '../../informes');

if(!fs.existsSync(CARPETA_INFORMES)){
    fs.mkdirSync(CARPETA_INFORMES, { recursive: true});
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre', '' ];


/* Generar PDF del informe mensual de una instalación y lo guarda*/
async function generarPDF(instalacion, dispositivos, alertas, mes, anio, fechaInicio, fechaFin){
    return new Promise((resolve, reject) => {
        const nombreArchivo = `informe_${instalacion.codigo}_${anio}_${String(mes).padStart(2,'0')}.pdf`;
        const rutaArchivo = path.join(CARPETA_INFORMES, nombreArchivo);

        const doc = new PDFDocument({margin: 50});
        const stream = fs.createWriteStream(rutaArchivo);
        
        doc.pipe(stream);

        //CABECERA
        doc.fontSize(20).font('Helvetica-Bold').text('INFORME MENSUAL DE MONITORIZACION GRANASAT', {align: 'center'});

        doc.moveDown(0.5);
        doc.fontSize(14).font('Helvetica').text(`${MESES[mes]} ${anio}`, {align: 'center'});

        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(1);

        //INSTALACION
        doc.fontSize(14).font('Helvetica-Bold').text('DATOS DE LA INSTALACION');
        
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Nombre: ${instalacion.nombre}`);
        doc.text(`Codigo: ${instalacion.codigo}`);
        doc.text(`Ubicacion: ${instalacion.ubicacion}`);
        doc.text(`Periodo: ${fechaInicio} - ${fechaFin}`);
        doc.moveDown(1);

        //DISPOSITIVOS
        doc.fontSize(14).font('Helvetica-Bold').text('DISPOSITIVOS REGISTRADOS');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');

        if(dispositivos.length === 0){
            doc.text('No hay dispositivos registrados en esta instalacion');
        } else {
            dispositivos.forEach((d, i) => { doc.text(`${i+1}. ${d.nombre} - Direccion MAC: ${d.mac_address} - Version Hardware; ${d.hw_version} - Version firmware: ${d.fw_version}`);});
        }

        doc.moveDown(1);

        // RESUMEN DE LAS ALERTAS
        doc.fontSize(14).font('Helvetica-Bold').text('RESUMEN DE ALERTAS DEL MES');

        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');

        if(alertas.length === 0){
            doc.text('No se registraron alertas durante este periodo');
        } else {
            doc.text('Total de alertas disparadas: ${alertas.length}');

            doc.moveDown(0.5);
            alertas.forEach((a, i) => {
                const fecha = new Date(a.fecha_disparo).toLocaleString('es-ES');

                doc.text(`${i+1}. [${a.tipo}] ${fecha} - Valor: ${a.valor_detectado} (umbral: ${a.umbral_configurado}) - Email enviado: ${a.email_enviado ? 'Si' : 'No'}`);
            });
        }
        
        doc.moveDown(1);

        // PIE DE PAGINA
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        
        doc.moveDown(0.5);
        doc.fontSize(9).font('Helvetica').fillColor('grey').text(`Informe generado automaticamente el ${new Date().toLocaleString('es-ES')}`, {align: 'center'});

        doc.end();

        stream.on('finish', () => {
            const tamanio = fs.statSync(rutaArchivo).size;
            resolve ({rutaArchivo, nombreArchivo, tamanio});
        });

        stream.on('error', reject);
    })
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

    //Transformar a String con formato 'YYYY-MM-DD'
    const fechaInicioStr = fechaInicio.toLocaleDateString('en-CA');
    const fechaFinStr = fechaFin.toLocaleDateString('en-CA');

    //Asegurarnos de que no exista ya un informe en este mes y año
    const informeExistente = await Informe.findOne({
        where: { instalacion_id, mes, anio}
    });

    if(informeExistente && informeExistente.generado){
        throw new Error('Ya existe un informe generado para este mes y anio');
    }

    //Obtener los dispositivos que hay en la instalacion
    const dispositivos = await Dispositivo.findAll({
        where: { instalacion_id }
    });

    //Recopilar las alertas del mes
    const alertas = await AlertaHistorial.findAll({
        where: {
            instalacion_id,
            fecha_disparo: {
                [Op.gte]: fechaInicio,
                [Op.lte]: fechaFin
            }
        }, order: [['fecha_disparo', 'ASC']]
    });

    //Generar el PDF
    const { rutaArchivo, tamano } = await generarPDF(instalacion, dispositivos, alertas, mes, anio, fechaInicioStr, fechaFinStr);

    //Determinar los destinatarios (responsable por ahora) que recibiran el email
    const destinatarios = [];

    if(instalacion.responsable && instalacion.responsable.email){
        destinatarios.push(instalacion.responsable.email);
    }

    //Enviar el informe por email
    let emailEnviado = false;
    let fechaEnvioEmail = null;

    if(destinatarios.length > 0){
        try {
            await emailService.enviarEmailAlerta(
                destinatarios,
                `Informe mensual IoT - ${MESES[mes]} {anio} - ${instalacion.nombre}`,
                `El informe mensual de la instalacion ${instalacion.nombre} correspondiente al mes de ${MESES[mes]} de ${anio} se encuentra adjuntado a este email.`
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
            tamano_bytes: tamano,
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
            tamano_bytes: tamano,
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

module.exports = { generarInformeMensual };
