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
    },
    marca_comercial: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    modelo_electronica: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    // Número de serie de la unidad de control electrónica
    num_serie_electronica: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    // Número de serie del detector/sonda ambiental (separado del de la electrónica)
    num_serie_sonda: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    // Tipo de detector: Centellador NaI(Tl), Cámara de ionización, Geiger-Müller, etc.
    tipo_detector: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    // Indica si el equipo tiene calibración vigente
    calibrado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    fecha_ultima_calibracion: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    // Fecha calculada de la próxima revisión — el sistema avisa 3 meses antes
    fecha_proxima_calibracion: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    // Indica si el equipo se somete a verificaciones periódicas
    verificacion_periodica: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    // Periodicidad de la verificación: mensual, trimestral, semestral, anual
    periodicidad_verificacion: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    // Indica si el equipo está destinado al registro continuo de valores
    medida_continuo: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    // Unidades de medida del equipo. Por defecto µSv/h
    unidades_medida: {
        type: DataTypes.STRING(20),
        defaultValue: 'µSv/h',
        allowNull: true
    },
    // Factor de corrección cuando las unidades no son µSv/h
    factor_correccion: {
        type: DataTypes.DECIMAL(10, 6),
        defaultValue: 1.0,
        allowNull: true
    },
    // Zona radiológica donde se encuentra el dispositivo
    zona_radiologica: {
        type: DataTypes.ENUM('LIBRE_PASO', 'VIGILADA', 'CONTROLADA', 'CONTROLADA_LIMITADA', 'CONTROLADA_REGLAMENTADA', 'ACCESO_PROHIBIDO'),
        allowNull: true
    },
    //Modelo de la sonda 
    modelo_sonda: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    //Foto del dispositivo
    foto: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    conectado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
}, {
    tableName: 'dispositivos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Dispositivo;