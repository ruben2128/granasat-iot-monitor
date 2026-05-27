const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlantillaEmail = sequelize.define('PlantillaEmail', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    html: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
},{
    tableName: 'plantillas_email',
    timestamps: false
});

module.exports = PlantillaEmail;