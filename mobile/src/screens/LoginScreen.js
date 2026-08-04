import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { coloresOscuro } from '../lib/temas';

export default function LoginScreen(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [cargando, setCargando] = useState(false);
    const {login} = useAuth();
    const colores = coloresOscuro;

    async function handleLogin(){
        if(!username || !password) {
            Alert.alert('Error', 'Introduce usuario y contraseña');
            return;
        }

        setCargando(true);
        
        try{
            const usuario = await login(username, password);
            console.log('Login OK:', usuario)
        } catch (err) {
            console.log('Error login: ', err.message);
            Alert.alert('Error', 'Usuario o contraseña incorrectos');
        } finally {
            setCargando(false);
        }
    }

    return (
        <View style={[styles.contenedor, { backgroundColor: colores.fondo}]}>
            <View style={styles.formulario}>
                <Text style={[styles.titulo, {color: colores.acento}]}>
                    GranaSAT
                </Text>
                <Text style={[styles.subtitulo, {color: colores.textoSecundario}]}>
                    Sistema de Monitorización IoT
                </Text>

                <View style={styles.campoContenedor}>
                    <Text style={[styles.etiqueta, { color: colores.texto}]}>
                        USUARIO
                    </Text>
                    <TextInput style={[styles.input, {backgroundColor: colores.tarjeta, borderColor: colores.borde, color: colores.texto}]} value={username} onChangeText={setUsername} autoCapitalize='none' placeholder='Usuario' placeholderTextColor={colores.textoSecundario}/>
                </View>

                <View style={styles.campoContenedor}>
                    <Text style={[styles.etiqueta, { color: colores.texto}]}>
                        CONTRASEÑA
                    </Text>
                    <TextInput style={[styles.input, {backgroundColor: colores.tarjeta, borderColor: colores.borde, color: colores.texto}]} value={password} onChangeText={setPassword} secureTextEntry placeholder='Contraseña' placeholderTextColor={colores.textoSecundario}/>
                </View>

                <TouchableOpacity style={[styles.boton, {backgroundColor: colores.acentoBoton}]} onPress={handleLogin} disabled={cargando}>
                    {cargando ? (<ActivityIndicator color="white" />) : (<Text style={styles.botonTexto}>Iniciar sesión</Text>)}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    contenedor: {
        flex: 1,
        justifyContent: 'center',
        padding: 24
    },
    formulario: {
        gap: 16
    },
    titulo: {
        fontSize: 32,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 4
    },
    subtitulo: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24
    },
    campoContenedor: {
        gap: 6
    },
    etiqueta: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 14
    }, 
    boton: {
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
        marginTop: 8
    },
    botonTexto: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600'
    }
});