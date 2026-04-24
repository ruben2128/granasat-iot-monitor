const Usuario = require('./Usuario');
const Instalacion = require('./Instalacion');
const Dispositivo = require('./Dispositivo');
const AlertaConfig = require ('./AlertaConfig');
const AlertaHistorial = require('./AlertaHistorial');
const Informe = require('./Informe');

// ==========================================
// RELACIONES
// ==========================================


// USUARIO --> INSTALACIONES
Usuario.hasMany(Instalacion, {
    foreignKey: 'responsable_id',
    as: 'instalaciones'
});
Instalacion.belongsTo(Usuario, {
    foreignKey: 'responsable_id',
    as: 'responsable'
});

//INSTALACION --> DISPOSITIVOS
Instalacion.hasMany(Dispositivo, {
    foreignKey: 'instalacion_id',
    as: 'dispositivos'
});
Dispositivo.belongsTo(Instalacion, {
    foreignKey: 'instalacion_id',
    as: 'instalacion'
});

//INSTALACION --> ALERTASCONFIG
Instalacion.hasMany(AlertaConfig, {
    foreignKey: 'instalacion_id', 
    as: 'alertas'
})
AlertaConfig.belongsTo(Instalacion, {
    foreignKey: 'instalacion_id',
    as: 'instalacion'
})


//ALERTACONFIG --> ALERTAHISTORIAL
AlertaConfig.hasMany(AlertaHistorial, { 
    foreignKey: 'alerta_config_id',
    as: 'historial'
});
AlertaHistorial.belongsTo(AlertaConfig, {
    foreignKey: 'alerta_config_id',
    as: 'alerta_config'
});

//DISPOSITIVO --> ALERTAHISTORIAL
Dispositivo.hasMany(AlertaHistorial, {
    foreignKey: 'dispositivo_id',
    as: 'alertas_historial'
});
AlertaHistorial.belongsTo(Dispositivo, {
    foreignKey: 'dispositivo_id',
    as: 'dispositivo'
});


//INSTALACION --> INFORMES
Instalacion.hasMany(Informe, {
    foreignKey: 'instalacion_id',
    as: 'informes'
});
Informe.belongsTo(Instalacion, {
    foreignKey: 'instalacion_id',
    as: 'instalacion'
});

module.exports = {Usuario, Instalacion, Dispositivo, AlertaConfig, AlertaHistorial, Informe};