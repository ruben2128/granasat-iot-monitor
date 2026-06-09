import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = __DEV__ ? 'http://192.168.1.249:3001/api' : 'https://radiacion.granasat.space/api';

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

export default api;