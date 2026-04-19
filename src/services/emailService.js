const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
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

module.exports = {enviarEmailAlerta}