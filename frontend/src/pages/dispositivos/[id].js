import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from '../../lib/api';

export default function Dispositivo(){
    const router = useRouter();
    const { id } = router.query;
    const [dispositivo, setDispositivo] = useState(null);

    useEffect(function(){
        async function cargarDatos(){
            if(!id)
                return;

            const token = localStorage.getItem('token');

            if(!token){
                router.push('/');
                return;
            }

            const respuesta = await api.get(`/dispositivos/${id}`, {headers: {Authorization: `Bearer ${token}`}}); 
            setDispositivo(respuesta.data);
        }
        cargarDatos();
    }, [id]) // Ejecutar cuando id esté disponible

    if (!dispositivo) {
        return <p>Cargando...</p>;
    }

    function estaActivo(){
        if(dispositivo.activo == true){
            return "SI";
        } else {
            return "NO";
        }
    }

    return(
        <div>
            <p>ID: {dispositivo.id}</p>
            <p>NOMBRE: {dispositivo.nombre}</p>
            <p>DESCRIPCION: {dispositivo.descripcion}</p>
            <p>DIRECCION MAC: {dispositivo.mac_address}</p>
            <p>VERSION HARDWARE: {dispositivo.hw_version}</p>
            <p>VERSION FIRMWARE: {dispositivo.fw_version}</p>
            <p>ACTIVO: {estaActivo()}</p>
            <p>ULTIMA CONEXION: {dispositivo.ultima_conexion}</p>
            <p>FECHA INSTALACION: {dispositivo.fecha_instalacion}</p>
            <button onClick={function(){router.back()}}>VOLVER</button>
        </div>
    );
}