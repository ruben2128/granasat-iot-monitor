const Usuario = require('./Usuario');
const Instalacion = require('./Instalacion');
const Dispositivo = require('./Dispositivo');
const AlertaConfig = require ('./AlertaConfig');
const AlertaHistorial = require('./AlertaHistorial');
const Informe = require('./Informe');
const PlantillaEmail = require('./PlantillaEmail');
const Licencia = require('./Licencia');
const LogCambio = require('./LogCambio');
const { Log } = require('@influxdata/influxdb-client');

// RELACIONES

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

// USUARIO --> LICENCIAS
Usuario.hasMany(Licencia, {
    foreignKey: 'usuario_id',
    as: 'licencias'
});
Licencia.belongsTo(Usuario, {
    foreignKey: 'usuario_id',
    as: 'usuario'
});

//INSTALACION --> LICENCIAS
Instalacion.hasMany(Licencia, {
    foreignKey: 'instalacion_id',
    as: 'licencias'
});
Licencia.belongsTo(Instalacion, {
    foreignKey: 'instalacion_id',
    as: 'instalacion'
});

// USUARIO --> LOG_CAMBIOS
Usuario.hasMany(LogCambio, {
    foreignKey: 'usuario_id',
    as: 'log_cambios'
});
LogCambio.belongsTo(Usuario, {
    foreignKey: 'usuario_id',
    as: 'usuario'
});

module.exports = {Usuario, Instalacion, Dispositivo, AlertaConfig, AlertaHistorial, Informe, PlantillaEmail, Licencia, LogCambio};