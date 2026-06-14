const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Licencia = sequelize.define('Licencia', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    usuario_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    instalacion_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    campo_aplicacion: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    fecha_concesion: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    fecha_caducidad: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }
}, {
    tableName: 'licencias',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Licencia;