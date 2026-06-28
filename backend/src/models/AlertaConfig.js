const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

//Configuración de alertas por instalación de GranaSAT
const AlertaConfig = sequelize.define('AlertaConfig', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true      
  },
  //Instalación a la que aplica esta alerta
  instalacion_id: {
    type: DataTypes.UUID,
    references: {
        model: 'instalaciones',
        key: 'id'
    },
    onDelete: 'CASCADE', //Si se borra la instalación, se borran sus alertas
    allowNull: false
  },
  //Tipo descriptivo para identificar la alerta rápidamente (Por ejemplo: RADIACION_ALTA)
  tipo: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  //Dato a la que pertenece la alerta (Por ejemplo: radiacion)
  campo: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  //Operador que hace que se lance la alerta
  operador: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
        isIn: [['>', '<', '>=', '<=', '==']]
    }
  },
  //Límite que se ha superado 
  umbral: {
    type: DataTypes.FLOAT
  },
  //Lista de emails que recibirán la notificación cuando se lance la alerta
  emails_destino: {
    type: DataTypes.ARRAY(DataTypes.TEXT)
  },
  mensaje_personalizado: {
    type: DataTypes.TEXT
  },
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  dispositivo_id:{
    type: DataTypes.UUID,
    references: {
      model: 'dispositivos',
      key: 'id'
    },
    onDelete: 'CASCADE',
    allowNull: false
  }
}, {
  tableName: 'alertas_config',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = AlertaConfig;
