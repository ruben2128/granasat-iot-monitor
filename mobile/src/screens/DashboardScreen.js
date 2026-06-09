import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from "../context/AuthContext";
import { coloresOscuro } from "../lib/temas";
import api from "../lib/api";

/*
    Pantalla principal: Muestra la lista de instalaciones a las que el usuario tiene acceso
 */
export default function DashboardScreen({ navigation }){
    const { usuario, logout} = useAuth();   //Usuario autenticado y la funcion para cerrar la sesión
    const [ instalaciones, setInstalaciones] = useState([]);    //Lista de instalaciones cargadas desde la API
    const [cargando, setCargando] = useState(true);     //Indicador de carga
    const colores = coloresOscuro;  // Tema de colors, por ahora fijo en oscuro

    //Al montar el componente, cargamos las instalaciones del usuario
    useEffect( () => {cargarInstalaciones();}, []);

    /*
        Consulta al endpoint GET /instalaciones
        Si el usuario tiene el rol de ADMIN, ve todas las instalaciones, si es RESPONSABLE solo ve sus asignadas
     */
    const cargarInstalaciones = async () => {
        try {
            const res = await api.get('/instalaciones');

            setInstalaciones(res.data.instalaciones);
        } catch (err) {
            Alert.alert('Error', 'No se pudieron cargar las instalaciones');
        } finally {
            setCargando(false);
        }
    };
    /*
        Cierra la sesión del usuario, eliminando el token y el usuario del AsyncStorage (similar a localStorage)
    */
    const handleLogout = async () => {
        await logout();
    }

    /*
        Renderiza una tarjeta por cada instalación que devuelva el endpoint
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
            <Text style={[styles.tarjetaCodigo, {color: colores.acento}]}>
                {item.codigo_referencia}
            </Text>

            {/* Ubicación física (si existe) */}
            {item.ubicacion && (
                <Text style={[styles.tarjetaUbicacion, { color: colores.textoSecundario}]}>
                    {item.ubicacion}
                </Text>
            )}
        </TouchableOpacity>
    );

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

            {/* Contenido principal */}
            {cargando ? (
                //Mientras carga, se muestra un spinner
                <View style={styles.centrado}>
                    <ActivityIndicator size="large" color={colores.acento} />
                </View>
            ) : instalaciones.length === 0 ? (
                //Si no hay instalaciones, se muestra el mensaje por pantalla
                <View style={styles.centrado}>
                    <Text style={[styles.vacio, { color: colores.textoSecundario}]}>
                        No hay instalaciones disponibles
                    </Text>
                </View>
            ) : (
                // Lista de instalaciones
                <FlatList data = {instalaciones} keyExtractor={item => item.id} renderItem={renderInstalacion} contentContainerStyle={styles.lista} showsVerticalScrollIndicator={false}/>
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