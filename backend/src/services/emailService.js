const nodemailer = require('nodemailer');

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

async function enviarEmailAlerta(destinatarios, asunto, mensaje){
    try {
        const info = await transporter.sendMail({
          from: `"Sistema IoT" <${process.env.SMTP_USER}>`,
          to: destinatarios.join(', '),
          subject: asunto,
          text: mensaje,
          html: `<pre style="font-family: Arial; font-size: 14px;">${mensaje}</pre>`
        });
        return info;
      } catch (error) {
        console.error('Error detallado email:', error); 
        throw error;
      }
}

async function enviarEmailBienvenida(email, nombre, username, password){
    try {
        const info = await transporter.sendMail({
            from: `"Sistema IoT GranaSAT" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Bienvenido al Sistema IoT GranaSAT - Tus credenciales de acceso',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #c93d00;">Bienvenido al Sistema IoT GranaSAT</h2>
                    <p>Hola <strong>${nombre}</strong>,</p>
                    <p>Tu cuenta ha sido creada correctamente. Aquí tienes tus credenciales de acceso:</p>
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Usuario:</strong> ${username}</p>
                        <p><strong>Contraseña:</strong> ${password}</p>
                    </div>
                    <p>Por seguridad, te recomendamos cambiar tu contraseña tras el primer acceso.</p>
                    <p>Saludos,<br/>Sistema IoT GranaSAT</p>
                </div>
            `
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
    console.log(`Transporter de email actualizado: ${host}:${port}`);
}

async function enviarEmailInforme(destinatarios, asunto, mensaje, rutaPdf, nombreArchivo) {
    try {
        const info = await transporter.sendMail({
            from: `"Sistema IoT GranaSAT" <${process.env.SMTP_USER}>`,
            to: destinatarios.join(', '),
            subject: asunto,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #c93d00;">Informe Mensual IoT GranaSAT</h2>
                    <p>${mensaje}</p>
                    <p>El informe se encuentra adjunto a este correo en formato PDF.</p>
                    <p style="color: #666; font-size: 12px;">
                        Este email ha sido generado automaticamente por el Sistema IoT GranaSAT.
                    </p>
                </div>
            `,
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
        const info = await transporter.sendMail({
            from: `"Sistema IoT GranaSAT" <${process.env.SMTP_USER}>`,
            to: destinatario,
            subject: 'Test de configuración SMTP de GranaSAT',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #c93d00;">Test de configuración SMTP</h2>
                    <p>Configuración SMTP del Sistema IoT GranaSAT está funcionando correctamente.</p>
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Servidor:</strong> ${process.env.SMTP_HOST}</p>
                        <p><strong>Puerto:</strong> ${process.env.SMTP_PORT}</p>
                        <p><strong>Usuario:</strong> ${process.env.SMTP_USER}</p>
                        <p><strong>Fecha del test:</strong> ${new Date().toLocaleString('es-ES')}</p>
                    </div>
                    <p style="color: #666; font-size: 12px;">
                        Este email ha sido generado automáticamente por el Sistema IoT GranaSAT.
                    </p>
                </div>
            `
        });
        return info;
    } catch (error) {
        console.error('Error enviando email de test:', error);
        throw error;
    }
}

module.exports = {enviarEmailAlerta, enviarEmailBienvenida , actualizarTransporter, enviarEmailInforme, enviarEmailTest};