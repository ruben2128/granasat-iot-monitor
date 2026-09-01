import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }){
    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarSesion();
    }, []);

    const cargarSesion = async () => {
        try{
            const token = await AsyncStorage.getItem('token');
            const usuarioGuardado = await AsyncStorage.getItem('usuario');

            if(token && usuarioGuardado){
                setUsuario(JSON.parse(usuarioGuardado));
            }
        } catch (e) {
            console.error('Error cargando la sesión:', e);
        } finally {
            setCargando(false);
        }
    };

    const login = async (username, password) => {
        const res = await api.post('/auth/login', { username, password });
        const {token, usuario} = res.data;

        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('usuario', JSON.stringify(usuario));

        setUsuario(usuario);

        return usuario;
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('usuario');

        setUsuario(null);
    };

    return (
        <AuthContext.Provider value={{ usuario, cargando, login, logout}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);