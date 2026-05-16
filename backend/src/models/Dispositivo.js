const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Declaración de un dispositivo registrado en el sistema GranaSAT
const Dispositivo = sequelize.define('Dispositivo', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    // Identificador único del dispositivo, con el formato AA:BB:CC:DD:EE:FF
    mac_address: {
        type: DataTypes.STRING(17),
        unique: true,
        allowNull: false
    }, 
    nombre:{
        type: DataTypes.STRING(100),
        allowNull: false
    },
    descripcion:{
        type: DataTypes.TEXT
    },
    //Instalacion a la que pertenerce el dispositivo
    instalacion_id: {
        type: DataTypes.UUID,
        references: {
            model: 'instalaciones',
            key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: true
    },
    //Versiones que envia el ESP32 mediante MQTT
    hw_version: {
        type: DataTypes.STRING(20)
    },
    fw_version: {
        type: DataTypes.STRING(20)
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    //En el caso de una conexión DHCP, la IP puede cambiar, por eso se actualiza cada vez que se conecta
    ultima_conexion: {
        type: DataTypes.DATE
    },
    ultima_ip: {
        type: DataTypes.STRING(15) // Al utilizar el formato IPv4, solo puede tener como maximo 15 caracteres (Por ejemplo: 192.168.100.100)
    },
    fecha_instalacion: {
        type: DataTypes.DATEONLY
    },
    notas: {
        type: DataTypes.TEXT
    },
    nivel_bateria: {
       type: DataTypes.INTEGER,
       allowNull: true
    },   
     latitud: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true
    },
    longitud: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true
    },
    altura: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true
    },
    titular_id: {
        type: DataTypes.UUID,
        references: {
            model: 'usuarios',
            key: 'id'
        },
        onDelete: 'SET NULL',
        allowNull: true
    },
    ip_registro: {
        type:DataTypes.STRING(45),
        allowNull: true
    },
    fecha_caducidad_ip: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }
}, {
    tableName: 'dispositivos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Dispositivo;