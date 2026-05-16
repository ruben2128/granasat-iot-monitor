const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ConfigEmail = sequelize.define('ConfigEmail', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
    type: DataTypes.STRING(100),
    allowNull: true
    },  
    smtp_host: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    smtp_port: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    smtp_user: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    smtp_pass: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    smtp_secure: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'config_email',
    timestamps: true,
    createdAt: false,
    updatedAt: 'updated_at'
});

module.exports = ConfigEmail;