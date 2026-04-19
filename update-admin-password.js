// backend/update-admin-password.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize } = require('./src/config/database');

async function updateAdminPassword() {
  try {
    await sequelize.authenticate();
    console.log(' Conectado a PostgreSQL');

    // Generar hash de "admin123"
    const newPassword = 'admin123';
    const hash = await bcrypt.hash(newPassword, 10);
    
    console.log('\n Nuevo hash generado:');
    console.log(hash);

    // Actualizar en la base de datos
    const [results] = await sequelize.query(
      'UPDATE usuarios SET password_hash = :hash WHERE username = :username', //:hash/:username son placeholders para evitar inyeccion SQL
      {
        replacements: { hash, username: 'admin' }
      }
    );

    console.log(`\n Contraseña actualizada para usuario admin`);
    console.log(`   Nueva contraseña: ${newPassword}`);

    // Verificar
    const [user] = await sequelize.query(
      'SELECT username, password_hash FROM usuarios WHERE username = :username',
      {
        replacements: { username: 'admin' }
      }
    );

    if (user && user[0]) {
      console.log('\n Verificando hash...');
      const isValid = await bcrypt.compare(newPassword, user[0].password_hash);
      console.log(`   ¿Password válido? ${isValid ? 'SI' : 'NO'}`);
    }

    await sequelize.close();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

updateAdminPassword();
