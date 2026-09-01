import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native'; 
import { coloresOscuro } from "../lib/temas";
import api from '../lib/api';

export default function DispositivoScreen({ navigation, route }) {
    const { dispositivo } = route.params;
    const [cargando, setCargando] = useState(true);
    const [lecturas, setLecturas] = useState({radiacion: null, suministro: null, elemento_activo: null, bateria: null});
    const colores = coloresOscuro;

    useEffect(() => {
        /*
            Los equipos portatiles no publican lecturas: no tienen direccion MAC
            con la que asociarlas en InfluxDB, y el backend rechaza la consulta.
            En ese caso no se pide nada ni se arranca el refresco periodico.
        */
        if(!dispositivo.medida_continuo || !dispositivo.mac_address){
            setCargando(false);
            return;
        }

        cargarLecturas();
        const intervalo = setInterval(cargarLecturas, 2000);
        return () => clearInterval(intervalo);
    }, []);

    const cargarLecturas = async () => {
        try{
            const res = await api.get(`/dispositivos/${dispositivo.id}/lecturas?rango=-1h`);
            const todasLecturas = res.data.lecturas;

            const ultimaRadiacion = todasLecturas.find(l => l.variable === 'radiacion');
            const ultimoSuministro = todasLecturas.find(l => l.variable === 'suministro');
            const ultimoElemento = todasLecturas.find(l => l.variable === 'elemento_activo');
            const ultimaBateria = todasLecturas.find(l => l.variable === 'bateria');

            setLecturas({
                radiacion: ultimaRadiacion ? ultimaRadiacion.valor : null,
                suministro: ultimoSuministro ? ultimoSuministro.valor : null,
                elemento_activo: ultimoElemento ? ultimoElemento.valor : null,
                bateria: ultimaBateria ? ultimaBateria.valor : null,
            });
        } catch (err) {
            setLecturas({radiacion: null, suministro: null, elemento_activo: null, bateria: null});
        } finally {
            setCargando(false);
        }
    };

    /*
        Traduce el valor del enumerado zona_radiologica a la denominacion
        que emplea el reglamento, para no mostrar el literal de la BD.
    */
    function etiquetaZona(valor){
        const zonas = {
            LIBRE_PASO: 'Libre paso',
            VIGILADA: 'Zona vigilada',
            CONTROLADA: 'Zona controlada',
            CONTROLADA_LIMITADA: 'Zona controlada: permanencia limitada',
            CONTROLADA_REGLAMENTADA: 'Zona controlada: permanencia reglamentada',
            ACCESO_PROHIBIDO: 'Zona de acceso prohibido'
        };

        return zonas[valor] || null;
    }

    /*
        La periodicidad se almacena en minusculas ('mensual', 'trimestral'...).
        Se capitaliza solo para presentarla, sin tocar el valor de la BD.
    */
    function capitalizar(texto){
        if(!texto){
            return null;
        }

        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    function formatearFecha(fechaISO){
        if(!fechaISO){
            return 'Sin datos';
        }

        return new Date(fechaISO).toLocaleDateString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    }

    return (
        <View style={[styles.contenedor, {backgroundColor: colores.fondo}]}>
            {/* Cabeceras */}
            <View style={[styles.cabecera, {backgroundColor: colores.tarjeta, borderBottomColor: colores.borde}]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={[styles.volver, {color: colores.acento}]}>
                        Volver
                    </Text>
                </TouchableOpacity>
                <View style={styles.cabeceraTexto}>
                    <Text style={[styles.cabeceraTitle, {color: colores.texto}]}>
                        {dispositivo.nombre}
                    </Text>
                    <Text style={[styles.cabeceraSubtitle, {color: colores.textoSecundario}]}>
                        {dispositivo.medida_continuo && dispositivo.mac_address
                            ? dispositivo.mac_address
                            : 'Equipo portátil'}
                    </Text>
                </View>
                <View style={[styles.badge, {backgroundColor: dispositivo.activo ? '#22c55e22' : '#ef444422'}]}>
                    <Text style={[styles.badgeTexto, {color: dispositivo.activo ? '#22c55e' : '#ef4444'}]}> 
                        {dispositivo.activo ? 'Activo' : 'Inactivo'}
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.contenido}>
                {/* Equipos portatiles: no hay lecturas que mostrar */}
                {!dispositivo.medida_continuo && (
                    <View style={[styles.infoCard, {backgroundColor: colores.tarjeta, borderColor: colores.borde, marginTop: 4}]}>
                        <Text style={[styles.descripcion, {color: colores.textoSecundario}]}>
                            Este equipo no realiza medida en continuo, por lo que no dispone de
                            lecturas en tiempo real. Sus datos de inventario, calibración y
                            verificación se muestran a continuación.
                        </Text>
                    </View>
                )}

                {/* Lecturas en tiempo real: solo equipos de medida en continuo */}
                {dispositivo.medida_continuo && (
                    <Text style={[styles.seccionTitulo, {color: colores.acento}]}>
                        LECTURAS EN TIEMPO REAL
                    </Text>
                )}

                {dispositivo.medida_continuo && (cargando ? (
                    <View style={styles.centrado}>
                        <ActivityIndicator size="large" color={colores.acento} />
                    </View>
                ): (
                    <View style={styles.lecturasGrid}>
                        {/* Radiación */}
                        <View style={[styles.lecturaCard, {backgroundColor: colores.tarjeta, borderColor: colores.borde}]}>
                            <Text style={[styles.lecturaLabel, {color: colores.textoSecundario}]}>
                                RADIACIÓN
                            </Text>
                            <Text style={[styles.lecturaValor, {color: colores.acento}]}>
                                {lecturas && lecturas.radiacion !== null ? lecturas.radiacion : '-'}
                            </Text>
                            <Text style={[styles.lecturaUnidad, {color: colores.textoSecundario}]}>
                                {dispositivo.unidades_medida || 'µSv/h'}
                            </Text>
                        </View>
                        {/* Suministro */}
                        <View style={[styles.lecturaCard, {backgroundColor: colores.tarjeta, borderColor: colores.borde}]}>
                            <Text style={[styles.lecturaLabel, {color: colores.textoSecundario}]}>
                                SUMINISTRO
                            </Text>
                            <Text style={[styles.lecturaValor, {color: lecturas.suministro === 1 ? '#22c55e' : '#a0a0a0'}]}>
                                {lecturas.suministro !== null ? (lecturas.suministro === 1 ? 'ON' : 'OFF') : '-'}
                            </Text>
                        </View>
                        {/* Elemento activo */}
                        <View style={[styles.lecturaCard, {backgroundColor: colores.tarjeta, borderColor: colores.borde}]}>
                            <Text style={[styles.lecturaLabel, {color: colores.textoSecundario}]}>
                                ELEMENTO ACTIVO
                            </Text>
                            <Text style={[styles.lecturaValor, {color: lecturas.elemento_activo === 1 ? '#22c55e' : '#a0a0a0'}]}>
                                {lecturas.elemento_activo !== null ? (lecturas.elemento_activo === 1 ? 'ON' : 'OFF') : '-'}
                            </Text>
                        </View>
                    </View>
                ))}


                {/* Información técnica */}
                <Text style={[styles.seccionTitulo, {color: colores.acento}]}> 
                    INFORMACIÓN TÉCNICA
                </Text>
                <View style={[styles.infoCard, {backgroundColor: colores.tarjeta, borderColor: colores.borde}]}>
                    {[
                        {label: 'Versión hardware', value: dispositivo.hw_version},
                        {label: 'Versión firmware', value: dispositivo.fw_version},
                        {label: 'Fecha de instalación', value: formatearFecha(dispositivo.fecha_instalacion)},
                        {
                            label: 'Nivel de batería',
                            value: dispositivo.medida_continuo
                                ? (lecturas.bateria !== null ? `${lecturas.bateria.toFixed(0)}%` : null)
                                : (dispositivo.nivel_bateria !== null ? `${dispositivo.nivel_bateria}%` : null)
                        },
                        {label: 'IP de registro', value: dispositivo.medida_continuo ? dispositivo.ip_registro : null},
                        {label: 'Marca comercial', value: dispositivo.marca_comercial},
                        {label: 'Modelo electrónica', value: dispositivo.modelo_electronica},
                        {label: 'Modelo sonda', value: dispositivo.modelo_sonda},
                        {label: 'Tipo de detector', value: dispositivo.tipo_detector},
                        {label: 'Zona radiológica', value: etiquetaZona(dispositivo.zona_radiologica)},
                        {label: 'Estado calibración', value: dispositivo.calibrado ? 'Calibrado' : 'No calibrado'},
                        {label: 'Última calibración', value: dispositivo.calibrado ? formatearFecha(dispositivo.fecha_ultima_calibracion) : null},
                        {label: 'Próxima calibración', value: dispositivo.calibrado ? formatearFecha(dispositivo.fecha_proxima_calibracion) : null},
                        {label: 'Verificación periódica', value: dispositivo.verificacion_periodica ? (capitalizar(dispositivo.periodicidad_verificacion) || 'Sí') : null},
                    ].filter(item => item.value).map(function(item) {
                        return (
                            <View key={item.label} style={[styles.infoFila,{borderBottomColor: colores.borde}]}>
                                <Text style={[styles.infoLabel, {color:colores.textoSecundario}]}>
                                    {item.label}
                                </Text>
                                <Text style={[styles.infoValor, {color:colores.texto}]}>
                                    {item.value}
                                </Text>
                            </View>
                        );
                    })}
                </View>
                {/* Descripción */}
                {dispositivo.descripcion && (
                    <>
                        <Text style={[styles.seccionTitulo, {color: colores.acento}]}>
                            DESCRIPCIÓN
                        </Text>
                        <View style={[styles.infoCard, {backgroundColor: colores.tarjeta, borderColor: colores.borde}]}>
                            <Text style={[styles.descripcion, {color: colores.texto}]}>
                                {dispositivo.descripcion}
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    contenedor: {
        flex: 1,
    },
    cabecera: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 56,
        borderBottomWidth: 1,
        gap: 8
    },
    volver: {
        fontSize: 14,
        fontWeight: '600',
    },
    cabeceraTexto:{
        flex: 1,
        marginHorizontal: 12,
        gap: 2
    },
    cabeceraTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    cabeceraSubtitle: {
        fontSize: 12,
    }, 
    badge:{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20
    },
    badgeTexto: {
        fontSize: 11,
        fontWeight: '600'
    }, 
    contenido: {
        padding: 16,
        gap: 12
    },
    seccionTitulo: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        borderLeftWidth: 3,
        paddingLeft: 8,
        marginTop: 8
    },
    centrado: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center'
    },
    lecturasGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    lecturaCard: {
        flex: 1,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        alignItems: 'center',
        gap: 4
    },
    lecturaLabel: {
        fontSize: 9,
        fontWeight: '600',
        letterSpacing: 1,
        textAlign: 'center'
    },
    lecturaValor: {
        fontSize: 26,
        fontWeight: '700',
    },
    lecturaUnidad: {
        fontSize: 10,
    },
    infoCard: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden'
    },
    infoFila: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
    },
    infoLabel: {
        fontSize: 12,
        flex: 1
    },
    infoValor: {
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right'
    },
    descripcion: {
        fontSize: 14,
        padding: 12,
        lineHeight: 20
    }
});