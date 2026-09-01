import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = __DEV__ ? 'http://192.168.0.165:3001/api' : 'https://radiacion.granasat.space/api';

const api = axios.create({
    baseURL: BASE_URL,
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');

    if(token){
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

/*
    Si el token ha caducado el servidor responde 401 a cualquier peticion.
    Sin este interceptor la aplicacion se queda inservible hasta que el
    usuario borra los datos de la app: aqui se limpia la sesion almacenada
    para que AuthContext devuelva al usuario a la pantalla de login.
*/
api.interceptors.response.use(
    (respuesta) => respuesta,
    async (error) => {
        if(error.response && error.response.status === 401){
            await AsyncStorage.multiRemove(['token', 'usuario']);
        }

        return Promise.reject(error);
    }
);

export default api;