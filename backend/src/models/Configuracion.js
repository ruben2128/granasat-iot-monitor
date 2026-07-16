const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Modelo de configuración general del sistema.
 * Almacena parámetros configurables como clave-valor.
 */
const Configuracion = sequelize.define('Configuracion', {
    clave: {
        type: DataTypes.STRING(100),
        primaryKey: true,
        allowNull: false
    },
    valor: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'configuracion',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Configuracion;