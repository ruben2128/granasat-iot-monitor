const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Informe = sequelize.define('Informe', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    instalacion_id: {
        type: DataTypes.UUID,
        references: { model: 'instalaciones', key: 'id'},
        onDelete: 'CASCADE',
        allowNull: false
    },
    mes: {
        type:DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 12}
    },
    anio: {
        type:DataTypes.INTEGER,
        allowNull: false
    },
    fecha_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    fecha_fin: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    ruta_pdf: {
        type: DataTypes.TEXT
    },
    tamano_bytes: {
        type: DataTypes.BIGINT
    },
    generado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    email_enviado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    email_destinatarios: {
        type: DataTypes.ARRAY(DataTypes.TEXT)
    },
    fecha_generacion: {
        type: DataTypes.DATE
    },
    fecha_envio_email: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'informes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Informe;
