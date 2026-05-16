const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AlertaHistorial = sequelize.define('AlertaHistorial', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    alerta_config_id: {
        type: DataTypes.UUID,
        references: {
            model: 'alertas_config',
            key: 'id'
        },
        onDelete: 'SET NULL',
        allowNull: true
    },
    dispositivo_id: {
        type: DataTypes.UUID,
        references: {
            model: 'dispositivos',
            key: 'id'
        },
        onDelete: 'SET NULL',
        allowNull: true
    },
    instalacion_id: {
        type: DataTypes.UUID,
        references:{
            model: 'instalaciones',
            key: 'id'
        }, 
        onDelete: 'SET NULL',
        allowNull: true
    },
    tipo: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    valor_detectado: {
        type: DataTypes.DOUBLE
    },
    umbral_configurado: {
        type: DataTypes.DOUBLE
    }, 
    mensaje: {
        type: DataTypes.TEXT
    },
    email_enviado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    email_error:{
        type: DataTypes.TEXT
    },
    destinatarios: {
        type: DataTypes.ARRAY(DataTypes.TEXT)
    },
    fecha_disparo: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }, 
    fecha_email: {
        type: DataTypes.DATE
    }

}, {
    tableName: 'alertas_historial',
    timestamps: false
});

AlertaHistorial.belongsTo(require('./Instalacion'), {
     foreignKey: 'instalacion_id',
     as: 'instalacion' 
});

module.exports = AlertaHistorial