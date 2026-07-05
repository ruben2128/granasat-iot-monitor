const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Modelo de invitación de usuario.
 * Permite al admin invitar a nuevos usuarios por email con un token
 * y caducidad de 48 horas.
 * El token se invalida tras el primer uso.
 */
const Invitacion = sequelize.define('Invitacion', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    // Email al que se envió la invitación
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { isEmail: true }
    },
    // Token criptográficamente seguro 
    token: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true
    },
    // Rol que tendrá el usuario al registrarse
    role: {
        type: DataTypes.ENUM('RESPONSABLE', 'TITULAR'),
        allowNull: false,
        defaultValue: 'RESPONSABLE'
    },
    // Fecha de caducidad (48h desde la creación)
    fecha_caducidad: {
        type: DataTypes.DATE,
        allowNull: false
    },
    // Si ya fue usado para registrarse
    usado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // Admin que envió la invitación
    invitado_por: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    tableName: 'invitaciones',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Invitacion;