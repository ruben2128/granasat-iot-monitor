const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

//Declaración de una instalación de GranaSAT, la cual agrupa uno o varios dispositivos
const Instalacion = sequelize.define('Instalacion', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    //Código corto para identificar rápidamente la instalación
    codigo: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT
    },
    ubicacion: {
        type: DataTypes.STRING(255)
    },
    //Responsable asignado a la instalación
    responsable_id: {
        type: DataTypes.UUID,
        references: {
            model: 'usuarios',
            key: 'id'
        },
        onDelete: 'SET NULL', // En el caso de que se borre el usuario responsable, el responsable_id se queda a null pero no se borra la instalación
        allowNull: true
    },
    //Permite desactivar una instalación conservando el historial
    activa: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    //Tipo según si es IRA o IRD
    tipo_instalacion: {
        type: DataTypes.ENUM('IRA', 'IRD'),
        allowNull: true
    },
    //Dirección postal 
    direccion_instalacion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    //Código de referencia interno
    codigo_referencia: {
        type: DataTypes.STRING(50),
        allowNull: true
    }
}, {
    tableName: 'instalaciones',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
     
});

module.exports = Instalacion;