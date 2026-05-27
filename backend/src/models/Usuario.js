const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

//Declaración de un usuario, el cual puede ser ADMIN o RESPONSABLE
const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.UUID, // Identificador único universal
    defaultValue: DataTypes.UUIDV4,  // Generación automática
    primaryKey: true      // Clave primaria
  },
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false  //Obligatorio 
  },
  //Se hashea la contraseña y se guarda
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('ADMIN', 'RESPONSABLE', 'TITULAR'),
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING(100)
  },
  apellidos: {
    type: DataTypes.STRING(100)
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true // Validar que tenga el formato correcto de email
    }
  },
  telefono_movil: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  telefono_fijo: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  ultimo_acceso: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'usuarios',
  timestamps: true,     // Sequelize se encarga de añadir automaticamente created_at y updated_at
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Comparar que la contraseña introducida coincide con el hash de la BBDD
Usuario.prototype.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

// Antes de guardar un usuario nuevo, se hashea la contraseña automaticamente
Usuario.beforeCreate(async (usuario) => {
  if (usuario.password_hash) {
    usuario.password_hash = await bcrypt.hash(usuario.password_hash, 10); // Factor de coste 10 (2¹⁰)
  }
});

module.exports = Usuario;
