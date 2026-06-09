import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, FlatList } from 'react-native';
import { coloresOscuro } from '../lib/temas';
import api from '../lib/api';

export default function InstalacionScreen({ navigation, route}){
    const {instalacion} = route.params;
    const [dispositivos, setDispositivos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const colores = coloresOscuro;

    useEffect(() => {
        cargarDispositivos();
    }, []);

    const cargarDispositivos = async() => {
        try {
            const res = await api.get(`/dispositivos?instalacion_id=${instalacion.id}`);
            console.log('Respuesta:', JSON.stringify(res.data));
            setDispositivos(res.data.dispositivos);
        } catch (err){
            Alert.alert('Error', 'No se pudieron cargar los dispositivos');
        } finally {

            setCargando(false);
        }
    };

    const renderDispositivo = ({ item }) => (
        <TouchableOpacity style={[styles.tarjeta, { backgroundColor: colores.tarjeta, borderColor: colores.borde}]} onPress={() => navigation.navigate('Dispositivo', {dispositivo: item})}>
            {/* Fila superior: nombre e indicador de activo o inactivo */}
            <View style={styles.tarjetaCabecera}>
                <Text style={[styles.tarjetaNombre, { color: colores.texto }]}>
                    {item.nombre}
                </Text>
                <View style={[styles.badge, { backgroundColor: item.activo ? '#22c55e22' : '#ef444422'}]}>
                    <Text style={[styles.badgeTexto, { color: item.activo ? '#22c55e' : '#ef4444'}]}>
                        {item.activo ? 'Activo' : 'Inactivo'}
                    </Text>
                </View>
            </View>

            {/* Dirección MAC */}
            <Text style={[styles.mac, {color: colores.acento}]}>
                {item.mac_address}
            </Text>

            {/* Descripción del dispositivo */}
            {item.descripcion && (
                <Text style={[styles.descripcion, {color: colores.textoSecundario}]}>
                    {item.descripcion}
                </Text>
            )}

            {/* Vesiones de hardware y firmware */}
            <View style={styles.versiones}>
                <Text style={[styles.version, {color: colores.textoSecundario}]}>
                    HW: {item.hw_version || 'N/A'}
                </Text>
                <Text style={[styles.version, {color: colores.textoSecundario}]}>
                    FW: {item.fw_version || 'N/A'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.contenedor, {backgroundColor: colores.fondo}]}>

            {/* Cabecera con botón de volver */}
            <View style={[styles.cabecera, {backgroundColor: colores.tarjeta, borderBottomColor: colores.borde}]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={[styles.volver, {color: colores.acento}]}>
                        Volver
                    </Text>
                </TouchableOpacity>
                <View style={styles.cabeceraTexto}>
                    <Text style={[styles.cabeceraTitle, {color: colores.texto}]}>
                        {instalacion.nombre}
                    </Text>
                    {/* Ubicación física de la instalación */}
                    {instalacion.ubicacion && (
                        <Text style={[styles.cabeceraSubtitle, {color: colores.textoSecundario}]}>
                            {instalacion.ubicacion}
                        </Text>
                    )}
                </View>
            </View>
        

            {/* Contenido principal */}
            {cargando ? (
                <View style={styles.centrado}>
                    <ActivityIndicator size="large" color={colores.acento}/>
                </View>
            ) : dispositivos.length === 0 ? (
                <View style={styles.centrado}>
                    <Text style={[styles.vacio, {color: colores.textoSecundario}]}>
                        No hay dispositivos en esta instalación
                    </Text>
                </View>
            ) : (
                //Lista de dispositivos
                <FlatList data={dispositivos} keyExtractor={item => item.id} renderItem={renderDispositivo} contentContainerStyle={styles.lista} showsVerticalScrollIndicator={false}/>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    contenedor: {
        flex: 1,
    },
    cabecera: {
        padding: 20,
        paddingTop: 56,
        borderBottomWidth: 1,
        gap: 8
    },
    volver: {
        fontSize: 14,
        fontWeight: '600'
    },
    cabeceraTexto: {
        gap:2
    },
    cabeceraTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    cabeceraSubtitle: {
        fontSize: 13,
    },
    lista: {
        padding: 16,
        gap: 12
    },
    tarjeta: {
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        gap: 6
    },
    tarjetaCabecera: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    tarjetaNombre: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1
    },
    mac: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1
    },
    descripcion: {
        fontSize: 13
    },
    versiones: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 4
    },
    version: {
        fontSize: 12
    },  
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20
    },
    badgeTexto: {
        fontSize: 11,
        fontWeight: '600'
    },
    centrado: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    vacio: {
        fontSize: 15
    }
});