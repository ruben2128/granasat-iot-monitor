const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LogCambio = sequelize.define('LogCambio', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    usuario_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    campo_modificado: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    valor_anterior: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    valor_nuevo: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'log_cambios',
    timestamps: true,
    createdAt: 'fecha',
    updatedAt: false
});

module.exports = LogCambio;