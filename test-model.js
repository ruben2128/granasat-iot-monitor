// backend/test-model.js
require('dotenv').config();         //Carga variables entorno archivo .env
const Usuario = require('./src/models/Usuario');
const { sequelize } = require('./src/config/database');

async function testModel() {
  try {
    // Conectar
    await sequelize.authenticate();
    console.log('Conectado');
    
    // Sincronizar modelo (NO usar en producción, solo para test)
    // await Usuario.sync({ alter: true });
    
    // Buscar usuario admin
    const admin = await Usuario.findOne({ where: { username: 'admin' } });
    
    if (admin) {
      console.log('Usuario admin encontrado:');
      console.log({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        nombre: admin.nombre
      });
      
      // Probar comparación de password
      const isValid = await admin.comparePassword('admin123');
      console.log('¿Password "admin123" válido?', isValid ? 'SÍ' : 'NO');
    } else {
      console.log('Usuario admin no encontrado');
    }
    
    // Cerrar
    await sequelize.close();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testModel();
