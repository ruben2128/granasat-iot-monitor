import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001/api'});

api.interceptors.response.use(
    function(response){
        return response;
    },
    /* Si la peticion devuelve 401, limpia el localStorage y manda el usuario al login */
    function(error) {
        if(error.response && error.response.status === 401){
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;