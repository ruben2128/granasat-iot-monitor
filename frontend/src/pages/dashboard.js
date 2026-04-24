import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from '../lib/api';

export default function Dashboard() {
    //useState es para indicar que el valor va a cambiar y cuando cambie, se debe actualizar la pantalla
    //variables entre corchetes porque useState devuelve un array con dos elementos, asi que tenemos que desestructurarlo
    const[usuario, setUsuario] = useState(null);
    const[instalaciones, setInstalaciones] = useState([]);
    const[dispositivos, setDispositivos] = useState([]);
    const router = useRouter();

    function handleLogout(){
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        router.push('/');
    }
    
    /*
        useEffect se ejecuta despues de que el componenente se pinte en pantalla
    */
    useEffect(function(){
        async function cargarDatos(){
            const token = localStorage.getItem('token');
            
            if(!token){
                router.push('/');
                return;
            }

            const usuarioGuardado = localStorage.getItem('usuario');
            setUsuario(JSON.parse(usuarioGuardado));

            const respuesta = await api.get('/instalaciones', {headers: {Authorization: `Bearer ${token}`}});
            const instalaciones = respuesta.data.instalaciones;
            const respuestaDispositivos = await api.get('/dispositivos', {headers:  {Authorization: `Bearer ${token}`}});
            const dispositivos = respuestaDispositivos.data.dispositivos;
            setInstalaciones(instalaciones);
            setDispositivos(dispositivos);

        }
        cargarDatos();
    }, []) // [] indica que useEffect se ejecute solo una vez, es decir, cuando el componente se cargue por primera vez

    if(!usuario) {
        return <p>CARGANDO...</p>;
    }

    return (
        <div>
            <h1>DASHBOARD</h1>
            <p>BIENVENIDO, {usuario.nombre}</p>
            {instalaciones.map(
                function(instalacion){
                    return (
                        <div key={instalacion.id} onClick={function(){router.push(`/instalaciones/${instalacion.id}`);}}>
                            {instalacion.nombre}
                        </div>
                    );
                }
            )}
            <p>TOTAL DE INSTALACIONES REGISTRADAS: {instalaciones.length}</p>
            <p>TOTAL DE DISPOSITIVOS REGISTRADOS: {dispositivos.length}</p>

            <div onClick={function(){router.push('/alertas');}}>ALERTAS</div>
            <div onClick={function(){router.push('/informes');}}>INFORMES</div>

            <button onClick={handleLogout}>CERRAR SESION</button>
        </div>
        
    );
}