import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from "../context/AuthContext";
import { coloresOscuro } from "../lib/temas";
import api from "../lib/api";

/*
    Pantalla principal. Su contenido depende del rol del usuario autenticado:

      - ADMIN        ve todas las instalaciones del sistema.
      - RESPONSABLE  ve unicamente las instalaciones de las que es responsable.
      - TITULAR      no tiene instalaciones asignadas, sino dispositivos concretos
                     a su nombre, de modo que se le muestra directamente la lista
                     de esos dispositivos.

    El filtrado real lo hace el backend en funcion del token; aqui solo se decide
    que recurso consultar y como presentarlo.
 */
export default function DashboardScreen({ navigation }){
    const { usuario, logout } = useAuth();
    const [instalaciones, setInstalaciones] = useState([]);
    const [dispositivos, setDispositivos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const colores = coloresOscuro;

    const esTitular = usuario?.role === 'TITULAR';

    useEffect(() => { cargarDatos(); }, []);

    const cargarDatos = async () => {
        try {
            if(esTitular){
                const res = await api.get('/dispositivos');

                setDispositivos(res.data.dispositivos);
            } else {
                const res = await api.get('/instalaciones');

                setInstalaciones(res.data.instalaciones);
            }
        } catch (err) {
            Alert.alert('Error', esTitular
                ? 'No se pudieron cargar los dispositivos'
                : 'No se pudieron cargar las instalaciones');
        } finally {
            setCargando(false);
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    /*
        Tarjeta de instalacion: al pulsarla se navega al listado de sus dispositivos.
    */
    const renderInstalacion = ({ item }) => (
        <TouchableOpacity style={[styles.tarjeta, {backgroundColor: colores.tarjeta, borderColor: colores.borde}]} onPress={ () => navigation.navigate('Instalacion', {instalacion: item})}>

            {/* Fila superior: Nombre e indicador de estado activo o inactivo */}
            <View style={styles.tarjetaCabecera}>
                <Text style = {[styles.tarjetaNombre, {color: colores.texto}]}>
                    {item.nombre}
                </Text>
                <View style={[styles.badge, {backgroundColor: item.activa ? '#22c55e22' : '#ef444422'}]}>
                    <Text style={[styles.badgeTexto, {color: item.activa ? '#22c55e' : '#ef4444'}]}>
                        {item.activa ? 'Activa' : 'Inactiva'}
                    </Text>
                </View>
            </View>

            {/* Código de la instalación */}
            {item.codigo_referencia && (
                <Text style={[styles.tarjetaCodigo, {color: colores.acento}]}>
                    {item.codigo_referencia}
                </Text>
            )}

            {/* Ubicación física (si existe) */}
            {item.ubicacion && (
                <Text style={[styles.tarjetaUbicacion, { color: colores.textoSecundario}]}>
                    {item.ubicacion}
                </Text>
            )}
        </TouchableOpacity>
    );

    /*
        Tarjeta de dispositivo, para el rol TITULAR: al pulsarla se navega
        directamente al detalle del equipo, sin pasar por la instalacion.
    */
    const renderDispositivo = ({ item }) => (
        <TouchableOpacity style={[styles.tarjeta, {backgroundColor: colores.tarjeta, borderColor: colores.borde}]} onPress={ () => navigation.navigate('Dispositivo', {dispositivo: item})}>

            <View style={styles.tarjetaCabecera}>
                <Text style={[styles.tarjetaNombre, {color: colores.texto}]}>
                    {item.nombre}
                </Text>
                <View style={[styles.badge, {backgroundColor: item.activo ? '#22c55e22' : '#ef444422'}]}>
                    <Text style={[styles.badgeTexto, {color: item.activo ? '#22c55e' : '#ef4444'}]}>
                        {item.activo ? 'Activo' : 'Inactivo'}
                    </Text>
                </View>
            </View>

            {/* Instalación a la que pertenece el equipo */}
            <Text style={[styles.tarjetaUbicacion, {color: colores.textoSecundario}]}>
                {item.instalacion ? item.instalacion.nombre : 'Sin instalación asignada'}
            </Text>

            {/* La MAC solo existe en los equipos de medida en continuo */}
            {item.medida_continuo && item.mac_address && (
                <Text style={[styles.tarjetaCodigo, {color: colores.acento}]}>
                    {item.mac_address}
                </Text>
            )}
        </TouchableOpacity>
    );

    const datos = esTitular ? dispositivos : instalaciones;
    const mensajeVacio = esTitular
        ? 'No tienes ningún dispositivo asignado'
        : 'No hay instalaciones disponibles';

    return (
        <View style={[styles.contenedor, {backgroundColor: colores.fondo}]}>
            {/* Cabecera */}
            <View style={[styles.cabecera , {backgroundColor: colores.tarjeta, borderBottomColor: colores.borde }]}>
                <View>
                    <Text style={[styles.cabeceraTitle, {color: colores.texto}]}>
                        GranaSAT
                    </Text>
                    <Text style={[styles.cabeceraSubtitle, {color: colores.textoSecundario}]}>
                        Hola, {usuario?.nombre}
                    </Text>
                </View>
                <TouchableOpacity onPress={handleLogout}>
                    <Text style={[styles.cerrarSesion, {color: colores.acento}]}>
                        Salir
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Rótulo de la sección, según lo que se esté listando */}
            {!cargando && datos.length > 0 && (
                <Text style={[styles.seccionTitulo, {color: colores.acento}]}>
                    {esTitular ? 'MIS DISPOSITIVOS' : 'INSTALACIONES'}
                </Text>
            )}

            {/* Contenido principal */}
            {cargando ? (
                <View style={styles.centrado}>
                    <ActivityIndicator size="large" color={colores.acento} />
                </View>
            ) : datos.length === 0 ? (
                <View style={styles.centrado}>
                    <Text style={[styles.vacio, { color: colores.textoSecundario}]}>
                        {mensajeVacio}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={datos}
                    keyExtractor={item => item.id}
                    renderItem={esTitular ? renderDispositivo : renderInstalacion}
                    contentContainerStyle={styles.lista}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    contenedor: {
        flex: 1,
    },
    cabecera: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 56,
        borderBottomWidth: 1,
    },
    cabeceraTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    cabeceraSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    cerrarSesion: {
        fontSize: 14,
        fontWeight: '600',
    },
    seccionTitulo: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    lista: {
        padding: 16,
        gap: 12
    },
    tarjeta: {
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        gap: 4
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
    tarjetaCodigo: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1
    },
    tarjetaUbicacion: {
        fontSize: 13
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