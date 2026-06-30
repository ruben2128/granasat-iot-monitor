const nodemailer = require('nodemailer');
const PlantillaEmail = require('../models/PlantillaEmail');

let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // false para el puerto 587, true para el puerto 465
    auth:{
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    //ESTO ES SOLO PARA HACER LAS PRUEBAS CON EL GMAIL
    tls: {
      rejectUnauthorized: false
    }
});

let smtpUserActivo = process.env.SMTP_USER;

async function enviarEmailAlerta(destinatarios, asunto, mensaje){
    try {
        const html = await aplicarPlantilla(asunto, `<p>${mensaje}</p>`);
        const info = await transporter.sendMail({
            from: `"Sistema IoT GranaSAT" <${smtpUserActivo}>`,
            to: destinatarios.join(', '),
            subject: asunto,
            html
        });

        return info;
      } catch (error) {
        console.error('Error detallado email:', error); 
        throw error;
      }
}

async function enviarEmailBienvenida(email, nombre, username, password){
    try {
        const contenido = `
            <p>Hola <strong>${nombre}</strong>, </p>
            <p>Su cuenta ha sido creada correctamente. Aquí tiene su credenciales
            <div style="background-color: #e8e8e8; padding: 16px; border-radius: 6px; margin: 16px 0;">
                <p><strong>Usuario:</strong> ${username}</p>
                <p><strong>Contraseña:</strong> ${password}</p>
            </div>
        `;

        const html = await aplicarPlantilla('Bienveido al Sistema IoT GranaSAT', contenido);
        const info = await transporter.sendMail({
            from: `"Sistema IoT GranaSAT" <${smtpUserActivo}>`,
            to: email,
            subject: 'Bienvenido al Sistema IoT GranaSAT - Su credenciales de acceso',
            html
        });

        return info;
    } catch (error) {
        console.error('Error enviando email de bienvenida:', error);
        throw error;
    }
}

function actualizarTransporter(host, port, user, pass, secure){
    transporter = nodemailer.createTransport({
        host: host,
        port: parseInt(port),
        secure: secure || false,
        auth: {
            user: user,
            pass: pass
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    smtpUserActivo = user;
    console.log(`Transporter de email actualizado: ${host}:${port}`);
}

async function enviarEmailInforme(destinatarios, asunto, mensaje, rutaPdf, nombreArchivo) {
    try {
        const html = await aplicarPlantilla('Informe Mensual IoT GranaSAT', `<p>${mensaje}</p><p>el informe se encuentra adjunto en PDF.</p>`);
        const info = await transporter.sendMail({
            from: `"Sistema IoT GranaSAT" <${smtpUserActivo}>`,
            to: destinatarios.join(', '),
            subject: asunto,
            html,
            attachments: [
                {
                    filename: nombreArchivo,
                    path: rutaPdf,
                    contentType: 'application/pdf'
                }
            ]
        });
        
        return info;
    } catch (error) {
        console.error('Error enviando email con informe adjunto:', error);
        throw error;
    }
}

async function enviarEmailTest(destinatario) {
    try {
        const contenido = `
                <p>
                    Configuración SMTP del Sistema IoT GranaSAT está funcionando correctamente.
                </p>
                <div style="background-color: #e8e8e8; padding: 16px; border-radius: 6px; margin: 16px 0;">
                    <p><strong>Servidor:</strong> ${process.env.SMTP_HOST}</p>
                    <p><strong>Puerto:</strong> ${process.env.SMTP_PORT}</p>
                    <p><strong>Usuario:</strong> ${process.env.SMTP_USER}</p>
                    <p><strong>Fecha del test:</strong> ${new Date().toLocaleString('es-ES')}</p>
                </div>
                <p style="color: #666; font-size: 12px;">
                    Este email ha sido generado automáticamente por el Sistema IoT GranaSAT.
                </p>
        `
        const html = await aplicarPlantilla('Test de configuración SMTP', contenido);
        const info = await transporter.sendMail({
            from: `"Sistema IoT GranaSAT" <${smtpUserActivo}>`,
            to: destinatario,
            subject: 'Test de configuración SMTP de GranaSAT',
            html
        });

        return info;
    } catch (error) {
        console.error('Error enviando email de test:', error);
        throw error;
    }
}

async function aplicarPlantilla(titulo, contenido){
    try{
        const plantilla = await PlantillaEmail.findOne();

        if(!plantilla){
            return `<h2>${titulo}</h2>${contenido}`;
        }

        return plantilla.html.replace('{{titulo}}', titulo).replace('{{contenido}}', contenido);
    } catch (error){
        console.error('Error cargando plantilla', error);
        
        return `<h2>${titulo}</h2>${contenido}`;
    }
}

async function cargarConfigEmailActiva(){
    try {
        const ConfigEmail = require('../models/ConfigEmail');
        const config = await ConfigEmail.findOne({ where: { activo: true } });

        if(config){
            const pass = Buffer.from(config.smtp_pass, 'base64').toString('utf8');

            actualizarTransporter(config.smtp_host, config.smtp_port, config.smtp_user, pass, config.smtp_secure);
            console.log(`Configuración SMTP cargada desde BD al arrancar: ${config.smtp_host} (${config.smtp_user})`);
        } else {
            console.log('No hay configuración SMTP activa en BD, usando .env por defecto');
        }
    } catch (error){
        console.error('Error cargando configuración SMTP activa al arrancar:', error.message);
    }
}

module.exports = {enviarEmailAlerta, enviarEmailBienvenida , actualizarTransporter, enviarEmailInforme, enviarEmailTest, cargarConfigEmailActiva};