const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LogAcceso = sequelize.define('LogAcceso', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    usuario_id: {
        type: DataTypes.UUID,
        references: {
            model: 'usuarios',
            key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    ip: {
        type: DataTypes.STRING(45),
        allowNull: true
    },
    fecha: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    exito: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'log_accesos',
    timestamps: false
});

module.exports = LogAcceso;