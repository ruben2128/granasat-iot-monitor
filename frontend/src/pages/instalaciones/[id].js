import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from '../../lib/api';

export default function Instalacion(){
    const router = useRouter();
    const { id } = router.query;
    const [instalacion, setInstalacion] = useState(null);
    const [dispositivos, setDispositivos] = useState([]);

    useEffect(function(){
        async function cargarDatos(){
            if(!id)
                return;

            const token = localStorage.getItem('token');

            if(!token){
                router.push('/');
                return;
            }

            const respuesta = await api.get(`/instalaciones/${id}`, {headers: {Authorization: `Bearer ${token}`}}); 
            setInstalacion(respuesta.data);
            const respuestaDispositivos = await api.get('/dispositivos', {headers: {Authorization: `Bearer ${token}`}});
            const todos = respuestaDispositivos.data.dispositivos;
            const soloDeEstaInstalacion = todos.filter(function(d) {
                return d.instalacion_id === id;
            });
            setDispositivos(soloDeEstaInstalacion);

            const llamadaTotalInstalaciones = await api.get('/instalaciones', {headers: {Authorization: `Bearer ${token}`}});

        }
        cargarDatos();
    }, [id])

    if (!instalacion) {
        return <p>Cargando...</p>;
    }

    function estaActivo(){
        if(instalacion.activa == true){
            return "SI";
        } else {
            return "NO";
        }
    }

    return(
        <div>
            <p>ID: {instalacion.id}</p>
            <p>NOMBRE: {instalacion.nombre}</p>
            <p>CODIGO: {instalacion.codigo}</p>
            <p>DESCRIPCION: {instalacion.descripcion}</p>
            <p>UBICACION: {instalacion.ubicacion}</p>
            <p>RESPONSABLE: {instalacion.responsable.nombre} {instalacion.responsable.apellidos}</p>
            <p>ACTIVA: {estaActivo()}</p>

            {dispositivos.map(
                function(dispositivo){
                    return (
                        <div key={dispositivo.id} onClick={function(){router.push(`/dispositivos/${dispositivo.id}`);}}>
                            NOMBRE DISPOSITIVO: {dispositivo.nombre}
                        </div>
                    );
                }
            )}

            <button onClick={function(){router.back()}}>VOLVER</button>
        </div>
    );
}