import axios from 'axios';

const api = axios.create({ 
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
});

api.interceptors.response.use(
    function(response){
        return response;
    },
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